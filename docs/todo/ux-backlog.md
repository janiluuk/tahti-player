# UX and design-system backlog

**Status:** open

One place for the open UI/UX polish work. Consolidates (2026-10-20):
`ux-sweep-30-slices.md`, `ux-sweep-batch-4.md`, `ux-sweep-batch-91-120.md`,
`catalog-components-empty-states.md`, `listen-ui-liveliness.md`,
`ambient-waveform-track-rows.md`, `view-modes-track-tables.md`,
`profile-surfaces-unification.md`, `studio-artist-usability.md`. What those
shipped is in HISTORY. Audits still being worked on keep their own files:
[navigation-flow-audit.md](navigation-flow-audit.md),
[studio-usability-audit.md](studio-usability-audit.md),
[ui-nav-audit.md](ui-nav-audit.md), [channel-page-redesign.md](channel-page-redesign.md).

Rule of thumb: library components only (`@tahti-player/ui`), Storybook story per
new surface, one PR per row.

## Small slices (from the sweeps)

- [x] `FeatureRequestsView` comments → `PageEmpty` (already on master)
- [x] `ProcessingIndicator` (top bar) → `Badge` (already on master)
- [ ] `HeaderStyleTabs` → catalog `Tabs`
- [x] `ArtistReferenceSections` → `SectionTitle` (already on master)
- [x] History list active-row accent (already on master)
- [x] `GovernanceView` "No motions returned." → `PageEmpty` (already on master)
- [x] History / Releases filter: clear-filter action on the filtered-empty state (batch 79)
- [x] `ReleasesPanel` filtered-empty + clear (batch 79); HelpView still TBD

## Liveliness

- [ ] De-green `Button` (primary-heavy everywhere; Cards and the MediaArtwork
  overlay were already neutralised).
- [ ] Optional `DiscoverGatewayBackground` on flat Listen surfaces.
- [ ] Verify Card / Badge / CardsRow / MediaArtwork / ListenSection stories in
  all five stock themes (incl. `tahti-blue`, `spotify-dark-theme`).

## Track lists: ambient rows, view modes, sort

- [ ] Wire `AmbientTrackRow` / `AmbientTrackList` beyond Library → Sounds
  (Listen, Favorites, Collections…); prefer real `peaks` from the list API.
- [ ] `PlayableTrackTable` view mode (dense / expanded / grid) + client sort,
  persisted (pattern: player `usePlaylistSort`). Fixes ListenView,
  CollectionView, SmartLinkView, FavoritesView, ChannelViewBlocks,
  TagSearchView, BrowserLocalFiles at once.
- [ ] Same toggle/sort for Studio lists that lack it: `StudioShowsView`,
  `MyVenuesView` (Releases already has search).
- [ ] Library trio (`LibraryMediaView` / `LibraryEmbedsView` /
  `LibrarySmartLinksView`): converge on a shared library row with FilterChips +
  sort (pattern: `studio/sounds/SoundFilters.tsx`).

## Shared surfaces (de-duplication)

- [ ] One entity-profile section stack (tracks table + releases grid +
  collections grid) for ArtistView and ChannelView
  (`artist-view/ArtistReferenceSections.tsx` vs `channel-view/ChannelViewBlocks.tsx`).
- [ ] One collection surface for CollectionView / SmartLinkView /
  StudioCollectionsView (same track list + empty message, rendered 3×).
- After moving files, update `docs/VIEW-CATALOG.md`.

## Studio functional

- [ ] Delete a release — needs a tahti-org `DELETE` route for releases first.
- [ ] Add selected Sounds to a release (bulk action; needs a picker).
- [ ] Undo for publish / create flows (none in Studio).
