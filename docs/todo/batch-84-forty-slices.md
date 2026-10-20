# Batch 84 — forty UX / dead-end honesty slices

**Status:** open

Asked for as "continue" while batch 83 (#1440) still open. Branched from
master — avoids depending on `LibrarySectionToolbar` from #1440.

## Theme

Partial-fail banners (error + existing data), remaining hide-on-fail settings
panels, Favorites ambient tracks, admin breadcrumbs, de-green / testids.

## Slices

### Listen / studio honesty (~15)

1. [x] Favorites — AmbientTrackList for liked + hearted audio tracks
2. [x] Favorites — always show likesError banner under Tracks
3. [x] RadioView — API fail → PageError vs offline empty
4. [x] HomeComingUp — error + retry (not hide on fail)
5. [x] TagSearchView — production empty copy (mock hint only in FORCE_MOCK)
6. [x] StudioReleaseDetailView — loadError PageError vs not found
7. [x] MessagesView — conversation fetch PageError
8. [x] MessagesView — loadOlder fail → Try again
9. [x] FeedView — soft banner when loadError && items.length > 0
10. [x] GovernanceMembersView — soft banner + signed-out PageEmpty
11. [x] StudioPlaylistsView — soft banner when loadError && rows
12. [x] FanTiersEditor — soft banner when loadError && tiers
13. [x] PurchaseTiersEditor — store settings fail → PageError
14. [x] PurchaseOrdersList — pass meta.reason into PageError
15. [x] StudioDistributionView — soft banner when releases error + list

### Settings / chrome honesty (~12)

16. [x] CommentSettingsToggles — PageError instead of null
17. [x] BroadcastPanel — PageError on fetch fail (not eternal Loading)
18. [x] ChannelPanel — profile fail PageError
19. [x] ThemesPanel — submissions fail hint
20. [x] MentionsPanel — mentions list PageError
21. [x] MySupportTickets — PageError + retry
22. [x] StatusView — PageError when !data
23. [x] notificationInboxStore — lastInboxError
24. [x] NotificationsPopover — show error + retry
25. [x] DevicesSessionsPanel — soft banner
26. [x] MulticastSection — soft banner
27. [x] VenuesDirectory — soft banner

### Polish / nav (~13)

28. [x] ApiTokensPanel — soft banner
29. [x] PublicGovernanceHistoryView — soft banner
30. [x] ChannelViewBlocks — hide empty public feed placeholder (non-edit)
31. [x] AdminGovernanceView breadcrumb
32. [x] AdminFinancialView breadcrumb
33. [x] AdminStorageView breadcrumb
34. [x] AdminDashboardView breadcrumb
35. [x] AdminRadioView breadcrumb
36. [x] RadioView + MessagesView data-testid
37. [x] De-green: BrowserLocalFiles / Discover / NotificationsPopover open
38. [x] HelpView / JamView / HistoryView data-testid
39. [x] Docs: INDEX, fold batch-82, bump, worklog
40. [x] Tests: RadioView / HomeComingUp / Favorites / CommentSettings / AdminFinancial

## Out of scope

LibrarySectionToolbar adoption (batch 83), AmbientTrackList peaks API,
PlayableTrackTable view modes, release DELETE, OAuth, ops cutover.
