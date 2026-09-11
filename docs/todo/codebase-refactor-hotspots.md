# Codebase refactor hotspots (god modules)

**Status:** partial

## Problem

`packages/tahti-web` has a handful of mega-files (2k–5k LOC) that mix many domains in one module. They slow feature work: merge conflicts, hard reviews, unclear ownership, and “touch one admin surface → risk half the API client.” `packages/player` / `packages/ui` are comparatively lean (largest real modules ~300–400 LOC); the pain is almost entirely tahti-web.

This leaf is a **prioritized backlog**, not a rewrite mandate. Prefer mechanical splits along existing domain seams; keep behavior identical.

Survey date: 2026-09-10 (approx LOC via `wc -l`, excluding tests/stories).

## Prioritized hotspot table

| Priority | File | ~LOC | Smell | Suggested direction |
| --- | --- | --- | --- | --- |
| P0 | `packages/tahti-web/src/api/admin.ts` | ~5000 | God API module: ~110 exports, ~40+ Admin* types, domains from venues → radio → storage → governance → addons → audit/logs. Private `getJson`/`sendJson`/`mutate` duplicated vs other clients. | Split into `api/admin/` barrel: `admin-http.ts` (shared fetch helpers), then domain files (`admin-users.ts`, `admin-radio.ts`, `admin-storage.ts`, `admin-governance.ts`, `admin-addons.ts`, `admin-moderation.ts`, `admin-activity.ts`, …). Re-export from `admin.ts` or `admin/index.ts` so call sites need not churn in one PR. |
| P0 | `packages/tahti-web/src/components/PluginStorePanel.tsx` | ~3560 | Mega-panel: themes, visualizers, Spotify/OAuth/Hearthis, DSP, multicast, audio plugins, tools, radio browser, discovery, channel categories in one file. | Extract category components under `components/plugin-store/` (`ThemesCategory`, `ServiceCategory` + service cards, `RadioCategory`, …). Keep `PluginStorePanel` as thin shell + tab routing. Align with existing `plugin-registry-extraction` leaf where contracts touch player. |
| P0 | `packages/tahti-web/src/api/client.ts` | ~3000 | Public/listener API kitchen sink: directory, channel, track, radio, auth, membership, chat, embeds, governance, support, feature requests (~84 functions). | Same pattern as studio already started (`studio.ts` + `studio-extras.ts`): split into named modules (`auth.ts`, `listen.ts`, `radio-public.ts`, `governance-member.ts`, `membership.ts`, `embeds.ts`) + thin re-export. Extract shared HTTP/`withMockFallback` once (shared with admin split). |
| P1 | `packages/tahti-web/src/views/settings/SettingsPanels.tsx` | ~2440 | Many settings surfaces in one file (Account, Artist, Channel, Broadcast, Notifications, Themes, storage, privacy). | One panel per file under `views/settings/panels/`; `SettingsSectionBody` stays the switch/router. |
| P1 | `packages/tahti-web/src/components/ChannelDesigner.tsx` | ~2050 | Designer god component (visualizer / color / header / look sections) tightly coupled to Channel + Artist editors. | Extract section editors + snapshot helpers; keep `forwardRef` façade. Coordinate with open designer todos (`channel-designer-*`) — split structure first, product fold later. |
| P1 | `packages/tahti-web/src/views/ChannelView.tsx` + `ArtistView.tsx` | ~1790 + ~1760 | Parallel public entity pages sharing designer, visualizer, disco widgets, social header patterns; each still owns full layout/data orchestration. | Extract shared hooks/sections (`usePublicChannelLook`, backdrop/visualizer chrome, disco widget block) before merging views. Do not force one route. |
| P2 | `packages/tahti-web/src/api/studio.ts` (+ `studio-extras.ts` ~1240) | ~1905 | Large but already partially split; still a frequent merge magnet. | Continue domain splits (releases, sounds, playlists, schedule) mirroring extras pattern; avoid expanding `studio.ts`. |
| P2 | `packages/tahti-web/src/router.tsx` | ~1965 | Monolithic route tree (high fan-in). | Split route groups (`listenRoutes`, `studioRoutes`, `adminRoutes`) composed into root; typed pieces stay as today. |
| P2 | `packages/tahti-web/src/content/mapScreens.ts` | ~2256 | Data atlas, not runtime logic — bloated but low change risk. | Optional: split by surface under `content/map/`; only if editing pain appears. |
| P2 | Other 1k+ views/panels | ~1k–1.5k each | `StudioProEditorView`, `TrackEditDialog`, `StudioReleaseDetailView`, `StudioScheduleView`, `mock.ts`, `channel-design.ts`, `shows.ts`, `sources.ts`, `artist-settings.ts`, `TrackDetailView`, etc. | Split when the surface is actively worked; no proactive boil. |
| P3 | `packages/tahti-web/src/stores/playerStore.ts` | ~408 | Cohesive playback store (queue, live flags, peaks, analyser). Moderate size; peaks recently extended. | Prefer extracting peaks cache / radio-resume helpers only if it grows further. **Defer while waveform peaks work is in flight.** |
| — | `packages/player`, `packages/ui` | max ~400 | No god-file crisis relative to tahti-web. | Out of scope unless a specific player task hits `pluginStore` / hosts. |

## Coupling notes that slow flexibility

- **Parallel HTTP stacks:** `admin.ts` embeds its own `apiBase`/`getJson`/`sendJson`; `client.ts` has `requestJson` + mock-fallback wrappers; many domain files repeat the same force-mock pattern. One shared transport reduces “fix auth once, miss admin.”
- **Import fan-out:** `admin` ~39 importers, `client` ~56, `studio` ~77, `router` ~147. Barrel re-exports make file splits cheap; renaming symbols is expensive — prefer path splits + re-exports.
- **Mock gravity:** `mock.ts` (~1467) + per-domain mocks keep client modules fat. When splitting client/admin, move mock branches with the domain, not into one larger mock god-file.

