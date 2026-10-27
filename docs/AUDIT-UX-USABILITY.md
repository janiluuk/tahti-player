# UX / Usability Audit — Tahti Player

> Ran 2026-10-27. Comprehensive scan of `packages/player` (desktop) and `packages/tahti-web` (web). All line numbers verified against current main.

---

## Desktoptable of Contents

1. [Desktop Player — UX Issues](#desktop-player--ux-issues)
2. [Web App — UX Issues](#web-app--ux-issues)
3. [Performance Optimization Opportunities](#performance-optimization-opportunities)
4. [Desktop ↔ Web Feature Parity Gap](#desktop-web-feature-parity-gap)
5. [Actionable Todo List](#actionable-todo-list)

---

## Desktop Player — UX Issues

### High Priority (affects core usability)

| ID | Finding | File:Line | Detail |
|----|---------|-----------|--------|
| D-H1 | **3 views render without ViewShell** — missing page headers, inconsistent padding/layout. Should use `<ViewShell title=…>` like every other view. | `Album/Album.tsx:17`<br>`PlaylistDetail/PlaylistDetail.tsx:25`<br>`PlaylistImport/PlaylistImport.tsx:33` | These 3 files wrap content in raw `<ScrollableArea className="bg-background">`. All other views use `<ViewShell title=…> <ScrollableArea>…</ScrollableArea></ViewShell>`. |
| D-H2 | **TopArtistsWidget reimplements CardsRow** — custom scroll buttons, filter input, card layout. Wastes ~100 lines and breaks visual consistency with TopAlbums/NewReleases/EditorialPlaylists widgets which all use `DashboardCardsWidget` → `CardsRow`. | `Dashboard/components/TopArtistsWidget.tsx:47-152` | Filter input (line 58), scroll buttons (lines 77–102), card layout (lines 117–148). |
| D-H3 | **History list shows empty div on loading** — blank white space, no spinner or skeleton. User sees nothing. | `History/components/HistoryBody.tsx:30` | `<div className="flex-1" data-testid="history-loading" />`. Every other view uses `<Loader size="xl" />`. |
| D-H4 | **Settings and Sources have NO loading/error states** — no Loader, no error message, no retry. If async plugin init fails, user sees incomplete/empty UI with no way to recover. | `Settings/Settings.tsx`<br>`Sources/Sources.tsx` | Neither component checks `isLoading` flags or calls `error` handlers. |

### Medium Priority (degrades experience)

| ID | Finding | File:Line | Detail |
|----|---------|-----------|--------|
| D-M1 | **Heading hierarchy broken** — entity headers render `<h1 class="text-5xl...">` inside ViewShell which already provides an h1. Screen readers announce duplicate h1; visual rhythm inconsistent. Also seen in ArtistBioHeader. | `Album/components/AlbumHeader.tsx:74` — `text-5xl`<br>`Artist/components/ArtistBioHeader.tsx:77` — `text-5xl` | ViewShell's h1 is `text-3xl font-bold`. Entity headers should use `<h2>` or `<h3>`. |
| D-M2 | **Only Search view has a retry button on error** (correct pattern at line 45–57). All other views (AlbumTrackList, ArtistPopularTracks, etc.) show plain red text — user cannot recover from transient errors. | `Search/Search.tsx:45-57` vs `Album/components/AlbumTrackList.tsx:51-56`, `Artist/components/ArtistPopularTracks.tsx:35-40` | Create shared `<ErrorState>` component with optional `onRetry` action prop. |
| D-M3 | **Raw `<img>` tags** bypass MediaArtwork component (no consistent fallback, loading behavior, sizing). | `AlbumHeader.tsx:65`, `ArtistBioHeader.tsx:70`, `ArtistSocialHeader.tsx:124`, `SimilarArtists.tsx:59` | Use `<MediaArtwork>` from UI library for all album/artist artwork. |
| D-M4 | **Filter input in PlaylistsToolbar has no aria-label** — placeholder text only, not accessible to screen readers without surrounding context. | `Playlists/PlaylistsToolbar.tsx:56-62` | Add `aria-label={t('filterPlaylists')}` matching CardsRow pattern. |
| D-M5 | **SimilarArtist links duplicate alt text** — `<img alt={name}>` + `<span>{a.name}</span>` causes redundant announcement "link, artist name, artist name". | `Artist/components/ArtistSimilarArtists.tsx:53-68` | Use `alt=""` on decorative image; put accessible name on the Link. |
| D-M6 | **Settings renders nested ScrollableArea wrapper** — redundant scroll when Settings is used in modal context (modal itself is scrollable). | `Settings/Settings.tsx:13-14` | When rendered inside `SettingsModal`, ViewShell should own scrolling; nested wrapper conflicts with `overflow-hidden`. |

---

## Web App — UX Issues

### High Priority (affects core usability)

| ID | Finding | File:Line | Detail |
|----|---------|-----------|--------|
| W-H1 | **`.catch (() => undefined)` silently swallows ALL errors** in auth flows. Network failures leave user with empty form, no feedback, no recovery. Appears in 3 views + ArtistView + RadioView. | `VerifyView.tsx:38,49`<br>`ResetPasswordView.tsx:61`<br>`SetupPasswordView.tsx:63`<br>`ArtistView.tsx:210-211,231` | Pattern: `.then(data => setData(data)).catch(() => undefined)`. User sees nothing changes; no toast, no error text. |
| W-H2 | **RadioView reload partial failure** — `fetchRadioStation()` succeeds but one of the other parallel fetches fails silently (`.catch (() => null)`). Page shows mixed data from some endpoints and empty/grey areas from failed ones. No "some data unavailable" banner. | `RadioView.tsx:131-146` | 5 fetches fire; only the last `.finally()` clears loading. No tracking of individual success/fail status per endpoint. |
| W-H3 | **StudioDistributionView rolls section has no loading guard** — releases show `<PageLoading/>`, but parallel `fetchAllRoyalties()` silently fails on error and royalties panel is invisible (no data, no message). | `studio/StudioDistributionView.tsx:29,57-58,80` | Single `loading` state wraps only releases section. Royalties uses `allRoyalties.length > 0` with no fallback. |

### Medium Priority (degrades experience)

| ID | Finding | File:Line | Detail |
|----|---------|-----------|--------|
| W-M1 | **Raw `<span>"Offline"</span>`** duplicates OnAirBadge styling but isn't semantic, not reusable, and has no `role="status"`. | `RadioView.tsx:234-236` | Style: `text-accent-red-strong font-mono text-xs…` matches badge text; should use `<Badge variant="pill" color="gray">Offline</Badge>` or an `OfflineBadge` component. |
| W-M2 | **ArtistView tab bar uses raw div** instead of shared section navigation container (SectionTabsNav / Tabs from UI). | `ArtistView.tsx:588` | `<div className="border-border flex flex-wrap gap-2 border-b pb-3">` — hand-rolled styling. |
| W-M3 | **No error boundaries on sub-tab content** — crashes in RecordingsTab, ScheduleAnalytics, or any child component cascade to entire view. | `studio/StudioShowDetailView.tsx:50`<br>`studio/StudioScheduleView.tsx:121` | Parent only checks `!show`; no `try/catch` or error boundary around tab content mounts. |
| W-M4 | **Episode source displayed as inline text** instead of Badge/chip. Repetitive pattern across OverviewTab and EpisodesTab. | `studio/StudioShowDetail/OverviewTab.tsx:258-262` | `{ep.source === 'broadcast' ? ', recorded' : ', upload'}` — should be `<Badge>` chips. |
| W-M5 | **useScheduleForm has 27 useState calls** in a single hook — any single input change re-renders the entire form and all components consuming slices. Could consolidate into `useReducer` or Zustand-like state. | `lib/hooks/useScheduleForm.ts:31-62` | ~27 `useState` calls for form state (schedule, upcoming, date, time, note, busy, loading, editorOpen, shows, etc.). |

---

## Performance Optimization Opportunities

### P0 — Critical (causes visible jank / wasted renders)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| P0-1 | **Non-selective Zustand subscriptions** — `useFavoritesStore()` without selectors picks entire store on every render. Any favorite toggle causes PlayerBar.nowPlaying, ConnectedNowPlaying, and useTrackActions to re-render even if unrelated keys changed. | `ConnectedFavoriteButton.tsx:21`, `ConnectedNowPlaying.tsx:14`, `useTrackActions.ts:10` | Every favorites-state change triggers player-bar re-renders across all views. |
| P0-2 | **No `React.memo()` on shared components** — Button, Card, MediaArtwork, TrackTable row, PlayerBar children have zero memoization. In data-dense screens (Settings 19 sections, History large lists), this compounds to hundreds of unnecessary renders per screen update. | All of `packages/ui/src/components/` | Visible stutter on scroll/input in list-heavy views. |
| P0-3 | **No code splitting in desktop app** — all 15+ routed views bundle upfront at first load. Web app (tahti-web) uses lazy loading correctly; desktop loads every view's dependencies immediately. | `packages/player/src/` — zero `React.lazy()` instances | Slower initial startup, larger memory footprint. Every unused view (Settings, Plugins, Themes, Sources, History…) is loaded even if user stays on Dashboard. |

### P1 — High (significant optimization potential)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| P1-1 | **Search results CardGrid not virtualized** — all album/artist cards render at once for large result sets (>100 items). TrackTable uses `useVirtualRows` correctly but CardGrid does not. | `Search/Search.tsx:66-94` | Scroll frame drops with 500+ search results. |
| P1-2 | **Plugin Store plugin list not virtualized** — all `filteredPlugins.map()` items render at once, potentially dozens of full PluginStoreItem components in DOM simultaneously. | `Plugins/PluginStore.tsx:131` | Same as above; degrades with large plugin catalogs. |
| P1-3 | **Inline functions recreated each render in PluginStore** — `isPluginInstalled` and `isPluginInstalling` are arrow functions defined inside component body, called on every `.map()` iteration, creating new fn refs every render. | `Plugins/PluginStore.tsx:78-81` | Causes child `<PluginStoreItem>` re-renders for no reason. |
| P1-4 | **recharts bundled for single chart** — `DayOfWeekChart.tsx` pulls in entire recharts library (200KB+ gzipped). Should be dynamic import (`React.lazy` + dynamic `import()`). | `History/hooks/charts/*` | Slower first paint for any view that renders history charts. |
| P1-5 | **SoundProvider creates new callbacks on every sound-state update** — handlers read from stores via `.getState()` inline, causing all SoundProvider consumers to re-render whenever audio state changes (seek, position) even if they don't need those values. | `SoundProvider.tsx:64,69,73-75` | Seek updates (potentially 60fps during playback) cascade to all listeners. |

### P2 — Medium (nice-to-have improvements)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| P2-1 | **Discord heartbeat polling every 30 seconds** — does `invoke('discord_set_activity', ...)` on each tick. Consider 60s interval or debounce with playback state change. Module-level init has no cleanup/dispose pattern. | `services/discordHandler.ts:132-145` | Wastes RPC calls when player is idle (no track playing). |
| P2-2 | **CreateIsFavorite scans entire favorites list** — O(n) array `.some()` check on every call during render, rather than a Set-based lookup. | `favoritesStore.ts:79-81` | Slows down with 1000+ favorite tracks (rare but possible). |

---

## Desktop ↔ Web Feature Parity Gap

These products serve fundamentally different purposes — desktop = local player with plugin ecosystem, web = social music platform + content distribution. Here's what each lacks:

### Desktop → Web needs (features desktop has that are missing from web)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **Keyword search across metadata providers** | Web missing entirely | Web only has tag-based discovery + directory browsing. No search box to find specific tracks/artists/albums by name. |
| 2 | **Rich listening analytics in History** | Partial gap only | Desktop has top albums, hourly listening breakdowns, day-of-week heatmaps (`useHourlyListeningTime.ts`, `useDayOfWeekListeningTime.ts`, `useTopAlbums.ts`). Web's history tab shows basic play history but no analytics. |
| 3 | **Playlist import (M3U/local file loading)** | Desktop only | Desktop has `PlaylistImportView.tsx` with provider-based import of M3U files and other playlist formats. Not available in web. |
| 4 | **Source/provider management** | Desktop only | Desktop's Sources view lets users select metadata, streaming, and discovery providers independently. Web is single-source (tahti-org API). Inherent limitation. |

### Web → Desktop needs (features web has that are missing from desktop)

| # | Feature | Scope | Notes |
|---|---------|-------|-------|
| 1 | **Full Studio subsystem** | ~70 files | Upload, edit, master, release management, branding, revenue, distribution, moderation, governance, audience analytics, events. Complete content distribution pipeline not applicable to local player. |
| 2 | **Jam / collaborative listening** | `JamView.tsx` | Real-time synchronized playback across multiple users. Requires WebSocket infrastructure — not implementable as local plugin without network backend. |
| 3 | **Social features** (chat, feed, channels) | Core web app | Chat (`ChatView.tsx`), social feed (`FeedView.tsx`), artist channels (`ChannelView.tsx`). These ARE server-dependent; desktop cannot have them via plugins without a proper RPC layer in the plugin SDK. |
| 4 | **Live streaming / broadcasting** | `StudioGoLiveView`, `GreenRoomView`, `RadioView` | Go-live, green room, show booking, radio stations. Requires audio encoding/transmission infrastructure — not suitable for desktop plugin model. |
| 5 | **Governance & membership** | ~15 views | Voting on motions, elections, feature requests, login/signup/verify flows (~20 auth views). Platform-specific cooperative governance features. |
| 6 | **Discover/discovery with widgets** | `DiscoverView.tsx` | Rich curated discovery page (channels on-air, radio stations, news feeds) — desktop Dashboard is plugin-provided and less feature-rich. |

---

## Actionable Todo List

Organized by effort and impact. Each row can become its own todo file in `docs/todo/`.

### Quick Wins (1-2 hours each)

| # | Priority | Task | Files Involved |
|---|----------|------|----------------|
| Q1 | P0 | **Add `aria-label` to PlaylistsToolbar filter input** — fix accessibility gap instantly. | `PlaylistsToolbar.tsx` |
| Q2 | P0 | **Remove duplicate alt text on SimilarArtist links** — set `alt=""` + `aria-hidden="true"` on decorative images. | `ArtistSimilarArtists.tsx` |
| Q3 | P1 | **Replace empty `<div className="flex-1">` in History body with `<Loader size="xl" />`** — 2-line fix, huge UX win for users with slow metadata providers. | `HistoryBody.tsx` |
| Q4 | P1 | **Add shared ErrorState component with optional onRetry** — use in all error states across album, artist, favorites views. Extract from Search pattern (already correct). | New: `ErrorState.tsx`; Consumed: `AlbumTrackList`, `ArtistPopularTracks`, `AlbumHeader`, `ArtistBioHeader`, `SimilarArtists` |

### Medium Effort (3-6 hours each)

| # | Priority | Task | Files Involved |
|---|----------|------|----------------|
| M1 | P0 | **Migrate Album, PlaylistDetail, PlaylistImport to ViewShell** — wraps them in the standard layout pattern, adds page headers, fixes heading hierarchy (D-H1, D-M1). | `Album.tsx`, `PlaylistDetail.tsx`, `PlaylistImport.tsx` |
| M2 | P0 | **Refactor TopArtistsWidget to use DashboardCardsWidget** — eliminates 100+ lines of duplicated card-scroll-filter logic. | `TopArtistsWidget.tsx` → import `DashboardCardsWidget` like other widgets |
| M3 | P0 | **Add loading/error guards to Settings and Sources views** — mirror existing Search/Dashboard patterns so plugin init failures are visible with retry option. | `Settings.tsx`, `Sources.tsx` |
| M4 | P1 | **Fix all `.catch (() => undefined)` patterns in web auth flows** — replace with proper error handling: populate store error field, show user-friendly message + retry. | `VerifyView.tsx`, `ResetPasswordView.tsx`, `SetupPasswordView.tsx`, `ArtistView.tsx`, `RadioView.tsx` |
| M5 | P1 | **Add React.lazy() code splitting to desktop routed views** — each view lazy-loaded with Suspense. Matches web app pattern; cuts initial bundle significantly. | `packages/player/src/App.tsx` (route definitions) |

### Larger Initiatives (half-day + days)

| # | Priority | Task | Scope |
|---|----------|------|-------|
| L1 | P0 | **Add React.memo() to high-frequency shared components** — Button, Card, MediaArtwork, PlayerBar.NowPlaying, TrackTable row. Baseline measurement: run Storybook with performance profiling on Settings view and History view before/after. | Entire `packages/ui/src/components/` — 25+ component files |
| L2 | P1 | **Virtualize CardGrid for Search results and Plugin Store** — implement virtual scrolling for card lists (>50 items). TrackTable already has `useVirtualRows`; need equivalent for CardGrid. | `CardGrid.tsx`, `Search.tsx`, `PluginStore.tsx` |
| L3 | P1 | **Convert useScheduleForm useState → useReducer** — consolidate 27 state calls, reduce re-render scope to form slices that actually change. | `useScheduleForm.ts` (+ any consumers) |
| L4 | P2 | **Lazy-load recharts into History charts** — dynamic import in `DayOfWeekChart`, `ListeningClock`, `CalendarHeatmap`. Prevents 200KB+ bundle from loading on every page. | `History/hooks/charts/*` |
| L5 | P1 | **Fix SoundProvider callback deps to use refs for store access** — seek updates at 60fps should not cascade re-renders to components that only care about audio src/status, not position. | `SoundProvider.tsx` |
