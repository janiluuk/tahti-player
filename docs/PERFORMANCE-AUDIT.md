# Player performance audit — 2026-09-10

Scope: the active desktop entry (`packages/player/src/main.tsx`) mounts `packages/tahti-web/src/TahtiApp.tsx`. Findings cover that shared frontend and its UI dependencies, not the inactive legacy Nuclear startup path. No runtime code was modified.

Validation: production frontend built successfully with `pnpm --filter @tahti-player/player exec vite build --outDir /tmp/tahti-player-perf-dist` (14.46 s reported by Vite). Build log: `/tmp/tahti-player-perf-build.log`. This was a bundling check, not a TypeScript check or native Tauri build. Static execution-path analysis establishes the findings below; no browser CPU trace, network timing, FPS, native memory, or audio-dropout measurements were taken. Severity is expected impact, not measured latency.

## 1. High: large initial JavaScript bundle

The generated index.html loads a 4,290,738-byte minified entry bundle (Vite reports 1,210.89 kB gzip); initial CSS is 171,195 bytes. Many listening and Studio pages are eager imports in `packages/tahti-web/src/router.tsx:21`, especially lines 53–70. AppShell also eagerly imports settings and dialogs (`components/AppShell.tsx:49`). Existing lazy routes do not eliminate these eager paths.

Impact: all starts pay the entry module loading/parsing cost, including listeners who never open Studio. Desktop assets are local, so web transfer savings do not translate directly to desktop startup savings; parse/evaluation still matters.

Fix: lazy-load remaining noninitial routes and substantial dialogs; inspect shared imports to ensure they do not pull those modules back into the entry graph. Measure entry size and first usable player time before/after. Do not count all emitted lazy chunks as startup bytes.

## 2. High for large queues: unbounded rendering plus quadratic lookups

`packages/ui/src/components/QueuePanel/QueuePanel.tsx:125` mounts every item, including sortable hooks and popovers. `packages/tahti-web/src/components/SidebarQueuePanel.tsx:57` supplies an isLiked callback that calls queue.find; `packages/ui/src/components/QueuePanel/ReorderableQueueItem.tsx:97` invokes it for each rendered row. Favorite membership adds a further linear scan (`stores/libraryStore.ts:181`). The compact viewport only clips the list; it does not virtualize it.

For N unique queued IDs, a full row render performs N(N+1)/2 queue-ID comparisons: 500,500 for 1,000 rows, or 50,005,000 for 10,000. These are derived operation counts, not wall-clock benchmarks. The open compact queue under ConnectedPlayerBar can also rerender on its parent's one-second progress updates (`components/ConnectedPlayerBar.tsx:41,356`).

Fix: virtualize queue rows, memoize row inputs, build an ID lookup map and a favorite-ID Set once per relevant change. Verify scroll-to-current and drag reorder across virtual windows with 100/1,000/10,000 items.

## 3. Medium: playback ticks recreate OS metadata

`components/AudioEngine.tsx:27` subscribes to currentTime. Each render rebuilds playable at line 36; the metadata effect depends on that new object at line 81 and assigns a fresh MediaMetadata at line 74. Progress is already throttled to once per second, but each accepted tick still triggers redundant OS metadata work and a queue.find.

Fix: select/memoize the current queue item and playable; depend on stable metadata fields. Keep analytics progress observation separate. Validate that metadata is assigned on track/metadata changes, not elapsed-time updates.

## 4. Medium: visualizer lifecycle and resize work

`components/visuals/ThreeVisualizer.tsx:85` creates a WebGL renderer and full preset scene inside an effect that depends on playing (line 149). Pausing/resuming disposes and reconstructs that scene. The frame loop also reads layout, calls renderer.setSize, and updates the camera projection every frame (lines 125–130), regardless of a size change. Paused visuals deliberately keep animating using a fallback level; there is no offscreen intersection gate in this component.

Fix: keep renderer/scene lifetime independent of playback status; read changing playback inputs through refs. Move resize/projection updates to ResizeObserver and gate offscreen rendering. Preserve intentional idle animation where desired. Profile actual GPU/frame-time effects before choosing a frame cap.

## 5. Medium: secondary requests gate primary listening content

`views/ListenView.tsx:83` waits for on-air channels, station data, and radio presets together before publishing any result. `views/ChannelView.tsx:239` waits for channel, sounds, widgets, and public shows before setting the channel and clearing loading. Thus a slow secondary endpoint delays already available primary content. The channel group also refetches on editing/lookTick changes (line 321).

Fix: expose primary channel/on-air data as soon as ready, load independent sections separately, and give each section a bounded loading/error state. Reuse/cache requests and invalidate only changed resources. Validate with an artificially delayed widgets/presets response; primary content should still appear promptly.

## Existing strengths and next verification

Playback progress already has a 1-second throttle; player consumers generally use Zustand selectors; many admin/heavy routes and the Three visualizer are lazy-loaded; the shared TrackTable has virtualized rows. These reduce scope for indiscriminate optimization.

Recommended order: entry-bundle splitting and queue scaling first, then stable metadata and visualizer lifetime, followed by independent section loading. Follow up with cold/warm startup traces on the target desktop, a 1,000-track queue during playback, visualizer play/pause/offscreen traces, and slow-network section loading. Native Rust/backend throughput was not profiled in this audit.
