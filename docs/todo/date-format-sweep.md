# One date style everywhere

**Status:** partial

Rule (user, 2026-11-03): listings show a humanized date inside a week ("3 hours ago", "2 days ago") and `d.m.yyyy` after that, with a clock icon instead of the word "on".

How: `lib/relativeDate.ts` (`relativeDate`, `numericDate`) formats; `components/ListingDate.tsx` renders the clock icon and a `<time dateTime>` titled with the full `toLocaleString()` (a date-only `yyyy-mm-dd` value reads as that local day). Use `ListingDate` for any listing date. Tests fix `now` with `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime`.

## Done

- `storyDate`, `humanizePastDate`, story/news/RSS cards and track rows (first pass).
- Comments (`CommentItem`), governance discussion list (`DiscussionsView`) and topic + replies (`DiscussionTopicView`), Notifications, artist News feed, My support tickets ("Sent"), sales list (`PurchaseOrdersList`), membership invoices, API tokens (last used / created / expires), signed-in devices, What's New timeline, Discover latest releases (`WidgetCard`), transparency resolutions ("Voted"), Admin content reports, Admin theme review.
- Admin moderation `SupportTab` (ticket list/detail), `BetaTab`, `RadioSubmissionsTab`; `CommunityStatsPanel` busiest day; `MotionCard` draft open date; `HistoryListSection` day headings; `ListingDate` tooltip locale.
- Governance `ElectionsPanel`, `CorrectionsPanel`, `AnnualReportsPanel`, `MotionCertificatePanel` and the `GovernanceView` meetings list; `RestrictionNotice` until-date; `FanSubscriptionStats` payout history; `FeatureRequestsView` comments; `AdminPageCommentsPanel` and `SavedMapComments` rows.
- Batch 33: `GovernanceMeetingDetailView` (notice, minutes approved), `AdminUserEditPanel` (member since, suspended), `AdminUserEngagementPanel` adjustments, `ArtistProfileSections` mentions, `DeliveryTab` fee paid, `MotionSeconders` / `MotionCirculateControl` / `MotionDiscussion`, admin governance `MemberRegisterPanel`, `MeetingRecordPanels` sent, `CorrectionsQueuePanel`, `AnnualReportRow` / `AnnualReportCorrection` (humanized), board `BoardTermsPanel`, `ElectionsAdminPanel` and `AuditorsPanel` (`numericDay` for term and deadline dates). `numericDay(iso)` joins `numericDate` in `lib/relativeDate.ts`.
- Batch 31: `PublicGovernanceHistoryView`, `AccountPanel` purchases, `StudioEditorProjectView`, `StudioUploadView` recordings, `AdminVenuesView`, `AdminMissedShowsView`, `FanSubPayoutQueue`, `LegacyMembersPanel`, `CurrentBoardPanel`, `MembershipStatusPanel`, `CurrentFanSubscriptionCard`; `FeedView` uses `storyDate`.
- Batch 34: `AudioRevisionList` revision dates, `AdminNewsView` published, `RecordingsTab` and `EpisodeEditorRow` created, Studio home `RecentBroadcastRow` and Recordings `RecordingRow`, aired episodes in `ShowEpisodeList` / `RadioShowEpisodeList` (through `ShowEpisodeWhen`). `NewsCarousel` takes a `publishedTitle` so the tooltip uses the app language (`LatestNewsWidget` passes it).
- Batch 33, second pass: admin governance `LegalHoldsPanel`; chart, heatmap, weekday and month labels in Studio stats and History follow the app language (`dateLocaleTag()` in `lib/locale.ts`).
- Batch 35: Admin Catalog latest content/broadcasts and Admin Radio featured/history → `ListingDate`; Studio editor list Updated → `ListingDate`; `channelRenameNote` redirect uses `numericDate`; artist "Joined" stays month/year via i18n.
- Batch 36: `MotionMeetingLinkControl` meeting option → `numericDay`; `PlayHistoryDialog` → `ListingDate`.

## Kept as full timestamps (exact time matters)

- Schedules and show times: `RadioScheduleView`, `RadioBookingCalendar`, `RadioProgrammingGrid`, `RadioBookedShowsPanel`, `lib/radioSchedule.ts`, `ChannelUpcomingShows`, Studio home `UpcomingShowsSection`, `ArtistUpcomingEvents`, `StudioListeningPartiesView` (party start).
- Support conversation reply times in `MySupportTickets`.
- `GovernanceMeetingDetailView` meeting date and time (a schedule).
- Audit / money trails: `moderation/moderationTime.ts`, `AdminUserRestrictionsPanel`, `LegalHoldsPanel`, `LedgerPanel`, `AdminDashboardView` recent audit events.
- Support conversation note times in admin `SupportTab` (same as member `MySupportTickets`).
- Upcoming and on-air show windows: `VenueDetailView`, `VenueShowsSection`, `ShowEpisodeWhen` (all through `lib/scheduleTime.ts`, which follows the app language), `EpisodeEditorRow` scheduled slot.
- Counts, not dates: `SmartPlaylistDialog`, `SmartPlaylists`, `WriteTagsDialog` (`toLocaleString('en-US')` on numbers), `ui` `CatalogTable` and `ShareList`, `AdminGrantCycleView` (money/units), `StudioChannelView` (plays/downloads), `DuplicatesDialog`, `OrganizeFilesDialog` (`n()` counts), `PlayHistoryDialog` “Show more” count.
- Studio stats chart labels and tooltips (`StudioStatsDetailView`, `stats/helpers.ts`, `useStatsData`, `PlaysTab` busiest day), Library history chart ranges (`HistoryStatsSection`, `historyStats.ts`), `ChannelViewBlocks` next show (schedule), `artistProfile` "Joined" month, `GovernanceMeetingDetailView` and `AgmTab` meeting and voting-window times, `ObsPresetButton`.
- `ChangeEmailForm` confirmation-link expiry (a deadline with a time), `SavedMapComments` copy/CSV export text, and `TrackInsightsPanel` calendar heatmap tooltip (a chart label, not a listing).

## Left

- [ ] Remaining one-off `toLocaleDateString` / `toLocaleString` in listings (`rg "toLocaleDateString|toLocaleString\(" packages/tahti-web/src packages/ui/src`): `AdminDashboardView` (audit events stay exact — see kept list); Studio (`StudioBroadcastView` agenda windows, `StudioStatsDetailView` chart labels, `stats/*`, `StudioEventsView` / `StudioEventView` / `StudioListeningPartiesView` schedule times); Library/desktop chart and count formatters (`HistoryStatsSection` range dates, `historyStats.ts`, `DesktopLibraryPanel`, `desktop-library/*`, `LocalLibrary*`, `SmartPlaylistDialog`, `WriteTagsDialog`, `SaveQueueLocalDialog`, `BackupRestoreDialog`); `ChannelViewBlocks` next show (schedule), `ObsPresetButton` / `CatalogTable` / `ShareList` (numbers); `AgmTab` voting windows. Decide per file: convert to `ListingDate`/`numericDay` or add to the kept list.
