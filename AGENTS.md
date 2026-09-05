# AGENTS.md

Guidelines for AI coding agents working on Tahti Player.

**Start here first:** [`AGENTS-START-HERE.md`](./AGENTS-START-HERE.md). Settled forks: [`docs/DECISIONS.md`](./docs/DECISIONS.md). Open tasks: [`docs/todo/INDEX.md`](./docs/todo/INDEX.md).

On-demand detail (do not load unless the task needs it):

| Topic | File |
| --- | --- |
| Code style / components / domains / i18n | [`docs/agent/CODE-STYLE.md`](./docs/agent/CODE-STYLE.md) |
| Marketplace registry checklist | [`docs/agent/REGISTRY.md`](./docs/agent/REGISTRY.md) |
| Testing wrappers & conventions | [`docs/agent/TESTING.md`](./docs/agent/TESTING.md) |
| Tauri / Rust backend | [`docs/agent/RUST.md`](./docs/agent/RUST.md) |
| Changelog & releasing | [`docs/agent/RELEASE.md`](./docs/agent/RELEASE.md) |

## Project Overview

Tahti Player is a free, open-source music player without ads or tracking, built on [Nuclear](https://github.com/nukeop/nuclear)'s player UI. Desktop app: Tauri (Rust + React), pnpm monorepo + Turborepo.

This repository is the Tahti fork of Nuclear (`janiluuk/tahti-player`). Upstream: `nukeop/nuclear`. Sibling API: **`../tahti-org`**. Marketplace: **`../tahti-registry`**. Cutover overview: [`TAHTI.md`](./TAHTI.md). Listen/studio SPA: `packages/tahti-web` → [`packages/tahti-web/AGENTS.md`](./packages/tahti-web/AGENTS.md).

**Themes** = CSS variables → Tailwind. **Plugins** are unsandboxed. Store catalog = `tahti-registry` (not on-disk runtime `plugins.json`).

### Packages

- `@tahti-player/player` — Tauri app
- `@tahti-player/ui` / `storybook` / `plugin-sdk` / `model` / `themes` / `hifi` / `i18n`
- `@tahti-player/tahti-web` — beta.tahti.live
- `@tahti-player/docs` / `website` / `tools` / shared eslint + tailwind configs

## Commands

```bash
pnpm dev                 # Player
pnpm dev:remote          # Bind Vite 0.0.0.0 for remote control
pnpm storybook
pnpm dev:tahti           # tahti-web
pnpm build && pnpm tauri build
pnpm lint && pnpm type-check && pnpm test
pnpm --filter @tahti-player/ui test -- src/components/Badge/Badge.test.tsx
```

## Invariants (keep short)

- No comments in code; never commit unless asked; small focused changes.
- Import-provider Configure lives in this Nuclear repo (modal: settings → test → save/enable). Open API questions → [`docs/DECISIONS.md`](./docs/DECISIONS.md).
- **Todo lifecycle:** `docs/todo/` + INDEX (`open|blocked|partial`) → when done fold HISTORY, delete file, strip WORKPLAN. See [`CLAUDE.md`](./CLAUDE.md).
- Governance API in `../tahti-org`. Contexts: member `/governance`, artist `/studio/governance`, board `/admin/governance` + `/admin/agm`. No invented DTOs; advisory ≠ AGM ballot until sibling contracts exist.
- Registry: after plugin/theme add/change, update `../tahti-registry` — full checklist in [`docs/agent/REGISTRY.md`](./docs/agent/REGISTRY.md). Do not migrate runtime `plugins.json` yet.
- Storybook-first UI (see START-HERE / Storybook cheat sheet).
- Persistent chrome on ordinary surfaces; takeover surfaces may hide it. Tests: assert nav mounted before `aria-current`. Details: [`docs/agent/TESTING.md`](./docs/agent/TESTING.md).
- User-facing player strings via i18n (`en_US.json` only here).
- Changelog / release: [`docs/agent/RELEASE.md`](./docs/agent/RELEASE.md).

## Design & tooling

Neo-brutalist, purposeful motion, no generic AI chrome. pnpm workspaces, Turborepo, Vite, Vitest, ESLint+Prettier, Husky. TanStack Router regenerates on dev.
