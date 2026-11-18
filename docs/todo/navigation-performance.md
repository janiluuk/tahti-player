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
- Mock fixtures (`api/mock.ts` 26 KB and smaller mock files) used to ship
  in production because `allowMockFallback()` was a runtime call. They are
  compile-time constants now (see Done).
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
- [x] Every view renders its saved result on a revisit: Listen's rows
      (Selects, Trending, New releases, Coming up) and dashboard sections
      (`useListenSections` keeps its 60 s reuse but stores sections in the
      snapshot store, so they survive a reload and clear on sign-in/out),
      the Studio release page, Library History's "Across devices" and both
      Stash lists moved onto `lib/useSnapshotFetch.ts` (2026-11-16).
- [x] `@tanstack/table-core` out of the shell: `PlayableAmbientTrackList`
      loads `PlayableTrackTable` lazily (it was the only shell user, through
      Listen's New tracks). Production build 2026-11-16: `TahtiApp` 1524 →
      1374 KB, 471 → 427 KB gzipped at level 6; the table is a 72 KB chunk.
- [x] `@dnd-kit` out of the shell (2026-11-18, 0.0.411): `QueuePanel` renders
      focusable rows at once and loads its drag layer (`queueDnd.tsx`) when
      the browser is idle; `SortableBlocks` loads `sortableBlocksDnd.tsx` the
      first time a stack starts reordering (Listen's Order sections button
      preloads it on hover or focus). Block
      content mounts again once at that first switch, never after.
      Production build: `TahtiApp` 1381.5 → 1334.7 KB, 428.6 → 412.9 KB
      gzipped (Vite's report); dnd-kit is a 45 KB chunk.

## Left

- [x] Make mock mode a build-time constant so production drops the fixtures
      (2026-11-18, 0.0.414): `isForceMock()` and `allowMockFallback()` in
      `api/mode.ts` fold to literals at build time. Call sites branch on them, and
      `withMockFallback` takes `null` when fixtures are off, so Rollup drops
      `api/mock*`. Production build: `TahtiApp` 1289 KB, 399 KB gzipped.
      `lp-mock-scheduled`, `AURORA42` and the listening-party fixtures are
      absent from every chunk.
- [ ] Check the effect on a real browser against the live API (back/forward
      between Listen, an artist profile and a track).
