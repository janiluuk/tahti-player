# Mobile: full width, fewer controls, less crowded

**Status:** partial

Requested 2026-11-24. First pass shipped in tahti-web 0.0.473 (#2163): 16px phone gutters with shared `FULL_BLEED_*` margins, tighter `StudioPanel`, `ViewShell` actions wrap under the title, `useOnDemandSelection` (TrackTable and CatalogTable hide checkboxes on phones behind Select / Done), Studio Releases rows keep only edit + ⋯ on phones.

## Left

- [ ] Duplicate headings on phones: Listen tab + "Listen" title, Favorites tab + "Favorites" title.
- [ ] Studio Sounds type-filter buttons wrap onto two rows on phones.
- [ ] Channel page block margins on phones.
- [ ] Track lists inside cards on phones: dropping the card border broke the `ChannelView` dark-scheme contrast play (the count relies on the card background); needs a contrast-safe variant.
- [ ] Check the Admin dashboard at phone width (mock board gate blocked the screenshot run).
