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

- [x] Collection edit gallery GET failure (`fetchCollectionGallery` meta +
  `useCollectionEditState` skips `gallery` patch when not loaded) — batch 30
  slice 10.
- [x] `ClipEditorDialog` Every Nth via `EveryNthInput` — batch 30 slice 9.
- [x] Stale-fetch guards on `AdminStorageUserView` and track-edit radio
  submission lookup — batch 30 slices 11–12.
- [ ] `api/admin/admin-users.ts`: the BOARD/ARTIST role filter runs on the
  client after server pagination, so `total` counts one page.

## Dead code to decide on (not deleted)

- [ ] Unwired API clients: `fetchStudioSoundFacets` (library-management-port
  may still want it), `importSoundBanner`, `fetchRevelatorStatus` /
  `startRevelatorCheckout`, `fetchExportPlugins`.
- [ ] `lib/locale.ts` browser/stored locale detection (`detectLocale`,
  `applyLocale`) is only called from its test.
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
