# Desktop integrations on tahti-web

**Status:** partial

Since 2026-09-01 the desktop app mounts tahti-web and never calls Nuclear's
`initPlayerApp`, so every desktop integration that `initPlayerApp` started has
been dead. MCP was rebuilt first (#738-#740). This file covers the rest.

## Slices

1. **MPD server (shipped).** The Rust MPD server (`src-tauri/src/mpd/`) asks the webview
   over the bridge. Its calls now carry an `Mpd.` prefix so they don't collide
   with the MCP domains, and tahti-web answers them from `usePlayerStore`
   (`src/lib/mpd/`). tahti-web also sends the `player`, `playlist`, `mixer` and
   `options` notifications that MPD `idle` waits on. Settings → Integrations
   gets an on/off switch with the address.
2. **Discord Rich Presence (shipped).** tahti-web watches `usePlayerStore` and sets or
   clears the activity through the existing `discord_*` commands
   (`src/lib/discord/`). Settings → Integrations gets an on/off switch.
3. **Tahti Jam (open).** The phone remote. The Rust HTTP API
   (`src-tauri/src/http_api/`) still calls Nuclear method names over the
   bridge, binds `0.0.0.0` with no pairing or auth, and serves Nuclear's remote
   UI (`packages/player/src/remoteControl/`) out of `dist/`, which now holds
   tahti-web. It needs a remote view in tahti-web, a pairing token before it
   listens on the LAN, and its events (`remote:queue`, `remote:playback`,
   `remote:settings`) sent from `usePlayerStore`. Not started; needs a product
   call on pairing.

## Not checked

The desktop app was not run here (no display). Each slice was tested with
Vitest and `cargo test --lib`; a run with a real MPD client (`mpc status`) and
a real Discord client is still needed.
