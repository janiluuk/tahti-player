# Player performance profiling and optimizations

**Status:** partial
**Scheduling:** Later; profiling not started. 2026-09-26: code-only slices shipped for sections 2, 3, 4 and 6 (see HISTORY).
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

- [ ] Lazy-load remaining noninitial routes and substantial dialogs; inspect eager shared imports that defeat splitting. **2026-09-26 done for tahti-web (#178):** every route view except the landing ListenView is lazy; settings modal and channel setup dialog load on first open (`useOpenedOnce`); Listen Feed/History tabs and hls.js (first HLS stream) are split out; visualizer metadata comes from `plugins/visualizers/meta`; `@tahti-player/ui` test helpers moved to `@tahti-player/ui/test`. Still in the initial set: ~305 KiB gzip vendor chunk, ~175 KiB raw eager i18n locales (`packages/i18n/src/locales.ts`), right-rail stream-manager/chat. Follow-ups: lazy i18n locales, idle-prefetch hls.js (first HLS play waits for a ~185 KiB gzip chunk).
- [ ] Compare initial JS/CSS bytes, parse/evaluation CPU, cold/warm startup time and peak native memory against baseline. Track desktop startup separately from web transfer time. **2026-09-26 bytes only (#178):** initial JS (entry + TahtiApp + static imports) 4419.8 -> 1745.7 KiB raw, 1277.0 -> 517.1 KiB gzip; CSS unchanged (~219 / 34 KiB). Parse/eval CPU, startup time and native memory not measured.

## 3. Make queue work scale

- [ ] Virtualize QueuePanel rows while preserving drag reorder, keyboard access and scroll-to-current.
- [ ] Compare render/interaction time, mounted row count, CPU and native memory at each fixture size. Verify favorite updates, removal, reorder and current-item visibility. Known limit after #172: reorderable panels still re-render every row when the id list changes (dnd-kit `SortableContext`); only virtualization or a custom sortable fixes that.

## 4. Stabilize playback updates

- [ ] Verify metadata assignment counts, seek/progress behavior, OS controls, analytics and CPU during sustained playback. Metadata/position counts are covered by `AudioEngine.mediaSession.test.tsx` (#170); real lock-screen/media-key/scrubber behavior, analytics and CPU still unchecked. Noticed: the placeholder SVG cover is sent to MediaSession as `image/jpeg`.

## 5. Reduce visualizer work

- [ ] Keep renderer/scene lifetime independent of play/pause; update changing inputs without scene reconstruction. **2026-09-21 done in `ThreeVisualizer`:** play/pause and the analyser now flow through a ref, so the WebGL context is no longer rebuilt on them; frames are capped at 30 fps, skipped while the document is hidden, and the canvas is resized only when its size changes. Prompted by a report of slow scrolling/menus in the desktop app (software-rendered WebKit on NVIDIA plus the app-wide animated background). Not yet measured before/after.
- [ ] Move resize/projection work to actual size changes; suspend offscreen work while preserving intended visible idle animation.
- [ ] Compare frame-time, CPU and native/GPU memory where measurable; verify cleanup after repeated mount/unmount, preset changes and play/pause. Pick frame caps only after profiling.

## 6. Unblock primary listening content

- [ ] Publish channel/on-air content independently of slower widgets, shows and presets, with section-specific loading/error states. **2026-09-26 ChannelView done (#171):** `useChannelData` no longer uses `Promise.all`; the channel alone gates the page, and tracks, disco widgets and public shows each have `loading | ready | error` + retry. Still open: ListenView already fetches its sections independently but has no per-section loading/error states (empty looks like "nothing here"), and `fetchLatestTracks` there has no `.catch`.
- [ ] Cache/reuse reads and narrow invalidation on editing/look changes. 2026-09-26 partial (#171): channel look/link saves refetch only the channel + profile (2 requests instead of 5); wider read caching not done.
- [ ] Verify primary content remains usable with delayed/failed secondary endpoints; compare request counts and time to usable content. 2026-09-26 (#171): hook and view tests with delayed/failed secondaries (Play still works); first load 5 requests, no longer waiting on the slowest. Time to usable content not measured in a browser.

## Completion gate

- [ ] Repeat the same release-build scenarios after each focused optimization; record before/after measurements and investigate CPU or native-memory regressions.
- [ ] Confirm playback continuity, queue controls, persistent chrome, visualizer behavior and OS media controls; run relevant project checks and behavioral tests.
- [ ] Update the audit with measured results, remaining limitations and final priorities. No claimed CPU/native-memory improvement without device measurements.
- [ ] When all work is complete, fold results into HISTORY, remove this todo and its INDEX/WORKPLAN entries.
