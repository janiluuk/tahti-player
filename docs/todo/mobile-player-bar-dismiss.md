# Phone player bar: a subtle way to close it when nothing plays

**Status:** open

Requested 2026-11-22.

On phones, when playback is paused or stopped, the player bar (`components/ConnectedPlayerBar.tsx`, `@tahti-player/ui` `PlayerBar`) should offer a quiet way to hide it: a small close (×) control and/or swipe-down on the bar. While something plays, no close control shows.

- Closing hides the bar and stops/clears the current item (decide: clear the queue or only hide until the next play; default to "hide until the next play" so the queue survives).
- The bar comes back as soon as anything plays again.
- Label through `web.actions` / `UiLabels` (English + Finnish), 44px touch target even if the icon is small, keyboard reachable.
- Tests: vitest for show/hide rules (playing → no close; paused → close hides; play again → bar back), Storybook phone story with a play test.
