# Restructure god modules into structured components

**Status:** open

Ask (2026-09-21): refactor god classes/modules into structured, professional components. `mod.rs` first; sweep everything bloated and flag it in the worklog. Complements [codebase-refactor-hotspots.md](codebase-refactor-hotspots.md) (tahti-web API/panel splits, already underway); this file covers the Rust desktop library and the wider sweep.

Behavior stays identical: mechanical splits along existing seams, tests move with the code.

## Sweep (2026-09-21, non-test, non-story LOC)

| Priority | File | ~LOC | Suggested seams |
| --- | --- | --- | --- |
| ~~P0~~ done | `packages/player/src-tauri/src/local_library/mod.rs` | 1693 → 240 (split into `import.rs`, `query.rs`, `roots.rs`, `tracks.rs`; commands now registered by their submodule path in `lib.rs`; behavior unchanged, 214 lib tests + generated bindings identical) | Types (`LibraryTrack`, filters, sort), query builder (`where_clause`/`order_clause`/`ListQuery`), import pipeline (batch, progress, walk), roots (scan/relink), facets/totals, Tauri command wrappers, `LibraryState`/pool/migrations. Target: `mod.rs` = re-exports + state only. |
| ~~P0~~ done | `packages/player/src-tauri/src/local_library/catalog.rs` | 1222 → `catalog/{mod,edits,user_data,plays,duplicates}.rs` (43/494/282/84/352; 214 lib tests, bindings identical) | edits+undo, user data (rating/color/tags), play log, duplicates+hashing, merge, commands. |
| P0 | `packages/tahti-web/src/components/DesktopLibraryPanel.tsx` | 1702 | Tracks table, group browser, roots block, import status, toolbars/dialog hosts, hooks for native state. Also owes the `@tahti-player/ui` audit. |
| P1 | `packages/tahti-web/src/components/ChannelDesigner.tsx` | 1800 | tracked in codebase-refactor-hotspots.md |
| P1 | `packages/tahti-web/src/views/ChannelView.tsx` / `ArtistView.tsx` | 1576 / 1408 | tracked there; re-check |
| P1 | `packages/tahti-web/src/views/studio/StudioProEditorView.tsx` | 1497 | not yet assessed |
| P1 | `packages/tahti-web/src/components/plugin-store/ServiceCategory.tsx`, `RadioCategory.tsx` | 1400 / 1264 | one file per service/tab |
| P1 | `packages/tahti-web/src/api/{shows,channel-design,studio-extras,sources,artist-settings}.ts` | 1000-1330 | by domain, like the admin.ts peel |
| P1 | `packages/tahti-web/src/components/TrackEditDialog.tsx`, `LocalPlaylists.tsx`, `StreamManagerPanel.tsx` | 1174 / 950 / 1012 | section components + hooks |
| P1 | `packages/tahti-web/src/views/studio/{StudioReleaseDetail,StudioShowDetail,StudioSchedule,StudioCollectionEdit,StudioDistribution}View.tsx`, `TrackDetailView.tsx`, `admin/AdminAddonsView.tsx`, `admin/AdminStorageView.tsx` | 900-1150 | not yet assessed |
| P2 | `packages/player/src-tauri/src/mcp/metadata.rs` | 1004 | not yet assessed |
| P2 | `packages/tahti-web/src/lib/nativeLibrary.ts` | 808 | split by catalog/playlists/roots/analysis |
| Data, not logic | `content/mapScreens.ts` (2366), `plugins/themes/presets.ts`, `api/mock.ts`, `content/flowDiagrams.ts`, `api/types.ts` | 1000-2400 | large data/type files; split only if editing hurts |
| Tests | `local_library/tests.rs` | 1822 | follow `mod.rs` split, one test file per module |

## Plan

1. [x] (2026-09-21, done) `local_library/mod.rs` first: split into submodules per the seams above, no behavior change. Do it as its own commit, **between** feature phases (not mixed with Phase 5 work, since other sessions touch the same files).
2. [ ] ~~`catalog.rs`~~ (done 2026-09-21), then `DesktopLibraryPanel.tsx` and `nativeLibrary.ts`.
3. [ ] Assess the "not yet assessed" rows; fold confirmed ones into codebase-refactor-hotspots.md or split here.
4. [ ] Add a size guard (e.g. lint/CI warning above ~800 LOC for non-data files) so this stops recurring.
