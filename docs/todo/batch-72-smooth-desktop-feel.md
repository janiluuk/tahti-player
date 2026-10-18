# Batch 72 — smooth desktop-app feel (20 slices)

**Status:** open

Make tahti-web feel closer to the desktop player: snappy navigation, lazy
chunks, purposeful motion, and less blank waiting. Honour
`prefers-reduced-motion`. Prefer existing `@tahti-player/ui` motion
(`RouteTransition`, sidebars) and CSS tokens — no new animation libraries.

| # | Slice | Size | PR |
| --- | --- | --- | --- |
| 1 | TanStack Router `defaultPreload: 'intent'` so sidebar/tab hover warms lazy routes | XS | #1056 |
| 2 | Route loading bar: shorter delay + indeterminate shimmer (still after real pending) | S | #1056 |
| 3 | Chrome hover/focus transitions on **all** themes (not only tahti-dark / tahti-blue) | XS | #1056 |
| 4 | Lazy-mount `FullScreenPlayer` on first open (`useOpenedOnce`) | S | #1057 |
| 5 | Idle prefetch Studio + Library + Radio route modules after Listen is idle | S | #1063 |
| 6 | Soft enter fade for `ViewShell` page bodies (reduced-motion → instant) | S | #1064 |
| 7 | `content-visibility: auto` on Listen/Discover card grids offscreen | S | #1092 |
| 8 | `useDeferredValue` for GlobalSearch result list while typing | S | #1086 |
| 9 | Keep sidebar `aria-current` on the destination while the router is pending | S | #1087 |
| 10 | Restore main scroll position per pathname (sessionStorage, chrome scrollport) | S | #1065 |
| 11 | Press feedback (`active:scale`) on MediaArtwork / primary play controls | XS | #1069 |
| 12 | Stagger Studio home tile entrance (motion, once per visit) | S | #1088 |
| 13 | Mobile queue / nav drawers use spring exit that matches ActionSheet | S | #1089 |
| 14 | Pause `AmbientBackground` when `document.hidden` or reduced-motion | XS | #1070 |
| 15 | Lazy-route Suspense fallback: compact pulse skeleton instead of empty flash | S | #1090 |
| 16 | Prefetch Channel / Radio chunks on Listen card hover/focus (like hls prefetch) | S | #1091 |
| 17 | Theme switch: short cross-fade on ambient surfaces + chrome (all themes) | XS | #1066 |
| 18 | Player bar slides in when the queue first becomes non-empty | S | #1067 |
| 19 | Right-rail tab panel fade on switch (queue ↔ other rails if any) | XS | #1068 |
| 20 | Plan + INDEX + fold note for batch 71 leftovers still open; bump help if needed | XS | #1056 |

Fold into HISTORY after the open PRs (#1086–#1092) merge.
