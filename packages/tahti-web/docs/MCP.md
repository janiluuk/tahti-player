# Tahti Player MCP (desktop)

The **Model Context Protocol** server lets an AI tool control the desktop app: playback, the queue, the desktop library, radio and Tahti search. It runs only in the Tauri desktop app, on `http://127.0.0.1:8800/mcp` (up to 8809).

| Piece | Path |
| ----- | ---- |
| Rust server, tools, loopback check | `packages/player/src-tauri/src/mcp/` |
| Desktop wiring | `packages/player/src/desktopMcp.ts` |
| API (domains, methods, types) | `packages/tahti-web/src/lib/mcp/` |
| Settings → Integrations row | `src/components/McpIntegrationRow.tsx` |
| User docs | `packages/docs/integrations/mcp-server.md` |
| Architecture | `packages/docs/development/mcp-architecture.md` |

## Enable (desktop)

1. Run the desktop app: `pnpm --filter @tahti-player/player tauri dev`.
2. Settings → Integrations → **MCP server**.
3. Point Claude Code, Cursor or Codex at the URL the row shows, with the Streamable HTTP transport (`claude mcp add tahti --transport http http://127.0.0.1:8800/mcp`).

## History

From 2026-09-01 (`126a4fc9e`, when the desktop entry switched to the tahti-web UI) until the rebuild (2026-10-14, see `docs/todo/HISTORY.md`), the server never started: it was wired to Nuclear's `initPlayerApp` and Nuclear's player stores. Nuclear's MCP metadata in `packages/plugin-sdk/src/mcp` is no longer used by it; its bridge dispatcher (`packages/player/src/services/bridge/`) was removed in 2026-10.

## Not on beta.tahti.live

A browser tab cannot host a local server. The Tahti API has its own MCP endpoint (`POST /api/v1/mcp` in tahti-org, personal API tokens); Settings → Account → API tokens shows its URL.
