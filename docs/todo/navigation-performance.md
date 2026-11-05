# Navigation performance: back/forward loads slowly

**Status:** partial

Going back and forth between pages feels slow. Every view fetches its data in
its own effect, so each visit starts from a loading state and waits on the
network again, even for a page seen seconds ago.

## What is already in place

- Route components are lazy (`router/router-lazy-views.ts`, 128 views) and the
  router preloads chunks on hover/focus (`defaultPreload: 'intent'` in
  `router.tsx`).
- `lib/idleRoutePrefetch.ts` warms Studio home, Library and Radio chunks when
  Listen is idle; `lib/intentRoutePrefetch.ts` warms Listen card targets.
- No data cache: `api/http.ts` `getJson` and `api/client-request.ts`
  `requestJson` call `fetch` every time.

## Measured (production build, 2026-11-05)

- First load: entry 1 KB + `TahtiApp` shell 1476 KB (453 KB gzipped at
  level 6) + `locale` 57 KB gzipped. No single library dominates the shell:
  app components 181 KB, react-dom 129 KB, ui components 127 KB, api 118 KB,
  headlessui 96 KB, motion 123 KB, tanstack table 51 KB, dnd-kit 44 KB.
- `content/mapScreens.ts` (62 KB, the screen atlas) was in the shell via
  `RightRailPanel` → `AdminPageCommentsPanel` → map helpers.
- Mock fixtures (`api/mock.ts` 26 KB and smaller mock files) ship in
  production because `allowMockFallback()` is a runtime call.
- nginx already sends `immutable` for hashed `/assets/*` and `no-cache` for
  `index.html`, but gzipped at the default level 1 (shell 508 KB vs 434 KB at
  level 6).

## Done

- [x] GET cache (`api/getCache.ts`): 30 s TTL, shared in-flight requests,
      cleared before and after every write through `requestJson` /
      `sendJson` / `mutate`, channel provisioning and the admin language
      import; live paths (auth, session, now playing, presence, chat,
      notifications, status, queue) skipped; off in unit tests and
      `VITE_FORCE_MOCK` (Storybook, mock e2e app).
- [x] `AdminPageCommentsPanel` lazy in `RightRailPanel`: the atlas moved to
      the `/more` chunk (shell 1476 → 1404 KB, 453 → 434 KB gzipped).
- [x] nginx `gzip_comp_level 6`, `gzip_min_length 1024`, `gzip_vary on`.

## Left

- [ ] Views still render their loader for one frame on a cache hit (state
      starts as loading). Seed initial state from the cache synchronously in
      the most visited views (Listen, Discover, artist profile, channel,
      track, release, Library tabs).
- [ ] Make mock mode a build-time constant so production drops the fixtures
      (touches ~40 api files and the tests that stub `VITE_*` env per test).
- [ ] `@tanstack/table-core` and `@dnd-kit` load with the shell; check which
      shell component needs them (queue panel, track table) and split if
      only some routes use them.
- [ ] Check the effect on a real browser against the live API (back/forward
      between Listen, an artist profile and a track).
