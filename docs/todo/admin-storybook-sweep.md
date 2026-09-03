# Admin Storybook primitive sweep

**Status:** planned (audit done, replacements not started).

Worklog: `packages/tahti-web/UI-REDESIGN-WORKLOG.md`
(2026-09-04 — Admin Storybook primitive sweep).

WORKPLAN: medium-priority Storybook backlog.

Storybook reference: `Tahti/Reference/Storybook-first backlog`.

Scope: `views/admin/*`, `views/admin/moderation/*`, `views/admin/orphanPages/*`,
and Admin-owned panels (`AdminUserEditPanel`, `AdminStreamManagerPanel`,
`ArtworkPresetUploadDialog`). Chrome stays mounted (`AdminNav` / section tabs).

Does **not** re-run the 2026-09-03 UX sweep (missing Button icons, Tooltip
help, StudioPanel clones, toast vs `<p>`). Those stay in
`STUDIO-ADMIN-UX-SWEEP.md`. Search-icon addons overlap
`docs/todo/input-storybook-sweep.md` — do those Inputs here when they live
on Admin surfaces.

## Storybook contract

Use existing `Components/*` and `Tahti/*` only. Do not invent
`SegmentedControl` or `Alert`/`Banner` in this pass (flag call sites).

- Exclusive label filters → `FilterChips` (single). Visual becomes rounded
  chips, not the bordered `p-1` segment strip.
- Search → `Input` `startAddon` `SearchIcon` (no overlay `pl-9`).
- On/off → `Toggle` (not Enable/Disable `Button`s).
- Empty / load-error copy → `PageEmpty` / `PageError` / `EmptyState`.
  Keep existing CTAs in `action`.
- KPI tiles → `StatChip` (grant money stays `StatNumber`).
- Status pills → `Badge` (already common in queues).
- Thumbs / preset art → `ImageReveal` when they are grid covers, not live
  replace-on-hover editors.
- Rankings already use `TopList`. Logs already use `LogViewer`.

Operational moderation tables stay dense tables. Do not force `TrackTable`
or `CardGrid` onto queues.

## Replace

### Filters → FilterChips

| Surface | Today |
| --- | --- |
| `AdminTopListsView` `FilterRow` | Month / Half year / All time; By type / By genre; Most / Least listened — bordered `p-1` segment, `aria-pressed` |

`AdminDiscoWidgetsView` already uses `FilterChips`. Storage “Group by user”
is a single toggle, not a chip set → `Toggle` (below).

### Search Inputs (Admin slice of Input sweep)

| Surface | Today |
| --- | --- |
| `AdminUsersView` | Overlay `SearchIcon` + `pl-9` |
| `AdminTopListsView` | Overlay `SearchIcon` + `pl-9` |
| `AdminStorageView` files tab | Overlay `SearchIcon` + `pl-9` |
| `SupportTab` | `endAddon` SearchIcon — move to `startAddon` |
| `SelectsTab` archive search | `endAddon` SearchIcon — move to `startAddon` |

Other Admin `Input`s (news title, i18n, financial, governance, venues,
reports, artwork names, beta notes) are labelled fields, not search — leave
unless they are still native.

### Toggle

| Surface | Today |
| --- | --- |
| `AdminRadioView` preset row | Enable / Disable for everyone `Button` |
| `AdminStorageView` files | “Group by user” pressed `Button` |

`AdminAnnouncementsView` and `AdminAgmView` already use `Toggle`.

### Empty / error → PageEmpty / PageError / EmptyState

Bare `<p>` empty or load-error copy (loading already uses `PageLoading`):

- Overview: `AdminStatusView`, `AdminStorageView` (×5), `AdminStorageUserView`,
  `AdminFinancialView`, `AdminLogsView` audit/container empty
- Community: `AdminUsersView`, `AdminGovernanceView` activity,
  `AdminReportsView`, `AdminGrantsView`, `AdminAgmView` (meetings / motions /
  documents), `AdminMissedShowsView`
- Content: `AdminNewsView`, `AdminRadioView` (×4), `AdminTopListsView`,
  `AdminContentView` (catalog + recordings), `AdminAnnouncementsView` clips
- Manage: `AdminVenuesView`, `AdminDiscoWidgetsView` type empty
- Moderation tabs: Support, Beta, Radio submissions, Content reports,
  Feature requests
- Orphan: `RadioStationSuggestionsTab`

### StatChip

`AdminGovernanceView` hand-rolled stat tiles (rounded `/35` cards) →
`StatChip`. Dashboard, Content, Storage used/free/total already comply.

### ImageReveal

`AdminArtworkPresetsView` grid `<img>` → `ImageReveal`. Leave
`RadioStationCover` (hover-replace editor, not a gallery thumb).

## Leave

- Moderation / Selects / Radio operational tables and row action stacks
- `AdminMapView` / `ScreenAtlas` (already a Storybook surface)
- Grant EUR amounts (`StatNumber` / formatted copy)
- Hidden file inputs (`FilePicker` / media-upload convention)
- `AdminLogsView` red warning box until a shared Alert/Banner exists
- `AdminGrantCycleView` `SectionShell` + `StudioPanel` mix — UX sweep
  decision, not a primitive swap
- Orphan `SelectsTab` not wired into Moderation (product; Selects lives at
  `/admin/tahti-selects`)

## Storybook coverage (this pass)

Added live `Default` stories for Admin sections that had none: Content,
Venues, Artwork presets, Annual reports, Tahti Selects, Orphan pages, Map.

Grant cycle (`/admin/grants/$year`) stays documented-only — the Storybook
memory router does not parse `$year`.

## Suggested execution order

1. `AdminTopListsView` FilterRow → `FilterChips` (same shape as Studio Stats)
2. Search `Input` `startAddon` on Users / Top lists / Storage / Support / Selects
3. Radio Enable + Storage group-by → `Toggle`
4. Empty/error copy → `PageEmpty` / `PageError` (highest count)
5. Governance KPIs → `StatChip`; Artwork presets → `ImageReveal`
