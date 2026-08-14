package backend

import (
	"encoding/json"
	"io"
	"net"
	"os"
	"path/filepath"
	"testing"

	"myproject/internal/client"
)

func TestNewManagerFromEnvDefaultsHTTP(t *testing.T) {
	t.Setenv("TRANSPORT", "")
	t.Setenv("BACKEND_BIN", "backend")
	m, err := NewManagerFromEnv()
	if err != nil {
		t.Fatalf("NewManagerFromEnv: %v", err)
	}
	if m.cfg.Transport != TransportHTTP {
		t.Fatalf("default transport = %q, want %q", m.cfg.Transport, TransportHTTP)
	}
}

// freePort returns an available TCP port for the HTTP spawn test.
func freePort() (int, error) {
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}

// findBuiltBackend locates a previously built backend bundle (Bun exe first,
// then compiled JS entry). Returns "" when nothing is built yet so the tests
// can skip.
func findBuiltBackend(t *testing.T) string {
	t.Helper()
	root := filepath.Join("..", "..") // desktop/internal/backend -> desktop -> repo root
	candidates := []string{
		filepath.Join(root, "backend", "bin", "backend"),
		filepath.Join(root, "backend", "bin", "backend.exe"),
		filepath.Join(root, "backend", "dist", "apps", "index.js"),
	}
	for _, c := range candidates {
		if st, err := os.Stat(c); err == nil && !st.IsDir() {
			return c
		}
	}
	return ""
}

func TestManagerSpawnStdio(t *testing.T) {
	bin := findBuiltBackend(t)
	if bin == "" {
		t.Skip("backend not built; run `make build-backend` first")
	}

	m := &Manager{cfg: Config{
		Bin:       bin,
		Transport: TransportStdio,
		DataDir:   t.TempDir(),
	}, stopped: make(chan struct{})}

	tr, err := m.Start()
	if err != nil {
		t.Fatalf("Start: %v", err)
	}
	defer m.Stop()

	resp, err := tr.Do("GET", "/workspaces", nil, nil)
	if err != nil {
		t.Fatalf("Do: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var env client.Envelope
	if err := json.Unmarshal(body, &env); err != nil {
		t.Fatalf("response not an envelope: %v\n%s", err, body)
	}
	if env.Error == nil && env.Data == nil {
		t.Fatalf("envelope has neither data nor error: %s", body)
	}
}

func TestManagerSpawnStdioCreateWorkspace(t *testing.T) {
	bin := findBuiltBackend(t)
	if bin == "" {
		t.Skip("backend not built; run `make build-backend` first")
	}
	root := filepath.Join("..", "..")
	logPath := filepath.Join(t.TempDir(), "backend.log")

	m := &Manager{cfg: Config{
		Bin:           bin,
		Transport:     TransportStdio,
		DataDir:       t.TempDir(),
		MigrationsDir: filepath.Join(root, "..", "drizzle"),
		LogFile:       logPath,
	}, stopped: make(chan struct{})}

	tr, err := m.Start()
	if err != nil {
		t.Fatalf("Start: %v", err)
	}
	defer m.Stop()

	created, err := tr.Do("POST", "/workspaces", map[string]any{"name": "Go IT", "projectPath": t.TempDir()}, nil)
	if err != nil {
		t.Fatalf("create Do: %v", err)
	}
	defer created.Body.Close()
	cb, _ := io.ReadAll(created.Body)
	var cenv client.Envelope
	if err := json.Unmarshal(cb, &cenv); err != nil {
		t.Fatalf("create response not envelope: %v\n%s", err, cb)
	}
	if cenv.Error != nil {
		logContent, _ := os.ReadFile(logPath)
		t.Fatalf("create failed: %+v\n--- backend log ---\n%s", cenv.Error, logContent)
	}
	var ws struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(cenv.Data, &ws); err != nil {
		t.Fatalf("create data: %v", err)
	}
	if ws.ID == "" {
		t.Fatal("create returned no id")
	}
}

func TestManagerSpawnHTTP(t *testing.T) {
	bin := findBuiltBackend(t)
	if bin == "" {
		t.Skip("backend not built; run `make build-backend` first")
	}

	m := &Manager{cfg: Config{
		Bin:       bin,
		Transport: TransportHTTP,
		Port:      0, // picks a free port via a listener probe
		DataDir:   t.TempDir(),
	}, stopped: make(chan struct{})}
	if m.cfg.Port == 0 {
		port, err := freePort()
		if err != nil {
			t.Fatalf("freePort: %v", err)
		}
		m.cfg.Port = port
	}

	tr, err := m.Start()
	if err != nil {
		t.Fatalf("Start: %v", err)
	}
	defer m.Stop()

	resp, err := tr.Do("GET", "/workspaces", nil, nil)
	if err != nil {
		t.Fatalf("Do: %v", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var env client.Envelope
	if err := json.Unmarshal(body, &env); err != nil {
		t.Fatalf("response not an envelope: %v\n%s", err, body)
	}
}