# Front page: calm loading, no layout jumps

**Status:** open

Requested 2026-11-24: on load, things on Listen (`/`) wiggle around; the loading should feel smooth with no hectic movement.

## Plan

- [ ] Record the load on a cold cache (Playwright trace / CLS via `PerformanceObserver('layout-shift')`) at desktop and phone width; list which blocks shift and why (late widgets, banners, skeleton height mismatch, fonts, images without size).
- [ ] Reserve space: skeletons with the final height per section, fixed artwork aspect ratios, banners that do not push content after first paint.
- [ ] One calm reveal instead of per-section pops (no staggered slide-ins on first load; respect reduced motion).
- [ ] Measure CLS before/after; target < 0.05.
