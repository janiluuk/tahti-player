# Pro desktop music player — phased implementation workplan

**Status:** partial
**Updated:** 2026-09-10
**Goal:** Import a personal music collection once, then catalog, sort, filter, search, analyze, play and build playlists offline as in a desktop music manager.

This is the canonical implementation plan for the independent player roadmap. It supersedes the old A–F ordering and right-rail library proposal. Historical context: `packages/tahti-web/UI-REDESIGN-WORKLOG.md`, 2026-09-04 — Independent desktop player.

## Verified starting point

- `packages/player/src/main.tsx` mounts `packages/tahti-web/src/TahtiApp.tsx`; desktop and web share frontend code.
- `/library/local` renders `DesktopLibraryPanel` inside LibraryView. The library was moved out of the right rail. Keep the main Library workspace for the catalog; use a rail only for optional details/queue.
- `localLibraryStore.ts` imports browser File objects, creates blob URLs, and persists filename/title/artist only. Playback works in-session; restart requires re-import. Identity restoration currently matches filename, which cannot distinguish same-named files in different folders.
- Tags, durable filesystem references, native catalog queries, analysis and durable local playlists are not implemented by this store.
- `SaveQueueAsPlaylistDialog.tsx` saves Tahti sound IDs to server collections and excludes local tracks. It cannot serve as local playlist persistence.
- Native SQLite infrastructure already exists in `packages/player/src-tauri/src/db.rs` (sqlx/WAL) for history. Reuse conventions, with dedicated versioned catalog migrations.
- Tahti window branding exists; custom window-frame defaults and installer naming are separate follow-ups, not prerequisites for catalog delivery.

## Product and architecture defaults

The desktop library works without a Tahti login or network. Import references original files by default; it does not upload, move or rewrite them. A future managed-copy option must be explicit. Cloud Sounds/Collections remain available alongside the local catalog, with clear source labels.

Use a native SQLite catalog as the durable source of truth; React/Zustand holds view state and bounded query results. Native background jobs handle scan, tag extraction and analysis. IPC returns typed pages/progress, not a whole decoded collection. Browser file preview may remain available but must clearly describe its session-only persistence. Native features use actual runtime capabilities, never screen width as a proxy.

Proposed entities (design targets, not existing contracts): library roots; tracks with stable IDs; file locations with size/mtime and optional content hash; artist/album/genre relations; user metadata overrides; artwork cache; versioned analysis results; ordered playlist entries with their own IDs; saved query rules; resumable jobs. A track can have multiple locations; two files with matching names or tags are not automatically the same track. Playlist references survive relocations.

## Current implementation slice — 2026-09-10

Native side only, not yet wired to the frontend. `packages/player/src-tauri/src/local_library/` has a `library_tracks` SQLite table (migration `0001_init.sql`), FLAC/WAV tag/duration/format extraction via `symphonia` (`metadata.rs`), and four typed commands (`library_list`, `library_import` — native file-picker import, upsert-on-reimport by path, `library_resolve` — existence check + asset-protocol allow, `library_remove`). 8 Rust unit tests cover import, re-import dedup, search (incl. SQL-wildcard escaping), missing-file resolve, and remove, all green; TS bindings regenerated into `packages/player/src/services/tauri/bindings.ts`. Found and fixed in this pass: a real tag-parsing bug where RIFF `LIST`/INFO values (title/artist/album) kept a trailing NUL byte because `symphonia-metadata`'s `riff::parse` includes the terminator in `Tag::value`.

Not started: `DesktopLibraryPanel.tsx`/`localLibraryStore.ts` still only use the browser File API session-only path — nothing in the frontend calls `library_list`/`library_import`/`library_resolve`/`library_remove` yet. No native-capability detection, no folder import, no relink/missing-file UI, no E2E coverage of the native path (a prior note claiming E2E coverage here was inaccurate). Phase 0's capability-detection and signed-out-access items, and all of Phase 1's frontend wiring, remain open.

## Phase 0 — Native foundation and delivery contract

Depends on: none. Produces the smallest complete desktop catalog boundary.

- [ ] Confirm active runtime, native command registration, permissions, app data directory and current auth redirects. Make local-library navigation usable signed out/offline without exposing authenticated cloud operations.
- [ ] Define a typed native library adapter for capabilities, import jobs, paged queries, details, source resolution and cancellation; browser adapter reports unsupported native operations honestly.
- [ ] Add catalog schema/migrations and transactional repository; define stable IDs, file-location identity, metadata precedence, missing-file states and migration/backup policy.
- [ ] Build deterministic fixture collections: tagged/untagged files, Unicode paths, duplicate filenames, corrupt files, multiple formats and disconnected roots. Add generated metadata fixtures at 1k/10k/100k rows.
- [ ] Establish release-build CPU/native-memory baseline using [performance workplan](player-performance-optimizations.md). Record hardware and initial query/import budgets; measure native host and WebView process tree separately from JS heap.

