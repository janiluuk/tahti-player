---
description: What Tahti Player is made of
---

# How Tahti Player works

## The app

Tahti Player is one React app (`packages/tahti-web` in the repository). The browser version is served from beta.tahti.live; the desktop app is the same app inside a [Tauri](https://tauri.app) window. The project started as a fork of the [Nuclear](https://github.com/nukeop/nuclear) music player, and the player bar, queue and much of the design come from there. Since 2026-09 the desktop window shows the Tahti app rather than Nuclear's.

<figure><img src="../.gitbook/assets/app-layout-overview.png" alt="Tahti Player app layout on Listen home"><figcaption><p>The same app in the browser and the desktop window</p></figcaption></figure>

## Where the music comes from

- **Tahti:** artists' channels (live broadcasts and their archive), releases, collections and Tahti Radio, all served by the Tahti API.
- **Internet radio:** a curated list of stations, plus your own stations in Settings → Playback.
- **Linked tracks:** hearthis.at, Mixcloud, Spotify and Bandcamp tracks that artists link. Tahti keeps only the link and the provider's own player plays them.
- **Your files** (desktop app): the local library under Library → Local files.

## What only the desktop app does

- The local library: import, folder watching, tag editing, analysis (BPM, key, loudness), playlists and smart playlists.
- Local servers you can turn on in Settings → Integrations: [Tahti Jam](desktop/remote-control.md) (a phone remote for paired devices), an [MCP server](../integrations/mcp-server.md) for AI tools, an [MPD server](../integrations/mpd-server.md) for MPD clients, and [Discord](../integrations/discord.md) Rich Presence.

## Add-ons

Themes, visualizers, import sources and other add-ons are in Settings → Add-ons; see [Plugins and providers](account/add-ons.md).
