# User manual refresh (`packages/docs`)

**Status:** open

Found in the 2026-10-15 docs audit. The GitBook user manual in `packages/docs` was written for Nuclear's player UI. Since 2026-09-01 the desktop app renders tahti-web, so most pages describe screens and settings that no longer exist. The audit updated `user-manual/remote-control.md` (Tahti Jam pairing, #743) and `misc/keyboard-shortcuts.md` (tahti-web's real shortcuts); the integrations pages (MCP, MPD, Discord, Jam HTTP API) were rewritten with #737-#743.

## Done

- Favorites, Playlists, The queue, Listening history and Listening stats rewritten against tahti-web (#789).
- Getting started, How Tahti Player works and Plugins and providers rewritten (#790).
- Themes (all four pages) and Discover rewritten; the stale sitemap page removed (#791).
- `plugins/*.md`: nothing loads `@tahti-player/plugin-sdk` plugins any more, so the 20 SDK pages carry a legacy warning and sit under "Legacy: Nuclear plugin SDK" in `SUMMARY.md`; `tahti-web-authoring.md` is the Add-ons section.

## Pages to rewrite against tahti-web

| Page | What is stale |
| --- | --- |
| `user-manual/installation.md` | Mostly current (releases, platforms); check Nuclear names and the Snap/Flatpak notes |

## Plan

1. Rewrite the user manual and core concepts from the mock app, with fresh screenshots (`scripts/capture-readme-guide.mjs` captures the views).
2. Update `SUMMARY.md` and remove pages that no longer apply.
