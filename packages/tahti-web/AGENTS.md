# AGENTS.md — `@tahti-player/tahti-web`

Package-specific agent instructions. **Start:** [`AGENTS-START-HERE.md`](../../AGENTS-START-HERE.md). Generic monorepo conventions: root [`AGENTS.md`](../../AGENTS.md). Fork/API relationship: [`TAHTI.md`](../../TAHTI.md).

## Two-repo product

`tahti-web` has **no backend**. Sibling checkout **`../tahti-org`** (same parent as this repo, e.g. `/home/jani/workspace/tahti-org` next to `tahti-nuclear`) owns Fastify API, Prisma, `@tahti/shared`, and the production Next.js `apps/web` client being replaced.

- HTTP contracts / schema / OG server pieces → `tahti-org/apps/api` + `tahti-org/packages/shared`.
- Listen/studio UI, routing, client fetch, this SPA’s nginx → here.
- Before assuming new backend work, search `tahti-org/apps/api` first.

**Contract lookup order:** (1) `tahti-org/apps/api/src/routes/**` (2) `tahti-org/packages/shared/src/dto/**` (3) `tahti-org/openapi.json` / `openapi.public.json` (4) `https://api.tahti.live/api` (5) [`docs/API-REFERENCE.md`](docs/API-REFERENCE.md) + `pnpm check:api-docs` (needs `../tahti-org`).

No route + no DTO ⇒ no real contract — do not invent shapes. Mock explicitly (`MOCKS.md`) or flag sibling API work. See [`docs/PLUGIN-INTEGRATIONS.md`](docs/PLUGIN-INTEGRATIONS.md).

## Cutover, not a prototype

Vite SPA on Nuclear chrome replacing `apps/web` at `app.tahti.live`, live on `beta.tahti.live` against production API. Plans: [`CUTOVER.md`](CUTOVER.md), parity: [`FEATURES.md`](FEATURES.md) (Remaining section), open slices: [`WORKPLAN.md`](WORKPLAN.md), agent todos: [`docs/todo/INDEX.md`](../../docs/todo/INDEX.md).

## Persistent chrome

Ordinary surfaces: keep sidebar / drawer / bottom bar / Studio/Admin / in-page tabs mounted always. Takeover OK without chrome: full-screen player, public release/share, maximized Pro Editor. Nav changes: Playwright all three governance contexts (member / Studio / Admin). Details: root `AGENTS.md`.

## Design system

1. Storybook first — [`STORYBOOK-SURFACES.md`](STORYBOOK-SURFACES.md), `packages/storybook/src/` (+ `tahti-web/`).
2. Else local shared (`ViewShell`, `StudioPanel`, `PageStates`, `InPageNav`, gates/navs).
3. Else build + add story; flag `Missing states:` / `Orphan:`.
4. Keep live data/features when swapping primitives.

Ordinary chrome pages use **`ViewShell`** (short title + optional one-line subtitle). Header actions live in children. `StudioNav` / Admin / Listen tabs stay **outside** the shell. Entity cover-overlay headers and takeover surfaces are exceptions.

Prefer catalog components (`Badge`, `Button`, `Tabs`, `Dialog`, `Input`, `Select`, `EmptyState`, …). Semantic tokens only (`bg-background`, …) — see `packages/tailwind-config/global.css`.

## Add-ons & plugins

Page widgets configure from **Settings → Add-ons** only (not a second Widgets section). Marketplace zips: `../tahti-registry`. Plugin extraction notes: [`PLUGIN-STORE-PLAN.md`](PLUGIN-STORE-PLAN.md), [`docs/PLUGINS.md`](docs/PLUGINS.md), [`docs/PLUGIN-INTEGRATIONS.md`](docs/PLUGIN-INTEGRATIONS.md).

## Agent workflow

1. INDEX + this file; for parity, inspect matching `../tahti-org` page/route first.
2. Prefer existing API clients and Storybook/`ViewShell` primitives.
3. API in `src/api`; changelog/worklog diary entry for user-visible ships.
4. Nav changes: chrome stays mounted on chrome views; verify selection + governance entry points.
5. Checks:

   ```bash
   pnpm exec prettier --write <changed-files>
   pnpm --filter @tahti-player/tahti-web type-check
   pnpm --filter @tahti-player/tahti-web lint
   git diff --check
   ```

6. Bump `packages/tahti-web/package.json` patch on user-visible commits (e.g. `0.0.83` → `0.0.84`). Skip docs-only.
7. **Close todos:** fold → `docs/todo/HISTORY.md`, delete todo file, update INDEX, strip finished lines from `WORKPLAN.md`. Skill: `tahti-web-ship-loop`.
8. Do not commit, push, deploy, or modify `../tahti-org` unless the user asks.
