# Warn before refreshing the page while the player is playing

**Status:** open

User ask (2026-10-04): if the player is playing, warn before the page is refreshed.

## Notes

- Nothing in `packages/tahti-web/src` listens for `beforeunload` today.
- Browsers only show their own generic "Leave site?" dialog, and only after the user has interacted with the page. The text cannot be customized.

## Plan

- [ ] 1. Add a `beforeunload` handler that asks for confirmation while playback status is `playing` (not paused, not idle). Register it only while playing, since a permanent handler disables the browser's back/forward cache.
- [ ] 2. Decide whether live broadcasting from Studio (Go live) should warn too. It is the more costly thing to lose.
- [ ] 3. Test with a store-driven unit test, and by hand in a browser, since headless runs skip the dialog.
