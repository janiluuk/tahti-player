# Empty states: create CTA (icon + title)

**Status:** open

## Pattern

When a `PageEmpty` means “nothing here yet” **and the viewer can create or add
an entry**, show a call-to-action on the empty itself:

- `action={<Button size="sm">…</Button>}` (or `ButtonLink`)
- Leading Lucide **icon** + short **title** (e.g. “Add track”, “New playlist”)
- Prefer pointing at the same create path as the page header / form already
  uses (scroll/focus the form, open the dialog, or navigate)

`PageEmpty` / `@tahti-player/ui` `EmptyState` already accept `action`. Good
templates: `StudioReleasesView`, `StudioCollectionsView`, `PlaylistsBrowser`,
`EmptyDiscographyPrompt`, `AdminNewsView`.

**Near** = create UI already exists on the same surface but the empty has no
`action`. **Gap** = empty has no adjacent create control.

Skip informational empties (history, bans, offline, filter “no matches”,
incoming review queues).

## Priority A — clear create, often Near

### Studio
- [ ] `TracklistEditor` — no pins → Add pin (`Plus`) · focus add form
- [ ] `TrackCreditsEditor` — no credits → Add credit (`Plus`) · **Near**
- [ ] `collection-edit/TracklistPanel` — no tracks → Add tracks (`Plus`)
- [ ] `StudioPlaylistEditorView` — empty playlist/collection → Add tracks (`ListPlus`)
- [ ] `StudioReleaseDetailView` — no tracks / no audio → Add / Upload (`Plus`/`Upload`)
- [ ] `ReleaseSmartLinksPanel` — no tracks → Add from library (`Plus`) · **Near**
- [ ] `ReleaseTrackCreditsPanel` / `distribution/CreditsEditor` — Add credit · **Near**
- [ ] `ReleaseTrackVersionsPanel` — Upload version (`Upload`)
- [ ] `MasteringPanel` — Add effect (`Plus`) · **Near**
- [ ] `StemsPanel` — Request split (`Sparkles`)
- [ ] `StudioEventsView` — Add event (`CalendarPlus`) · **Near**
- [ ] `StudioGroupsView` — New group (`Plus`) · **Near**
- [ ] `StudioListeningPartiesView` — Schedule party (`CalendarPlus`) · **Near**
- [ ] `StudioBroadcastView` — Nothing coming up → Schedule (`CalendarPlus`)
- [ ] `schedule/ScheduledTimes` — Add schedule (`CalendarPlus`)
- [ ] `show-detail/OverviewTab` + `EpisodesTab` — Book slot / New episode · **Near**
- [ ] `FanTiersEditor` / `PurchaseTiersEditor` — New tier (`Plus`) · **Near**
- [ ] `ChannelStoreEditor` — Set price (`Tag`) · **Near**
- [ ] `ChannelAnnouncementsPanel` — Record / upload clip · **Near**
- [ ] `ChannelRotationEditor` — Add from playlist (`ListMusic`) · **Near**
- [ ] `StudioRadioSubmissionPanel` — Submit to radio (`Radio`)
- [ ] `StudioEditorListView` library empty → Upload track (`Upload`) · **Gap**

### Library
- [ ] `local-playlists/PlaylistView` — empty playlist → Add tracks (`ListPlus`) · **Gap**
- [ ] `AddToPlaylistDialog` — Create playlist (`ListPlus`) · **Near**
- [ ] `AddToReleasePanel` — Create release (`Plus`) · **Gap**
- [ ] `LibraryEmbedsView` — Import embed (`Link`) · **Gap**
- [ ] `ChannelPlaylistPicker` — New collection (`Plus`)
- [ ] `StashFilesPanel` / desktop library empties — Upload / Import (`Upload`) · **Near**

### Admin
- [ ] `AdminArtworkPresetsView` — Add artwork (`Plus`) · **Near**
- [ ] `InternetRadioPresetsPanel` — Add station (`Plus`) · **Near**
- [ ] `AdminAnnouncementsView` — Upload audio (`Upload`) · **Near**
- [ ] `AdminAddonsView` — Register add-on (`Plus`)
- [ ] `AdminRadioView` rotation empty → Add to Selects (`ListPlus`)
- [ ] Governance: Discussions topics, Agenda items, Elections, Board terms — Add… · **Near**
- [ ] `SelectsTab` — Add content (`Plus`) · **Near**

### Radio
- [ ] `RadioBookedShowsPanel` — Book a slot (`CalendarPlus`) when `onBook` exists
- [ ] `RadioBookingCalendar` — Book slot (`CalendarPlus`)
- [ ] `RadioBrowserDirectoryCard` / `MyRadioStations` — Add station (`Plus`) · **Near**
- [ ] `ChannelProgrammingGrid` — Book show (`CalendarPlus`)

### Listen / community / settings
- [ ] `FeatureRequestsView` — Propose idea / Post comment · **Near**
- [ ] `GovernanceView` — Submit draft (`ScrollText`) · **Near**
- [ ] `DiscussionTopicView` / `TrackBody` / `ChannelComments` — Reply / comment
- [ ] `NewsSourcesDialog` — Add feed (`Rss`) · **Near**
- [ ] `PinnedAnnouncementsPanel` — Pin announcement (`Send`) · **Near**
- [ ] `ListenAddonsPanel` / `DiscoWidgetManagerPanel` — Browse / install (`Puzzle`)
- [ ] `ChannelModeratorsPanel` — Add moderator (`UserPlus`) · **Near**
- [ ] `ApiTokensPanel` — New token (`KeyRound`) · **Near**
- [ ] `SocialPostNow` — Post now (`Send`) · **Near**
- [ ] `MySupportTickets` — New request (`LifeBuoy`)

## Priority B — weaker / optional

- [ ] `PressKitPreview` — Edit bio (`Pencil`) · **Near**
- [ ] `StudioRevenueView` empty disbursements → Connect Stripe
- [ ] `StudioEditorProjectView` — Open library (`FolderOpen`)
- [ ] `RadioView` member-sets empty → Create set (if product path exists)
- [ ] `admin/streams/ChannelTracksPanel` — nudge artist upload

## Done when

Storybook or unit coverage for the CTA pattern on at least one Studio empty;
ship slices in small PRs (Studio Near first, then Library Gaps, then Admin /
Radio / community). Update this checklist as each lands; fold into HISTORY
when the Priority A Near set is cleared.
