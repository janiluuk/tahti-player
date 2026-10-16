# Shift+play Storybook coverage

**Status:** partial

## Ask

Make sure Shift+play / Shift-held queue icon changes are reflected in Storybook and stories are up to date.

## Done

1. `Components/MediaArtwork` docs mention Shift+click / Shift-held queue icon; `ShiftClickQueues` play covers label swap + Shift+click `onQueue` / plain `onPlay`.
2. Interactive size stories show a queued counter hint; Thumb docs note Shift.
3. `Components/TrackTable` `ShiftClickQueuesFromThumbnail` covers thumbnail wiring from `onAddToQueue`.
4. `GlowMediaTile` autodocs point at the same MediaArtwork Shift behavior.

## Left

- Merge PR; fold this todo.
