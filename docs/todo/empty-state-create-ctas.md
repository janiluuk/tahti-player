# Empty states: create CTA (icon + title)

**Status:** open

Inventory source: tahti-web `PageEmpty` scan (2026-11-05) — ~243 empties
without `action`; this file is the shippable subset where the user can
create/add. INDEX: [`INDEX.md`](INDEX.md) → this row.

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
- [ ] `ReleaseTracklistDialog` — `empties.noTracklist` → Add pin / open editor (`ListPlus`)
- [ ] `TrackCreditsEditor` — no credits → Add credit (`Plus`) · **Near**
- [ ] `ReleaseTrackCreditsPanel` — `studioReleaseDetail.creditsEmpty` → Add credit (`Plus`)
- [ ] `collection-edit/TracklistPanel` — no tracks → Add tracks (`Plus`)
- [ ] `StudioPlaylistEditorView` — empty playlist/collection → Add tracks (`ListPlus`)
- [ ] `StudioReleaseDetailView` — no tracks / no audio → Add / Upload (`Plus`/`Upload`)
- [ ] `ReleaseSmartLinksPanel` — no tracks → Add from library (`Plus`) · **Near**
- [ ] `ReleaseTrackCreditsPanel` / `distribution/CreditsEditor` — Add credit · **Near**
- [ ] `ReleaseTrackVersionsPanel` — Upload version (`Upload`)
- [ ] `MasteringPanel` — Add effect (`Plus`) · **Near**
- [ ] `StemsPanel` — Request split (`Sparkles`)
- [ ] `StudioBroadcastView` — Nothing coming up → Schedule (`CalendarPlus`)
- [ ] `schedule/ScheduledTimes` — Add schedule (`CalendarPlus`)
- [ ] `show-detail/OverviewTab` + `EpisodesTab` — Book slot / New episode · **Near**
- [ ] `ChannelStoreEditor` — Set price (`Tag`) · **Near**
- [ ] `ChannelAnnouncementsPanel` — Record / upload clip · **Near**
- [ ] `ChannelRotationEditor` — Add from playlist (`ListMusic`) · **Near**
- [ ] `StudioRadioSubmissionPanel` — Submit to radio (`Radio`)
- [ ] `StudioEditorListView` library empty → Upload track (`Upload`) · **Gap**
- [ ] `go-live/MultistreamPanel` — no destinations → Add destination (`Plus`) · **Near** (panel header)
- [ ] `StudioEditorProjectView` — no archive seed → Open library / new session (`FolderOpen`) · **Gap**

### Library
- [ ] `local-playlists/PlaylistView` — empty playlist → Add tracks (`ListPlus`) · **Gap**
- [ ] `AddToPlaylistDialog` — Create playlist (`ListPlus`) · **Near**
- [ ] `AddToReleasePanel` — Create release (`Plus`) · **Gap**
- [ ] `LibraryEmbedsView` — Import embed (`Link`) · **Gap**
- [ ] `ChannelPlaylistPicker` — New collection (`Plus`)
- [ ] `StashFilesPanel` / desktop library empties — Upload / Import (`Upload`) · **Near**
- [ ] `desktop-library/DesktopLibraryContent` — empty facet groups → Import files (`Upload`) · **Near** (toolbar)

### Admin
- [ ] `AdminAnnouncementsView` — Upload audio (`Upload`) · **Near**
- [ ] `AdminAddonsView` — Register add-on (`Plus`)
- [ ] `AdminRadioView` rotation empty → Add to Selects (`ListPlus`)
- [ ] `governance/tabs/AgendaItemsPanel` — Add agenda item (`Plus`) · **Near**
- [ ] `SelectsTab` — Add content (`Plus`) · **Near** (title already mentions +)
- [ ] `admin/moderation/tabs/ThemesTab` — empty catalog → Submit theme / registry docs (`Palette`) · optional

### Radio
- [ ] `RadioBookedShowsPanel` — Book a slot (`CalendarPlus`) when `onBook` exists
- [ ] `RadioBookingCalendar` — Book slot (`CalendarPlus`)
- [ ] `RadioBrowserDirectoryCard` / `MyRadioStations` — Add station (`Plus`) · **Near**
- [ ] `RadioView` — `radio.memberSetsEmpty` → Create member set (`Plus`) if product path exists
- [ ] `ChannelProgrammingGrid` — Book show (`CalendarPlus`)

### Listen / community / settings
- [ ] `FeatureRequestsView` — Propose idea / Post comment · **Near**
- [ ] `GovernanceView` — Submit draft (`ScrollText`) · **Near**
- [ ] `DiscussionTopicView` / `TrackBody` / `ChannelComments` — Reply / comment
- [ ] `NewsSourcesDialog` — Add feed (`Rss`) · **Near**
- [ ] `PinnedAnnouncementsPanel` — Pin announcement (`Send`) · **Near**
- [ ] `ListenAddonsPanel` / `DiscoWidgetManagerPanel` — Browse / install (`Puzzle`)
- [ ] `ChannelModeratorsPanel` — Add moderator (`UserPlus`) · **Near**
- [ ] `SocialPostNow` — Post now (`Send`) · **Near**
- [ ] `MySupportTickets` — New request (`LifeBuoy`)

## Priority B — weaker / optional

- [ ] `PressKitPreview` — Edit bio (`Pencil`) · **Near**
- [ ] `StudioRevenueView` — `studioRevenue.emptyDisbursements` → Connect Stripe (`CircleDollarSign`)
- [ ] `admin/streams/ChannelTracksPanel` — nudge artist upload (`Upload`)
- [ ] `AdminUsersView` — “No users yet” only if board gets an invite/create path (none today)

## Shipped

Events, listening parties, groups, fan and purchase tiers, API tokens,
admin artwork and internet radio presets, governance discussions, elections
and board terms (feat/slices-e-backlog). Where the create button sat right
next to the empty (API tokens, governance forms), it now lives only in the
empty state while the list is empty.

## Done when

Storybook or unit coverage for the CTA pattern on at least one Studio empty;
ship slices in small PRs (Studio Near first, then Library Gaps, then Admin /
Radio / community). Update this checklist as each lands; fold into HISTORY
when the Priority A Near set is cleared.
