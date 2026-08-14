package backend

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"myproject/internal/client"
)

const (
	TransportStdio = "stdio"
	TransportHTTP  = "http"
)

// Config controls how the bundled backend is spawned.
type Config struct {
	Bin           string // executable path, or a node script (.js/.mjs/.cjs)
	Transport     string // "stdio" (default) or "http"
	Port          int    // used only for http transport
	DataDir       string // APP_DATA_DIR passed to the child
	MigrationsDir string // APP_MIGRATIONS_DIR passed to the child
	LogFile       string // where to tee backend stderr ("" = discard)
}

// Manager owns the backend child process. It hands the app a Transport bound
// to that process; Stop terminates the child cleanly.
type Manager struct {
	cfg       Config
	cmd       *exec.Cmd
	transport client.Transport
	stdin     io.WriteCloser
	stopOnce  sync.Once
	stopped   chan struct{}
}

func NewManagerFromEnv() (*Manager, error) {
	transport := os.Getenv("TRANSPORT")
	if transport != TransportStdio && transport != TransportHTTP {
		transport = TransportStdio
	}
	cfg := Config{
		Bin:           os.Getenv("BACKEND_BIN"),
		Transport:     transport,
		Port:          4567,
		DataDir:       os.Getenv("APP_DATA_DIR"),
		MigrationsDir: os.Getenv("APP_MIGRATIONS_DIR"),
	}
	if p := os.Getenv("BACKEND_PORT"); p != "" {
		var n int
		if _, err := fmt.Sscanf(p, "%d", &n); err == nil && n > 0 {
			cfg.Port = n
		}
	}
	if cfg.Bin == "" {
		bin, err := discoverBin()
		if err != nil {
			return nil, err
		}
		cfg.Bin = bin
	}
	return &Manager{cfg: cfg, stopped: make(chan struct{})}, nil
}

// SetLogFile makes the backend write its stderr logs to the given path.
func (m *Manager) SetLogFile(path string) {
	m.cfg.LogFile = path
}

// Start spawns the backend and returns the transport bound to it.
func (m *Manager) Start() (client.Transport, error) {
	if m.cfg.Transport == TransportHTTP {
		return m.startHTTP()
	}
	return m.startStdio()
}

// Stop closes the child's stdin (stdio) or terminates it (http), then reaps it.
func (m *Manager) Stop() {
	m.stopOnce.Do(func() {
		close(m.stopped)
		if m.stdin != nil {
			_ = m.stdin.Close()
		}
		if m.cmd == nil {
			return
		}
		done := make(chan struct{})
		go func() {
			_ = m.cmd.Wait()
			close(done)
		}()
		select {
		case <-done:
		case <-time.After(3 * time.Second):
			_ = m.cmd.Process.Kill()
			<-done
		}
	})
}

func (m *Manager) startStdio() (client.Transport, error) {
	cmd := m.command()
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("backend: stdin pipe: %w", err)
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("backend: stdout pipe: %w", err)
	}
	cmd.Stderr = m.logWriter()

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("backend: start: %w", err)
	}

	m.cmd = cmd
	m.stdin = stdin

	t := client.NewStdioTransport(stdin, stdout)
	t.SetLogger(func(format string, args ...any) {
		fmt.Fprintf(os.Stderr, "[backend:stdio] "+format+"\n", args...)
	})
	m.transport = t
	return t, nil
}

func (m *Manager) startHTTP() (client.Transport, error) {
	cmd := m.command()
	cmd.Args = append(cmd.Args, "--port", fmt.Sprintf("%d", m.cfg.Port))
	cmd.Stderr = m.logWriter()

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("backend: start: %w", err)
	}
	m.cmd = cmd

	baseURL := fmt.Sprintf("http://127.0.0.1:%d", m.cfg.Port)
	if err := waitReady(baseURL, m.stopped, 15*time.Second); err != nil {
		_ = cmd.Process.Kill()
		return nil, fmt.Errorf("backend: not ready: %w", err)
	}

	t := client.NewHTTPTransport(baseURL, client.DefaultClientID, client.DefaultSecretKey)
	m.transport = t
	return t, nil
}

