# Codebase refactor hotspots (god modules)

**Status:** partial

## Problem

`packages/tahti-web` has a handful of mega-files (2k–5k LOC) that mix many domains in one module. They slow feature work: merge conflicts, hard reviews, unclear ownership, and “touch one admin surface → risk half the API client.” `packages/player` / `packages/ui` are comparatively lean (largest real modules ~300–400 LOC); the pain is almost entirely tahti-web.

This leaf is a **prioritized backlog**, not a rewrite mandate. Prefer mechanical splits along existing domain seams; keep behavior identical.

Survey date: 2026-09-10 (approx LOC via `wc -l`, excluding tests/stories).

## Prioritized hotspot table

| Priority | File | ~LOC | Smell | Suggested direction |
| --- | --- | --- | --- | --- |
| P0 | ~~`packages/tahti-web/src/api/admin.ts`~~ | ~~~1595~~ **~436** | God API module, shrinking. | **2026-09-15:** dashboard (+venues), beta applications, top lists, announcements, content reports, vendors, status, i18n peeled to `api/admin/admin-*.ts`, joining the earlier radio/storage/addons/users/support/governance/news/financial/selects/streams peels. Only activity-feed/audit-topic and container-logs remain in `admin.ts` — deliberately left, per this row's own note (flagged as in-flight elsewhere). Off the P0 hotspot list. |
| P0 | `packages/tahti-web/src/components/PluginStorePanel.tsx` | ~3560 | Mega-panel: themes, visualizers, Spotify/OAuth/Hearthis, DSP, multicast, audio plugins, tools, radio browser, discovery, channel categories in one file. | Extract category components under `components/plugin-store/` (`ThemesCategory`, `ServiceCategory` + service cards, `RadioCategory`, …). Keep `PluginStorePanel` as thin shell + tab routing. Align with existing `plugin-registry-extraction` leaf where contracts touch player. |
| ~~P0~~ | ~~`packages/tahti-web/src/api/client.ts`~~ | ~~~3000~~ **~1419** | Public/listener API kitchen sink: directory, channel, track, chat, support, feature requests, transparency, venues, collections, follow, newsletter (~54 functions left, no single dominant domain). | **Original named-module split done 2026-09-12:** `client-request.ts`/`client-auth.ts`, `listen.ts`, `radio-public.ts`, `governance-member.ts`, `membership.ts`, `embeds.ts` all peeled — the exact list this row originally suggested. Remaining domains are smaller/mixed with no obvious next seam; demote off the P0 hotspot list, revisit only if one grows or a merge-conflict pain point shows up. |
| ~~P1~~ | ~~`packages/tahti-web/src/views/settings/SettingsPanels.tsx`~~ | ~~~2440~~ **done 2026-09-12, now ~110** | Many settings surfaces in one file (Account, Artist, Channel, Broadcast, Notifications, Themes, storage, privacy). | One panel per file under `views/settings/panels/`; `SettingsSectionBody` stays the switch/router. |
| P1 | `packages/tahti-web/src/components/ChannelDesigner.tsx` | ~1988 (was ~2103) | Designer god component (visualizer / color / header / look sections) tightly coupled to Channel + Artist editors. **2026-09-15:** first slice done (4 low-coupling JSX chunks extracted, see item 12 below) — remaining body still tightly closure-coupled. | Extract section editors + snapshot helpers; keep `forwardRef` façade. Coordinate with open designer todos (`channel-designer-*`) — split structure first, product fold later. |
| P1 | `packages/tahti-web/src/views/ChannelView.tsx` + `ArtistView.tsx` | ~1500 + ~1500 (was ~1754) | Parallel public entity pages sharing designer, visualizer, disco widgets, social header patterns; each still owns full layout/data orchestration. **2026-09-15:** `ArtistView.tsx`'s Releases/Collections tab bodies, then its Music tab body, all extracted (see item 13) — off this row's remaining scope. `ChannelView.tsx`: hooks-order bug fixed (PR #94), then its 11 small `renderBlock` cases extracted to `ChannelViewBlocks.tsx` (see items 14/17). **2026-09-16:** `ChannelHeroBlock` also extracted (see item 18) — still open for `useChannelLayoutEditing`. | ~~Extract shared hooks/sections~~ `ArtistView.tsx` done. `ChannelView.tsx`: blocks slice + `ChannelHeroBlock` done; `useChannelLayoutEditing` custom-hook extraction remains (bigger, riskier — see item 17). |
| ~~P2~~ | ~~`packages/tahti-web/src/api/studio.ts`~~ | ~~~1897~~ **barrel only** | Large but already partially split; still a frequent merge magnet. | **Done 2026-09-15:** peeled into `api/studio/studio-{sounds,releases,collections,upload,editor}.ts` + shared `studio-request.ts`/`studio-mock.ts`; `studio.ts` re-exports. Off the P2 list. |
| ~~P2~~ | ~~`packages/tahti-web/src/router.tsx`~~ | ~~~1965~~ **382, assembly only** | Monolithic route tree (high fan-in). | **Done 2026-09-15:** peeled into `router/routes-*.tsx` by nav section (listen, settings, admin, library/misc, transparency, help, auth, governance, info, studio, embed) + `router/router-core.tsx` (shared parents) + `router/router-lazy-views.ts` (code-split registry); `router.tsx` now only imports every route const and does the `addChildren` tree assembly + `createRouter`. Off the P2 list. |
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
4d. ~~**`admin.ts` selects + streams peel**~~ — **2026-09-12:**
   `admin-selects.ts` (`AdminSelectsItem`/`AdminSelectsBrowseItem`/
   `AdminSelectsStream` types, `fetchAdminSelects`/
   `searchAdminSelectsBrowse`/`addToSelectsRotation`/
   `removeFromSelectsRotation`/`reorderSelectsItem`/
   `reorderSelectsRotation`/`startSelectsStream`/`stopSelectsStream`, plus
   their mock state) and `admin-streams.ts` (`AdminLiveStreamRow`,
   `fetchAdminStreams`/`restartStream`/`skipStreamTrack`/`pauseStream`/
   `resumeStream`/`forceStreamOffline`) — two adjacent, self-contained
   domains, split into separate files to match the one-domain-per-file
   convention. Deliberately skipped the activity-feed/audit-topic section
   per this leaf's own "coordinate with in-flight work" note. `admin.ts`
   ~1935 → ~1595. Verified: `tsc --noEmit` / `eslint` clean, full unit
   suite (515/515 under Node 24 — matches CI), `vite build` succeeds.
5. ~~**`SettingsPanels.tsx` file-per-panel split**~~ — **2026-09-12:**
   `views/settings/panels/AccountPanel.tsx` (Account + Storage + Privacy +
   Membership checkout), `ArtistPanel.tsx` (Artist + Pronouns +
   ReleaseVisualDefaultsPanel), `ChannelPanel.tsx`, `BroadcastPanel.tsx`,
   `NotificationsPanel.tsx` (Notifications + Notifications/Visibility),
   `ThemesPanel.tsx`. `SettingsPanels.tsx` stays as the thin
   `SettingsSectionBody` router + re-exports (`BroadcastPanel`,
   `ReleaseVisualDefaultsPanel`) so the 3 external call sites
   (`ConnectedSettingsModal`, `StudioChannelView`, a Storybook story)
   needed no changes. ~2440 → ~110 lines; each extracted panel 108–618
   lines. Zero behavior change — mechanical split, no shared helpers were
   actually cross-panel (verified each of `euros`/`detectCountryCode`/
   `parseArtistRoles`/`PronounsField`/`MembershipCheckoutButton` has
   exactly one call site) so no `shared.tsx` was needed. Verified:
   `tsc --noEmit` clean, `eslint` clean, full unit suite (515/515 under
   Node 24, matching CI — Node 26 locally breaks jsdom's `localStorage`,
   an unrelated pre-existing environment issue), `vite build` and
   `storybook build` both succeed.
6. ~~**`client.ts` governance-member domain peel**~~ — **2026-09-12:**
   `api/governance-member.ts` — `MotionComment`/`FetchGovernanceMotionsOpts`
   types + all 13 `fetchGovernanceMotions`/`fetchGovernanceMotion`/
   `createGovernanceMotion`/`fetchPublicGovernanceMotions`/
   `fetchGovernanceMeetings`/`fetchGovernanceDocuments`/
   `fetchGovernanceMembers`/`fetchGovernanceQuarterlyReports`/
   `voteOnMotion`/`patchGovernanceMotion`/`fetchMotionComments`/
   `fetchMotionCommentsBulk`/`postMotionComment` functions, plus their mock
   state. `client.ts` re-exports via `export * from './governance-member'`;
   kept a local `import type { MotionComment }` since the (unrelated,
   not-yet-split) feature-requests-comments code in `client.ts` reuses that
   same shape. Preserved `client.ts`'s own private `getJson`-over-
   `client-request.ts` wrapper in the new file rather than switching to
   `http.ts`'s `getJson` — that has subtly different error-message
   extraction, so swapping it would've been a behavior change, not a
   mechanical move. `client.ts` ~2724 → ~2155 lines. Verified: `tsc --noEmit`
   / `eslint` clean, full unit suite (515/515 under Node 24 — matches CI;
   Node 26 locally breaks jsdom's `localStorage`, an unrelated pre-existing
   environment issue), `vite build` succeeds.
7. ~~**`client.ts` embeds domain peel**~~ — **2026-09-12:**
   `api/embeds.ts` — `fetchEmbedChannel`/`fetchEmbedRelease`/
   `fetchEmbedCollection` (the `/embed/*` iframe views), re-exported via
   `export * from './embeds'`. Only external consumer (`EmbedViews.tsx`)
   still imports from `../api/client`, unaffected. `client.ts` ~2155 →
   ~1880 lines. Same verification as slice 6 (`tsc`/`eslint`/515 tests
   under Node 24/`vite build`).
8. ~~**`client.ts` radio-public domain peel**~~ — **2026-09-12:**
   `api/radio-public.ts` — `fetchRadio`/`EnabledInternetRadioPreset`/
   `fetchEnabledInternetRadioPresets`/`fetchRadioStation`/
   `fetchRadioRecentlyPlayed`. `fetchRadio` and `fetchRadioStation` call
   `fetchChannel` (still in `client.ts`), so `radio-public.ts` imports it
   back from `./client` — a deliberate one-direction-at-runtime circular
   import (only referenced inside async function bodies, never at module
   init, so both modules finish evaluating before either is called); 515
   tests still pass, confirming it's fine in practice. `client.ts` ~1880 →
   ~1760 lines. Same verification as slices 6–7.
9. ~~**`client.ts` membership domain peel**~~ — **2026-09-12:**
   `api/membership.ts` — `fetchMembership`/`startMembershipCheckout`/
   `startMembershipPortal`/`resendVerificationEmail`/
   `requestAccountDeletion`/`fetchMySubscriptions`/`fetchMyPurchases`/
   `cancelMySubscription`. Left `fetchFeed` in `client.ts` even though it
   sat in the middle of this block — it's the `/api/me/feed` listener-home
   fetch, not membership/billing, so it belongs with a future `listen.ts`
   slice instead; extracted the two non-contiguous halves around it rather
   than force an unrelated function into the wrong module. `client.ts`
   ~1760 → ~1543 lines. Same verification as slices 6–8.
10. ~~**`client.ts` listen domain peel**~~ — **2026-09-12:** `api/listen.ts`
    — `fetchDirectory`/`fetchSearch`/`fetchOnAirChannels` (contiguous) plus
    `fetchFeed` (left behind by slice 9, reunited here). `client.ts` ~1543
    → ~1419 lines. Same verification as slices 6–9. This completes the
    exact named-module list this leaf's `client.ts` row originally
    suggested (`auth`/`listen`/`radio-public`/`governance-member`/
    `membership`/`embeds`) — see that row's note above; `client.ts` is off
    the P0 hotspot list now.
11. ~~**`admin.ts` remaining domain peel**~~ — **2026-09-15:**
    `admin-dashboard.ts` (venues + dashboard KPIs + content overview),
    `admin-beta.ts`, `admin-top-lists.ts`, `admin-announcements.ts`,
    `admin-content-reports.ts`, `admin-vendors.ts`, `admin-status.ts`,
    `admin-i18n.ts` — eight adjacent, self-contained domains, each a
    mechanical move (types + mock helper + fetch/mutate functions),
    `admin.ts` re-exporting via `export * from './admin/admin-*'`
    matching every prior slice. Deliberately left the activity-feed/
    audit-topic section and admin container logs untouched (this row's own
    note: activity-feed is flagged as in-flight elsewhere). `admin.ts`
    ~1595 → ~436 lines; off the P0 hotspot list. Verified: `tsc --noEmit` /
    `eslint` clean, full unit suite (516/516), `vite build` succeeds.
12. **`ChannelDesigner.tsx` first slice** — **2026-09-15:** extracted 4
    clearly self-contained JSX chunks into `components/channel-designer/`
    (`DesignerToolbar`, `SavedLooksRow`, `AppliedPresetBanner`,
    `PreviewTracksPlaceholder`), matching that folder's existing
    `BackdropPanel`/`PlayerPanel` pattern. ~2103 → ~1988 lines. **Not**
    done: the remaining ~1350-line body (state, effects, save/preset
    logic, header/backdrop/visualizer control panels) is far more tightly
    closure-coupled — each chunk there closes over 15+ local variables, so
    safe extraction needs either heavy prop-threading or a context, and no
    automated tests exist for this component to catch a regression
    (confirmed via `find`). Left for a dedicated follow-up; still P1,
    still "coordinate with open `channel-designer-*` product todos first."
13. **`ArtistView.tsx` tab-body slice** — **2026-09-15:** the "Releases"
    and "Collections" tab bodies (self-contained, small prop surface) were
    extracted to `components/ArtistReleasesTab.tsx` /
    `ArtistCollectionsTab.tsx`. ~1754 → ~1696 lines. **Not** done (at the
    time): the "Music" tab body (~315 lines) closes over 30+ local
    variables (look-visibility flags, player color scheme, now-playing
    state, queue actions, favorites, dialogs) — same closure-coupling
    problem as `ChannelDesigner.tsx`'s remaining body. **Done in a later
    pass, same day:** a design investigation found this one was actually a
    pure JSX+props extraction — the Music tab body owns no internal state/
    effects of its own; everything it reads is either `ArtistView`
    component state or `const`s derived just above the `return`. Extracted
    to `ArtistMusicTab.tsx` (grouped props: `player`, `featured`,
    `pinnedTiles`, `releaseTiles`, flat callbacks) — no state/effect
    migration, `ArtistView.tsx` unchanged apart from the JSX swap + import
    cleanup. Also moved all three Artist tab components (`ArtistMusicTab`,
    `ArtistReleasesTab`, `ArtistCollectionsTab`) into a new
    `components/artist-view/` subfolder with a barrel `index.ts`, matching
    the existing `components/channel-designer/` convention — pure file
    moves + relative-import-depth fixes, no content changes to the two
    pre-existing files. Verified live in the browser signed in as the mock
    owner: play/pause toggle, pinned-tile favorite, release tracklist
    dialog, multi-track queue-confirm dialog, smart-link navigation, tab
    switching (Music/Releases/Collections/Design), and the owner-only
    Manage button (`StreamManagerPanel`) all confirmed working. Noticed,
    not fixed (pre-existing, unrelated to this file): the catalog table's
    edit-track button never renders here because `compactActions` hides
    the *entire* actions column in the shared `TrackTable` (`showActions =
    Boolean(display?.displayQueueControls)` in
    `packages/ui/src/components/TrackTable/hooks/useColumns.tsx:40`), not
    just queue controls as the prop name implies — traced, confirmed
    identical before/after this extraction (same `compactActions`+`onEdit`
    props passed both times), left alone as out of scope for a structural
    move. `ChannelView.tsx` (the other half of this row) not attempted —
    see item 14.
14. **`ChannelView.tsx` investigated, left untouched** — **2026-09-15:**
    unlike `ChannelDesigner.tsx`/`ArtistView.tsx`, this file's natural
    componentizable pieces (visualizer, backdrop, layers menu, links/
    navigation editors, playlist blocks, track tables) were already
    extracted into separate files in earlier work — that's most of what
    this row's own "Suggested direction" column names. What's left
    (~1700 of ~1835 lines) is a single closure-coupled orchestrating
    component: `renderBlock`'s cases each read 10-20+ local variables
    (`editing`, `layout`, `selectedId`, `channel`, a dozen color/scheme
    values, several setters), and the final render/editing-toolbar
    section is no less coupled. No test or Storybook coverage exists for
    this component to catch a regression (confirmed via `find`). Unlike
    the other two files, no comparable low-coupling chunk was found here
    to extract even partially — left for a dedicated follow-up (likely a
    custom-hook extraction for the layout/editing state, which is a
    bigger, riskier change than anything done so far in this leaf, not a
    mechanical one).
15. **`api/studio.ts` domain peel** — **2026-09-15:**
    `api/studio/studio-{sounds,releases,collections,upload,editor}.ts`
    (matching each of the source file's own `// ── Section ──` comment
    boundaries) + shared `studio-request.ts` (the local `requestJson`
    helper) and `studio-mock.ts` (`mockSoundStore`, mutated across 4 of
    the 5 domain files). `studio.ts` re-exports via
    `export * from './studio/studio-*'`; no call site's import path
    changed (~20 importers). ~1897 → 5-line barrel. Verified:
    `tsc --noEmit` / `eslint` clean, full unit suite (516/516).
16. **`router.tsx` route-tree peel** — **2026-09-15:** all 172 routes'
    `getParentRoute` referenced only `rootRoute`/`appLayoutRoute` (a flat
    tree, no route-to-route parent chaining), which made a safe split
    straightforward: `router/routes-*.tsx` by nav section (listen,
    settings, admin, library/misc, transparency, help, auth, governance,
    info/legal, studio, embed+aliases), `router/router-core.tsx` (the 2
    shared parents), `router/router-lazy-views.ts` (the 54
    `lazyRouteComponent()` code-split registrations, centralized so
    section files import only what they use). `router.tsx` itself now
    only imports every route const and does the `addChildren` assembly +
    `createRouter` — byte-for-byte unchanged. Verified beyond
    `tsc`/`eslint`/tests: diffed the full `path:` string set before/after
    (172/172 identical) and diffed the `addChildren` tree-assembly block
    itself (byte-identical); production build confirms every lazy view
    still produces its own chunk. ~1965 → 382 lines.

17. **`ChannelView.tsx` low-risk blocks slice** — **2026-09-15 (later
    pass):** a design investigation (following up on item 14's "no
    comparable low-coupling chunk" finding) found the *per-case* coupling
    inside `renderBlock` was actually very uneven — `hero` alone accounts
    for the 50+-variable closure item 14 described, but the other 11 cases
    (`sound`/`chat`/`navigation`/`about`/`links`/`programming`/`stats`/
    `events`/`subscribe`/`embed`/`playlist`) are each small (2-6 free
    variables), matching the same JSX-chunk style that worked for
    `ChannelDesigner.tsx`'s first slice (item 12). Extracted those 11 into
    `renderChannelBlock(item, ctx)` in a new
    `components/channel-view/ChannelViewBlocks.tsx` (+ barrel `index.ts`),
    matching the `components/channel-designer/`/`components/artist-view/`
    subfolder convention — pure JSX-and-inputs extraction, no state/effect
    migration, `hero`/the embedded `stagePlayer`/the bottom edit-mode
    layers-menu section untouched. `ChannelView.tsx`'s `renderBlock` now
    just special-cases `hero` inline and delegates everything else to
    `renderChannelBlock`, preserving the original file's compile-time
    exhaustiveness guard (adding a new block type without a matching case
    still fails the build). Also folded in as its own prior commit (not
    part of this slice): a real rules-of-hooks bug found during the item-14
    investigation — 3 hooks called after a conditional early return, fixed
    and merged as PR #94 before this extraction began. Verified: `tsc`/
    `eslint` clean, full unit suite (516/516, only the pre-existing
    unrelated `HistoryRow` flake), production build succeeds; live-browser
    verified all 11 extracted blocks render correctly (both visible and
    edit-mode hidden-state previews) on an ordinary artist channel, the
    radio-channel-page's Programming block still renders correctly
    post-extraction, and an edit→exit→re-enter toggle sequence produced
    zero console errors. Remaining: `ChannelHeroBlock` (the `hero` case +
    `stagePlayer`, medium-large) and `useChannelLayoutEditing` (drag/drop +
    layout state, highest risk of the three ChannelView.tsx pieces) — see
    item 14's design notes for both.
18. **`ChannelHeroBlock` extraction** — **2026-09-16:** the `hero` case
    (backdrop card, player stage, nav-tab bar + quick-add chips) extracted
    to `components/channel-view/ChannelHeroBlock.tsx`, joining
    `ChannelViewBlocks.tsx` under the same barrel. Pure JSX+props: no
    state/effect migration. `stagePlayer` is passed in as a ready-built
    `ReactNode` rather than reconstructed inside the new component, since
    `ChannelView.tsx` renders that same node a second time as the
    fixed-fallback next to `EntitySocialHeader` when the hero block is
    hidden (`data-testid="channel-stage-player-fixed"`) — extracting the
    builder itself would have meant either duplicating it or a bigger
    refactor than this slice intended. `ChannelView.tsx`'s `renderBlock`
    now only inline-cases `hero` to assemble+pass the props object.
    Verified: `tsc --noEmit` / `eslint` clean, full unit suite (516/516,
    only the pre-existing unrelated Playwright-vs-vitest config failures
    for `e2e/*.spec.ts` when run outside `--exclude 'e2e/**'`), `vite
    build` succeeds; live-browser verified against the `dj-moonlight` mock
    channel (backdrop, avatar, bio, player stage all render; edit-mode
    query param produces no console errors for a non-owner viewer).
    Remaining: `useChannelLayoutEditing` (drag/drop + layout state) — see
    item 14's design notes.

Next: the remaining `ChannelDesigner.tsx` body (item 12) and
`ChannelView.tsx`'s `useChannelLayoutEditing` piece (item 14) — each needs
either prop-threading 15-30+ closure variables or a shared custom hook,
bigger/riskier slices than the mechanical `studio.ts`/`router.tsx`/
`ChannelViewBlocks.tsx`/`ChannelHeroBlock.tsx` peels above. Admin
activity-feed/audit-topic and container-logs sections remain in
`admin.ts` intentionally — revisit once confirmed quiet.

## Related open leaves (do not duplicate)

- `plugin-registry-extraction.md` — contracts/player side; UI panel split here is complementary.
- `channel-designer-*` — product/behavior; structural extract here should not block those.
- `waveform-detail-accuracy.md` / admin activity work — avoid conflicting files until quiet.