**Exit demo:** signed-out desktop opens Local files offline; catalog migrations survive restart; a typed query returns a fixture page; browser does not invoke native commands.

## Phase 1 — Durable import and reliable playback

Depends on: phase 0. First usable personal music library.

- [ ] Add files, recursive folder selection and native file/folder drag-drop. Reference originals by default. Show scan progress, imported/skipped/failed counts, cancellation, retry and per-file errors.
- [ ] Extract title, artists, album artist, album, track/disc numbers, year/date, genre, comment, duration, codec/container, bitrate, sample rate, channels and embedded artwork. Preserve unknown values; filename is a fallback, not a guessed artist.
- [ ] Index in bounded batches with background concurrency limits; commit incrementally and resume interrupted jobs without duplicate rows. Validate decodability independently of accepted extensions.
- [ ] Resolve durable native file locations into the shared player at playback time. Verify seek, duration, next/previous, pause/resume and queue identity for local tracks. Do not persist blob URLs or send local IDs to sound analytics/cloud collection endpoints.
- [ ] Re-scan roots idempotently; mark missing/unavailable files; provide relink file/folder and reveal-in-folder. Preserve IDs during proven relocations; ask for resolution when identity is ambiguous.
- [ ] Migrate old filename-only entries as unresolved references. Do not silently bind them to a different same-named file. Keep removal from catalog separate from physical file deletion.

**Exit demo:** import a 1,000-file nested folder, restart offline, search a basic title list and play/seek tracks without re-import. Re-scan adds no duplicates; corrupt files do not abort the batch; disconnected files remain visible and can be relinked.

## Phase 2 — Catalog, sorting, filtering and search

Depends on: phase 1. Main Library workspace, not a tiny sidebar list.

- [ ] Build a virtualized multi-select TrackTable with configurable/reorderable columns and persisted widths, sorting and view state. Reuse Storybook primitives and preserve player/nav chrome.
- [ ] Add Tracks, Artists, Albums, Genres and Folders browsing backed by the same catalog; show track count, duration and local file size totals separately from cloud storage.
- [ ] Add indexed text search over title/artist/album/genre/path/comment; combine search with facets and ranges for year, duration, format, bitrate, root, date added and availability. Add BPM/key/analysis facets when phase 5 lands.
- [ ] Execute sort/filter/search in SQLite with stable tie-breaking and paged results. Cancel or discard stale queries. Do not load all rows into Zustand for client-side filtering.
- [ ] Support shift/range selection, select all matching results across pages, keyboard actions, play selected, play filtered results, play next and enqueue. Define snapshot ordering so queue insertion is predictable when a filter changes.
- [ ] Add a details inspector, empty/loading/error states and saved column layouts; retain position and filters when returning from a detail view.

**Exit demo:** in a 10k-track fixture, combine artist + format + year filters, sort by album/disc/track, select all matches across pages and queue them in displayed order. Verify bounded mounted rows, query timings and UI responsiveness against phase 0 budgets; stress 100k catalog rows.

## Phase 3 — Durable local playlists

Depends on: phase 2. Deliberately before analysis or Soulseek.

- [ ] Create, rename, duplicate and delete local playlists; add tracks from selection, filtered results, albums, folders and queue. Persist ordering and repeated entries using entry IDs distinct from track IDs.
- [ ] Support drag/keyboard reorder, multi-remove, undo for playlist edits, play/shuffle playlist and save queue as a local playlist. Handle unavailable tracks visibly without deleting their entries.
- [ ] Provide local save independently of cloud Save as playlist. Keep existing cloud collection behavior explicit; do not silently omit local tracks when the user intends a local playlist.
- [ ] Import/export M3U/M3U8 with UTF-8 and relative/absolute paths; preview unresolved entries and support relinking. Round-trip ordering and duplicates. Explain portability for files outside the export root.
- [ ] Persist queue references/order and restore paused after restart; resolve sources lazily and avoid autoplay on launch.

**Exit demo:** create a 50-track playlist from filtered results, reorder it, save the queue, restart offline and play both. Export/import round-trip preserves order and duplicates; moving a root and relinking preserves membership.

## Phase 4 — Catalog editing and organization

Depends on: phase 3.