func (m *Manager) command() *exec.Cmd {
	argv := []string{m.cfg.Bin}
	if isScript(m.cfg.Bin) {
		argv = []string{"node", m.cfg.Bin}
	}

	var cmd *exec.Cmd
	if len(argv) == 1 {
		cmd = exec.Command(argv[0])
	} else {
		cmd = exec.Command(argv[0], argv[1:]...)
	}

	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env, "TRANSPORT="+m.cfg.Transport)
	if m.cfg.Transport == TransportHTTP {
		cmd.Env = append(cmd.Env, "APP_MODE=production")
	}
	// Always pass absolute paths: a compiled Bun executable resolves relative
	// paths against its embedded filesystem, not the real cwd.
	if dir := absolutize(m.cfg.DataDir); dir != "" {
		cmd.Env = append(cmd.Env, "APP_DATA_DIR="+dir)
	}
	// Point the child at the bundled drizzle migrations for first-run schema.
	if dir := absolutize(m.cfg.MigrationsDir); dir != "" {
		cmd.Env = append(cmd.Env, "APP_MIGRATIONS_DIR="+dir)
	}
	return cmd
}

// absolutize returns an absolute version of p, or "" when p is empty.
func absolutize(p string) string {
	if p == "" {
		return ""
	}
	if abs, err := filepath.Abs(p); err == nil {
		return abs
	}
	return p
}

func (m *Manager) logWriter() io.Writer {
	if m.cfg.LogFile == "" {
		return io.Discard
	}
	f, err := os.OpenFile(m.cfg.LogFile, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		return io.Discard
	}
	return f
}

func isScript(bin string) bool {
	return strings.HasSuffix(bin, ".js") || strings.HasSuffix(bin, ".mjs") || strings.HasSuffix(bin, ".cjs")
}

// discoverBin finds the bundled backend. Preference: BACKEND_BIN via env is
// handled by the caller; here we probe paths relative to cwd and executable.
func discoverBin() (string, error) {
	roots := []string{}
	if wd, err := os.Getwd(); err == nil {
		roots = append(roots, wd)
	}
	if exe, err := os.Executable(); err == nil {
		roots = append(roots, filepath.Dir(exe), filepath.Dir(exe)+"/..")
	}

	exeName := "backend"
	if isWindows() {
		exeName = "backend.exe"
	}

	seen := map[string]bool{}
	for _, root := range roots {
		if seen[root] {
			continue
		}
		seen[root] = true

		for _, cand := range []string{
			filepath.Join(root, "backend", "bin", exeName),
			filepath.Join(root, "bin", exeName),
		} {
			if fileExists(cand) {
				return cand, nil
			}
		}
		for _, cand := range []string{
			filepath.Join(root, "backend", "dist", "apps", "index.js"),
			filepath.Join(root, "dist", "apps", "index.js"),
		} {
			if fileExists(cand) {
				return cand, nil
			}
		}
	}
	return "", fmt.Errorf("backend: no backend found; set BACKEND_BIN or run `make build-backend`")
}

func fileExists(p string) bool {
	st, err := os.Stat(p)
	return err == nil && !st.IsDir()
}

func isWindows() bool {
	return os.PathSeparator == '\\'
}

// waitReady polls the HTTP backend until it responds.
func waitReady(baseURL string, stopped <-chan struct{}, timeout time.Duration) error {
	client := &http.Client{Timeout: 2 * time.Second}
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		select {
		case <-stopped:
			return fmt.Errorf("cancelled")
		default:
		}
		resp, err := client.Get(baseURL + "/healthz")
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode < 500 {
				return nil
			}
		}
		time.Sleep(200 * time.Millisecond)
	}
	return fmt.Errorf("backend did not become ready within %s", timeout)
}
