# Unify duplicated profile / collection surfaces

**Status:** open

2026-10-19 sweep. The app renders the same page anatomy (hero/backdrop + track table +
releases grid + collections grid + widgets) with copy-pasted JSX in several places, and
collection content is rendered in three independent surfaces.

## Evidence

- `artist-view/ArtistReferenceSections.tsx:40,110-159,173-199` (popular tracks + releases
  CardGrid + playlists CardGrid) vs `channel-view/ChannelViewBlocks.tsx:97,114,130-374`
  (two PlayableTrackTables + seven `<section>` blocks incl. releases/collections grids) —
  parallel hero structures in `ArtistPageHero.tsx` vs `ChannelHeroBlock.tsx:136` +
  `ChannelBackdropCard`; no shared "profile-page" abstraction.
- Player-side mirror: `packages/player` `ArtistAlbumsGrid.tsx:59`,
  `ArtistPlaylistsGrid.tsx:54`, `ArtistPopularTracks.tsx:44` hand-rebuild the same
  CardGrid/table cells.
- Collection content rendered 3×: `CollectionView.tsx:440,443`,
  `SmartLinkView.tsx:201`, `studio/StudioCollectionsView.tsx:371` — same track list +
  empty message, no shared surface.
- `LibraryView` trio (`LibraryMediaView` / `LibraryEmbedsView` / `LibrarySmartLinksView`)
  each hand-roll rows + grouping + ad-hoc empty text (`LibraryView.tsx:335,364`).
- Local `SectionTitle` recreations: `ArtistReferenceSections.tsx:24`,
  `ArtistProfileSections.tsx:301,369`, `ListenView.tsx:662`.

## Tasks

1. Extract a shared entity-profile section stack (tracks table + releases grid +
   collections grid) used by ArtistView and ChannelView; keep the per-entity
   colorScheme/tint from ChannelView.
2. Extract a shared collection-surface component for CollectionView / SmartLinkView /
   StudioCollectionsView.
3. Converge the Library trio onto one shared library-row surface (pairs with
   [view-modes-track-tables.md](view-modes-track-tables.md) item 3).
4. Add a `SectionTitle` to `@tahti-player/ui` or `components/` and replace the local copies.

## Verify

- Storybook: story for the new shared section/profile surfaces.
- Cross-check `docs/VIEW-CATALOG.md` (route/file-path table) after moving files.
- `pnpm --filter @tahti-player/tahti-web type-check && lint && test`.
