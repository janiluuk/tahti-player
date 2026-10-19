# Universal translucent BackButton

**Status:** partial

## Ask

Radio channel page lacks a back arrow; library top-nav back is too small. Need one
standard round translucent arrow-left control in Storybook, theme-aware, used
everywhere these cases appear.

## Done

1. `@tahti-player/ui` `BackButton` / `BackButtonLink` / `BackButtonAnchor` + story + tests.
2. Wired: ChannelView, RadioStationView, AppTopNav history pair, FullScreenPlayer,
   StudioReleaseDetailView, StudioCollectionEditView, StudioSoundView,
   StudioShowDetailView, StudioEpisodeReviewView, StudioPlaylistEditorView,
   ArtistView, CollectionView, TrackHero. Page backs float in the top-left
   corner instead of taking a row.

## Left

- CI: refresh CardGrid, CardsRow, and Tabs snapshots for the Card `data-surface` class order, and point the radio station test at the other-stations chip.
- Merge PR; fold this todo.
