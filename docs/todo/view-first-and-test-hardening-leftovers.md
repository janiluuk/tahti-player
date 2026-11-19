# View-first and test-hardening leftovers

**Status:** open

Left over from the 2026-11-03 view-first sweep and test/refactor sweep (see
HISTORY "View-first sweep + test hardening"). Each item was found but not
changed, because it needs a product call or more than a mechanical fix.

## View-first

- [x] `views/studio/distribution/ReleaseOpsPanel.tsx` (2026-11-19): the
  collapsed header is already the read-only summary (title, type, state,
  tracks, UPC, smart link, Revelator badge). Expand opens Catalog / Delivery /
  Guides — no extra summary layer.

## Bugs found, not fixed

- None open.

## Dead code to decide on (not deleted)

- [x] Revelator helpers isolated (2026-11-19 slice 18):
  `fetchRevelatorStatus` / `startRevelatorCheckout` are module-local in
  `distribution.ts`; Studio uses `payAndSubmitToRevelator`. `fetchExportPlugins`
  is kept (tested client for `GET /api/me/export-plugins`).
- [ ] Unwired API clients: remaining export-plugin UI consumers. `importSoundBanner`
  was deleted (batch 32); `fetchStudioSoundFacets` is wired via
  `useUsedBeforeTags`.
- [x] `lib/locale.ts` locale note is stale (batch 33): `detectLocale` is gone
  and `applyLocale` is called from `stores/languageStore.ts`; nothing to delete.
- [ ] `lib/relativeDate.ts` `numericDate` is now used by `numericDay` and
  `relativeDate` only; keep both, they are the one absolute date style.
- [x] `libraryStore` dead persist fields pruned (2026-11-19 slice 15): v3 migrate
  drops `syncNote`, `heardFavorite*`, `markFavoriteHeard`, `favorite*Dates` from
  exports; legacy keys in old localStorage are ignored on rehydrate.
- [x] `mapNotesStore` unused getters removed (2026-11-19 slice 16): `getDraft`,
  `listComments`, `isCaseApproved` (callers use `draftsByKey` / `comments` /
  `approvedByCaseId` selectors).
- [ ] Tests-only code: `views/studio/sounds/SoundRow.tsx`,
  `plugins/youtube-liked-songs/parser.ts`, `storageFormat.groupFilesByUser`, `renderAnnouncementTrim`,
  `fetchStickyNotifications`, `channelLookElements` adjacent/toggle helpers,
  `clampTimelineDuration`, `litStudioSubmenuDestinations`,
  `SIDEBAR_UNLIT_INTENTIONAL`, `encodeWavPcm16Blob`, go-live tab helpers.
- [ ] Stories-only exports (keep for Storybook; do not delete without placement):
  `CollectionPlayerWidget` (`Tahti/Collections/CollectionPlayerWidget`),
  `InPageNav` (`Tahti/Page/InPageNav` — no production importer today),
  `HomeTiles` `CompactBroadcastTile` / `SummaryStat`,
  `sourceTileSubtitle` (`SourceServiceIcon` story only).
- [x] `/library/collections*` catalog honesty (2026-11-19 slice 14): redirect-only
  aliases documented in VIEW-CATALOG / NAVIGATION-SITEMAP; canonical catalog is
  `/studio/collections` (+ `$slug` edit).
- [ ] `@tahti-player/ui` exports with no consumer (library, keep unless
  pruned on purpose): `Mosaic`, `TopBar*`, `BackButtonAnchor`,
  `BreadcrumbAnchor`, `Slider` subparts.
- [x] `AmbientCard` — decided keep (2026-11-04 batch 31): reserved for mosaic
  / ambient grid layouts; no production consumer yet; do not delete without a
  Storybook replacement plan.
