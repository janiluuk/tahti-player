# Channel view — play icon hover / queue

**Status:** open

## Problem

On the channel view, hovering the mouse activates **all** play icons in the track list. Only the actively playing track (and the row under the pointer) should show a play control.

## Expected behavior

- Idle rows: no play icon (or inactive chrome), unless that track is currently playing.
- Hover a row: show the play icon for that row only.
- Holding **Shift** while hovering: icon switches to **queue** (add to queue).
- **Shift+click**: add the track to the queue (instead of starting playback).

## Scope

- Channel view track rows (Listen artist/channel page); check shared list/row components (`TrackTable` / ambient rows) so Library and other surfaces stay consistent if they share the same control.
- Storybook: idle / hover / playing / shift-hover states if the control lives in `@tahti-player/ui`.

## Leftovers

- Confirm whether shift+queue already exists elsewhere and should be reused rather than reinvented.
