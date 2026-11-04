# One date style everywhere

**Status:** partial

Rule (user, 2026-11-03): listings show a humanized date inside a week ("3 hours ago", "2 days ago") and `d.m.yyyy` after that, with a clock icon instead of the word "on".

How: `lib/relativeDate.ts` (`relativeDate`, `numericDate`) formats; `components/ListingDate.tsx` renders the clock icon and a `<time dateTime>` titled with the full `toLocaleString()` (a date-only `yyyy-mm-dd` value reads as that local day). Use `ListingDate` for any listing date. Tests fix `now` with `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime`.

## Done

- `storyDate`, `humanizePastDate`, story/news/RSS cards and track rows (first pass).
- Comments (`CommentItem`), governance discussion list (`DiscussionsView`) and topic + replies (`DiscussionTopicView`), Notifications, artist News feed, My support tickets ("Sent"), sales list (`PurchaseOrdersList`), membership invoices, API tokens (last used / created / expires), signed-in devices, What's New timeline, Discover latest releases (`WidgetCard`), transparency resolutions ("Voted"), Admin content reports, Admin theme review.
- Admin moderation `SupportTab` (ticket list/detail), `BetaTab`, `RadioSubmissionsTab`; `CommunityStatsPanel` busiest day; `MotionCard` draft open date; `HistoryListSection` day headings; `ListingDate` tooltip locale.
- Governance `ElectionsPanel`, `CorrectionsPanel`, `AnnualReportsPanel`, `MotionCertificatePanel` and the `GovernanceView` meetings list; `RestrictionNotice` until-date; `FanSubscriptionStats` payout history; `FeatureRequestsView` comments; `AdminPageCommentsPanel` and `SavedMapComments` rows.
- Batch 31: `PublicGovernanceHistoryView`, `AccountPanel` purchases, `StudioEditorProjectView`, `StudioUploadView` recordings, `AdminVenuesView`, `AdminMissedShowsView`, `FanSubPayoutQueue`, `LegacyMembersPanel`, `CurrentBoardPanel`, `MembershipStatusPanel`, `CurrentFanSubscriptionCard`; `FeedView` uses `storyDate`.

## Kept as full timestamps (exact time matters)

- Schedules and show times: `RadioScheduleView`, `RadioBookingCalendar`, `RadioProgrammingGrid`, `RadioBookedShowsPanel`, `lib/radioSchedule.ts`, `ChannelUpcomingShows`, Studio home `UpcomingShowsSection`, `ArtistUpcomingEvents`, `StudioListeningPartiesView` (party start).
- Support conversation reply times in `MySupportTickets`.
- Audit / money trails: `moderation/moderationTime.ts`, `AdminUserRestrictionsPanel`, `LegalHoldsPanel`, `LedgerPanel`, `AdminDashboardView` recent audit events.
- Support conversation note times in admin `SupportTab` (same as member `MySupportTickets`).
- `ChangeEmailForm` confirmation-link expiry (a deadline with a time), `SavedMapComments` copy/CSV export text, and `TrackInsightsPanel` calendar heatmap tooltip (a chart label, not a listing).

## Left

- [ ] Skipped while the edit/view-mode rework is in flight (show/sound/venue/post pages and editors): `AudioRevisionList`, `AdminNewsView`, `VenueDetailView`, `venues/VenueShowsSection`, `ShowEpisodeList`, `RadioShowEpisodeList`, `studio/show-detail/RecordingsTab`, `studio/show-detail/EpisodeEditorRow`.
- [ ] Remaining one-off `toLocaleDateString` / `toLocaleString` in listings (`rg "toLocaleDateString|toLocaleString\(" packages/tahti-web/src packages/ui/src`): Admin `AdminContentView`, `AdminRadioView`, `AdminGrantCycleView`, `AdminDashboardView` (audit events stay exact — see kept list); governance (`Motion*` controls, `GovernanceMeetingDetailView`, admin governance tabs/records/board panels); Studio (`StudioBroadcastView`, `StudioChannelView`, `StudioStatsDetailView`, `stats/*`, `recordings/helpers.ts`, `home/home-helpers.ts`, `distribution/DeliveryTab`); Library/desktop (`HistoryStatsSection`, `historyStats.ts`, `libraryFormat.ts`, `DesktopLibraryPanel`, `desktop-library/*`, `LocalLibrary*`, `DuplicatesDialog`, `SmartPlaylistDialog`, `TrackEditorDialog`, `track-edit-dialog/AudioTab`, `TrackOrganizeDialog`, `OrganizeFilesDialog`, `WriteTagsDialog`, `SaveQueueLocalDialog`, `BackupRestoreDialog`, `PlayHistoryDialog`); account (`channelRenameNote.ts`, `fanSubscriptionStatus.ts`); `artist-view/ArtistProfileSections`, `lib/artistProfile.ts`, `channel-view/ChannelViewBlocks`, `ObsPresetButton`, `AdminUserEditPanel`, `RadioView`, `lib/storageFormat.ts`, `lib/nativePlayback.ts`. Decide per file: convert to `ListingDate` or add to the kept list.
- [ ] `packages/ui`: `CatalogTable`, `ShareList`, `NewsCarousel` format dates themselves; pass the formatted string (or a `ListingDate` node) from the tahti-web caller.
