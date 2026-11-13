# Channel manager — play station in player

**Status:** open

## Goal

On Studio → Broadcast → Channel manager, add a control that plays the
artist's station in the Tahti player (bottom bar), so they can listen
while managing rotation / stream without leaving Broadcast.

## Plan

1. `usePlayChannelInPlayer(slug)` — fetch channel playable, play/pause via
   `playerStore` (same id rules as Favorites / channel stage: `live:` /
   `radio:`).
2. Header button “Listen in player” / “Pause” on the Channel manager
   section; wire the same toggle into `StreamManagerPanel`'s existing
   `onPlaybackToggle` / `isPlaying`.
3. i18n (en + fi), Storybook Broadcast play assert, version bump.
