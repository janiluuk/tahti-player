# Tahti Player MCP (desktop)

> **Not running since 2026-09-01.** The desktop app now mounts the tahti-web UI, and nothing calls Nuclear's `initPlayerApp`, which started this server. The steps below describe the old Nuclear player and do not work in current builds. The server is being rebuilt on tahti-web's player: see `docs/todo/desktop-mcp.md` in the repository.

The **Model Context Protocol** server is **not** part of the Vite SPA (`@tahti-player/tahti-web` / beta.tahti.live). It is part of the Tahti Player Tauri desktop stack and exposes the local player controls to AI tools.

## Where it lives

| Piece | Path |
|-------|------|
| Rust server (`rmcp` Streamable HTTP) | `packages/player/src-tauri/src/mcp/` |
| TS lifecycle (`mcp_start` / `mcp_stop`) | `packages/player/src/services/mcp/` |
| Tool metadata (Queue, Playback, …) | `packages/plugin-sdk/src/mcp/` |
| Settings UI | Player → Settings → Integrations |
| Docs | `packages/docs/integrations/mcp-server.md` |
| Architecture | `packages/docs/development/mcp-architecture.md` |

**Parity check** (optional, needs sibling `../nuclear` checkout):

```bash
node packages/tahti-web/scripts/verify-nuclear-mcp-parity.mjs
```

## Enable (desktop)

1. Run Tahti Player from this repo:
   ```bash
   export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22
   pnpm --filter @tahti-player/player tauri:dev   # or the package’s documented tauri script
   ```
2. Settings → Integrations → **Enable MCP Server**.
3. Server binds `http://127.0.0.1:8800/mcp` … `8809` (localhost only).
4. Point Cursor / Claude / Codex at that URL with **Streamable HTTP** transport.

Tools (unchanged from upstream): `list_methods`, `method_details`, `describe_type`, `call` over domains Queue, Playback, Metadata, Favorites, Playlists, Dashboard, Providers (+ Settings in plugin-sdk meta).

A screenshot of the Settings → Integrations panel (Enable MCP Server toggle
+ MCP Server URL field) lives at
`packages/docs/.gitbook/assets/mcp-settings.png`, embedded in
`packages/docs/integrations/mcp-server.md`.

**Retaking it:** the real desktop build needs a live Tauri backend just to
get past its own "Connecting to Tahti Player…" bootstrap, so this was
captured by rendering `App.tsx` directly in a plain browser instead —
`registerBuiltInCoreSettings()` + `initializeSettingsStore()` +
`hydrateThemeStore()` + `applyThemeFromSettingsIfAny()`, same calls
`initPlayerApp.tsx` makes, mounted from a throwaway entry point that skips
`main.tsx`'s `isTauri` branch. `App.tsx` and its settings tree pull in a
handful of Tauri modules at import time (`@tauri-apps/plugin-os`,
`@tauri-apps/plugin-store`, `@tauri-apps/api/window`,
`@tauri-apps/plugin-log`) — point Vite's `resolve.alias` for just those
four at the same in-memory/no-op shims `packages/player/src/test/setup.ts`
already uses for Vitest (`src/test/utils/inMemoryTauriStore.ts` covers
`plugin-store`; the rest are a couple lines each). None of this is wired
into the repo — it was a scratch harness, deleted after the screenshot —
recreate it if the panel changes enough to need a new one. The MCP server
itself never actually starts this way; `mcp_start` still requires the real
native Tauri backend, so this only proves the Settings UI renders
correctly, not that the server works.

## Why not on beta.tahti.live

MCP requires the Tauri process + webview **bridge** to the live player API. A multi-user CDN SPA cannot host that localhost control plane. Cutover of listen/studio to SPA does **not** remove desktop MCP from this fork.

## Product stance

- **Desktop Tahti Player:** MCP **broken since 2026-09-01**, being rebuilt (local-only).
- **Web cutover (`tahti-web`):** N/A for desktop MCP; an optional future *Tahti API* MCP would be a separate package, not a browser-hosted local control plane.