## Out of scope / do not boil the ocean

- No redesign of Nuclear player packages or wholesale Zustand architecture.
- No “rewrite the router to file-based routes” unless product asks.
- No merging ChannelView and ArtistView into one mega-view.
- No Storybook/UI primitive sweeps here (covered by WORKPLAN / VIEW-CATALOG).
- Do not expand `mapScreens` / `flowDiagrams` / help content into this epic — data dumps, not gods of behavior.
- **Coordinate with in-flight work:** avoid large edits to `admin.ts` (audit topic/pagination) and waveform/`playerStore` peaks until those slices land or park this split after them. Prefer PluginStorePanel / SettingsPanels / client domain splits first if admin is hot.
- Docs-only inventory was the creation pass; implementation is later leaf work (or sub-leaves).

## Suggested first slices (when picked up)


1b. ~~**API `forceMock` alias cleanup**~~ — **2026-09-11:** all
   `const forceMock = isForceMock` / inline `VITE_FORCE_MOCK` lambdas in
   `api/*.ts` now call `isForceMock()` from `mode.ts` (tracked under
   `performance-cleanup-bulk` Phase 2B).

1. ~~**Shared admin/client HTTP helper**~~ — **2026-09-10:** extracted
   `api/http.ts` (`apiBase` / `getJson` / `sendJson` / `mutate`);
   `admin.ts` imports it. **2026-09-11:** domain API modules + `client.ts`
   re-export now share `apiBase` from `http.ts` (tracked under
   `performance-cleanup-bulk` Phase 2A). `client.ts` still has its own
   `requestJson` — adopt when splitting client domains.
2. ~~**`PluginStorePanel` Radio category extraction**~~ — **2026-09-11:**
   moved `PersonalRadioStreamCard`/`RadioBrowserStationRow`/
   `CuratedFinnishStationRow`/`RadioBrowserDirectoryCard`/`RadioCategory`
   (933 lines) to `components/plugin-store/RadioCategory.tsx`; the two
   generic shells they (and other categories) share,
   `ConfigurableCard`/`AudioPluginToggleRow`, to
   `components/plugin-store/shared.tsx`. `PluginStorePanel.tsx`:
   3564 → 2501 lines. Zero behavior change — mechanical move + import-only
   cleanup (removed now-unused imports: the whole `../api/radio-sources`
   block, `RADIO_STATIONS`/`radioStationPlayable`/`RadioStation` type,
   `flagEmoji`, `RadioStationCover`, three now-unused store hooks,
   `FavoriteButton`/`FilterChips`, four now-unused icons). Verified:
   `tsc --noEmit`, `eslint`, full unit suite (506/506), and `vite build` all
   pass; Storybook's `PluginStorePanel.stories.tsx` only imports the
   top-level `PluginStorePanel` export, unaffected.
2b. ~~**`PluginStorePanel` Service + Themes/Visualizers extract**~~ —
   **2026-09-11:** `ServiceCategory` (+ Spotify/OAuth/Hearthis/`DspUrlPasteCard`)
   → `plugin-store/ServiceCategory.tsx`; `InstalledAvailableTabs` →
   `shared.tsx`; `ThemesCategory`/`VisualizersCategory` →
   `ThemesCategory.tsx`. Panel ~2359 → ~488 lines.
2c. ~~**`PluginStorePanel` remaining categories**~~ — **2026-09-11:**
   Multicast / AudioPlugins / Tools / Discovery / Channel →
   `RemainingCategories.tsx`. Panel ~488 → ~166 lines (thin shell +
   CategoryBody only).
3. ~~**`admin.ts` domain peel (radio + storage + addons)**~~ —
   **2026-09-11:** `api/admin/admin-radio.ts`, `admin-storage.ts`,
   `admin-addons.ts`; `admin.ts` re-exports (~4935 → ~3579). Call sites
   unchanged.
3b. ~~**`admin.ts` users / support / governance peel**~~ — **2026-09-11:**
   `admin-users.ts`, `admin-support.ts` (tickets + missed shows),
   `admin-governance.ts` (overview + feature requests + grants + AGM).
   `admin.ts` ~3579 → ~2231.
4. ~~**`client.ts` auth + `requestJson` extract**~~ — **2026-09-11:**
   `client-request.ts` (`requestJson`) + `client-auth.ts` (login/register/
   password/logout); `client.ts` re-exports (~3047 → ~2694).

4b. ~~**`admin.ts` news peel**~~ — **2026-09-11:** `admin-news.ts`
   (`AdminNewsPost`, CRUD + mock-persistence helpers). `admin.ts` ~2231 →
   ~2059.
4c. ~~**`admin.ts` financial/ledger peel**~~ — **2026-09-11:**
   `admin-financial.ts` (`AdminLedgerEntry`, `AdminFinancialOverview`,
   `LEDGER_CATEGORIES`, `fetchAdminFinancial`, `createLedgerEntry`).
   `admin.ts` ~2059 → ~1935.

Next: SettingsPanels file-per-panel, further `client.ts` listen/governance
splits, remaining admin domains (dashboard, selects, streams, …).

## Related open leaves (do not duplicate)

- `plugin-registry-extraction.md` — contracts/player side; UI panel split here is complementary.
- `channel-designer-*` — product/behavior; structural extract here should not block those.
- `waveform-detail-accuracy.md` / admin activity work — avoid conflicting files until quiet.
