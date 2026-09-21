# Restructure god modules into structured components

**Status:** open

Ask (2026-09-21): refactor god classes/modules into structured, professional components. `mod.rs` first; sweep everything bloated and flag it in the worklog. Complements [codebase-refactor-hotspots.md](codebase-refactor-hotspots.md) (tahti-web API/panel splits, already underway); this file covers the Rust desktop library and the wider sweep.

Behavior stays identical: mechanical splits along existing seams, tests move with the code.

## Sweep (2026-09-21, non-test, non-story LOC)

| Priority | File | ~LOC | Suggested seams |
| --- | --- | --- | --- |
| ~~P0~~ done | `packages/player/src-tauri/src/local_library/mod.rs` | 1693 → 240 (split into `import.rs`, `query.rs`, `roots.rs`, `tracks.rs`; commands now registered by their submodule path in `lib.rs`; behavior unchanged, 214 lib tests + generated bindings identical) | Types (`LibraryTrack`, filters, sort), query builder (`where_clause`/`order_clause`/`ListQuery`), import pipeline (batch, progress, walk), roots (scan/relink), facets/totals, Tauri command wrappers, `LibraryState`/pool/migrations. Target: `mod.rs` = re-exports + state only. |
| ~~P0~~ done | `packages/player/src-tauri/src/local_library/catalog.rs` | 1222 → `catalog/{mod,edits,user_data,plays,duplicates}.rs` (43/494/282/84/352; 214 lib tests, bindings identical) | edits+undo, user data (rating/color/tags), play log, duplicates+hashing, merge, commands. |
| P0 partial | `packages/tahti-web/src/components/DesktopLibraryPanel.tsx` | 1820 → 754 (`useNativePlayback`, `useNativeImport`; 2026-09-22: `NativeTrackTable`, `TrackBatchDialogs` (four dialog states → one), `useSelectionActions` hook, `useLibraryRoots` hook, `importFailures.ts`, `desktop-library/BrowserLocalFiles` (browser fallback) and `useNativeLibraryList` (paged list hook); 2026-09-21: `desktop-library/{LibraryRootsBlock,SelectionToolbar,TrackRowActions,pathLabels}`; no hand-rolled button/input/img left, so the ui audit is clean). Still open: the ~500-line JSX body and the dialog hosts, (all planned hooks done) | 1702 | Tracks table, group browser, roots block, import status, toolbars/dialog hosts, hooks for native state. Also owes the `@tahti-player/ui` audit. |
| P1 | `packages/tahti-web/src/components/ChannelDesigner.tsx` | 1800 | tracked in codebase-refactor-hotspots.md |
| P1 | `packages/tahti-web/src/views/ChannelView.tsx` / `ArtistView.tsx` | 1576 / 1408 | tracked there; re-check |
| P1 | `packages/tahti-web/src/views/studio/StudioProEditorView.tsx` | 1497 | not yet assessed |
| P1 | `packages/tahti-web/src/components/plugin-store/ServiceCategory.tsx`, `RadioCategory.tsx` | 1400 / 1264 | one file per service/tab |
| P1 | `packages/tahti-web/src/api/{shows,channel-design,studio-extras,sources,artist-settings}.ts` | 1000-1330 | by domain, like the admin.ts peel |
| P1 | `packages/tahti-web/src/components/TrackEditDialog.tsx`, `LocalPlaylists.tsx`, `StreamManagerPanel.tsx` | 1174 / 950 / 1012 | section components + hooks |
| P1 | `packages/tahti-web/src/views/studio/{StudioReleaseDetail,StudioShowDetail,StudioSchedule,StudioCollectionEdit,StudioDistribution}View.tsx`, `TrackDetailView.tsx`, `admin/AdminAddonsView.tsx`, `admin/AdminStorageView.tsx` | 900-1150 | not yet assessed |
| P2 | `packages/player/src-tauri/src/mcp/metadata.rs` | 1004 | not yet assessed |
| P2 partial | `packages/tahti-web/src/lib/nativeLibrary.ts` | 1047 → 213 runtime (`getNativeLibrary`, `playableFromNativeTrack`, read cache) + 850 lines of pure types/constants in `nativeLibrary.types.ts`, re-exported so imports are unchanged | types file could still split by catalog/playlists/roots/analysis |
| Data, not logic | `content/mapScreens.ts` (2366), `plugins/themes/presets.ts`, `api/mock.ts`, `content/flowDiagrams.ts`, `api/types.ts` | 1000-2400 | large data/type files; split only if editing hurts |
| Tests | `local_library/tests.rs` | 1822 | follow `mod.rs` split, one test file per module |

