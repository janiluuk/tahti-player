# Tahti Player — project notes

Tahti Player is built on [nukeop/nuclear](https://github.com/nukeop/nuclear) (AGPL-3.0).
The canonical repository is [github.com/janiluuk/tahti-player](https://github.com/janiluuk/tahti-player).

It is **not** the upstream Nuclear project. Do not open Nuclear PRs from this tree without cherry-picking onto a clean upstream branch.

## Product in one paragraph

**Tahti** is a Finnish nonprofit broadcasting platform for independent artists (live channels, archive, fan subscriptions). This fork adds `@tahti-player/tahti-web` — a Nuclear-UI listen + studio SPA that already runs on **beta.tahti.live** against the production API, intended to replace the Next.js `apps/web` client after cutover ([`packages/tahti-web/CUTOVER.md`](./packages/tahti-web/CUTOVER.md)).

## Remotes

| Remote | URL | Role |
|--------|-----|------|
| `origin` | `https://github.com/janiluuk/tahti-player.git` | Tahti Player (push here) |
| `upstream` | `https://github.com/nukeop/nuclear.git` | Nuclear upstream (fetch/rebase only) |

Sync upstream later:

```bash
git fetch upstream
git rebase upstream/master   # or merge
```

## Plugin & theme registry

Marketplace plugins and themes are both served from a single combined repo, [github.com/janiluuk/tahti-registry](https://github.com/janiluuk/tahti-registry) (`plugins.json` + `themes.json`, fetched directly from `raw.githubusercontent.com` — no CDN layer). It replaces the two separate upstream repos (`NuclearPlayer/plugin-registry`, `NuclearPlayer/theme-registry`), which were served via jsDelivr. The Nuclear desktop clients (`packages/player/src/apis/pluginMarketplaceApi.ts`, `themeRegistryApi.ts`) were removed with the dead desktop UI in 2026-10 (last at `d703e03cf`); tahti-web has no catalog client yet. Sibling checkout: `../tahti-registry`. After adding a plugin, users must see it in that repo; after changing one, bump `version` in the plugin **and** in the catalog (auto-update reads the catalog). See `AGENTS.md`.

## Tahti package

- **`packages/tahti-web`** — listen/studio client on Nuclear UI → public Tahti API
- Dev: `pnpm dev:tahti` (Node 24)
- Offline: `VITE_FORCE_MOCK=1 pnpm dev:tahti`
- Deploy beta: `pnpm deploy:tahti-beta` → vimage `:15180` / `beta.tahti.live`
- Docs: package [`README.md`](./packages/tahti-web/README.md), [`FEATURES.md`](./packages/tahti-web/FEATURES.md), [`MOCKS.md`](./packages/tahti-web/MOCKS.md), [`deploy/README.md`](./packages/tahti-web/deploy/README.md)
- Screenshots: [`packages/tahti-web/docs/redesign-shots/`](./packages/tahti-web/docs/redesign-shots/)
- Local planning (gitignored): `tahti-fit/`

Public API reference: [`https://api.tahti.live/api`](https://api.tahti.live/api).

## Backend lives in a separate repo

`tahti-web` has no server code of its own — it only calls the Tahti API over HTTP (via the `/tahti-api` dev proxy, see `packages/tahti-web/vite.config.ts`). The actual API — Fastify routes, Prisma schema, and shared Zod DTOs (`@tahti/shared`) — lives in a sibling checkout at **`../tahti-org`** (relative to this repo's parent workspace directory), not inside this monorepo. When a task needs a new or changed endpoint, that work happens in `tahti-org/apps/api` (routes under `src/routes/`, shared response schemas in `packages/shared/src/dto/api-responses.ts`, registered in `src/server.ts`) — check there for existing integrations (e.g. ACRCloud/AcoustID fingerprinting) before assuming something needs to be built from scratch or reaching for an unintegrated third-party service.

## What this port is, and how it should look

`tahti-web` is an in-progress port: swapping Tahti's existing Next.js `apps/web` client (in `tahti-org`) for this standalone player built on Nuclear's UI, talking to the same API. It is replacing a real product, not prototyping one.

Because of that, treat every screen as a professional app, not a demo: prioritize clarity, simplicity, and practicality over decoration. Custom Tahti-specific widgets are expected (channels, archives, fingerprinting, fan tiers — none of that exists in stock Nuclear), but they should read as a natural, restrained extension of Nuclear's own design language, not a bolted-on skin. When in doubt, favor the plainer, more legible option.

## Detached from `/home/jani/workspace/nuclear`

The pristine upstream clone at `~/workspace/nuclear` should track `nukeop/nuclear` only. All Tahti work lives **here**.
