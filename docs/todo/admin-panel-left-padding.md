# Admin panel: content has big left padding, should start from the left edge

**Status:** open
Reported 2026-09-08, not investigated yet.

## Ask

Admin panel pages have a large left gap before their content starts —
other views (Studio, Library, etc.) start flush from the left edge.
Admin's content should match.

## Starting point

`.admin-page-layout` (`packages/tahti-web/src/styles.css:76-129`) is a
CSS grid with `grid-template-columns: 11rem minmax(0, 1fr)` at `≥640px`
— a fixed 11rem left column, presumably for the admin sidebar nav
rendered via `AdminPageLayout` (`components/AdminNav.tsx`, used by
`AdminDashboardView.tsx` and others: `<div className="admin-page-layout
px-1 py-2"><AdminPageLayout current="/admin">…`). Worth checking
whether that left column is actually occupied by a real nav on every
admin page, or whether some pages render into the second grid column
while leaving the first empty (which would look like exactly this "big
left gap" symptom) — compare against how `.studio-page-layout` (same
file) achieves flush-left content.
