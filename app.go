package main

import (
	"context"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"

	"myproject/internal/backend"
	"myproject/internal/categories"
	"myproject/internal/chats"
	"myproject/internal/client"
	"myproject/internal/hitl"
	"myproject/internal/files"
	"myproject/internal/messages"
	"myproject/internal/mockapi"
	"myproject/internal/models"
	"myproject/internal/notes"
	"myproject/internal/providers"
	"myproject/internal/settings"
	"myproject/internal/shell"
	"myproject/internal/stream"
	"myproject/internal/workspaces"
)

type App struct {
	ctx              context.Context
	Client           *client.Client
	Backend          *backend.Manager
	Workspaces       *workspaces.Service
	Chats            *chats.Service
	Messages         *messages.Service
	Notes            *notes.Service
	Categories       *categories.Service
	Providers        *providers.Service
	Models           *models.Service
	Settings         *settings.Service
	Files            *files.Service
	Shell            *shell.Service
	FileWatch        *stream.FileWatchService
	ChatStream       *stream.ChatStreamService
	Hitl            *hitl.Service
	HitlWatch        *stream.HitlWatchService
}

func NewApp() *App {
	_ = godotenv.Load()

	backendMgr, transport, err := resolveTransport()
	if err != nil {
		panic(err)
	}

	c := client.NewWithTransport(transport)

	if os.Getenv("USE_MOCK") == "true" {
		mockapi.EnableMock(c)
	}

	return &App{
		Client:     c,
		Backend:    backendMgr,
		Workspaces: workspaces.NewService(c),
		Chats:      chats.NewService(c),
		Messages:   messages.NewService(c),
		Notes:      notes.NewService(c),
		Categories: categories.NewService(c),
		Providers:  providers.NewService(c),
		Models:     models.NewService(c),
		Settings:   settings.NewService(c),
		Files:      files.NewService(c),
		Shell:      shell.NewService(c),
		FileWatch:  stream.NewFileWatchService(c),
		ChatStream: stream.NewChatStreamService(c),
		Hitl:       hitl.NewService(c),
		HitlWatch:  stream.NewHitlWatchService(c),
	}
}

// resolveTransport picks the delivery boundary, highest to lowest:
//   - USE_MOCK=true       -> in-process HTTP mock (mirrors real routes)
//   - BACKEND_URL set     -> external HTTP backend, no spawn
//   - otherwise           -> spawn the bundled backend; transport = TRANSPORT
func resolveTransport() (*backend.Manager, client.Transport, error) {
	if os.Getenv("USE_MOCK") == "true" {
		return nil, nil, nil // mock transport is set by EnableMock below
	}
	if os.Getenv("BACKEND_URL") != "" {
		return nil, client.New().Transport(), nil
	}
	mgr, err := backend.NewManagerFromEnv()
	if err != nil {
		return nil, nil, err
	}
	mgr.SetLogFile(filepath.Join(logDir(), "backend.log"))
	transport, err := mgr.Start()
	if err != nil {
		return nil, nil, err
	}
	return mgr, transport, nil
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.FileWatch.SetAppContext(ctx)
	a.ChatStream.SetAppContext(ctx)
	a.HitlWatch.SetAppContext(ctx)
	a.Files.SetAppContext(ctx)
}

// onShutdown stops the spawned backend cleanly.
func (a *App) onShutdown(ctx context.Context) {
	if a.Backend != nil {
		a.Backend.Stop()
	}
}

// logDir returns the desktop log folder used by the backend manager.
func logDir() string {
	if wd, err := os.Getwd(); err == nil {
		dir := filepath.Join(wd, "stream-logs")
		_ = os.MkdirAll(dir, 0o755)
		return dir
	}
	return "stream-logs"
}