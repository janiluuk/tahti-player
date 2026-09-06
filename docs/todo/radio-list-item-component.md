# Listen page: extract Tahti Radio row as RadioListItem + hover play on cover

**Status:** open

User request (2026-09-06): on the Listen page, save the Tahti Radio row
as a `RadioListItem` component in Storybook. Move the play button to
hover over the cover art (instead of a separate button to the side).

## Current shape

`views/ListenView.tsx:248-320` — a bespoke inline `Box` (not a reusable
component): `ChannelVisualizer` backdrop when playing, a 48px
(`size-12`) cover thumbnail (`ImageReveal` + `RadioIcon` placeholder)
on the left, name/now-playing subtitle text next to it, and on the
right a separate `Tooltip`-wrapped icon-only play/pause `Button` plus
an "Open radio" button linking to `/radio`. Play state comes from
`radioIsPlaying`/`toggleRadioPlayback` (already in scope in
`ListenView.tsx`, wired to the player store elsewhere in the file).

## Plan

1. Extract this into a new `RadioListItem` component (likely
   `packages/ui` if it should be a generic reusable list-row pattern
   sharing the same "cover + hover play + text" shape used elsewhere —
   or `packages/tahti-web/src/components` if it stays radio-specific;
   check `MediaArtwork` first, since
   `docs/todo/queued-ux-fixes-2026-09-05.md`'s Stream Manager artwork
   item already notes `MediaArtwork` (`packages/ui/src/components/
   MediaArtwork/MediaArtwork.tsx`) has the exact `onPlay`/`isPlaying`
   hover-play-button-over-artwork pattern needed here — reuse it rather
   than building a second hover-play implementation).
2. Move the play/pause control from the separate right-side button to
   a hover overlay on the cover art itself, using that pattern.
3. Keep the "Open radio" link and the now-playing text/visualizer
   backdrop behavior unchanged.
4. Add a Storybook story for the new component (states: playing / not
   playing / offline / no artwork).
5. Swap `ListenView.tsx`'s inline markup for the new component.
