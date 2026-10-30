# Feed avatars and Discover random-track widget

**Status:** partial

Requested 2026-10-30. The random-track widget shipped (see the worklog, 0.0.285).

## User avatars in feeds

- [ ] Wherever a user is named in a feed (news feed, Discover widgets, similar
  lists), show their avatar thumbnail beside the name; username fallback,
  never an email.
- Blocked on API data: `/api/discover/latest-tracks`, `/api/top-lists`
  (incl. `/loved`) and the news posts return no artist/author avatar URL.
  Add one in `../tahti-org` first, then render it in `WidgetTrackRow` and the
  news cards.
