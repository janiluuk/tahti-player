# RUST

Extracted from root `AGENTS.md` for on-demand reading.

## Rust Backend

The Tauri backend lives in `packages/player/src-tauri/src/`. Modules:

- `bridge/` - bidirectional RPC. Lets Rust servers call into the frontend (`Bridge::call` emits a `bridge:request` event, frontend replies via the `bridge_respond` command).
- `http_api/` - Axum REST + SSE server for Tahti Jam remote control
- `mcp/` - MCP server exposing player functions as tools to LLM clients
- `mpd/` - MPD-protocol TCP server for clients like ncmpcpp
- `stream_server.rs` - local audio proxy adding CORS + Range so the browser can play blocked streams
- `http.rs` - `http_fetch` command, a CORS-bypassing HTTP proxy for the frontend
- `ytdlp.rs` / `ytdlp_setup.rs` - yt-dlp subprocess wrapper; auto-downloads the binary
- `discord.rs` - Discord Rich Presence
- `commands.rs` - filesystem helpers (zip, download, flatpak detection)
- `net.rs`, `setup.rs`, `logging.rs` - port binding, log plugin config, startup log ring buffer
- `lib.rs` - declares modules, registers all commands, runs `init_*` in `.setup()`. `main.rs` - binary entry, env fixups.

Commands (run from `packages/player/src-tauri/`):

```bash
cargo test          # Rust tests (no clippy/rustfmt configured; run manually)
```

`pnpm dev` runs `tauri dev`; `pnpm build` (in `packages/player`) runs the full `tauri build`.

