# User manual refresh (`packages/docs`)

**Status:** partial

Found in the 2026-10-15 docs audit. The GitBook user manual in `packages/docs` was written for Nuclear's player UI. Since 2026-09-01 the desktop app renders tahti-web, so most pages describe screens and settings that no longer exist. The audit updated `user-manual/remote-control.md` (Tahti Jam pairing, #743) and `misc/keyboard-shortcuts.md` (tahti-web's real shortcuts); the integrations pages (MCP, MPD, Discord, Jam HTTP API) were rewritten with #737-#743.

## Done

- Favorites, Playlists, The queue, Listening history and Listening stats rewritten against tahti-web (#789).
- Getting started, How Tahti Player works and Plugins and providers rewritten (#790).
- Themes (all four pages) and Discover rewritten; the stale sitemap page removed (#791).
- `plugins/*.md`: nothing loads `@tahti-player/plugin-sdk` plugins any more, so the 20 SDK pages carry a legacy warning and sit under "Legacy: Nuclear plugin SDK" in `SUMMARY.md`; `tahti-web-authoring.md` is the Add-ons section.
- Installation rewritten from the real release files (no MSI, DMG, RPM, Flatpak or AUR; the snap installs from the file). Its Updating section describes the in-app updater from #805 (the startup notice, Settings → Integrations → Desktop app, and that the snap does not update itself), checked against `desktopUpdates.ts`, `DesktopUpdatesRow.tsx` and the release workflow (batch 64).
- Platform-specific notes rewritten: the app data and log folders the desktop app really uses (no config folder), and the Linux environment variables it sets (batch 64).
- The documentation home page (`README.md`) rewritten: Tahti links instead of Nuclear's Mastodon and Discord, the current package list and dev commands (batch 64).

## Plan

1. Fresh screenshots for the rewritten pages from the mock app (`scripts/capture-readme-guide.mjs` captures the views).
