# Mobile: full width, fewer controls, less crowded

**Status:** partial

Requested 2026-11-24. First pass shipped in tahti-web 0.0.473 (#2163): 16px phone gutters with shared `FULL_BLEED_*` margins, tighter `StudioPanel`, `ViewShell` actions wrap under the title, `useOnDemandSelection` (TrackTable and CatalogTable hide checkboxes on phones behind Select / Done), Studio Releases rows keep only edit + ⋯ on phones. Second pass in 0.0.474: `ViewShell` `classes.title` hides the repeated Listen/Library page title on phones (kept for screen readers), the Sounds type `SegmentedControl` is one swipeable row, and the Admin section tabs are one swipeable row with an edge fade. On phones the Listen Order/Add buttons now sit in the Listen/History tab row (0.0.481). Channel page margins were checked at 390px and left as they are; the Admin dashboard was checked with `VITE_MOCK_ADMIN=1`.

## Left

- [ ] Track lists inside cards on phones: dropping the card border broke the `ChannelView` dark-scheme contrast play (the count relies on the card background); needs a contrast-safe variant.
