# UI performance audit (sluggish, worst on non-accelerated Firefox)

**Status:** open

Requested 2026-11-24: the web UI feels sluggish, especially in Firefox without hardware acceleration.

## Plan

- [ ] Profile Listen, Discover, a channel page and Studio Tracks in Firefox with `layers.acceleration.disabled` / `gfx.webrender.software` and in Chromium with GPU off; record frame time while scrolling and hovering.
- [ ] Find expensive paint: `backdrop-filter` / large `blur`, fixed ambient backgrounds, box-shadow transitions, animated gradients, waveform canvases redrawn per tick.
- [ ] Find expensive JS: re-renders per player progress tick, store subscriptions, long tasks on route change.
- [ ] Propose fixes with measured before/after; consider a reduced-effects mode when GPU compositing is unavailable.
