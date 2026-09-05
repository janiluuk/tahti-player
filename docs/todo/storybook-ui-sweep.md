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

- Remaining ViewShell migrations (History, Studio Releases/Schedule/Go Live, Admin list pages)
- Remaining icon-button Tooltip surfaces (Studio toolbars / Admin / PluginStore)
- More Studio EmptyState / FilterChips from `studio-storybook-sweep.md`

Keep StudioNav / Listen tabs / Admin tabs mounted.
