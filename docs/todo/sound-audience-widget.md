# Sound audience widget

**Status:** partial

Requested 2026-11-02 (from a screenshot): a widget on the sound page for
tracks, sets and other sounds. Tabs from the left: the collections the sound
is in, Liked (people who liked it), Reposted (people who reposted it) and
Played by (listeners), every row with a thumbnail.

- [x] `SoundAudience` in `@tahti-player/ui` + Storybook (`Media/SoundAudience`):
  tabs with counts, collection covers, round avatars with an initial
  fallback, empty copy per tab, `renderLink` / `renderMore` slots.
- [x] tahti-org#1037: public lists per sound — public collections containing it,
  likers, reposters, listeners (signed-in listen sessions, people who have
  not hidden their listening). Names via `safeDisplayName`; no blocked or
  suspended accounts; paged with totals. "Played by" = signed-in listeners (user, 2026-11-02).
- [x] tahti-web: fetcher + mock, render on the track page (and set / other
  sound pages) beside the comments, router links, "Show all" paging.
- [ ] Help center / manual line.
- [ ] Drop the allowlist entry once a tahti-org release has #1037; "Show all" paging.
