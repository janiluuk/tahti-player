# The collapse-panel button covers the first queue item

**Status:** partial

User ask (2026-10-04): the collapse panel button sits over the queue item and cuts out its top corner. Fix it.

## Notes

- The button is the sidebar toggle in `packages/ui/src/components/PlayerWorkspace/PlayerWorkspaceSidebar.tsx` (`aria-label` "Collapse panel" / "Expand panel"), positioned over the panel's top corner.
- The right rail renders the queue through `RightRailPanel` with `RightRailHeaderActions` in `packages/tahti-web/src/components/AppShell.tsx`.
- The same toggle is used by the left sidebar and by the desktop player, so a fix belongs in the shared component.

## Plan

- [ ] 1. Reproduce with a queue of several items in the mock app, expanded and collapsed, and capture it.
- [x] 2. Give the toggle its own space in the panel header (or pad the scroll area under it) so it never overlaps content. Check the left sidebar and the collapsed rail too.
- [x] 3. Update the `PlayerWorkspace` story and snapshots.

## Landed (layout)

- Shared `PlayerWorkspaceSidebar`: header row is `shrink-0` with `mb-3` when expanded; content flex child gets `min-h-0` + `pt-1` so the toggle row cannot sit on queue/nav items (left and right).
- Still **partial** until visually verified on a queue with several items (hard to reproduce on web alone — see Tried).

## Tried (2026-10-05)

- Mock web app with three queued tracks at 768, 900, 1024, 1100, 1280, 1400 and 1920 px, right rail expanded and collapsed: the toggle's box never intersects a queue item. Below 768 px there is no rail.
- Needed from the user: a screenshot, or which surface it happens on (the desktop player uses the same sidebar with a different queue panel).

