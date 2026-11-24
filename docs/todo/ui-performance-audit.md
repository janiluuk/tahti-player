# UI performance audit (sluggish, worst on non-accelerated Firefox)

**Status:** partial

Requested 2026-11-24. First pass in tahti-web 0.0.475 (#2165), measured in Chromium with `--disable-gpu`, software compositing, SwiftShader WebGL and 4x CPU throttle:

| Issue | Before | After |
| ----- | ------ | ----- |
| Channel backdrop visualizer drew a page-tall WebGL canvas (1220x4147) | `/channel/yaniho` idle 12.3 fps | 60 fps (screen-sized fixed canvas) |
| Listen/Discover gateway aurora page-tall canvas | 10.9 / 13.1 fps | 60 / 60 fps |
| Background visualizers on software WebGL | full-window CPU redraw | still gradient (renderer name check, cached) |
| Endless hue-drift filter on visualizer canvases | channel scroll paint 2337 ms / 2.6 s | 157 ms |
| Section fade-ins left `filter: blur(0)` (fill-mode both) | Listen scroll paint 504 ms | 122 ms |
| Full-screen player blur over a plain background | 22.6 fps | 60 fps |
| Full-screen glow/water ambience without GPU | 10.4 / 30.5 fps | 60 / 60 fps (held still) |
| Queued rows pulsing forever | 500 ms style work / 5 s | 4 ms |
| Track table re-rendered every progress tick | 685 ms script / 5 s | 55 ms |

## Left

- [ ] Measure in Firefox with `layers.acceleration.disabled` / `gfx.webrender.software` (Playwright Firefox download timed out). The no-GPU check reads the WebGL renderer name, so it may not trigger when Firefox keeps hardware WebGL but paints in software.
- [ ] Event page banner backdrop (no mock event page to measure).
- [ ] Tooltip and reduced-motion hooks call `matchMedia` on every render; a shared cache broke a test that mocks `matchMedia`.
- [ ] Optional: a live frame-time monitor that switches to the still backdrop when frames drop, instead of the one-time startup check.
