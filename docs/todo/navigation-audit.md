# Navigation audit

**Status:** open

User-requested audit of tahti-web's navigation structure (not started —
this file is the placeholder to scope and pick up the work).

## Scope

- Every page should have a clear parent to go back to (breadcrumb / back
  link / parent nav item) — audit for dead ends.
- Scan for duplicate pages or out-of-context sections that should be
  merged or moved (cross-check against `docs/VIEW-CATALOG.md`).
- Every page should resolve to one active leaf tab **and** its parent
  section/tab both showing selected — audit current active-state logic
  (`lib/navigationActive.ts`, `InPageNav`, sidebar/StudioNav selection)
  for pages where only one level highlights.
- Content should render into a single stable content region across tab
  switches — no layout jump/reflow when switching tabs; only the content
  pane should re-render, not chrome/nav.
- Add subtle transition animations on navigation for a smoother feel
  (tab switches, route changes) — check `RouteTransition` in
  `@tahti-player/ui` as the likely existing hook point before adding a
  new mechanism.

## Notes

Not yet investigated — no findings recorded. Next step is a read-only
pass over routes (`src/router.tsx`), `AppShell`, `InPageNav` usages, and
`docs/VIEW-CATALOG.md` to build an actual punch list before changing
code.