## Plan

1. [x] (2026-09-21, done) `local_library/mod.rs` first: split into submodules per the seams above, no behavior change. Do it as its own commit, **between** feature phases (not mixed with Phase 5 work, since other sessions touch the same files).
2. [ ] ~~`catalog.rs`~~ (done 2026-09-21), then `DesktopLibraryPanel.tsx` (`nativeLibrary.ts` types/runtime split done 2026-09-21).
3. [ ] Assess the "not yet assessed" rows; fold confirmed ones into codebase-refactor-hotspots.md or split here.
4. [x] Size guard: `pnpm check:file-size` (`scripts/check-file-size.mjs`, 800-line limit, existing offenders pinned in `scripts/file-size-baseline.json`, may only shrink; `--update` after a split). Runs in `ci.yml` after Lint.

## DesktopLibraryPanel review findings (2026-09-21, fixed with the split)

- **Perf:** every search keystroke/sort/filter change ran `refreshNative`: list + `listUnavailable` + `listRoots` + `totals`, then bumped `catalogVersion`, which refetched tags, filter options and facets — about 7 IPC calls per keystroke. Now the list reloads alone (`loadList`); library-wide data (`loadMeta`) loads on mount and after real changes (`refreshNative`). Test added.
- **Bug:** the folder watcher's `library://roots-changed` handler only bumped `catalogVersion` (tags/filter options/facets), so the track list, roots, totals and missing count stayed stale despite the comment saying otherwise. It now calls `refreshNative`. Test added.
- **Perf (scrolling):** the table's `onScrollOffsetChange` fired on every scroll frame and did `JSON.stringify` + `sessionStorage.setItem` each time. Now `saveViewStateDeferred` updates memory immediately and coalesces the write (250 ms), flushed on unmount/`pagehide`. Test added.
- **Bug/perf:** `loadMoreNative` could run twice before the first call settled (the table asks again on re-render), fetching the same page twice; added an in-flight guard.
- **Perf:** `queueNative` resolved paths one IPC round trip at a time; now in parallel, queued in the original order. Row callbacks `getRowId/getRowLabel/isRowMuted` are stable module-level functions.
- **Not changed, worth a look:** `renderActions` mounts 6 Tooltip+Button pairs per visible row (consider one shared row-actions menu or lazy tooltips); `selectAllMatching`/`playablesFor` fetch every matching id (100k ids on a big library); the table unmounts/remounts when a search returns zero rows.

## Second review pass (2026-09-22, fixed)

- **Perf:** play/queue/add-to-playlist with a single selected track fetched every matching id just to order one row; it now skips the round trip.
- **Bug:** a failed bulk remove still cleared the selection; it is now kept so the user can retry.
- **UX:** `queueNative` raised one error toast per failed track; now one.
- **Cleanup:** `playSelection`/`playAllMatching` duplicated the play-head logic; shared.
- **Still open:** multi-track selections still fetch all matching ids to preserve table order (needs a backend `order_ids(ids, sort)` command); no unit test yet for the single-selection shortcut.

## Noticed follow-ups (2026-09-22) — all closed

