# SaveButton + StatChip sweep

Status: first pass shipped (`0.0.57`). Studio Sound toolbar left icon-only.
Further StatChip KPI cards (admin dashboard, track insights, fan-sub money)
remain.

Storybook: `Components/SaveButton` (Idle, Saving, CustomLabel — add Disabled) and
`Components/StatChip` (Default, WithIcon, Row). Player reference for chips:
`packages/player/src/views/Artist/components/ArtistSocialHeader.tsx`.

`SaveButton` is for persisting an **existing** entity. Create / Publish / Connect /
wizard-finish / autosave status text stay as they are.

`StatChip` is a compact labeled count. `StatNumber` is a large accent figure — keep
it for hero money/chart totals (already noted in `docs/todo/HISTORY.md`).

## SaveButton — replace (persist existing)

| File | Current control | Proposed `label` |
| --- | --- | --- |
| `StreamOverlayEditor.tsx` | `Button` “Save overlay” / “Saving…” | Save overlay |
| `AdminFinancialView.tsx` | `Button` “Save entry” / “Saving…” | Save entry |
| `AdminDiscoWidgetsView.tsx` | `Button` “Save changes” when `editing` (keep “Register widget” as create) | Save changes |
| `RadioScheduleView.tsx` | `Button` “Save changes” / “Saving…” | Save changes |
| `BroadcastPreflightPanel.tsx` | `Button` + `SaveIcon` “Show info” / “Saving…” | Save show info |
| `StudioUpdatesView.tsx` | `Button` “Save draft” / “Saving…” | Save draft |
| `AdminRadioView.tsx` | `Button` “Save changes” when `editingId` (keep “Add station” as create) | Save changes |
| `AdminGovernanceView.tsx` | `Button` “Record resolution” / “Saving…” | Record resolution |
| `MulticastSection.tsx` | `Button` “Save changes” when `savedTarget` (keep “Add destination” as create) | Save changes |
| `PluginStorePanel.tsx` | `Button` “Save profile URL” | Save profile URL |
| `PluginStorePanel.tsx` | Dialog `Button` “Save” / “Saving…” (multicast dest) | Save destination |
| `PluginStorePanel.tsx` | Submit `Button` “Save station” | Save station |
| `StudioSoundView.tsx` | Icon-only `Button` + `SaveIcon` (“Save changes”) | Prefer labeled `SaveButton`; if the toolbar cannot take a label, flag and leave |

Uncommitted in tree (include only if that plugin is kept):
`plugins/discord-bot/DiscordBotAddonCard.tsx` — `Button` “Save” / “Saving…”.

## SaveButton — already using it

Settings identity/story/people/social; Channel designer; Channel view save-changes;
Channel radio playlist; Track edit dialog; Branding bio; Collection edit; Playlists
meta; Show detail (episode / defaults / public details); Venues; Schedule next
broadcast; Distribution catalog; Release detail / destinations; Pro Editor draft;
Admin user account; Admin news; Admin storage.

## SaveButton — do not swap

| File | Why |
| --- | --- |
| `SaveQueueAsPlaylistDialog.tsx` | Creates a new playlist |
| `ListenAddonsPanel.tsx` | “Add” (create); “Saving…” is that submit |
| `ResetPasswordView.tsx` | Auth submit, not entity save |
| `OnboardingView.tsx` | “Finish setup” wizard |
| `AdminAgmView.tsx` | “Saving…” status text beside a Select |
| `StudioEditorProjectView.tsx` | Autosave status text, no button |
| `SecurityTotpPanel.tsx` | “Save these backup codes” is copy, not a save control |
| `ChannelDesigner.tsx` | “Save preset” is a dialog title; persist control is already `SaveButton` |

## StatChip — replace (artist / labeled counts)

| File | What |
| --- | --- |
| `ArtistView.tsx` | Hero row: Followers, Following, Tracks, Releases, Collections (hand-rolled number + uppercase label) |
| `ChannelView.tsx` | Channel `stats` block: Followers count + label |
| `ChannelDesigner.tsx` | Live preview of that stats block, if it still paints a custom Followers pair |

## StatChip — other strong candidates

| File | What |
| --- | --- |
| `StudioHomeView.tsx` | `SummaryStat` cards: Plays today, Total plays, Total downloads, Followers (has a note + is a link — wrap/compose `StatChip` inside the link, keep the note) |
| `StudioStatsView.tsx` | Overview `keyMetrics` (Plays, Downloads, Smart-link clicks, Followers, Minutes listened/streamed) — today `StatNumber` + note in `StudioPanel`; chip row if the note can sit beside/under the chip |
| `StudioChannelView.tsx` | “Last 1/7/30 days” play/download cards |
| `StudioScheduleView.tsx` | Broadcast analytics play cards (same pattern) |
| `TrackInsightsPanel.tsx` | Plays / Downloads (`StatNumber` in bordered cells) |
| `FanSubscriptionStats.tsx` | `FanStat` cards: Active subscribers, This month, YTD, Pending |
| `AdminDashboardView.tsx` | KPI tiles: Active members, Live now, Beta queue, Open tickets |
| `AdminContentView.tsx` | KPI tiles: Tracks, Shows, Uploads, Listens |
| `StreamManagerPanel.tsx` | Local `StatCell` (listeners current/peak, time left, live for) — already chip-shaped |
| `AdminUserEditPanel.tsx` | Followers `<dl>` row — optional chip next to the other facts |
| `AdminStorageView.tsx` | Used / Free / Total storage numbers |

## StatChip — leave alone

| File | Why |
| --- | --- |
| `ArtistView.tsx` featured-track like/comment/repost | Interactive icon buttons, not a stat row |
| `TrackDetailView.tsx` comment/download/heart counts | Dense overlay metadata |
| `WidgetTrackRow.tsx` “N plays” | Inline row metadata |
| `CollectionView.tsx` `(subscriberCount)` | Parenthetical on a line |
| `StudioRevenueView.tsx` grant estimate € | Hero `StatNumber` |
| `StudioStatsDetailView.tsx` chart-header total plays | Hero `StatNumber` above a chart |
| `HistoryStatsSection.tsx` | Charts / TopList, not count chips |
| Player `ArtistSocialHeader` / `AlbumHeader` | Already `StatChip` |
