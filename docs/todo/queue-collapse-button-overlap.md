# The collapse-panel button covers the first queue item

**Status:** open

User ask (2026-10-04): the collapse panel button sits over the queue item and cuts out its top corner. Fix it.

## Notes

- The button is the sidebar toggle in `packages/ui/src/components/PlayerWorkspace/PlayerWorkspaceSidebar.tsx` (`aria-label` "Collapse panel" / "Expand panel"), positioned over the panel's top corner.
- The right rail renders the queue through `RightRailPanel` with `RightRailHeaderActions` in `packages/tahti-web/src/components/AppShell.tsx`.
- The same toggle is used by the left sidebar and by the desktop player, so a fix belongs in the shared component.

## Plan

- [ ] 1. Reproduce with a queue of several items in the mock app, expanded and collapsed, and capture it.
- [ ] 2. Give the toggle its own space in the panel header (or pad the scroll area under it) so it never overlaps content. Check the left sidebar and the collapsed rail too.
- [ ] 3. Update the `PlayerWorkspace` story and snapshots.
