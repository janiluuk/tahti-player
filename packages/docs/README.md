---
description: Tahti Player - Music streaming app for your desktop
---

# Tahti Player Documentation

Tahti Player is a free, open-source music player without ads or tracking. Search for any song or artist, build playlists, and start listening. This documentation is for both users and developers.

{% hint style="info" %}
Tahti Player is built on the Nuclear player project. The GitHub org and Mastodon handle below still point at upstream Nuclear where we don't run a replacement yet.
{% endhint %}

## Quick links

| Site     | Website                                                                    |
| -------- | -------------------------------------------------------------------------- |
| Website  | [https://tahti.live](https://tahti.live)                                   |
| Github   | [https://github.com/janiluuk/tahti-player](https://github.com/janiluuk/tahti-player) |
| Discord  | [https://discord.gg/JqPjKxE](https://discord.gg/JqPjKxE)                   |
| Mastodon | [https://fosstodon.org/@nuclearplayer](https://fosstodon.org/@nuclearplayer) |
| Docs     | [https://tahti.live](https://tahti.live)                                   |

## For users

New to Tahti Player? Start here:

- [Getting started](user-manual/getting-started.md) - install Tahti Player and play your first song
- [How Tahti Player works](core-concepts/how-nuclear-works.md) - what the app is made of and where the music comes from
- [Plugins and providers](core-concepts/plugins-and-providers.md) - add-ons, integrations and where they come from
- [Installation](user-manual/installation.md) - platform-specific download and install instructions
- [Themes](themes/themes.md) - customize Tahti Player's appearance with built-in, custom, or community themes

## What is in this repo?

This is a pnpm/turbo monorepo with these major packages:

- @tahti-player/tahti-web - The app: beta.tahti.live and the desktop window
- @tahti-player/player - Desktop shell (Tauri, Rust)
- @tahti-player/ui - Shared UI components
- @tahti-player/themes - Theming system and utilities
- @tahti-player/plugin-sdk - Nuclear's plugin SDK (legacy; the app no longer loads these plugins)
- @tahti-player/model - Shared data model
- @tahti-player/hifi - Advanced HTML5 audio engine
- @tahti-player/i18n - Internationalization
- @tahti-player/storybook - Component demos
- @tahti-player/tailwind-config - Shared Tailwind v4 CSS config
- @tahti-player/eslint-config - Shared linting rules
- @tahti-player/tools - Build and maintenance utilities
- @tahti-player/docs - This documentation
- @tahti-player/website - Project website

## For developers

### Tech highlights

- TypeScript everywhere
- Tauri (desktop shell)
- React 18
- Tailwind v4 configured via CSS (@theme/@layer), no tailwind.config.js
- TanStack Router (routing)
- TanStack Query v5 (HTTP and client‑side server state; no backend server)
- Vitest + React Testing Library (tests)
- Coverage via V8 with CI reporting

### Common workspace tasks

Run these from the repo root:

```bash
pnpm dev            # Run player (and UI) in dev mode
pnpm dev:remote     # Same, but binds Vite to 0.0.0.0 so the remote control UI is reachable from other devices
pnpm build          # Build all packages
pnpm lint           # Lint all packages
pnpm test           # Run all tests
pnpm test:coverage  # Run tests with coverage
pnpm type-check     # TypeScript checks
pnpm tauri          # Tauri CLI for the player
pnpm storybook      # Run Storybook
```