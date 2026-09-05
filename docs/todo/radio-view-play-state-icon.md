# RadioView: hero station play icon didn't reflect actual playback state

**Status:** done (2026-09-05).

## What shipped

`RadioView.tsx`'s "Tahti Radio" hero card used `MediaIconActions` with a
hardcoded `PlayIcon` and a `playStation` handler that always called
`play()` on a freshly-fetched playable, regardless of whether the
station was already the one currently playing — clicking it while
playing would just re-trigger playback instead of pausing, and the icon
never switched to a pause state. `ListenView.tsx`'s own separate Tahti
Radio card (a different render higher up on the Listen page) already
had this wired correctly, so that one was the reference pattern:
`radioPlayableId = \`radio:${TAHTI_RADIO_SLUG}\`` (matches the
`radio:<slug>` id shape `fetchChannel`/`fetchRadioStation` return),
compared against `usePlayerStore`'s `currentId`/`status`.

Mirrored that into `RadioView.tsx`: added `isRadioCurrent`/
`isRadioPlaying`, `playStation` now toggles play/pause via
`setPlayerStatus` when the station is already current instead of
re-fetching and re-playing, and the `MediaIconActions` play entry shows
`PauseIcon`/"Pause Radio" when playing. Set `disableWhenActive: false`
(the component defaults to disabling `active` actions, which would
have made the button unclickable once playing — wrong for a play/pause
toggle, per the component's own doc comment).

## Verification

`tsc --noEmit`, `eslint`, and `pnpm --filter @tahti-player/tahti-web
build` all pass. No existing test file for `RadioView.tsx`; none added.
Not manually verified in a running browser.
