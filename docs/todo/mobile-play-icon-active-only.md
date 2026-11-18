# Mobile: play icon only when playing or paused

**Status:** open  
**Updated:** 2026-11-18

On touch / narrow viewports, `MediaArtwork` (and ambient/list rows that use it)
currently shows a play control on every playable item (see
`[@media(hover:none)]:bg-black/35` + always-visible overlay). That clutters
lists on phones.

## Done when

- On mobile / coarse pointer: play (and pause) chrome on artwork appears **only**
  for the row that is currently playing or paused — not on every idle playable
  item.
- Hover / fine-pointer desktop keeps the existing hover-to-reveal play control.
- Cover with Vitest and/or Storybook: idle vs playing vs paused on a touch
  media query (or `hideIdlePlayOnTouch` prop).
- Check AmbientTrackRow, Discover, Library, channel catalog — wherever
  `MediaArtwork` + `onPlay` is used in lists.

## Notes

Likely change in `@tahti-player/ui` `MediaArtwork`: do not apply the always-on
touch dim / reveal unless `isPlaying` (or an explicit paused/current flag).
Row click / artwork tap can still start playback without a visible idle icon.