- [x] Track table remount on zero rows: not a real problem. The list keeps the old rows until a new page arrives, and column/sort state is persisted outside the table (`usePersistedCatalogTable`), so a remount only resets scroll, which a scope change resets anyway. Left as is.
- [x] Per-row tooltips: fixed at the source in `@tahti-player/ui` `Tooltip` — the floating-ui positioning now mounts only while a tooltip is open, and all tooltips share one `matchMedia` subscription (`useSyncExternalStore`) instead of one each. Benefits every table/toolbar in the app.
- [x] Multi-track selections fetching every matching id: new backend `library_order_ids(ids, sort)` (ids passed as one JSON array through `json_each`, so no bound-variable limit; Rust test added, bindings regenerated); `useSelectionActions` uses `library.orderIds` when present. "Select all N" / "Play all" still fetch every id by design (they need them all).
- [x] Hook tests (`useSelectionActions`, `useNativeLibraryList`, `useNativePlayback`, `useNativeImport`).
- [x] Shared `nativeLoading`: import/rescan/relink now use their own `busy` flag; list paging keeps `loading`. Rescan/relink moved to `useMissingTracks`.
- [x] `DesktopLibraryPanel.tsx` under the limit (out of the baseline).
- [ ] `ChannelDesigner.tsx` 1801 → 1713 (2026-09-22): `SlideshowControls` (+ story, migrated to `Button`/`MediaArtwork`) and `slideshowOptions.ts` extracted; bug audit below. Still open: `loadFromServer` / `save` / preset actions (a `useChannelLook` state hook, snapshot helpers, `buildVisualPatch` as a pure function), the ~230-line final render, and the panel slot builders.
- [ ] Next offenders to split (baselined): ~~`ChannelDesigner.tsx`~~, `ChannelView.tsx` 1577, `StudioProEditorView.tsx` 1498, `ArtistView.tsx` 1409, `ServiceCategory.tsx` 1401.
- Fixed in passing: failed load-more toasts an error; the drop-import subscription no longer resubscribes per keystroke (`useNativeImport` goes through a ref).

## ChannelDesigner bug audit (2026-09-22, fixed)

- **Reorder lost its preview index:** a `[galleryImages]` effect reset the preview to 0 after every reorder/add/remove, clobbering the reorder's own `setGalleryPreviewIndex(toIndex)`. Now only clamps when the index falls off the end.
- **Load had no error handling or stale guard:** a failed fetch left "Loading designer…" forever with no message; a slow older response could overwrite a newer load. Now request-counted, cancelled on unmount/reload, toasts on failure (test added); presets fetch is cancelled too.
- **Invalid-preset correction lost its dirty flag:** `loadFromServer` set dirty, then unconditionally reset it to false at the end. It now sets `dirty` iff it corrected the preset, and only calls `setVisual` once.
- **Reset/revert kept a picked backdrop file:** "Reset", "Revert" of an applied preset, applying a preset, and "Restore previous save" left a pending upload that would silently override the restored look on the next Save. All discard it now (and revoke its blob URL, which also leaked on unmount and on switching to a URL).
- **Save could stick on "Saving…" forever** if a request threw; now try/finally with an error toast. If the gallery endpoint fails, the baseline (used by "Restore previous save") keeps the old gallery instead of recording unsaved gallery state as saved.
- **Gallery upload clobbered concurrent edits:** appended to a stale image list after `await`; now appends to the current list, and a thrown upload no longer leaves the designer busy.
- **Custom gradients wiped on toggle:** turning the player/page-background gradient off and on re-seeded from the header colors because it checked a server-side field that never updates locally. Now seeds only when the local scheme is empty.
- **Right rail re-expanded on every render** while docked (users couldn't keep it collapsed); now opens once when docking starts.
- **`onLookVisibilityChange`** in an effect dependency list re-ran the effect (and re-notified the parent) for any caller passing an inline callback; now via ref. `lookVisibility` initial state reads localStorage lazily instead of every render.
- Not fixed: `dirty` is cleared after a successful save even if the user edited during the in-flight save (the Save button is disabled only while `busy`, so the window is small).
