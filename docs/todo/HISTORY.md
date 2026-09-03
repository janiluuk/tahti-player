# docs/todo history

Completed task notes folded here so `docs/todo/` stays current.

## 2026-09-04 — Listen / Discover CardGrid

Shared `DirectoryArtistCardGrid` on Listen + Discover Artists. WidgetCard /
embeds stay non-CardGrid. Folded from `cardgrid-listen-discover.md`.

## 2026-09-04 — TopList on all top lists

Admin Top lists, Studio Stats rankings/tracks/countries, and Library
overview use Storybook `TopList`. History already compliant. Discover
widgets stay `WidgetTrackRow`. Folded from `toplist-storybook-sweep.md`.

## 2026-09-04 — Help keyboard navigation

Help hub quick start → `/help/keyboard-shortcuts` with Storybook
`KeyCombo`. Settings remapping still deferred. Folded from
`help-keyboard-navigation.md`.

## 2026-09-04 — TrackContextMenu first pass

`PlayableTrackContextMenu` Header + playlist With Submenu + Audio tools;
`StudioSoundRowMenu` on Studio Sounds. Queue/history/feed custom menus
and Sound detail Quick edits still open. Folded from
`track-context-menu-sweep.md`.

## 2026-09-04 — Settings themes compact

Themes use `ThemeController` + `Toggle` for Dynamic; compact
`ThemeStoreItem`; configure controls receive `themeId`. Folded from
`settings-themes-compact.md`.

## 2026-09-04 — Remove About from Settings footer

About link removed from Settings modal footer. `/about` and Help About remain.
Folded from `settings-remove-about.md`.

## 2026-09-04 — SaveButton + StatChip sweep (0.0.57)

Persist-edit controls use Storybook `SaveButton` (custom labels, Saving/Disabled). Create/publish stay `Button`. Studio Sound toolbar left icon-only. Disabled story added.

`StatChip` now covers artist/channel followers, Studio home/stats/channel/schedule counts, track insights, fan-sub summary, admin dashboard/content KPIs, stream manager cells, admin user followers, and storage used/free/total. Chart-header totals and grant money stay `StatNumber`.

## 2026-09-03 — Playerbar/sidebar queue, revision picker, NewsWidget

Playerbar queue uses `QueueItem` (current expanded, others collapsed) plus
a count `Badge` and shared clear confirm. Sidebar Queue tab wires
`QueuePanel` with reorder, title→track, like, save-as-playlist, and
one-shot shuffle. `QueueItemPopover` is stream candidates, not archive
revisions — `AudioRevisionList` stays. `NewsWidget` is Storybook-only until
a news endpoint exists.

## 2026-09-03 — Storybook history/stats audit

Shared HistoryCharts primitives already match production. Added in-context
`HistoryStatsSection` and `HistoryListSection` stories. `StatChip` vs
`StatNumber` are different jobs (not a swap). `TrackTable` unused in
tahti-web at audit time.

## 2026-09-03 — CopyButton / ImageReveal / FilterChips audit

CopyButton gained 10s feedback and optional toast; truncated copy fields
made scrollable. Discover widget images use `ImageReveal`. FilterChips
already correct on Listen/Discover listings. Remaining grid-shaped `<img>`
candidates: `MyDiscographyView`, `LibraryMediaView`, `LibrarySmartLinksView`,
`StudioCollectionsView`.

## 2026-09-03 — CardsRow / Combobox audit

No safe CardsRow swap in tahti-web (per-item overlay controls would drop).
Added `TahtiRadioRow` story. Genre multi-select already `FilterChips` +
`CreatableCombobox`.

## 2026-09-03 — LogViewer / crowded artwork / DropdownButton

LogViewer: date-range popover, entry modal, Recent audit tab on LogViewer.
MediaArtwork hides queue/favorite overlays at sm/thumb/md. New
`DropdownButton`; Channel Designer More menu (Save preset / Reset).

## 2026-09-03 — Storybook-first ten slices (0.0.51)

# Storybook-first UI — ten slices (0.0.51)

Keep live data/features. Swap only Storybook primitives. Flag missing
states and orphans on stories.

## Instructions (this pass)

- Root `AGENTS.md` Storybook-first UI
- `packages/tahti-web/AGENTS.md` design-system order
- `.agents/skills/creating-components/SKILL.md`
- `.cursor/rules/storybook-first-ui.mdc`

## Slices

1. ChannelView editing Play/Favorite mock pills → `Badge`
2. Collection edit slideshow count → `Badge`
3. Player bar queue count → `Badge`
4. ImageLightbox photo → `ImageReveal`
5. Library media thumbs → `ImageReveal`; type overlay → `Badge`
6. Discography thumbs → `ImageReveal`
7. Smart links thumbs → `ImageReveal`; empty → `EmptyState`
8. Studio collections thumbs → `ImageReveal`; empty/filter miss → `EmptyState`
9. Global search thumbs → `ImageReveal`; searching → `Loader`; no results → `EmptyState`
10. Storybook: CardsRow orphan-in-tahti-web flag; Combobox missing states; ImageLightbox empty flagged

## 2026-09-04 — Add-on store header + ThemeStoreItem

# Add-on store header + UX sweep

## Goal

1. Remove always-visible category header subtext in Settings → Add-ons.
2. Keep the info (i) control on every category — it reveals the same
   description in a `Box` note.
3. Sweep add-on listings/config panels toward Storybook / `@tahti-player/ui`
   primitives (`PluginStoreItem`, `ThemeStoreItem`, `Box`, `EmptyState`,
   `Toggle`, `Tabs`, `PluginItem`, `Input`, …).

## Verify (category info icons) — done

All categories render through `CategoryBody` in `PluginStorePanel.tsx`, which
mounts an `About {label}` info button + expandable note for every
`PLUGIN_CATEGORIES` entry (themes, visualizers, export, import, multicast,
fingerprinting, audio-plugins, radio, listen, discovery, channel).

Top-level Add-ons section in `SettingsPanels` also uses an info button for
`SETTINGS_NAV` description (no always-visible subtext).

Discover page widgets subsection uses the same info pattern.

## Changes

- [x] Drop always-visible `{category.description}` beside the info button.
- [x] Hide Settings-level Add-ons description behind info.
- [x] Themes category uses `ThemeStoreItem` (apply / active / remove custom).
- [x] `ThemeStoreItem` only shows apply/uninstall when those callbacks exist.
- [x] Empty gates → `EmptyState`; visualizer/radio shells → `Box`; audio rows
      → `PluginItem` + `Toggle`; Installed/Available empties → `EmptyState`.
- [x] Disco widget installs → `PluginItem`; search → Nuclear `Input`; empties
      → `EmptyState`.
