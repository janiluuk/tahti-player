# User manual refresh (`packages/docs`)

**Status:** open

Found in the 2026-10-15 docs audit. The GitBook user manual in `packages/docs` was written for Nuclear's player UI. Since 2026-09-01 the desktop app renders tahti-web, so most pages describe screens and settings that no longer exist. The audit updated `user-manual/remote-control.md` (Tahti Jam pairing, #743) and `misc/keyboard-shortcuts.md` (tahti-web's real shortcuts); the integrations pages (MCP, MPD, Discord, Jam HTTP API) were rewritten with #737-#743.

## Done

- Favorites, Playlists, The queue, Listening history and Listening stats rewritten against tahti-web (#789).
- Getting started, How Tahti Player works and Plugins and providers rewritten (#790).

## Pages to rewrite against tahti-web

| Page | What is stale |
| --- | --- |
| `user-manual/installation.md` | Mostly current (releases, platforms); check Nuclear names and the Snap/Flatpak notes |
| `core-concepts/tahti-sitemap-and-journeys.md` | 2026-08-28 route map; superseded by `packages/tahti-web/NAVIGATION-SITEMAP.md` (2026-10-03). Replace with a short user-facing tour or drop it |
| `misc/discovery.md` | Nuclear's auto-queue discovery; tahti-web has the Discover page |
| `themes/*.md` | `Preferences → Themes`; now Settings → Themes, with Nuclear Green as the default |
| `plugins/*.md` (21 pages) | Nuclear plugin SDK reference; keep only if the desktop app still loads SDK plugins, otherwise point to `tahti-web-authoring.md` |

## Plan

1. Decide whether `plugins/*.md` stays (does anything still load `@tahti-player/plugin-sdk` plugins?).
2. Rewrite the user manual and core concepts from the mock app, with fresh screenshots (`scripts/capture-readme-guide.mjs` captures the views).
3. Update `SUMMARY.md` and remove pages that no longer apply.
