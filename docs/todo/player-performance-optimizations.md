# Player performance profiling and optimizations

**Status:** open
**Scheduling:** Later; deferred work, not started.
**Source:** [Performance audit](../PERFORMANCE-AUDIT.md), 2026-09-10.

Scope: active Tauri desktop player, which mounts the shared tahti-web frontend, plus its native process tree. Reconfirm the entry point before implementation. The audit measured bundle size and inspected code; CPU and native memory still require profiling.

## 1. Establish a reproducible baseline first

- [ ] Profile a production/release Tauri build on the target desktop. Record commit, build flags, OS/WebView version, hardware, display scaling, fixture sizes, stream type and tools. Keep development/StrictMode overhead separate.
- [ ] Capture cold and warm startup to usable controls and first audio; run at least three comparable repetitions and report median and range. Distinguish local assets, network waits and audio buffering.
- [ ] Capture CPU samples/flamegraphs for the Rust host and WebView processes, with a frontend performance trace for JS/render/layout attribution. On Linux use available native sampling tools such as perf and per-process CPU sampling; document any unavailable tooling.
- [ ] Measure native memory across the full process tree: Rust host, WebView renderer, network and GPU/helper processes where exposed. Record baseline, steady state, peak and post-cleanup RSS/PSS (Linux smaps_rollup or equivalent). Prefer PSS for aggregate accounting; do not sum RSS and call it unique memory. Measure JS heap separately; it is not a substitute for native memory.
- [ ] Exercise idle, ordinary track playback, HLS/radio playback, 100/1,000/10,000-item queues (open and closed), queue scrolling/reorder, visualizer enabled/disabled, pause/resume, offscreen/minimized views, and route transitions.
- [ ] Run a 30-minute playback soak and repeated track switches, visualizer toggles, and route entry/exit. Chart CPU and memory over time; distinguish bounded caches/buffers from retained growth. Investigate growth with native allocation profiling where supported; do not infer a leak from RSS alone.
- [ ] Save reproducible commands, fixtures, traces and a results table in a durable location linked from the audit. Set explicit CPU, startup, interaction and memory budgets from the baseline before changing code.

## 2. Reduce startup work

- [ ] Lazy-load remaining noninitial routes and substantial dialogs; inspect eager shared imports that defeat splitting.
- [ ] Compare initial JS/CSS bytes, parse/evaluation CPU, cold/warm startup time and peak native memory against baseline. Track desktop startup separately from web transfer time.

## 3. Make queue work scale

- [ ] Virtualize QueuePanel rows while preserving drag reorder, keyboard access and scroll-to-current.
- [ ] Replace per-row queue.find/favorite scans with stable indexed lookups; stabilize row props and isolate playback progress rerenders.
- [ ] Compare render/interaction time, mounted row count, CPU and native memory at each fixture size. Verify favorite updates, removal, reorder and current-item visibility.

## 4. Stabilize playback updates

- [ ] Memoize/select the current item and playable metadata; update MediaSession metadata only when its fields change.
- [ ] Separate elapsed-time/analytics updates from metadata work; retain the existing progress throttle.
- [ ] Verify metadata assignment counts, seek/progress behavior, OS controls, analytics and CPU during sustained playback.

## 5. Reduce visualizer work

- [ ] Keep renderer/scene lifetime independent of play/pause; update changing inputs without scene reconstruction.
- [ ] Move resize/projection work to actual size changes; suspend offscreen work while preserving intended visible idle animation.
- [ ] Compare frame-time, CPU and native/GPU memory where measurable; verify cleanup after repeated mount/unmount, preset changes and play/pause. Pick frame caps only after profiling.

## 6. Unblock primary listening content

- [ ] Publish channel/on-air content independently of slower widgets, shows and presets, with section-specific loading/error states.
- [ ] Cache/reuse reads and narrow invalidation on editing/look changes.
- [ ] Verify primary content remains usable with delayed/failed secondary endpoints; compare request counts and time to usable content.

## Completion gate

- [ ] Repeat the same release-build scenarios after each focused optimization; record before/after measurements and investigate CPU or native-memory regressions.
- [ ] Confirm playback continuity, queue controls, persistent chrome, visualizer behavior and OS media controls; run relevant project checks and behavioral tests.
- [ ] Update the audit with measured results, remaining limitations and final priorities. No claimed CPU/native-memory improvement without device measurements.
- [ ] When all work is complete, fold results into HISTORY, remove this todo and its INDEX/WORKPLAN entries.
