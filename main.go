package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:  "myproject",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.onShutdown,
		Bind: []interface{}{
			app,
			app.Workspaces,
			app.Chats,
			app.Messages,
			app.Notes,
			app.Categories,
			app.Providers,
			app.Models,
			app.Settings,
			app.Files,
			app.Shell,
			app.FileWatch,
			app.ChatStream,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
