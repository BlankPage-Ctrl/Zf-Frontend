package main

import (
	"context"
	"os"

	"github.com/joho/godotenv"

	"myproject/internal/categories"
	"myproject/internal/chats"
	"myproject/internal/client"
	"myproject/internal/files"
	"myproject/internal/messages"
	"myproject/internal/mockapi"
	"myproject/internal/models"
	"myproject/internal/notes"
	"myproject/internal/providers"
	"myproject/internal/settings"
	"myproject/internal/stream"
	"myproject/internal/workspaces"
)

type App struct {
	ctx              context.Context
	Client           *client.Client
	Workspaces       *workspaces.Service
	Chats            *chats.Service
	Messages         *messages.Service
	Notes            *notes.Service
	Categories       *categories.Service
	Providers        *providers.Service
	Models           *models.Service
	Settings         *settings.Service
	Files            *files.Service
	FileWatch        *stream.FileWatchService
	ChatStream       *stream.ChatStreamService
}

func NewApp() *App {
	_ = godotenv.Load()

	c := client.New()

	if os.Getenv("USE_MOCK") == "true" {
		mockapi.EnableMock(c)
	}

	return &App{
		Client:     c,
		Workspaces: workspaces.NewService(c),
		Chats:      chats.NewService(c),
		Messages:   messages.NewService(c),
		Notes:      notes.NewService(c),
		Categories: categories.NewService(c),
		Providers:  providers.NewService(c),
		Models:     models.NewService(c),
		Settings:   settings.NewService(c),
		Files:      files.NewService(c),
		FileWatch:  stream.NewFileWatchService(c),
		ChatStream: stream.NewChatStreamService(c),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.FileWatch.SetAppContext(ctx)
	a.ChatStream.SetAppContext(ctx)
	a.Files.SetAppContext(ctx)
}
