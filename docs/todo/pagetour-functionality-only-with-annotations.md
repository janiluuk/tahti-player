# Page tour: functionality-only on inner pages, menus only on front page, always annotate page purpose

**Status:** open
(Later) — reported 2026-09-08, not investigated yet.

## Ask

1. On any page other than the front/home page, the page tour (`H` key,
   `lib/pageTour.ts`) should only step through that page's own
   functionality — not the sidebar/nav menus or other chrome shared
   across pages.
2. The sidebar/nav and other shared UI elements should only appear as
   tour steps on the front page's tour.
3. Every page's tour should always include an annotation step
   explaining what the page is for (not just what its controls do).

## Starting point

`packages/tahti-web/src/lib/pageTour.ts` (`getPageTourSteps`) is the
single source for tour steps across pathnames — worth checking whether
nav-chrome steps (`nav-*`, `STUDIO_NAV_TOUR_STEPS`, etc.) are already
cleanly separable from page-specific steps, or whether they're
interleaved per-route today. `pageTour.test.ts` has the existing
coverage shape to extend.
