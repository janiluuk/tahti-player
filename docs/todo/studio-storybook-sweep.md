# Studio Storybook primitive sweep

**Status:** planned (audit done, replacements not started).

Worklog: `packages/tahti-web/UI-REDESIGN-WORKLOG.md`
(2026-09-04 — Studio Storybook primitive sweep).

WORKPLAN: medium-priority Storybook backlog.

Scope: `views/studio/*`, Studio chrome Library routes (`MyDiscographyView`,
`MyCollectionsView`, `Library*`, `ReleasesPanel`), and Studio-owned panels
(`ChannelRadioPlaylistPanel`, `BroadcastPreflightPanel`,
`BroadcastDetailsFields`, `FanTiersEditor`, `AudioRevisionList`,
`StudioRadioSubmissionPanel`, `RadioBookingCalendar`, `PortInventoryPanel`).

Does **not** re-run the 2026-09-03 UX sweep (missing Button icons, Tooltip
help, StudioPanel clones, toast vs `<p>`). Those stay in
`STUDIO-ADMIN-UX-SWEEP.md`. Search-icon addons overlap
`docs/todo/input-storybook-sweep.md` — do those Inputs here when they live
on Studio surfaces.

## Storybook contract

Use existing `Components/*` and `Tahti/*` only. Do not invent
`SegmentedControl` in this pass.

- Exclusive label filters → `FilterChips` (single). Visual becomes rounded
  chips, not the bordered `p-1` segment strip. Acceptable for range /
  type / sort. **Not** for icon-only view toggles.
- Multi day-of-week / perk lists (labels only) → `FilterChips` `multiple`.
- Icon+label chips (`StyleChip`, `TypeChip`, `PerkChip`, Live/Talk with
  icons) → **leave** unless dropping the icon is OK. FilterChips has no
  icon slot.
- Search → `Input` `startAddon` `SearchIcon` (see Input sweep).
- Dates → `Input type="date"` (already used next to leftover natives).
- On/off → `Toggle` (not Enable/Disable `Button`s with ToggleLeft/Right).
- Empty copy → `EmptyState` / `PageEmpty`. Keep existing CTAs in `action`.
- Thumbs → `ImageReveal` / `MediaArtwork` when they are grid/list covers.
- Status pills → `Badge`.
- Sliders: Pro Editor + Channel Designer already use `Slider`. No leftover
  `type="range"` in Studio views.

`CalendarHeatmap` / `DayOfWeekChart` / `ListeningClock` are listening-
history shapes. Studio daily **plays bars** are not a swap.

## Replace

### Filters / chips → FilterChips (labels only)

| Surface | Today |
| --- | --- |
| `StudioStatsView` header | 7d / 30d / All bordered segment |
| `StudioStatsDetailView` header | same strip (duplicate) |
| `StudioStatsView` top-list | dimension + sort segments |
| `StudioBrandingView` | Append / Replace |
| `ChannelRadioPlaylistPanel` | Shuffle / In order |
| `BroadcastPreflightPanel` | show type + visibility |
| `StudioShowsView` | SERIES/SINGLE + 1h/2h |
| `StudioEditorListView` | library type chips |
| `StudioScheduleView` frequency days | multi day buttons |

### Search + date (Studio slice of Input sweep)

| Surface | Today |
| --- | --- |
| `StudioSoundsView` | Search with no addon; “Uploaded to” native date |
| `StudioCollectionsView` | Search with no addon |
| `StudioCollectionEditView` | list search no addon (dialog already has endAddon) |
| `StudioEditorListView` | Search library |
| `StudioReleaseDetailView` | Search + orphan Search/Filter icons beside field |
| `MyDiscographyView` / `MyCollectionsView` / `ReleasesPanel` | Search, no addon |

### Toggle

`StudioUploadView` Configure dialog Enable/Disable `Button` with
`ToggleLeftIcon` / `ToggleRightIcon` → `Toggle`.

### EmptyState

Plain “No … yet” / empty CTAs: Sounds archive, Releases, Shows, Stash
tracks, Recordings, Venues, Events, Home broadcasts, Moderation,
Updates posts/drafts, Revenue fan-subs, Distribution credits/reports,
FanTiersEditor, AudioRevisionList, RadioSubmissionPanel,
RadioBookingCalendar empty slots, Schedule empty.

### ImageReveal / MediaArtwork / Badge

| Surface | Today |
| --- | --- |
| `MyCollectionsView` | raw `<img>` covers (Studio collections already ImageReveal) |
| `ReleasesPanel` | raw `<img>` |
| `StudioUpdatesView` | post image `<img>` |
| `PortInventoryPanel` | hand-rolled StatusBadge → `Badge` |

## Leave alone

- **Pro Editor** Sliders + mode FilterChips; slope chips keep `FilterCurve`.
- **Channel Designer** already Slider / FilePicker / SaveButton /
  DropdownButton; swatches and visualizer cards stay custom.
- **Mastering** FilePicker already; SlidersHorizontalIcon is the Match
  button, not a Slider.
- **Stats plays bars**, **ListenerWorldMap**, **RadioBookingCalendar**
  month grid — no matching Storybook viz.
- **Track rows** with pin/embed/edit/download (Sounds, stash, release
  tracks) — not a `TrackTable` / `PlayableTrackTable` swap.
- **Collection edit** in-panel seek — not Slider.
- **Distribution** catalog method tiles (icon + description, multi).
- **Schedule** cards/list icon toggle.
- **Sound** “Add to rotation” `aria-pressed` (action, not filter).
- Icon chip families until FilterChips grows an icon slot or we accept
  label-only: `StyleChip`, `TypeChip`, `PerkChip`,
  `BroadcastDetailsFields` Live/Talk, ShowDetail upload/broadcast with
  icons, `MyCollectionsView` type filters with icons.
- Bordered segment chrome if product must keep it — that needs a new
  `SegmentedControl`, out of this pass.

## Suggested slices

1. Stats + StatsDetail range (and top-list dim/sort) → FilterChips.
2. Remaining label-only chip groups (shows, branding append/replace,
   playlist shuffle, preflight, editor library type, schedule days).
3. Studio search Inputs + Sounds “Uploaded to” date (Input sweep).
4. Upload configure → Toggle.
5. EmptyState pass on the list above.
6. Covers: MyCollections, ReleasesPanel, Updates; PortInventory Badge.

Keep Studio nav / section tabs mounted on every chrome view.
