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
- [ ] `collection-edit/TracklistPanel` — no tracks → Add tracks (`Plus`)
- [ ] `StudioPlaylistEditorView` — empty playlist/collection → Add tracks (`ListPlus`)
- [ ] `StudioReleaseDetailView` — no tracks / no audio → Add / Upload (`Plus`/`Upload`)
- [ ] `StemsPanel` — Request split (`Sparkles`)
- [ ] `show-detail/EpisodesTab` — New episode · **Near** (Overview's Book slot shipped)
- [ ] `StudioEditorProjectView` — no archive seed → Open library / new session (`FolderOpen`) · **Gap**

### Library
- [ ] `ChannelPlaylistPicker` — New collection (`Plus`)
- [ ] `StashFilesPanel` / desktop library empties — Upload / Import (`Upload`) · **Near**

### Admin
- [ ] `admin/moderation/tabs/ThemesTab` — empty catalog → Submit theme / registry docs (`Palette`) · optional

### Radio
- [ ] `RadioBookingCalendar` — Book slot (`CalendarPlus`)
- [ ] `RadioView` — `radio.memberSetsEmpty` → Create member set (`Plus`) if product path exists
- [ ] `ChannelProgrammingGrid` — Book show (`CalendarPlus`)

### Listen / community / settings
- [ ] `DiscussionTopicView` / `TrackBody` / `ChannelComments` — Reply / comment
- [ ] `ListenAddonsPanel` / `DiscoWidgetManagerPanel` — Browse / install (`Puzzle`)
- [ ] `ChannelModeratorsPanel` — Add moderator (`UserPlus`) · **Near**

## Priority B — weaker / optional

- [ ] `StudioRevenueView` — `studioRevenue.emptyDisbursements` → Connect Stripe (`CircleDollarSign`)
- [ ] `admin/streams/ChannelTracksPanel` — nudge artist upload (`Upload`)
- [ ] `AdminUsersView` — “No users yet” only if board gets an invite/create path (none today)

## Shipped

Events, listening parties, groups, fan and purchase tiers, API tokens,
admin artwork and internet radio presets, governance discussions, elections
and board terms (feat/slices-e-backlog). 2026-11-08 batch (#1884-#1888,
30 slices): tracklist pins, track / release-track / distribution credits,
mastering add-ons, smart-link tracks, multistream destinations, announcement
clips, schedule, broadcast agenda (create link follows the filter), radio
submissions, show slot booking, editor library upload; Library add to
playlist, desktop playlist (Browse tracks), desktop library and facet groups
(Import files), embeds (import add-ons), add to release (Create release);
admin add-ons, Selects, admin radio rotation (link to Selects), governance
agenda; Radio Book a slot, Settings radio stations; feature requests,
governance Top topics, news sources, support requests, press kit bio. Strings
in `web.emptyActions` (en + fi).

Read and skipped (create control is the list itself or sits directly above
the empty, or there is no create path): `ReleaseTracklistDialog` (public
listener dialog), `ChannelStoreEditor`, `ChannelRotationEditor`,
`ReleaseTrackVersionsPanel` (empty means no tracks), `AdminAnnouncementsView`,
`PinnedAnnouncementsPanel`, `SocialPostNow`. Where the create button sat right
next to the empty (API tokens, governance forms), it now lives only in the
empty state while the list is empty.

## Done when

Storybook or unit coverage for the CTA pattern on at least one Studio empty;
ship slices in small PRs (Studio Near first, then Library Gaps, then Admin /
Radio / community). Update this checklist as each lands; fold into HISTORY
when the Priority A Near set is cleared.