- [ ] Add single/bulk metadata editing with mixed-value indicators, preview of affected tracks, undo and field-level provenance. Store user overrides separately from extracted tags; rescanning must not erase edits.
- [ ] Add ratings, color labels/custom tags, comments, play count and last played; record local listening history locally.
- [ ] Add duplicate review using exact content hashes on demand, then metadata similarity as a separate suggested match. Never auto-delete similar tracks.
- [ ] Add explicit optional write-tags-to-files with supported-format matrix, read-only/error handling and recoverable writes; preserve original files by default.
- [ ] Add catalog backup/restore including playlists, overrides, roots and analysis references. Preview root mappings and distinguish database backup from audio-file backup.

**Exit demo:** bulk-correct an album, undo, re-scan without losing overrides, review same-name nonduplicates correctly, and restore catalog/playlists into a fresh profile with remapped roots.

## Phase 5 — Audio analysis and smart playlists

Depends on: phases 1–4. Analysis enriches the catalog without blocking playback.

- [ ] Implement background jobs for waveform peaks, loudness/true peak, BPM and musical key. Read existing BPM/key tags first; store tag values, computed estimates and user corrections separately.
- [ ] Select and validate native analysis implementation on reference fixtures; record algorithm/version, units, confidence where available and analyzed file identity. Label BPM/key as estimates and allow correction/re-analysis.
- [ ] Decode incrementally where supported, cap worker count/memory, prioritize playback, and provide pause/cancel/resume. Cache results; invalidate only when source content or algorithm changes. Never decode an entire collection concurrently.
- [ ] Show waveform and analysis status in details; add BPM range, key, loudness and analyzed/unanalyzed filters and sorting.
- [ ] Build smart playlists as persisted all/any rules over catalog fields, ratings/tags, dates/play counts and analysis, with sort/limit and live reevaluation. Support saving a fixed snapshot.
- [ ] Keep loudness analysis separate from gain application. If normalization playback is included, make it an explicit mode with clipping protection and verified gain handling.

**Exit demo:** analyze a selected album during uninterrupted playback, cancel/restart and reuse completed results. Correct a BPM estimate; a smart playlist such as “house, 120–128 BPM, rating ≥4, not played in 30 days” updates accordingly. Publish accuracy limits and CPU/native-memory results.

## Phase 6 — Folder automation and performance hardening

Depends on: phases 1–5; profiling and bounded design apply from phase 0 onward.

- [ ] Add watched roots with debounced events, incremental reconciliation, missing-drive detection and fallback full rescan. Handle rename/delete/external tag edits without losing playlist IDs or user overrides.
- [ ] Finish catalog query indexes, artwork cache limits, queue virtualization and scoped progress subscriptions. Coordinate shared fixes with [performance workplan](player-performance-optimizations.md) rather than duplicating them.
- [ ] Profile native CPU and RSS/PSS across import, search, playback and analysis; repeat a 30-minute soak and repeated view/preset/track changes. Explain retained caches versus unbounded growth; validate cancellation releases job resources.
- [ ] Validate target-platform format playback, Unicode/removable-drive behavior, keyboard navigation, migration recovery and offline startup. Record supported/tested platforms and formats explicitly.

**Exit demo:** add/change/move files externally and see incremental reconciliation; 10k-track real workflow and 100k-row stress fixture meet recorded budgets without playback regressions. Publish before/after traces and known limitations.

## Phase 7 — Optional acquisition and cloud connections

Depends on: stable core phases 1–6. These do not gate personal library use.

- [ ] Soulseek native add-on: help/settings copy, Configure → test → save/enable, native connectivity, search/download progress/cancel, then completed downloads through the same importer. Tahti servers do not relay searches or P2P traffic. Follow plugin/registry checklist when implementing.
- [ ] Optional managed-copy/organize-files workflow with destination preview, collision handling and explicit confirmation before changing originals.
- [ ] Optional local-to-cloud publishing/linking via actual sibling API contracts; keep local paths/private metadata off the server by default. Upload is an explicit action, separate from import.
- [ ] Revisit custom title-bar default, installer branding and optional desktop status-bar shortcuts after catalog delivery.

## Delivery and completion rules

Each phase is a reviewable slice with its exit demo; no calendar estimate until phase 0 confirms native dependencies. Phases 0–3 deliver the everyday desktop library; phases 4–6 deliver pro catalog/analysis quality. Phase 7 is optional follow-up.

Before UI implementation inspect Storybook surfaces and applicable component/native/testing instructions. Update VIEW-CATALOG for real route/story/nav changes. Add behavioral tests for migration/restart, file identity, query pagination, local playlist round-trips and job cancellation; run package/native checks appropriate to each slice. No commits/push/deploy without user instruction.

Track open steps here; fold completed phase summaries into HISTORY and remove completed task bullets. When the core plan is complete, move any remaining optional work to explicit follow-up todos, then close this file and its INDEX/WORKPLAN entries.
