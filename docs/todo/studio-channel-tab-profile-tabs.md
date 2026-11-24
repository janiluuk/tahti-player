# Studio: Channel as its own tab, Profile sub-items as smart tabs

**Status:** open

Queued 2026-11-24 (not started).

- In Studio, make Channel its own top-level tab with sub-tabs for every channel-related item that currently lives under Profile.
- Move the remaining Profile page sub-items into tabs. Combine tabs that would be mostly empty so no tab is a near-empty page.
- Keep the design consistent across the new tabs (same section layout, headings, spacing, `StudioPanel` use).
- Use active (primary) buttons only for the important action on a page; everything else is secondary or text.
- Polish for a professional look. Check desktop and phone widths, Storybook stories and tests, and update `docs/VIEW-CATALOG.md` and the navigation map for any moved route.
- Keep old routes working (redirects) so saved links and the in-app help links do not break.
