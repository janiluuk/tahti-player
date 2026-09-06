# Generic Storybook UI sweep (2026-09-04)

**Status:** partial

## Remaining

follow-ups continue

Swapped hand-rolled controls onto Storybook primitives without dropping
live data, overlays, routes, or actions.

## Done

1. ViewShell Listen/Discover + icon Tooltip UI primitives
2. Studio Upload Configure Enable/Disable → `Toggle`
3. Label-only segment strips → `FilterChips` (Admin Top lists, Radio schedule,
   Branding Append/Replace, Channel radio Shuffle/In order, Shows mode/hours)
4. Studio empty `<p>` → `EmptyState` (Sounds, Stash, Recordings, Venues, Shows,
   Stats empties)
5. Short Discover ViewShell subtitles
6. ViewShell Help, Radio, Studio Sounds, Collections, Admin Dashboard
7. Icon Tooltip listener leftovers + UI primitives (TopBar, TahtiJam, lightbox, …)

## Still open

- More Studio EmptyState / FilterChips from `studio-storybook-sweep.md`

**2026-09-06:** re-checked the other two "still open" lines against
current code — both are already done, just never folded back into this
file. `HistoryView`, `StudioReleasesView`, `StudioScheduleView`, and
`StudioGoLiveView` all already render `<ViewShell>` (grepped directly).
A grep sweep for icon buttons with a bare `title=` attribute instead of
a styled `Tooltip` across every Studio/Admin/PluginStore file turned up
zero real hits — every `title={...}` match left was a `StudioPanel`
heading prop, not a native HTML tooltip on an icon button. Removed both
stale lines.

Keep StudioNav / Listen tabs / Admin tabs mounted.
