# Playlist page background: subtle ambience instead of solid orange (dark mode)

**Status:** open

## Bug

In dark mode the playlist page background is all orange. It should be a subtle background, for example an ambience from the playlist / collection artwork, or from the first track that has artwork.

## Where to look

- `packages/tahti-web/src/views/CollectionView.tsx`: `coverTintUrl` falls back to `placeholderArtworkUrl(collection.slug)` when the collection has no cover, `useDominantColor` samples it, and `schemeFromCoverRgb` (line ~70) turns the raw dominant colour into a full-strength `bg` that is passed as `colorScheme` (line ~350). A warm placeholder (or cover) then paints the whole page solid orange.
- Ambient pattern to reuse: `AmbientTrackRow` (`ambientStyle(rgb)`), and the ambient wash in `@tahti-player/ui` `AmbientCard`.

## To do

- [ ] Pick the tint source: collection cover, else the first track with a `coverUrl`, else no tint (theme background) - not the generated placeholder.
- [ ] Use the colour as a soft wash (low-alpha gradient over the theme background) rather than a solid `bg`, with text staying on theme tokens so contrast holds in dark and light mode.
- [ ] Storybook: playlist with a warm cover, with no cover but a track cover, and with no artwork at all, in dark mode; play test that the page background is the theme background plus the wash, not the raw colour.
