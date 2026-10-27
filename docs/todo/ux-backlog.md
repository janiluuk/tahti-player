# UX and design-system backlog

**Status:** open

One place for the open UI/UX polish work. Consolidates (2026-10-20):
`ux-sweep-30-slices.md`, `ux-sweep-batch-4.md`, `ux-sweep-batch-91-120.md`,
`catalog-components-empty-states.md`, `listen-ui-liveliness.md`,
`ambient-waveform-track-rows.md`, `view-modes-track-tables.md`,
`profile-surfaces-unification.md`, `studio-artist-usability.md`. What those
shipped is in HISTORY. Audits still being worked on keep their own files:
[navigation-flow-audit.md](navigation-flow-audit.md),
[ui-nav-audit.md](ui-nav-audit.md), [channel-page-redesign.md](channel-page-redesign.md).

Rule of thumb: library components only (`@tahti-player/ui`), Storybook story per
new surface, one PR per row.

## Small slices (from the sweeps)

- [x] `FeatureRequestsView` comments → `PageEmpty` (already on master)
- [x] `ProcessingIndicator` (top bar) → `Badge` (already on master)
- [x] `HeaderStyleTabs` → catalog `Tabs` (already on master)
- [x] `ArtistReferenceSections` → `SectionTitle` (already on master)
- [x] History list active-row accent (already on master)
- [x] `GovernanceView` "No motions returned." → `PageEmpty` (already on master)
- [x] History / Releases filter: clear-filter (batch 79; HelpView already clears)
- [x] `ReleasesPanel` filtered-empty + clear (batch 79)

## Liveliness

- [ ] De-green `Button` (primary-heavy everywhere; Cards and the MediaArtwork
  overlay were already neutralised). Partial: Governance attention panel +
  stream PlaylistDialog selected row (batch 81).
- [x] Optional `DiscoverGatewayBackground` on flat Listen surfaces (batch 80).

## Track lists: ambient rows, view modes, sort

- [ ] Wire `AmbientTrackRow` / `AmbientTrackList` beyond Library → Sounds
  (Listen, Favorites, Collections…); prefer real `peaks` from the list API.
  Partial: Favorites (batch 84); CollectionView + SmartLinkView (batch 85);
  Listen new tracks + artist popular (batch 87); artist liked tracks (batch
  91). Left: channel page blocks (waits on the channel redesign).
- [ ] `PlayableTrackTable` view mode (dense / expanded / grid) + client sort,
  persisted (pattern: player `usePlaylistSort`). Fixes ListenView,
  CollectionView, SmartLinkView, FavoritesView, ChannelViewBlocks,
  TagSearchView, BrowserLocalFiles at once.
  Partial: `PlayableAmbientTrackList` (Collection, SmartLink, Favorites,
  Listen new tracks, artist popular) has a persisted Sort menu (title,
  artist, newest, duration) on top of its existing size / List switcher
  (2026-10-21 / batch 87) and a Grid view (batch 90). Left: channel blocks /
  local files.
- [x] `StudioShowsView` search + clear (already); `MyVenuesView` search + clear (batch 80).
- [ ] Library trio (`LibraryMediaView` / `LibraryEmbedsView` /
  `LibrarySmartLinksView`): converge on a shared library row with FilterChips +
  sort (pattern: `studio/sounds/SoundFilters.tsx`). Partial: Embeds FilterChips +
  SmartLinks search (batch 80); Media kind chips + SmartLinks DSP chips + load
  `PageError` (batch 81); Embeds PageError even with partial data (batch 82);
  shared `LibrarySectionToolbar` on Media + SmartLinks (batch 83); Embeds
  (batch 85); client sort Select on Media/Embeds/SmartLinks (batch 87).

## Shared surfaces (de-duplication)

- [ ] One entity-profile section stack (tracks table + releases grid +
  collections grid) for ArtistView and ChannelView
  (`artist-view/ArtistReferenceSections.tsx` vs `channel-view/ChannelViewBlocks.tsx`).
- [ ] One collection surface for CollectionView / SmartLinkView /
  StudioCollectionsView (same track list + empty message, rendered 3×).
- After moving files, update `docs/VIEW-CATALOG.md`.

## Studio functional

- [ ] Undo for publish / create flows (none in Studio).
  - 2026-10-27 (batch 90): Studio > Collections new-collection toast has
    Undo (`DELETE /api/me/collections/:slug`), which also leaves the new
    collection's editor. Left: other create paths (playlists view, add-to-
    playlist, save queue), sound shares, editor projects, events.

