# Desktop MCP and the Tahti API MCP

**Status:** open

User request (2026-10-14): bring back the desktop app's MCP server, fix the docs that describe it, then grow the Tahti API MCP in tahti-org.

## What was found

- Since `126a4fc9e` (2026-09-01) the desktop entry `packages/player/src/main.tsx` mounts the tahti-web UI (`mountTahtiApp`). `initPlayerApp`, which started the MCP server, the bridge, MPD, the local HTTP remote-control API and Discord Rich Presence, is no longer called, so none of them start.
- The old bridge drove Nuclear's player stores; tahti-web plays through its own `usePlayerStore`, so even a started server would control nothing that plays.
- `rmcp` 0.17 checks neither `Origin` nor `Host` (the MCP spec requires `Origin` validation against DNS rebinding).
- Method metadata was kept twice (Rust `src-tauri/src/mcp/metadata/` JSON and `plugin-sdk/src/mcp`); `Settings` was callable but not discoverable.
- tahti-org's `POST /api/v1/mcp` (personal API tokens) has one tool, `search`; tahti-web never mentions it.

## Plan

1. Docs say what works today (this file's first PR).
2. Rust: discovery tools ask the webview for metadata over the bridge (one source of truth), `list_methods` without a domain lists the domains, reject requests whose `Origin` or `Host` is not loopback, Tahti naming.
3. tahti-web `src/lib/mcp/`: domains over `usePlayerStore` (Playback, Queue), the desktop library (Library), radio (Radio) and Tahti search (Tahti); the desktop entry answers `bridge:request` with it; Settings → Integrations gets a working MCP toggle and URL in the desktop app.
4. Docs and the agent skill rewritten for the new tools.
5. tahti-org: more tools on `/api/v1/mcp` (favorites, playlists, follow, own library), each checking a write-scoped token; a Help section on connecting with an API token.

Not in scope: MPD, the local HTTP remote-control API and Discord Rich Presence (also not started since 2026-09-01; listed in Settings as desktop features).
