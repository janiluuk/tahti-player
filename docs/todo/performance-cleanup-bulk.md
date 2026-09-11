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

### 2A. Extract shared `apiBaseUrl()` helper
The identical `VITE_TAHTI_API_URL` resolution block is copy-pasted across
**34 API modules** (~68 occurrences). Extract into a single `lib/apiBaseUrl.ts`
and import everywhere.

**Files to update:** `admin.ts`, `announcements.ts`, `api-tokens.ts`,
`archive-versions.ts`, `artist-settings.ts`, `broadcast.ts`, `channel-design.ts`,
`channel-gallery.ts`, `channel-provision.ts`, `client.ts`, `discover.ts`,
`disco-widgets.ts`, `discord-bot.ts`, `distribution.ts`, `events.ts`,
`export-plugins.ts`, `fan-tiers.ts`, `integrations.ts`, `mentions.ts`,
`messages.ts`, `notifications.ts`, `purchase-tiers.ts`, `revenue.ts`,
`rss-feed.ts`, `security.ts`, `shows.ts`, `sources.ts`, `studio.ts`,
`studio-extras.ts`, `track-insights.ts`, `user-media.ts`, `venues-manage.ts`,
plus `views/ArtistView.tsx`.

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
| `StudioProEditorView.tsx:240` | 4s | While stem is PENDING/PROCESSING |
| `StudioProEditorView.tsx:264` | 4s | While render is pending |
| `AudioRevisionList.tsx:101` | 4s | While processing === true | **→ usePolling 2026-09-11**
| `useJam.ts:137` | 5s | While jam session active (host push) |
| `useJam.ts:206` | 5s | While guest + playing (drift check) |

### 3C. Low priority — special cases
| File | Interval | Action |
|---|---|---|
| `AppShell.tsx:315` | 450ms | Title scrolling → replace with requestAnimationFrame |
| `notificationInboxStore.ts:110` | 20s | Store-level singleton → add visibility pause |

---

## Phase 4 — Split monolith files (>1000 lines)

| File | Lines | Split plan |
|---|---|---|
| `api/admin.ts` | 4629 | By domain: users, streams, content, logs, governance |
| `PluginStorePanel.tsx` | 3564 | Card grid, detail view, install flow |
| `api/client.ts` | 2863 | Fetch helpers, auth, error handling, mock fallback |
| `SettingsPanels.tsx` | 2523 | Extract each tab to its own file |
| `ChannelDesigner.tsx` | 2048 | Colors, layout, overlay, page blocks sub-panels |
| `api/studio.ts` | 1845 | Tracks, releases, collections, schedule |
| `router.tsx` | 1817 | Route definitions by section |
| `ArtistView.tsx` | 1754 | Extract tab bodies |
| `ChannelView.tsx` | 1677 | Chat rail, visualizer, layout blocks |

---

## Phase 5 — Env var and config cleanup

- Remove `VITE_ENABLE_DIAGNOSTICS` (single use, undocumented) or document it
- Audit `VITE_MOCK_ADMIN` (single use in mock-session)

---


## Shipped this pass (2026-09-11)

Phases **1A**, **1B** (minus Storybook primitives), **1C**, **2B**, and the
high-priority / selected medium **3A/3B** `usePolling` migrations above.
Still open: Phase **2A** `apiBaseUrl` extract, remaining Phase 3 polls
(Pro Editor, Jam, AppShell title scroll, notification store), Phase 4
monolith splits (see also `codebase-refactor-hotspots.md`), Phase 5 env.

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
