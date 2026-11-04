# Batch 33 slices 2026-11-04

**Status:** partial

Thirty slices from the open backlog (date-format sweep, Finnish localization,
de-green, nav/Library polish). Branch `feat/batch-33-slices-2026-11-04`, cut
from `origin/master`. #1816 (batch 32, `0.0.319`) merged while this was in
flight, so the batch ships `0.0.322` after the rebase. `ListingDate` /
`relativeDate` only on listings; term ranges and deadlines use `numericDay`.

## Slices

1. [x] Date: `GovernanceMeetingDetailView` notice published + minutes approved → `ListingDate` (scheduled time stays exact)
2. [x] Date: `AdminUserEditPanel` member since + suspended → `ListingDate` (`StudioPanel` `description` takes a node)
3. [x] Date: `ArtistProfileSections` mentions → `ListingDate`
4. [x] Date: `DeliveryTab` distribution fee paid → `ListingDate`
5. [x] Date: board `BoardTermsPanel` term range → `numericDay`
6. [x] Date: `ElectionsAdminPanel` nominations close → `numericDay`
7. [x] Date: `AuditorsPanel` term range → `numericDay`
8. [x] Date: `CorrectionsQueuePanel` sent → humanized
9. [x] Date: `AnnualReportRow` / `AnnualReportCorrection` → humanized
10. [x] Date: `MotionSeconders` / `MotionCirculateControl` / `MotionDiscussion` → `ListingDate`
11. [x] Date: `MemberRegisterPanel` since + `MeetingRecordPanels` sent → `ListingDate`
12. [x] Date: `AdminUserEngagementPanel` adjustments → `ListingDate`
13. [ ] Date: `StudioChannelView` / `StudioStatsDetailView` / `stats/*` — skipped, see below
14. [ ] Date: `HistoryStatsSection`, `PlayHistoryDialog`, `DuplicatesDialog`, `ObsPresetButton`, `ChannelViewBlocks`, `artistProfile` — skipped, see below
15. [x] Finnish: Library Overview stat cards + `formatPlayCount` plural
16. [x] Finnish: Radio tabs, loading, recent-plays errors and empty copy
17. [x] Finnish: Messages popover
18. [x] Finnish: processing-failure toast
19. [x] Finnish: `FullScreenPlayer` chrome, tooltips and shuffle/repeat labels
20. [x] Finnish: `TrackHero` back, back-to-channel, share, add
21. [x] Finnish: Settings → Account tabs, session, membership, subscriptions, purchases
22. [x] Finnish: Settings → Artist tabs + load errors
23. [x] Finnish: Settings → Channel page panel + chat/moderator pointers
24. [x] Finnish: Settings → Broadcast radio + green room
25. [ ] Finnish: `seo.ts` Discover/Studio titles — already shipped in batch 32 (`web.seo.*`)
26. [x] De-green: plugin-store import cards confirm Disconnect in red
27. [x] `ConfirmDialog` sweep: no non-destructive dialog left except deliberate primaries (noted in `ux-backlog.md`)
28. [x] Library Media empty state: description + Open Branding link
29. [x] Storybook play: Confirm dialogs `ReplaceQueue` / `RemoveWidget`
30. [x] Docs: VIEW-CATALOG, nav audit, dead-export note, Done lists, WORKPLAN check, worklog, `0.0.322`

27 of 30 done.

## Skipped

- 13 Studio stats: the `toLocaleDateString` calls are chart axis labels and tooltips, and the rest are `toLocaleString()` on counts, not listing dates.
- 14 `HistoryStatsSection` ranges and heat-map labels, `ChannelViewBlocks` next show (schedule time), `artistProfile` "Joined" month, `PlayHistoryDialog` / `DuplicatesDialog` / `ObsPresetButton` (numbers only).
- 25 `seo.ts`: batch 32 already moved every Discover/Studio/Admin title to `web.seo.*`.

## Not changed on purpose

- `GovernanceView` / `AgmTab` / `MotionMeetingNote` meeting and voting-window times stay exact.
- `WORKPLAN.md` has no checkboxes to strip.
