# One date style everywhere

**Status:** partial

Rule (user, 2026-11-03): listings show a humanized date inside a week ("3 hours ago", "2 days ago") and `d.m.yyyy` after that, with a clock icon instead of the word "on".

How: `lib/relativeDate.ts` (`relativeDate`, `numericDate`) formats; `components/ListingDate.tsx` renders the clock icon and a `<time dateTime>` titled with the full `toLocaleString()` (a date-only `yyyy-mm-dd` value reads as that local day). Use `ListingDate` for any listing date. Tests fix `now` with `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime`.

## Done

- `storyDate`, `humanizePastDate`, story/news/RSS cards and track rows (first pass).
- Comments (`CommentItem`), governance discussion list (`DiscussionsView`) and topic + replies (`DiscussionTopicView`), Notifications, artist News feed, My support tickets ("Sent"), sales list (`PurchaseOrdersList`), membership invoices, API tokens (last used / created / expires), signed-in devices, What's New timeline, Discover latest releases (`WidgetCard`), transparency resolutions ("Voted"), Admin content reports, Admin theme review.

## Kept as full timestamps (exact time matters)

- Schedules and show times: `RadioScheduleView`, `RadioBookingCalendar`, `RadioProgrammingGrid`, `RadioBookedShowsPanel`, `lib/radioSchedule.ts`, `ChannelUpcomingShows`, Studio home `UpcomingShowsSection`, `ArtistUpcomingEvents`, `StudioListeningPartiesView` (party start).
- Support conversation reply times in `MySupportTickets`.
- Audit / money trails: `moderation/moderationTime.ts`, `AdminUserRestrictionsPanel`, `LegalHoldsPanel`, `LedgerPanel`.

## Left

- [ ] Skipped while the edit/view-mode rework is in flight (show/sound/venue/post pages and editors): `AudioRevisionList`, `AdminNewsView`, `VenueDetailView`, `venues/VenueShowsSection`, `ShowEpisodeList`, `RadioShowEpisodeList`, `studio/show-detail/RecordingsTab`, `studio/show-detail/EpisodeEditorRow`.
- [ ] Remaining one-off `toLocaleDateString` / `toLocaleString` in listings (`rg "toLocaleDateString|toLocaleString\(" packages/tahti-web/src packages/ui/src`): Admin moderation `SupportTab`, `BetaTab`, `RadioSubmissionsTab`; Admin `AdminContentView`, `AdminVenuesView`, `AdminRadioView`, `AdminMissedShowsView`, `AdminGrantCycleView`, `AdminDashboardView`, `CommunityStatsPanel`, `FanSubPayoutQueue`, `LegacyMembersPanel`; governance (`MotionCard`, `Motion*` controls, `ElectionsPanel`, `CurrentBoardPanel`, `CorrectionsPanel`, `AnnualReportsPanel`, `GovernanceView`, `GovernanceMeetingDetailView`, `PublicGovernanceHistoryView`, admin governance tabs/records/board panels); Studio (`StudioUploadView` recordings, `StudioBroadcastView`, `StudioChannelView`, `StudioStatsDetailView`, `stats/*`, `recordings/helpers.ts`, `home/home-helpers.ts`, `distribution/DeliveryTab`); Library/desktop (`history/HistoryListSection` day headings, `HistoryStatsSection`, `historyStats.ts`, `libraryFormat.ts`, `DesktopLibraryPanel`, `desktop-library/*`, `LocalLibrary*`, `DuplicatesDialog`, `SmartPlaylistDialog`, `TrackEditorDialog`, `track-edit-dialog/AudioTab`, `TrackOrganizeDialog`, `OrganizeFilesDialog`, `WriteTagsDialog`, `SaveQueueLocalDialog`, `BackupRestoreDialog`, `PlayHistoryDialog`); account (`AccountPanel`, `channelRenameNote.ts`, `ChangeEmailForm`, `MembershipStatusPanel`, `CurrentFanSubscriptionCard`, `FanSubscriptionStats`, `fanSubscriptionStatus.ts`, `RestrictionNotice`); `artist-view/ArtistProfileSections`, `lib/artistProfile.ts`, `channel-view/ChannelViewBlocks`, `ObsPresetButton`, `AdminUserEditPanel`, `RadioView`, `FeedView`, `lib/storageFormat.ts`, `lib/nativePlayback.ts`. Decide per file: convert to `ListingDate` or add to the kept list.
- [ ] `packages/ui`: `CatalogTable`, `ShareList`, `NewsCarousel` format dates themselves; pass the formatted string (or a `ListingDate` node) from the tahti-web caller.
