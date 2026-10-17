# Batch 72 — smooth desktop-app feel (20 slices)

**Status:** open

Make tahti-web feel closer to the desktop player: snappy navigation, lazy
chunks, purposeful motion, and less blank waiting. Honour
`prefers-reduced-motion`. Prefer existing `@tahti-player/ui` motion
(`RouteTransition`, sidebars) and CSS tokens — no new animation libraries.

| # | Slice | Size | PR |
| --- | --- | --- | --- |
| 1 | TanStack Router `defaultPreload: 'intent'` so sidebar/tab hover warms lazy routes | XS | this PR |
| 2 | Route loading bar: shorter delay + indeterminate shimmer (still after real pending) | S | this PR |
| 3 | Chrome hover/focus transitions on **all** themes (not only tahti-dark / tahti-blue) | XS | this PR |
| 4 | Lazy-mount `FullScreenPlayer` on first open (`useOpenedOnce`) | S | |
| 5 | Idle prefetch Studio + Library + Radio route modules after Listen is idle | S | |
| 6 | Soft enter fade for `ViewShell` page bodies (reduced-motion → instant) | S | |
| 7 | `content-visibility: auto` on Listen/Discover card grids offscreen | S | |
| 8 | `useDeferredValue` for GlobalSearch result list while typing | S | |
| 9 | Keep sidebar `aria-current` on the destination while the router is pending | S | |
| 10 | Restore main scroll position per pathname (sessionStorage, chrome scrollport) | S | |
| 11 | Press feedback (`active:scale`) on MediaArtwork / primary play controls | XS | |
| 12 | Stagger Studio home tile entrance (motion, once per visit) | S | |
| 13 | Mobile queue / nav drawers use spring exit that matches ActionSheet | S | |
| 14 | Pause `AmbientBackground` when `document.hidden` or reduced-motion | XS | |
| 15 | Lazy-route Suspense fallback: compact pulse skeleton instead of empty flash | S | |
| 16 | Prefetch Channel / Radio chunks on Listen card hover/focus (like hls prefetch) | S | |
| 17 | Theme switch: short cross-fade on ambient surfaces + chrome (all themes) | XS | |
| 18 | Player bar slides in when the queue first becomes non-empty | S | |
| 19 | Right-rail tab panel fade on switch (queue ↔ other rails if any) | XS | |
| 20 | Plan + INDEX + fold note for batch 71 leftovers still open; bump help if needed | XS | |

Also continue/ship open batch 71 PRs (#1054, #1055) separately — do not block this batch on them.
