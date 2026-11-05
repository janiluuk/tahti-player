# Batch 50 UX slices (2026-11-05)

**Status:** open

Finnish / chrome for remaining high-visibility empties and shared actions after
batch 49 ConfirmDialogs and the Radio player widget (0.0.340).

Bump tahti-web to **0.0.341**.

## Slices

### Shared action

1. [x] `web.actions.openChannel` — wire "Open channel" on RadioView, ChatView, ModerateChannelView, ArtistProfileSections, EmbedViews, AdminStreamManagerPanel

### Radio chrome empties

2. [x] RadioUpNextPanel: member-set / rotation empty + errors
3. [x] RadioBookedShowsPanel: nothing booked empty
4. [x] RadioScheduleView: no upcoming shows

### Admin Radio empties

5. [x] AdminRadioView: rotation / live members / opted-out / history empties

### Moderation / Fans chat empties

6. [x] ChannelModeratorsPanel: no moderators
7. [x] ChatBansPanel: nobody banned
8. [x] ChatMessagesPanel: no messages

### Studio / library dialogs

9. [x] AddToPlaylistDialog: no playlists
10. [x] TracklistEditor: no tracks
11. [x] TrackCreditsEditor: no credits
12. [x] PlayHistoryDialog: nothing yet
13. [x] PinnedAnnouncementsPanel: no pinned
14. [x] ReleaseTracklistDialog: no tracklist
15. [x] AudioRevisionList: no revisions
16. [x] FingerprintTrackPanel: no match

### Admin / governance empties

17. [x] AdminLogsView: no audit entries
18. [x] AdminUserRestrictionsPanel: no restrictions
19. [x] AdminUserEditPanel: no messages
20. [x] AdminVendorsView: no launch blockers
21. [x] ElectionsPanel: no candidates / no elections
22. [x] AnnualReportsPanel: no report
23. [x] AssociationPanel: no details / no auditor
24. [x] CurrentBoardPanel: no terms
25. [x] MotionDiscussion: no comments

### Listen / fan / venue

26. [x] ChatView: no chat activity
27. [x] FanSubscriptionStats: no payouts
28. [x] MembershipInvoices: no invoices
29. [x] BlockedAccounts: haven't blocked
30. [x] VenueShowsSection: no shows; ListenerWorldMap: no location data; TrackInsightsPanel empties; NewsSourcesDialog; ListenAddonsPanel installed empty

## Skip

- pageTour / keyboardNavigation (large tables)
- SEO route descriptions
- performance audit
- admin hub card English descriptions (separate pass if time)

## Done when

Keys in en_US + fi_FI, locales.test green, type-check, bump 0.0.341, PR.
