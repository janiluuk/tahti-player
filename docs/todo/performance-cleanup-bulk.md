# Performance Cleanup — Dead Code, Bloat & Remaining Polling

**Status:** partial

Comprehensive cleanup of stale dependencies, dead components, duplicate code,
and remaining `setInterval` polling that wasn't covered in the first perf pass.

---

## Phase 1 — Dead weight removal (low risk, high signal)

### 1A. Remove unused dependencies from tahti-web package.json — **done 2026-09-11**
- ~~`@material/material-color-utilities`~~
- ~~`motion`~~

### 1B. Remove dead components — **partial 2026-09-11**
- ~~`views/studio/StudioVenuesView.tsx`~~
- ~~`views/MyReleasesView.tsx`~~
- ~~`components/LanguageSwitcher.tsx` + test~~
- ~~`components/CollectionTrackList.tsx`~~
- ~~`components/ScheduleDialog.tsx`~~
- Kept `InPageNav` + `ConnectedQueuePanel` (Storybook surfaces / documented primitives)

### 1C. Remove deprecated types — **done 2026-09-11**
- ~~`MapScreen` / `MapScreenGroup` / `MAP_SCREEN_GROUPS`~~

---

## Phase 2 — Deduplicate API layer

### 2A. Extract shared `apiBaseUrl()` helper — **done 2026-09-11**
- All domain API modules + `client.ts` re-export + `ArtistView` / revelator
  now use `apiBase` from existing `api/http.ts` (no new `lib/apiBaseUrl.ts`).

### 2B. Remove local `forceMock` aliases — **done 2026-09-11**
- Removed `const forceMock = isForceMock` aliases across API modules
- Replaced inline `VITE_FORCE_MOCK` lambdas in `sources` / `sound-versions` /
  `venues-manage` / `events` / `track-insights` with shared `isForceMock()`

---

## Phase 3 — Migrate remaining polling to `usePolling`

Use the shared `usePolling` hook (from `hooks/usePolling.ts`) which auto-pauses
on `document.visibilitychange`.

### 3A. High priority — unconditional polls running globally
| File | Interval | What |
|---|---|---|
| `StreamManagerPanel.tsx:181` | 5s | Signal + stats | **→ usePolling 2026-09-11**
| `StreamManagerPanel.tsx:230` | 15s | Targets, programme, rotation | **→ usePolling 2026-09-11**
| `StreamManagerPanel.tsx:238` | **1s** | `setNow()` clock — consider rAF or 2s throttle | **→ usePolling 2026-09-11**
| `SelectsTab.tsx:78` | 4s | Admin selects + stream status | **→ usePolling 2026-09-11**
| `AdminLogsView.tsx:118` | 15s | Container logs | **→ usePolling 2026-09-11**
| `AdminActivityView.tsx:175` | 15s | Activity feed | **→ usePolling 2026-09-11**

### 3B. Medium priority — conditional polls (processing/transcode)
| File | Interval | Condition |
|---|---|---|
| `StudioGoLiveView.tsx:255` | 4s | While mounted (signal check) | **→ usePolling 2026-09-11**
| `StudioSoundView.tsx:142` | 4s | While status is PENDING/PROCESSING | **→ usePolling 2026-09-11**
| `StudioProEditorView.tsx:240` | 4s | While stem is PENDING/PROCESSING | **→ usePolling 2026-09-11**
| `StudioProEditorView.tsx:264` | 4s | While render is pending | **→ usePolling 2026-09-11**
| `AudioRevisionList.tsx:101` | 4s | While processing === true | **→ usePolling 2026-09-11**
| `useJam.ts:137` | 5s | While jam session active (host push) | **→ usePolling 2026-09-11**
| `useJam.ts:206` | 5s | While guest + playing (drift check) | **→ usePolling 2026-09-11**

### 3C. Low priority — special cases
| File | Interval | Action |
|---|---|---|
| `AppShell.tsx:315` | 450ms | Title scrolling → replace with requestAnimationFrame | **→ rAF 2026-09-11**
| `notificationInboxStore.ts:110` | 20s | Store-level singleton → add visibility pause | **→ visibility pause 2026-09-11**

---

## Phase 4 — Split monolith files (>1000 lines)

