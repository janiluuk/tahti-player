# View-first and test-hardening leftovers

**Status:** open

Left over from the 2026-11-03 view-first sweep and test/refactor sweep (see
HISTORY "View-first sweep + test hardening"). Each item was found but not
changed, because it needs a product call or more than a mechanical fix.

## View-first

- [ ] `views/studio/distribution/ReleaseOpsPanel.tsx`: "Release ops" opens
  straight into the Catalog & credits form (catalog tiles, UPC/ISRC inputs,
  CreditsEditor). It is an ops workspace opened by an explicit button, so
  decide whether it needs a read-only summary first.
- [ ] `views/admin/AdminAnnouncementsView.tsx`: each clip row keeps an inline
  Schedule select that saves on change (Every Nth now commits on blur).
- [ ] `views/admin/governance/tabs/AgmTab.tsx` `AgendaBuilder`: every agenda
  line is an input (local scratch builder, not persisted items).

## Bugs found, not fixed

- [ ] `api/admin/admin-users.ts`: the list and CSV export now send `role=` (tahti-org #1085 filters by the web's account-role split, so studio-tier and free-with-channel artists are found). Left: once #1085 is released, drop the client-side role filter and its page-count fallback.

## Dead code to decide on (not deleted)

- [ ] Unwired API clients: `fetchRevelatorStatus` / `startRevelatorCheckout`
  (only used inside `distribution.ts`). `fetchExportPlugins` is kept (tested client
  for `GET /api/me/export-plugins`, sibling contract `export-plugin-contracts`)
  until an `ExportProvider` UI consumes it. `importSoundBanner`
  was deleted (batch 32); `fetchStudioSoundFacets` is wired via
  `useUsedBeforeTags`.
- [x] `lib/locale.ts` locale note is stale (batch 33): `detectLocale` is gone
  and `applyLocale` is called from `stores/languageStore.ts`; nothing to delete.
- [ ] `lib/relativeDate.ts` `numericDate` is now used by `numericDay` and
  `relativeDate` only; keep both, they are the one absolute date style.
- [ ] Store fields never read outside the store: `libraryStore` `syncNote`,
  `heardFavoritePlaylists` / `heardFavoriteArtists` / `markFavoriteHeard`,
  `favorite*Dates`; `mapNotesStore` `getDraft`, `listComments`,
  `isCaseApproved`.
- [ ] Tests-only code: `views/studio/sounds/SoundRow.tsx`,
  `plugins/youtube-liked-songs/parser.ts`, `storageFormat.groupFilesByUser`, `renderAnnouncementTrim`,
  `fetchStickyNotifications`, `channelLookElements` adjacent/toggle helpers,
  `clampTimelineDuration`, `litStudioSubmenuDestinations`,
  `SIDEBAR_UNLIT_INTENTIONAL`, `encodeWavPcm16Blob`, go-live tab helpers.
- [ ] Stories-only code: `components/CollectionPlayerWidget.tsx`,
  `components/InPageNav.tsx`, `HomeTiles` `CompactBroadcastTile` /
  `SummaryStat`, `sourceTileSubtitle`.
- [ ] Route `/library/collections/$slug` has no link (the list opens
  `/studio/collections/$slug`); removing it also drops
  `StudioCollectionEditView`'s `nav="library"`.
- [ ] `@tahti-player/ui` exports with no consumer (library, keep unless
  pruned on purpose): `Mosaic`, `TopBar*`, `BackButtonAnchor`,
  `BreadcrumbAnchor`, `Slider` subparts.
- [x] `AmbientCard` — decided keep (2026-11-04 batch 31): reserved for mosaic
  / ambient grid layouts; no production consumer yet; do not delete without a
  Storybook replacement plan.

## Tests

- [ ] Storybook plays under heavy CPU load (a full run next to the web unit
  suite) failed on `TabsPanel` content still at `opacity: 0` and on closing
  dialogs still in the DOM (`relative z-50` expected null), although
  `useSkipEnterMotion` and `MotionGlobalConfig.skipAnimations` are on. All
  pass when run alone; find why the Tabs enter fade is not skipped there.
- [ ] Still slow: `StudioProEditorView` "asks before leaving" (~2 s),
  `ProviderSetImportDialog`, `LocalPlaylists` export/create tests (~0.8 s
  each, render cost rather than waits).
