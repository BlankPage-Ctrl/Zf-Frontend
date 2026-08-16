# desktop/backend

This folder is the **bundled backend** shipped with the Wails desktop app. It is
**gitignored** and populated at build time by the root `Makefile`.

The Wails app (Go) spawns the backend found here via `internal/backend.Manager`.
`Manager.discoverBin()` probes, in order:

1. `desktop/backend/bin/backend` — single Bun executable (TRANSPORT default `stdio`)
2. `desktop/backend/dist/apps/index.js` — compiled JS entry (`node ...`)

## Layout

| Path              | Contents                                                          |
|-------------------|-------------------------------------------------------------------|
| `bin/backend`     | Bun single executable, built by `make build-backend-exec` (`scripts/build-bun.mjs` via `bun build --compile`) |
| `dist/`           | Compiled JS backend (`npm run build:ts` output, `make build-backend-js`) |
| `data/`           | Runtime SQLite DB / per-instance data (`APP_DATA_DIR`)            |

The Bun executable embeds the Bun runtime **and** the native `@libsql` addon,
so nothing extra needs to ship alongside it.

## Build commands (root `Makefile`)

The root `Makefile` is a Runner: it builds the backend (JS), copies it here, and
runs the Wails desktop app (including the frontend via the vite dev watcher)
together. Preview mode differs only by transport:

```sh
make dev-stdio   # preview over stdio (TRANSPORT=stdio)
make dev-http    # preview over HTTP (TRANSPORT=http)
```

Under the hood both run: `clean -> build backend (js) -> copy -> wails dev -s -tags webkit2_41`.
`wails dev` starts the frontend itself, so there is no explicit frontend build.

Helper targets (also available):

```sh
make build-backend-js    # npm run build:ts -> desktop/backend/dist
make build-backend-exec  # bun build --compile -> desktop/backend/bin/backend
make copy-backend        # copies the compiled JS backend
```

`exec` requires `bun` on PATH (>= 1.1; tested on 1.3). `js` requires only
`node`.