| File | Lines | Split plan |
|---|---|---|
| `api/admin.ts` | ~436 | **Done 2026-09-15** — all domains peeled to `api/admin/admin-*.ts` except activity-feed/audit-topic and container logs, deliberately left (flagged as in-flight elsewhere) |
| `PluginStorePanel.tsx` | ~166 | **Done** as thin shell; categories under `plugin-store/` |
| `api/client.ts` | ~1419 | **Done** (named-module split): `client-request.ts` + `client-auth.ts` + `governance-member.ts` + `embeds.ts` + `radio-public.ts` + `membership.ts` + `listen.ts` |
| `SettingsPanels.tsx` | ~110 | **Done 2026-09-12** — one panel per file under `views/settings/panels/` |
| `ChannelDesigner.tsx` | ~1988 | **Partial 2026-09-15** — 4 low-coupling JSX chunks extracted (toolbar, saved-looks row, applied-preset banner, static preview section); remaining body still tightly closure-coupled, see `codebase-refactor-hotspots.md` item 12 |
| `api/studio.ts` | ~5 (barrel) | **Done 2026-09-15** — peeled into `api/studio/studio-{sounds,releases,collections,upload,editor}.ts` + shared `studio-request.ts`/`studio-mock.ts`, matching the source file's own section boundaries (not literally "tracks, releases, collections, schedule" as originally guessed here — see `codebase-refactor-hotspots.md` item 15) |
| `router.tsx` | 382 (assembly only) | **Done 2026-09-15** — peeled into `router/routes-*.tsx` by nav section (listen/settings/admin/library/transparency/help/auth/governance/info/studio/embed) + `router/router-core.tsx` + `router/router-lazy-views.ts`; see `codebase-refactor-hotspots.md` item 16 |
| `ArtistView.tsx` | ~1696 | **Partial 2026-09-15** — Releases/Collections tab bodies extracted; "Music" tab body still closure-coupled (30+ locals), see `codebase-refactor-hotspots.md` item 13 |
| `ChannelView.tsx` | ~1835 | **Investigated 2026-09-15, left untouched** — its natural componentizable pieces (visualizer, backdrop, layers menu, editors, playlist blocks) were already extracted in earlier work; what's left is one closure-coupled orchestrator with no comparable low-coupling chunk and no test coverage, see `codebase-refactor-hotspots.md` item 14 |

---

## Phase 5 — Env var and config cleanup — **done 2026-09-11**

- Documented `VITE_ENABLE_DIAGNOSTICS` + `VITE_MOCK_ADMIN` in `vite-env.d.ts`
  (kept: beta deploy sets diagnostics; mock-admin is intentional offline demo)

---


## Shipped this pass (2026-09-11)

Phases **1A–1C**, **2A–2B**, **3A–3C**, and **5** are done. Phase **4**
partial: PluginStore fully category-split; admin radio/storage/addons/
users/support/governance peels; `client.ts` full named-module split done
(2026-09-12: `listen`/`radio-public`/`governance-member`/`membership`/
`embeds` on top of the existing `requestJson`/auth extract);
SettingsPanels file-per-panel split (2026-09-12).
Still open in Phase 4: ChannelDesigner, studio, router, Artist/Channel
views. `admin.ts` domain peel completed 2026-09-15 (see `codebase-refactor-
hotspots.md`). **2026-09-15:** first slices of `ChannelDesigner.tsx` and
`ArtistView.tsx` also done (low-coupling chunks only — see
`codebase-refactor-hotspots.md` items 12-13); both still open for their
remaining, more tightly closure-coupled bodies. **2026-09-15 (later same
day):** `api/studio.ts` and `router.tsx` both fully split (mechanical,
no behavior change — see `codebase-refactor-hotspots.md` items 15-16);
off this backlog. `ChannelView.tsx` investigated and left untouched —
see item 14 (no low-coupling chunk left to extract, no test coverage).
Still open in Phase 4: `ChannelDesigner.tsx`'s remaining body,
`ArtistView.tsx`'s "Music" tab, `ChannelView.tsx`.

## Execution order

1. **Phase 1** first — pure deletions, easiest to review, no behavior change
2. **Phase 2** next — mechanical extraction, no behavior change
3. **Phase 3** — behavioral but each migration is isolated, test with `pnpm type-check`
4. **Phase 4** — largest scope, do as separate PRs per file if needed
5. **Phase 5** — trivial, bundle with any phase

Each phase should be its own commit (or PR for Phase 4) to keep reviews manageable.

## Verification
- `pnpm type-check` after every phase
- `pnpm test` after Phases 1–3
- `pnpm build` after Phase 4 (bundle size check)
- E2E smoke test after Phase 3 (polling changes affect runtime behavior)
