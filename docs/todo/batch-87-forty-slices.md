# Batch 87 — forty UX / honesty / admin breadcrumb slices

**Status:** open

Asked for as "continue" after batches 83–86 shipped. Theme: remaining
admin breadcrumbs, partial-fail banners, Listen ambient, library sort,
News/Radio de-green.

## Slices

### Admin breadcrumbs + dashboard honesty (~19)

1. [x] AdminDashboardView — PageError when dashboard load fails
2. [x] AdminContentView breadcrumb
3. [x] AdminUsersView breadcrumb
4. [x] AdminLogsView breadcrumb
5. [x] AdminMonitoringView breadcrumb
6. [x] AdminStreamsView breadcrumb
7. [x] AdminAddonsView breadcrumb
8. [x] AdminStatusView breadcrumb
9. [x] AdminVenuesView breadcrumb
10. [x] AdminNewsView breadcrumb
11. [x] AdminVendorsView breadcrumb
12. [x] AdminTopListsView breadcrumb
13. [x] AdminStorageUserView breadcrumb
14. [x] AdminI18nView breadcrumb
15. [x] AdminMissedShowsView — skipped (lives inside AdminModerationView breadcrumb)
16. [x] AdminSelectsView breadcrumb
17. [x] AdminMapView breadcrumb
18. [x] AdminAnnouncementsView breadcrumb
19. [x] AdminArtworkPresetsView breadcrumb

### Partial-fail / hide-on-fail (~10)

20. [x] ChannelUpcomingShows — PageError on schedule fail
21. [x] DownloadGatesPanel — PageError not null
22. [x] RecentActivitySection — error vs empty
23. [x] StudioSoundsView — soft banner when loadError && items
24. [x] StudioEditorListView — soft banner
25. [x] StudioUpdatesView — soft banner
26. [x] RadioView — soft banner when recent error + rows
27. [x] RadioUpNextPanel — soft banners for rotation/bookings
28. [x] RadioShowView NowPlaying — poll fail vs empty
29. [x] NewsFeedWidget — Retry on RSS fail

### Ambient / library / polish (~11)

30. [x] ListenView new tracks → PlayableAmbientTrackList
31. [x] ArtistReferenceSections popular → PlayableAmbientTrackList
32. [x] LibraryMediaView — client sort in toolbar
33. [x] LibraryEmbedsView — client sort
34. [x] LibrarySmartLinksView — client sort
35. [x] NewsView / WhatsNewView — de-green timeline latest node
36. [x] RadioView — de-green playing-row accent
37. [x] FeatureRequestsView embedded — prominent full-page ButtonLink
38. [x] NewsArticleDialog — empty/broken body fallback
39. [x] Docs: INDEX, bump, worklog, ux-backlog ticks
40. [x] Tests: AdminDashboard fail, library sort, NewsFeed retry, ChannelUpcomingShows

## Out of scope

PlayableTrackTable grid mode, wavesurfer peaks API, release DELETE, ops,
studio-stats-audience-breakdown (org UA).
