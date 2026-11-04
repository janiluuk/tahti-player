# Batch 34 slices 2026-11-04

**Status:** partial

Thirty slices from the open backlog (listing-date leftovers, Finnish
localization, polish). Branch `feat/batch-34-slices-2026-11-04`. Rebased onto
`origin/master` after #1818 (`0.0.320`); still at `0.0.321`. Open siblings:
#1817 batch 33 (`0.0.322`) and #1819 batch-32 follow-up (`0.0.323`) — rebase
again (version/worklog/INDEX/todo/i18n) once either merges.
`ListingDate` only on listings; schedule and booking windows keep their time of
day and now follow the app language (`lib/scheduleTime.ts`).

## Slices

1. [x] Date: `AudioRevisionList` revision created → `ListingDate`
2. [x] Date: `AdminNewsView` published → `ListingDate`
3. [x] Schedule: `VenueDetailView` upcoming shows through `formatScheduleWindow` (stays exact, app language)
4. [x] Schedule: `VenueShowsSection` booking list and cancel dialog through `formatScheduleWindow`
5. [x] Date: `ShowEpisodeList` / `RadioShowEpisodeList` through the new `ShowEpisodeWhen` (aired → `ListingDate`, upcoming → exact window)
6. [x] Date: `RecordingsTab` recording start → `ListingDate`
7. [x] Date: `EpisodeEditorRow` created → `ListingDate`; scheduled slot uses the app language
8. [x] Date: Studio home `RecentBroadcastRow` → `ListingDate`; removed `formatBroadcastDate`
9. [x] Date: Studio Recordings `RecordingRow` → `ListingDate`; removed `formatDate`
10. [x] `libraryFormat` `pluralTracks` → `web.library.trackCount` (locale number format, Finnish plural)
11. [x] Finnish: Settings → Integrations
12. [x] Finnish: Settings → Add-ons (group titles, category tabs, scrobbling notice, loader)
13. [x] Finnish: Settings → What's new chrome
14. [x] Finnish: Library History (tabs, toolbar, filter, pagination, toasts, plurals, row time)
15. [x] Finnish: Library Following
16. [x] Finnish: Admin hub titles, descriptions and the empty state
17. [x] Finnish: Admin section tabs, back link and page labels (`adminNav.*`, `adminPages.*`)
18. [x] Finnish: channel page actions (`ChannelPageActions`) and `ChannelShareButton` dialog
19. [x] Finnish: track `DownloadGateDialog`
20. [x] Finnish: auth toasts (connect callback, sign in to buy, no-TOTP error, device sign-out dialogs and toasts)
21. [x] Finnish: `seo.ts` Library, Studio and Admin child titles (English `Go live` → `Broadcast` to match the nav)
22. [x] Polish: `NewsCarousel` `publishedTitle` so the tooltip follows the app language
23. [x] Storybook: `ShowEpisodeWhen` stories (Upcoming, Aired)
24. [x] Tests: `scheduleTime`, `ShowEpisodeWhen`, `pluralTracks` in Finnish, `NewsCarousel` title, `seo` Finnish children
25. [x] Folded batches 31 and 32 (both merged) into HISTORY, deleted their todos, removed their INDEX rows
26. [x] `date-format-sweep` Done / Kept / Left updated
27. [x] `finnish-localization` Done / Left updated
28. [x] Counts-only files recorded as kept (`SmartPlaylistDialog`, `SmartPlaylists`, `WriteTagsDialog`, `CatalogTable`, `ShareList`)
29. [ ] Finnish: Studio Updates — skipped, see below
30. [x] tahti-web `0.0.321` + UI-REDESIGN-WORKLOG line

29 of 30 done.

## Skipped

- 29 Studio Updates: #1809 (StoryCard posts, newsletter removal) rewrites the page.
- `CatalogTable`, `ShareList`, `SmartPlaylist*`, `WriteTagsDialog`: they format counts and percentages, not dates; no `ListingDate` fits.
- `ChannelStagePlayer` favorite tooltip: batch 32 already touched those lines.

## Not changed on purpose

- Release notes (`content/releaseNotes.ts`) stay English; only the What's new chrome is translated.
- Admin hub card descriptions per page (`PRIMARY[].description`) stay English.
