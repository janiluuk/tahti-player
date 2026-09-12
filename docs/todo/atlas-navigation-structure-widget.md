# Atlas navigation structure widget

**Status:** partial

The Screen Atlas contains a persisted draft navigation-structure widget.
Users can drag or use move controls to reorder entries at any nesting level,
add label/path pairs as top-level items or as sub-items under any existing
item, expand/collapse branches, and remove entries (which also removes their
sub-items). This state is intentionally not connected to application
navigation yet.

## 2026-09-12: submenus added

`navigationStructureStore.ts`'s `NavigationStructureItem` gained an optional
`children?: NavigationStructureItem[]`, making it a tree instead of a flat
list. `addItem`/`removeItem`/`moveItem` now operate recursively at any depth
(`addItem` takes an optional `parentId` to add as a child instead of a root
item); persistence is unchanged (same `zustand/persist` key, tree serializes
as JSON same as the flat list did).

Seeded `DEFAULT_ITEMS` with the real app's current nested structure (mirrored
from `AppShell.tsx`'s sidebar top level and `StudioNav.tsx`'s
`SUBMENUS`/`AUDIENCE_SUBNAV_ITEMS`/`BROADCAST_SUBNAV_ITEMS`) so the widget
starts by showing the whole real tree — Studio's 9 submenu tabs, with
Audience and Go Live each further expanded into their own sub-tabs — not just
the top level.

`NavigationStructureWidget.tsx` renders the tree recursively: each row shows
an expand/collapse chevron when it has children, indented children below it,
an "add sub-item" button opening an inline label/path form scoped to that
node, and drag/up/down reordering scoped to siblings at that same level
(dragging or moving an item across nesting levels is out of scope — only
sibling-level reorder, matching the flat widget's existing behavior one
level down).

Verified: `pnpm --filter @tahti-player/tahti-web type-check` / `lint` clean;
`navigationStructureStore.test.ts` (3 tests, including a new nested
add/reorder/remove case) passes. No component test existed for the widget
before or after this pass. Not manually verified in a running browser.

## Remaining

- Product decision and implementation for applying the saved structure to
  real navigation (still out of scope — this pass only extended the draft
  widget itself to represent the whole tree, per explicit instruction: "make
  all the submenus working there as well, i wanna be able to see the whole
  tree").
