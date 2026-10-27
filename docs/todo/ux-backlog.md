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
  - 2026-10-27: Settings → Add-ons import cards - per-row Import (Bandcamp
    albums, SoundCloud tracks), the hearthis.at Search submit and the
    disabled Soulseek "Desktop only" are `secondary`; Connect / Import all /
    Import selected stay primary.
  - 2026-10-27: Studio list views - per-row Edit / Send / open-in-editor and
    the empty-state duplicate of the header "+" are `secondary`; the header
    "+" and dialog submits stay primary (Playlists, Collections, Releases,
    Editor, Updates).
- [x] Optional `DiscoverGatewayBackground` on flat Listen surfaces (batch 80).

## Track lists: ambient rows, view modes, sort

- [ ] Wire `AmbientTrackRow` / `AmbientTrackList` beyond Library → Sounds
  (Listen, Favorites, Collections…); prefer real `peaks` from the list API.
  Partial: Favorites (batch 84); CollectionView + SmartLinkView (batch 85);
  Listen new tracks + artist popular (batch 87); artist liked tracks (batch
  91). Left: channel page blocks (waits on the channel redesign).
  - 2026-10-27: the channel Playlist widget (`ChannelPlaylistBlock`,
    tracklist display) is on `PlayableAmbientTrackList` and passes the
    sound's `durationSec`. Collection items carry no `peaks` yet, so rows
    draw the placeholder waveform. Channel Tracks / Pinned blocks still left.
- [ ] `PlayableTrackTable` view mode (dense / expanded / grid) + client sort,
  persisted (pattern: player `usePlaylistSort`). Fixes ListenView,
  CollectionView, SmartLinkView, FavoritesView, ChannelViewBlocks,
  TagSearchView, BrowserLocalFiles at once.
  Partial: `PlayableAmbientTrackList` (Collection, SmartLink, Favorites,
  Listen new tracks, artist popular) has a persisted Sort menu (title,
  artist, newest, duration) on top of its existing size / List switcher
  (2026-10-21 / batch 87) and a Grid view (batch 90). Left: channel blocks.
  - 2026-10-27: browser local files (`BrowserLocalFiles`) are on
    `PlayableAmbientTrackList`, which gained `onRemove` (a Remove row
    action) and passes `selectable` / `onBulkRemove` to its List view.
    Left: channel blocks.
- [x] `StudioShowsView` search + clear (already); `MyVenuesView` search + clear (batch 80).
- [ ] Library trio (`LibraryMediaView` / `LibraryEmbedsView` /
  `LibrarySmartLinksView`): converge on a shared library row with FilterChips +
  sort (pattern: `studio/sounds/SoundFilters.tsx`). Partial: Embeds FilterChips +
  SmartLinks search (batch 80); Media kind chips + SmartLinks DSP chips + load
  `PageError` (batch 81); Embeds PageError even with partial data (batch 82);
  shared `LibrarySectionToolbar` on Media + SmartLinks (batch 83); Embeds
  (batch 85); client sort Select on Media/Embeds/SmartLinks (batch 87).
  - 2026-10-27: Media (file name) and Embeds (title) get the toolbar search
    SmartLinks already had, and all three use one `LibraryFilteredEmpty`
    (names the search, one button clears search and chips). Left: the
    shared row itself (Media is a card grid, Embeds a provider widget, so
    only SmartLinks has a plain row today).

## Shared surfaces (de-duplication)

- [ ] One entity-profile section stack (tracks table + releases grid +
  collections grid) for ArtistView and ChannelView
  (`artist-view/ArtistReferenceSections.tsx` vs `channel-view/ChannelViewBlocks.tsx`).
  - 2026-10-27 (batch 90): shared `ProfileSection` (heading + loading /
    error / empty) on the artist popular, related, releases and playlists
    sections and the channel Tracks block. Left: one tracks list for both
    (channel blocks wait on the ambient-rows item) and a releases / playlists
    grid on the channel page.
- [ ] One collection surface for CollectionView / SmartLinkView /
  StudioCollectionsView (same track list + empty message, rendered 3×).
  - 2026-10-27 (batch 90): shared `CollectionTrackList` (framed ambient
    rows + empty state) on CollectionView and SmartLinkView; a smart link
    with no playable and no locked tracks now says so. Left: StudioCollectionsView
    lists collections, not tracks; the Studio editor tracklist
    (`collection-edit/TracklistPanel.tsx`, reorderable `TrackTable`) still
    has its own empty state.
- After moving files, update `docs/VIEW-CATALOG.md`.

## Studio functional

- [ ] Undo for publish / create flows (none in Studio).
  - 2026-10-27 (batch 90): Studio > Collections new-collection toast has
    Undo (`DELETE /api/me/collections/:slug`), which also leaves the new
    collection's editor. Left: other create paths (playlists view, add-to-
    playlist, save queue), sound shares, editor projects, events.
  - 2026-10-27 (batch 90): new-release toast has Undo (`DELETE
    /api/me/releases/:id`), via shared `lib/undoToast.ts`.
  - 2026-10-27 (batch 90): release publish toast has Undo (PATCH
    `state: DRAFT`), via shared `lib/undoToast.ts`. The follower notice and
    social post queued on publish are not recalled.

