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
- 2026-11-02: tahti-org#1036 adds `artistAvatarUrl` to top lists, the loved
  list and latest tracks; Discover widget rows show it beside the artist
  name (the Tahti Selects / new-to-you rows follow when their routes send
  it). Left: news cards.
