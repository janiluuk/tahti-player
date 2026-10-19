# View modes + sort for the shared track table and studio lists

**Status:** open

2026-10-19 sweep. No list/grid view-mode toggle exists anywhere in the app, and the shared
`PlayableTrackTable` has no sort surface even though its columns declare `sortable: true`
(`PlayableTrackTable.tsx:161`). The sort pattern already exists for a few studio lists
(`MyDiscographyView.tsx` SortKey + FilterChips, `studio/sounds/SoundFilters.tsx:83`,
`ReleasesPanel.tsx`, `admin/storage/FilesBrowserTab.tsx:360`, player `Playlists.tsx`
`usePlaylistSort`) but is not generalized to the primary listen surfaces.

## Tasks

1. **`PlayableTrackTable` view-mode + sort** — add `viewMode` (dense table / expanded /
   grid) and client-side `sort`, persist the choice (store, like player
   `Playlists.tsx` `usePlaylistSort`). One change fixes ~9 surfaces that all render track
   rows through it: ListenView, CollectionView, SmartLinkView, FavoritesView,
   ChannelViewBlocks, TagSearchView, BrowserLocalFiles (player).
2. **Studio list sort + search parity** — apply the same toggle/sort to the studio lists
   that lack it: `StudioReleasesView.tsx` (no search — see
   `studio-artist-usability.md` for the functional side), `StudioShowsView.tsx`,
   `MyVenuesView.tsx`.
3. **Library view modes** — `LibraryMediaView` / `LibraryEmbedsView` /
   `LibrarySmartLinksView` hand-roll rows with no sort and no toggle; converge onto the
   shared track table (or a shared library-row) with FilterChips + sort. Pattern:
   `MyDiscographyView.tsx`.

## Verify

- Storybook: story per view-mode variant (story-first per AGENTS).
- `pnpm --filter @tahti-player/tahti-web type-check && lint`; snapshot digest on the PR.
