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
| ~~P1~~ done | `packages/tahti-web/src/components/ChannelDesigner.tsx` | 1800 → 757 (out of the size baseline) | Split via `useChannelLook`/`useLookVisibility`/`useDockedControlsRail`/`ChannelPagePreview` + pure snapshot helpers (see "Next up" below) — only the panel slot builders remain. Off both this list and `codebase-refactor-hotspots.md`. |
| P1 | `packages/tahti-web/src/views/ChannelView.tsx` / `ArtistView.tsx` | 1576 / 1408 | tracked there; re-check |
| P1 | `packages/tahti-web/src/views/studio/StudioProEditorView.tsx` | 1497 | not yet assessed |
| P1 | `packages/tahti-web/src/components/plugin-store/ServiceCategory.tsx`, `RadioCategory.tsx` | 1400 / 1264 | one file per service/tab |
| ~~P1~~ done | `packages/tahti-web/src/api/{shows,channel-design,studio-extras,sources,artist-settings}.ts` | 1000-1330 → 47-140 each (2026-09-22): barrels re-exporting `api/<name>/<domain>.ts`, imports unchanged | |
| ~~P1~~ done | ~~`packages/tahti-web/src/components/TrackEditDialog.tsx`~~ | ~~1174~~ **2026-09-23: 172** | **Done:** `track-edit-dialog/useTrackEditDialog.ts` (state/effects/save/playback/quick-edit hook, 447 lines) + `BasicsTab`/`AudioTab`/`SharingTab`/`AdvancedTab` components (83-239 lines each); Export tab stayed inline (already tiny). Zero behavior change — mechanical split, each tab receives the whole hook state object (same pattern as `usePressKit`'s `kit` prop). `tsc`/`eslint`/full vitest suite (846/846) all pass; `TrackEditDialog.stories.tsx` only imports the top-level export, unaffected. |
| ~~P1~~ done | ~~`packages/tahti-web/src/components/LocalPlaylists.tsx`~~ | ~~952~~ **2026-09-23: 24** | **Done:** `local-playlists/shared.tsx` (columns, `summaryLine`, `playPlaylist`, 101 lines), `PlaylistsBrowser.tsx` (342 lines), `PlaylistView.tsx` (517 lines) — one file per already-independent component, `LocalPlaylists.tsx` is now just the open/list router + a `PLAYLIST_COLUMNS` re-export for back-compat. Zero behavior change; `tsc`/`eslint`/full vitest (846/846, including the 18 existing `LocalPlaylists.test.tsx` cases) all pass. |
| ~~P1~~ done | ~~`packages/tahti-web/src/components/StreamManagerPanel.tsx`~~ | ~~1012~~ **2026-09-23: 93** | **Done:** `stream-manager/useStreamManagerState.ts` (polling, rotation tracking, playlist/overlay/end-stream handlers, 496 lines) + `PanelHeader`/`StatsGrid`/`RotationBody`/`PlaylistDialog`/`ManagerDialogs` components (63-227 lines each), same whole-state-object-as-prop pattern as the other splits this pass. Zero behavior change; `tsc`/`eslint`/full vitest (846/846) pass; `StreamManagerPanel.stories.tsx` only imports the top-level export, unaffected. |
| ~~P1~~ done | `packages/tahti-web/src/views/studio/{StudioReleaseDetail,StudioShowDetail,StudioSchedule,StudioCollectionEdit,StudioDistribution}View.tsx`, `TrackDetailView.tsx`, `admin/AdminAddonsView.tsx`, `admin/AdminStorageView.tsx` | 900-1150 | all split; `TrackDetailView` (1047→132) and `AdminAddonsView` (1075→214) in the tenth pass (2026-09-23) |
| ~~P2~~ done | `packages/player/src-tauri/src/mcp/metadata.rs` | 1004 → `mcp/metadata/{mod,domains,methods,types}.rs` (48/119/536/353) | pure `json!` data per MCP tool; public API (`list_methods`/`method_details`/`describe_type`) unchanged via re-exports |
| ~~P2~~ done | `packages/tahti-web/src/lib/nativeLibrary.ts` | 1047 → 213 runtime (`getNativeLibrary`, `playableFromNativeTrack`, read cache) + types; 2026-09-23: `nativeLibrary.types.ts` 852 → 90 (the `TahtiNativeLibrary` bridge type + re-exports of `native-library/{tracks,playlists,catalog,analysis}.ts`), imports unchanged | |
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
- [x] `ChannelDesigner.tsx` split: done 2026-09-22 (1697 → 757, see "Next up" below); this earlier partial note was stale.
- [x] `RadioCategory.tsx` split + audit (2026-09-22, 1264 → 15): see below.
- [x] 2026-09-23: `TrackEditDialog`, `LocalPlaylists`, `StreamManagerPanel` all split (see the sweep table rows above); unassessed studio/admin views tracked separately below.
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
- `dirty` in-flight-edit race: fixed later (edit revision counter).

## Third pass on ChannelDesigner (2026-09-22, fixed with the hook extraction)

- **Save overwrote edits made while it ran:** the server copy replaced the draft (while `dirty` stayed true), silently reverting them; now the draft is kept when edited mid-save. The baseline also recorded overlay/preview settings from after the save, not from the saved state.
- **Reset/Revert on a failed reload** toasted success and cleared the banner although nothing was reloaded; now only on success.
- **Layout toggle wrote localStorage behind ChannelView's back** (stale parent view, overwritten by its next save); inside ChannelView it now goes through `onLayoutChange`.
- Preset save/delete left `presetBusy` stuck if a request threw; highlight timers could clear a newer highlight and fired after unmount (one timer now); dead `pageLayout` state removed; redundant `setPreviewPreset` calls removed; every edit now goes through `applyLocal`/`edit*` helpers so dirty can't be forgotten.
- Not done: visual check in the running app (still open below).

## ChannelView audit + split (2026-09-22, 1576 → 797, out of the size baseline)

Split into `components/channel-view/`: `useChannelData`, `useChannelLinksDraft`, `useEditRail`, `ChannelLayersPanel`, `ChannelStagePlayer`, `ChannelPageBackdrop`, `ChannelBlockFrame`.

- **Every look save or edit-mode toggle showed the full-page spinner:** the fetch effect depended on `editing` and `lookTick` and set `loading` each time, unmounting the page and the designer inside it. Now only a slug change shows loading; refreshes are silent and keep the follower count. Fetch failure no longer leaves the spinner forever.
- **Done discarded look and link edits** while keeping the layout; it now saves all three first. `saveAll` is exception-safe (`savingLook` could stick).
- **Rail re-expanded on every render** while editing (same as the designer); now once.
- **Whole page re-rendered on every playback `timeupdate`** (currentTime/duration subscriptions in `ChannelView`); the player controls own those subscriptions now.
- Edit mode now follows the URL (back button leaves it); play-stream and preset-look requests toast on failure.
- Not changed: `applyPreset` persists the look to the server immediately though its note says "save layout to keep it"; the Feed block's controls have no live update source; the backdrop `<img>` is still hand-rolled (decorative full-bleed, `MediaArtwork` doesn't fit). No test drives the full `ChannelView` (new hook tests only).

## StudioProEditorView audit + split (2026-09-22, 1497 → 333, out of the size baseline)

Split into `views/studio/pro-editor/`: `WaveformEditor` (audio, toolbar, canvas, markers), `MasteringPanel`, `PluginControls`, `StemsPanel`, `useWaveformPeaks`, `pluginUi`, and pure `editCuts` (merge/kept/trim/silence/zoom, tested).

- **Kept-duration double-counted overlapping cuts** (cuts were only sorted, never merged), so "Kept: 3:10" could be wrong and duplicate regions were sent to the render. Cuts are merged everywhere now.
- **"Trim to selection" replaced all existing cuts**, dropping ones inside the kept range; it now keeps them.
- **Load had no error handling:** a failed fetch left "Loading editor…" forever (now an error state); stem and version polling had unhandled rejections; save, render and stem-request threw past `busy`/state (try/finally, toasts).
- **A failed draft save before render was silent**; it now warns.
- **Navigating between tracks carried over** selection, markers, zoom, message and unsaved edits (no remount); the view is keyed by sound now.
- **AudioContext leaked** when peak decoding failed (browsers cap live contexts); now closed in `finally`. The audio element is paused on unmount.
- **Every `timeupdate` re-rendered the whole editor** (mastering, stems, export); playback state now lives in `WaveformEditor` only.
- Duplicate marker at the same time crashed on a duplicate React key; markers dedupe. Editing feedback (cut, trim, normalize) goes through toasts as well as the status line; hand-rolled marker/slope `<button>`s use `Button`.
- Not changed at the time: markers weren't persisted and playback ignored cuts by design (removed on render). 2026-09-23 the Pro-editor audit closed both frontend gaps: markers now live in the draft (`EditList.markers`, see HISTORY close of `pro-editor-audit.md`) and the whole-view test + unsaved-changes prompt are done; playback skipping cuts is now a "Skip cuts" toggle. Server-side render/export of markers still needs an `EditList` contract change in `../tahti-org`.

## Next up (2026-09-22)

- [x] `ChannelDesigner.tsx` split (2026-09-22, 1697 → 757, out of the size baseline): `useChannelLook` (draft state, load/save/presets/gallery/backdrop), `useLookVisibility`, `useDockedControlsRail`, `ChannelPagePreview`, and pure `buildVisualPatch` / `buildLoadedLook` / `applyPresetToVisual` / `LookSnapshot`, with tests. Only the panel slot builders remain in the component.
- [x] `ChannelDesigner`: `dirty` no longer cleared by a save when the user edited while it was in flight (edit revision counter; no dedicated test yet).
- [x] `ArtistView.tsx` split + audit (2026-09-22, 1409 → 787, out of the baseline): see below.
- [x] `ServiceCategory.tsx` split + audit (2026-09-22, 1401 → 93, out of the baseline): see below.
- [x] 2026-09-23: checked in the running app (offline mock mode, desktop and 400 px widths): right rail stays collapsed while editing, layout presets, Save/Done. Slideshow reorder preview, Reset/Revert with a pending backdrop file and the gradient toggles need file uploads, so they remain covered by unit tests only.
- [x] 2026-09-23: checked in the running app: channel edit mode (no spinner on save, Save/Done save look + layout, rail stays collapsed) and the Pro editor (sample-level zoom, stereo lanes, clipping, cut + undo, ms readouts).
- [x] Pro editor follow-ups: persist markers (now saved into the draft via `EditList.markers`, 2026-09-23 audit — render/export still needs a `../tahti-org` contract), unsaved-changes prompt (router `useBlocker` + `beforeunload`, `Dialog` confirm) and a whole-view test are done, see the twelfth pass below.
- [x] `ChannelView`: `applyPreset` (2026-09-23) now keeps the preset's look as an unsaved draft, like every other edit: it goes into the designer's draft (applied once its look has loaded), Save/Done write it (directly if the look panel is closed), and the note clears after saving. It used to save to the server immediately while saying "save layout to keep it". Test in `ChannelView.test.tsx`.
- [x] `ui` `QueuePanel` test "skips offscreen layout only for long queues": failed in 3 of 3 full `ui` runs (about 7 s against vitest's 5 s default, rendering 150 rows under load) but passed alone. 2026-09-23: now renders 101 rows (the smallest count over the 100-row threshold) with an explicit 20 s timeout; the full `ui` suite passed twice in a row (353/353).

## ArtistView audit + split (2026-09-22, 1409 → 787)

Split into `lib/artistProfile.ts` (embed/playable helpers, tested), `components/artist-view/{useArtistChannelLook,ArtistProfileSections}` (bio, live shows, tagged-in, feed, news, embeds, header actions).

- **Failed profile fetch left the spinner forever** (no catch); now falls through to "Artist not found". Channel look, disco widgets, posts, news, live shows, mentions, gallery and post-save refetches all had unhandled rejections, and one failing endpoint (Promise.all) blanked the whole look; each block now loads independently.
- **Featured play/pause button never updated** (read `getState().status` during render, no subscription); now subscribed.
- **Full-bio save failed silently** and could stick on "Saving" if the request threw; now toasts success/error, try/finally.
- **State leaked between artists** (tab, bio draft, tagged-in, gallery); the view is keyed by username. Previous artist's look no longer flashes while the next loads.
- Tab list was computed twice (effect + render) and could drift; one memo. The 19-field look mapping was duplicated (`pickChannelVisual`).
- Not changed: no smoke test renders the whole `ArtistView`; visual check in the running app still open.

## Designer option audit + tests (2026-09-22)

New tests: `channel-designer/designerOptions.test.tsx` (every offered option has a renderer/scene/label; what a save sends), `channel-designer/useChannelLook.options.test.ts` (each preset/header style/brand accent/overlay style/background visualizer/overlay effect/slideshow transition survives apply → save → reload), `ChannelBackdropCard.test.tsx`, `views/ArtistView.test.tsx`.

- **Fixed: the designer's "Slideshow" header mode never showed a slideshow.** It saves `headerStyle: GRADIENT` plus a gallery mode, but `ChannelBackdropCard` only drew the slideshow when the style was *not* GRADIENT (preview and published page). The gallery now wins over the plain gradient.
- **Flagged, not fixed: 5 of 6 "Gallery style" options render nothing.** TWISTED_WAVE, ZOOM_BLUR, RGB_SHIFT, POSTER_WALL and SHATTER_CAROUSEL (`*_GLSL`) are selectable but no renderer exists; only STATIC_SLIDESHOW draws (pinned with `it.fails.each`, flips when implemented). Either build them or drop them from `GALLERY_MODES`.
- Correction: the channel-page Text overlay does reach the server, through the separate `/api/me/channel/text-layer` route (best-effort: a failure there is swallowed silently).
- Noted: `MINIMAL` is in `VISUAL_PRESETS` but treated as invalid (corrected to AURORA on load, "visualizer off" elsewhere).
- **Added: Top bar text** in the designer's Backdrop panel (`TopBarTextField`), saved via `topBarText`, shown as a strip across the top of the channel hero (`ChannelBackdropCard`, preview and published page). Assumes the backend already accepts `topBarText` (it was already in the API patch keys) — unverified against a real server.
- **Open: pnpm 12 / router bump broke `packages/ui/src/components/RouteTransition.tsx`** (`router.__store` no longer exists in @tanstack/react-router 1.170); `tsc` fails and the page transition will throw at runtime.

## ServiceCategory audit + split (2026-09-22, 1401 → 93)

Split into `plugin-store/service-category/{SpotifyCard,OAuthServiceCard,HearthisCard,DspUrlPasteCard}`.

- **hearthis multi-collection import lost imported marks:** each collection wrote `new Set(importedIds)` from a stale render snapshot, so the second overwrote the first (items could be re-imported). Now one `markImported` over a ref; localStorage writes are try/catch.
- **hearthis collection import stuck "busy" forever** when every track was already imported (early return after `setBusy(true)`); an import that threw also left the loading toast and `busy` stuck. All try/finally with error toasts; a failed cover patch no longer hides a successful import.
- **hearthis library load** had no catch (spinner forever), no stale guard, and shared its busy flag with Search; separate `searching` flag, request counter, toasts. Saving the username reports through a toast.
- **Spotify:** "Configure" opened the import dialog even when no profile was linked (now opens the config panel); a link error was set but never displayed while unlinked (toast now); search/import/unlink/link had no try/finally or catch.
- **OAuth (Bandcamp/SoundCloud):** Bandcamp album import had no busy state (double-click imported twice) and no toast; every fetch lacked a catch/stale guard; disconnect could leave `busy` stuck; the `adapter.id === 'soundcloud' ? … : Promise.resolve({error:'Unavailable'})` dead branches are gone.
- **Home-baked elements:** `<Link><Button/></Link>` and `<Link><PluginStoreItem/></Link>` (button inside an anchor) now navigate via `Button`/`onInstall`; Bandcamp covers use `MediaArtwork` instead of `ImageReveal`; a fake `cursor-pointer` on non-clickable Spotify rows removed.
- Not changed: `@tahti-player/ui` has no external-link component, so the remaining `<a target=_blank>` (hearthis.at ↗, OAuth instructions) stay hand-rolled; hearthis collections import as public while track imports go to private playlists (inconsistent, product call); covered by tests in `service-category/*.test.tsx`.

## RadioCategory audit + split (2026-09-22, 1264 → 15)

Split into `plugin-store/radio-category/`: `PersonalRadioStreamCard`, `RadioBrowserDirectoryCard`, `StationRows`, `StationEditDialog`, `AddStationUrlDialog`, `StationDetailsDialog`, `SuggestStationForm`. The three dialogs own their drafts and mount only while open, so 13 pieces of state left the card.

- **"Now playing" never showed a loading state:** the `'…'` branch was unreachable (`null` meant both loading and unavailable); now `undefined` = reading. A slow ICY read for a previous station could also overwrite the current one; request-guarded.
- **Resolve/search/suggest had no try/finally:** a throw left "Resolving…"/"Sending…" stuck (suggestion form, personal stream, add-by-URL). Personal-stream search had no busy state or disabled empty query.
- **Directory search:** stale responses could overwrite newer ones, and the "Results" heading flipped before the results arrived; newest-only now. Initial loads had unhandled rejections.
- **Add-by-URL:** closing or editing the URL while resolving let the old result land afterwards (stale guard); saving gave no feedback (toast).
- **Station edit:** a non-numeric bitrate saved `NaN`; it keeps the old value now. Save toasts.
- **Home-baked elements replaced with `Button`/`MediaArtwork`:** station-name row buttons, the search-icon button in the input, the "All genres" toggle, the station favicon box (`ImageReveal` + hand-built frame).
- Not changed: the `<a target=_blank>` links in the details dialog (no ui link component); covered by `radio-category/Radio{Dialogs,Cards}.test.tsx`.

## api/* splits (2026-09-22)

- `api/request-json.ts` is now the one `requestJson` (16 byte-identical private copies removed; `studio/studio-request.ts` re-exports it). Still 11 near-copies that differ (`client-request.ts` also returns headers; announcements, api-tokens, channel-gallery, distribution, integrations, mentions, sound-versions, track-insights, user-media, revelator) — audit before merging them.
- Split by domain into barrels: `shows/` (types, mock, wire, series, episodes, bookings, public-show), `channel-design/` (presets, header, colors, visual, mock, visual-api, look-extras, patch, saved-presets, domain), `studio-extras/` (schedule, stats, stats-plays, profile, posts), `sources/` (catalog, soundcloud, spotify, bandcamp, hearthis, export-status, stash, connections), `artist-settings/` (prefs, green-room, social, moderation, press-kit, press-kit-images, avatar, mock).
- Module-level mock state that was reassigned in place (`let mockBookings`, `mockVisual`, `mockNotifications` …) can't be assigned across modules; it now has `setMockX` setters in the owning `mock.ts`.
- Behavior unchanged; existing api/views/components tests pass.

## Studio views audit (2026-09-22)

Scope: the five 1000+ line studio views (`StudioReleaseDetailView`, `StudioShowDetailView`/`StudioEpisodeReviewView`, `StudioScheduleView`, `StudioCollectionEditView`, `StudioDistributionView`) plus a mechanical scan of all of `views/studio/`. The first scan reported almost no hand-rolled elements, but it only matched single-line tags. **Correction (2026-09-22):** a multi-line scan found real ones — see "Hand-rolled elements" below.

### Fixed in this pass
- **Collection editor:** adding a track called `reload()`, which reset the details form and dropped unsaved edits (and refetched sounds and gallery). It now refreshes only the tracklist (also after a failed reorder); `saveMeta` is try/finally.
- **Show detail:** a picked thumbnail/backdrop file was never uploaded — the show saved a `blob:` object URL as its cover. Files are uploaded first, then saved; toasts.
- **Episode review:** "Trim start/end" *removed* the range instead of keeping it (trim start 10 s cut 10 s→end, i.e. deleted the rest). New pure `trimToCuts` keeps `[start, end]` (tested). Render/approve had no catch (stuck "Rendering…"); the effect used dynamic imports of a module already imported statically and left the spinner forever on a failed load (now "Episode not found").
- **Release detail:** no loading state ("Release not found" flashed, and stayed on failure); header Save also wrote raw Spotify/Bandcamp text (bare slugs, half-typed targets) over the smart-link targets — it now saves the description only, the smart-links panel owns its targets (the lifted `spotify`/`bandcamp` state is gone); `<li>` nested in `<li>` and every track title shown twice in the playlist; Publish had no confirm/busy and stayed enabled when already published.
- **Distribution:** "Pay & submit to Revelator" (charges money, sends to stores) had no confirmation and no error handling; loads/saves/exports had no catch so `busy`/`loading` could stick; a failed release load showed the empty state forever.
- **Schedule:** cancelling a scheduled episode had no confirm; initial load had no catch (`loading` forever).

### Found, not fixed
- **Show detail:** the "Record broadcasts by default" toggle is bound to `autoPublish` (a different field); creating an *upload* episode attaches the next booking slot to it; `bookNextInterval` books tomorrow +24 h with no conflict check and leaves an orphan booking if episode creation fails; an uploaded sound is orphaned if `createEpisode` fails; identical branches in `createNewEpisode`; the statistics block is a placeholder ("will appear when analytics are available"); object URLs from `createObjectURL` are never revoked; tab state is local, not in the URL.
- **Schedule:** the dialog carries three unrelated saves (weekly recurrence, schedule one episode, save next broadcast) sharing one `busy`; the tagline, visibility, auto-publish, episode-numbering and "Start episode" fields only apply when a *new* show is created (ignored for an existing show), and the "Minutes" select only feeds the weekly recurrence though it sits by "Schedule episode". Upcoming items are matched to shows by **title** (5 `find` scans per item per memo run), `openEditor` doesn't reset stale form state when there's no next broadcast, hand-rolled `<button>` for the title and an unescaped `url(${...})` background.
- **Collection editor:** `currentTime`/`duration` subscribed at the root, so the whole 1000-line view re-renders on every `timeupdate` (same bug as ChannelView had) — extract the now-playing bar; the add-tracks dialog shows disabled "Releases/Collections/Playlists" tabs (unwired); the progress bar is a hand-rolled div with click-to-seek; `queueAllTracks` fetches sources serially; the details save is two requests (details, then gallery) with no rollback if the second fails; `genres` silently truncates to 5.
- **Release detail:** `fetchStudioReleases()` loads every release to find one (needs a by-id fetch); `fetchStudioSounds()` runs twice (view + smart-links panel) and each track row makes 2 requests (N+1) though the sounds map is already loaded; playlist reorder is mouse-drag only (no keyboard), no in-flight guard; hand-rolled `<button>` rows in the library dialog; two decorative `SearchIcon`/`FilterIcon` beside inputs; `<Link><Button/></Link>` nesting; `buildPlayable` is duplicated in the collection editor.
- **Distribution:** `activeMethods` is re-derived on every reload, discarding the user's tile toggles.

### Splits still needed (crowded views)
| View | Now | Split into |
| --- | --- | --- |
| `StudioScheduleView` | 1089 | `ScheduledTimes` (+ card/list, details dialog) and `ScheduleAnalytics` to their own files; the dialog into three forms (next broadcast / one-off episode / weekly recurrence) with a `useScheduleForm` hook (17 `useState`); pure date helpers to `lib/` |
| `StudioCollectionEditView` | ~1070 (one 984-line component) | `NowPlayingBar`, `CollectionDetailsForm`, `CollectionTracklist`, `AddTracksDialog`, `useCollectionEditor` hook (load/save/upload/reorder) |
| `StudioReleaseDetailView` | ~1150 | `ReleaseSmartLinksPanel` (431 lines: targets editor, playlist, library dialog), `ReleaseTrackRow`, `FingerprintTab`; shared `useSoundPlayable` with the collection editor |
| `StudioShowDetailView` | ~1100 | `StudioEpisodeReviewView` (286 lines) and `EpisodeEditorRow` to their own files; `ShowDefaultsForm`, `NewEpisodeDialog`, `useShowDetail` |
| `StudioDistributionView` | ~1030 | `ReleaseOpsPanel` (673 lines): catalog form, credits, checklist, submission/billing, royalties; `GuideDetail` and constants out |


### Second audit pass: the remaining eight views (2026-09-22)

Systemic: none of the eight has a single `try`/`finally`; busy flags (`setBusy(true)` … `setBusy(false)` after an `await`) and `loading` spinners stick if a request throws, and most `.then()` chains have no `.catch`. `StudioSoundView` reports every result through an inline `message`, not a toast.

- **`StudioUpdatesView`:** **sending a newsletter draft mails every subscriber with no confirmation** (outward-facing, irreversible); create/send use `.then` chains without catch, so a throw sticks `busy`; uses inline `msg` instead of toasts.
- **`StudioBrandingView`:** the press-kit gallery "replace" upload **deletes every existing image first**, then uploads — if the upload fails the gallery is gone (no confirm, deletes unchecked, `busy` stuck on a throw); hand-rolled `<label>`s and a `<a><Button/></a>` for the ZIP download.
- **`StudioPlaylistsView`:** the tracklist's row remove button deletes with **no confirmation** (a `ConfirmDialog` exists for the other remove path but the table bypasses it) and ignores failure (`.then(() => reload())`); every add/save calls `reload()`, which resets the settings form (unsaved edits lost, same bug as the collection editor); the add-track select offers tracks already in the playlist; the editor (520 lines) is a near-copy of `StudioCollectionEditView` (cover upload, reorder, remove, add, `buildPlayable`, playback) — share a `useCollectionEditor` hook and components.
- **`StudioGoLiveView`:** "Go live" hands the channel rotation over to the broadcast with no confirmation, and reports through `message`; the destination enable/disable and delete use `.then` with no catch; the whole 660-line component holds the preflight, credentials, recording, multistream and signal polling.
- **`StudioStatsView`:** 9 requests in one `Promise.all` that re-run **in full** whenever the top-list dimension or sort changes (summary, egress, live, grant and geo don't depend on either — over-fetch, same shape as the DesktopLibraryPanel refresh bug); one failure leaves `loading` forever; for "Custom" and "1 day" the top tracks/countries silently use the last 30 days while the header says otherwise; `minutesListened` assumes a 192 kbps stream.
- **`StudioHomeView`:** loads the whole library (all sounds, collections, releases) only to show three counts (needs a counts endpoint); no catch, so `discographyLoaded` never flips; governance motions and requests load for every studio visit.
- **`StudioSoundView`:** six independent busy flags; no `key` per sound, so tab/message/form state carry over when navigating between sounds; "Quick auto-trim" appends the same silence cuts on every click (stacks duplicates) and falls back to a 180 s duration when the sound has none; `startPlayback` leaves `playBusy` stuck if the source fetch throws; polling calls have no catch.
- **`StudioSoundsView`:** `loading` set without finally, delete `.then(reload)` ignores failure.

### Splits done in the studio pass (2026-09-22)

Ten views split into folders next to them (behavior unchanged, tests green): `schedule/` (`ScheduledTimes`, `ScheduleAnalytics`, `schedule-helpers`), `release-detail/` (`ReleaseSmartLinksPanel`, `ReleaseTrackRow`), `show-detail/` (`EpisodeEditorRow`, `StudioEpisodeReviewView`, lazy route updated), `distribution/` (`ReleaseOpsPanel`, `GuideDetail`, content + helpers), `playlists/` (`StudioPlaylistEditorView`, route updated), `branding/` (`PressKitPreview`), `collection-edit/` (`NowPlayingBar` — owns the playback-tick subscriptions, so the editor no longer re-renders every tick; `AddTracksDialog` — owns its search, drops the disabled placeholder tabs), `updates/` (`NewPostDialog`, `NewDraftDialog`, `PostPreview`; also confirm before sending a newsletter), `go-live/` (`MultistreamPanel` with its dialogs), `home/` (tiles, broadcast row, helpers).

Still big: `distribution/ReleaseOpsPanel` 770, `StudioBrandingView` 708 (one 618-line `StudioBrandingPanel`: needs a `usePressKit` hook and per-tab sections), `StudioCollectionEditView` 917, `StudioReleaseDetailView` 644, `StudioShowDetailView` 694, `StudioScheduleView` 755 (its three-form dialog is still inline), `StudioGoLiveView` 629, `StudioHomeView` 539, `StudioSoundView` 752 (683-line component), `StudioStatsView` 697.

### Hand-rolled elements (multi-line scan, 2026-09-22)

Replaced with `Button` this pass: the image-thumbnail buttons in `updates/PostPreview` and `StudioUpdatesView`, the "Show info" chip in `StudioGoLiveView`, "Create your channel" in `StudioHomeView`, the library rows in `release-detail/ReleaseSmartLinksPanel`, the show-title button in `schedule/ScheduledTimes`.

Still open: `<img>` in `StudioBrandingView` (~594) and `branding/PressKitPreview` (two) → `MediaArtwork`; `<input>` in `components/channel-designer/ColorSchemeFields`; `<img>` in `components/channel-designer/VideoOrImageField`; `<a>` links (`ReleaseTrackRow`, four in `distribution/ReleaseOpsPanel`, `GuideDetail`, `StudioReleasesView`, `StudioMasteringView`, `StudioBrandingView` ZIP download) — blocked on a `@tahti-player/ui` external-link component, which is the actual gap; also `<Link><Button/></Link>` nesting in several views.

### Fix queue for the audited views (2026-09-22, done except where noted)

Fix, in this order (tick when done; each finished item moves to HISTORY):

- [x] Playlists: table row remove goes through the confirm dialog and reports failure; add-track select hides tracks already in the playlist; add/save refresh only the tracklist (`reload()` resets the settings form).
- [x] Branding: press-kit "replace" uploads first, deletes the old images only after a successful upload; try/finally on `busy`; `<img>` → `MediaArtwork`.
- [x] Show detail: rename/fix the "Record broadcasts by default" toggle (bound to `autoPublish`); uploaded episodes don't grab the next booking; orphaned upload if `createEpisode` fails; drop the identical branches; revoke object URLs; loading state.
- [x] Schedule: existing-show selection disables/hides the create-only fields (tagline, visibility, auto-publish, numbering, start episode); move "Minutes" into the recurrence section; match upcoming items by id, not title; reset the form in `openEditor`; three forms.
- [x] Collection editor: one request/rollback for details+gallery (or report partial failure); warn when genres are truncated to 5; parallel `queueAllTracks`.
- [x] Release detail: pass the loaded sound to track rows (N+1); share `useSoundPlayable` with the collection editor; keyboard reorder.
- [x] Distribution: derive `activeMethods` once, not on every reload.
- [x] Stats: separate the top-list request from the other eight; label/honour the custom and 1-day ranges; one failure must not leave `loading`; document the 192 kbps assumption.
- [x] Home: catch failures (`discographyLoaded`), stop loading the whole library for three counts.
- [x] Sound view: `key` by id; auto-trim doesn't stack duplicate cuts; toasts; `playBusy` in finally.
- [x] Sounds view: catch, delete failure feedback.
- [x] Go live: confirm before going live; toasts; catches on destination toggle/delete.

Notes on the fix queue: Schedule — upcoming broadcasts linked to shows by title; fixed 2026-09-23 (later), see the "Backend / API needed" entry below — the API already had a show id (`seriesId`), the frontend just wasn't reading it. The three-form split of the dialog is still not done. Home — the three discography counts still fetch the whole library; fixed 2026-09-23 (later), see below. Stats — "Custom" and "1 day" used to fall back to the last 30 days for top tracks/countries; fixed 2026-09-23 (later), see below. Sound view — the destructive/quick actions still lack tests; no fix in this pass added tests beyond `trimToCuts`.

## Test coverage + a bug fix (2026-09-22, `docs/storybook-studio-extracted-stories`)

Added the 8 of 9 "Tests missing" tests listed above (`usePressKit.test.ts`, `useStatsData.test.ts`, `ScheduleEditorDialog.test.tsx`, `StudioPlaylistEditorView.test.tsx`, `StudioUpdatesView.test.tsx`, `StudioGoLiveView.test.tsx`, `DeliveryTab.test.tsx`, `StudioCollectionEditView.test.tsx`), plus a UI-library follow-up: `@tahti-player/ui` `Input` gained a `color` variant (was listed under "UI library" below as a remaining hand-rolled `<input>`), and `ColorSchemeFields` now uses it.

Also ran a bug/inconsistency scan while doing this pass and fixed one real bug found:

- **`RoundImageUploadButton` (shared component — used by every avatar/backdrop/press-kit-avatar upload in the app) had no `try`/`catch`/`finally` around its upload call.** A thrown error (network failure, `uploadUserMediaFile`/`uploadProfileAvatar`/etc. rejecting instead of returning `{ok:false}`) left the button stuck showing "busy" forever with no error toast — the same "stuck on a throw" pattern flagged repeatedly elsewhere in this doc, just not previously caught here because this component predates the studio-view audit passes. Fixed with try/finally + an error toast; test added (`RoundImageUploadButton.test.tsx`).
- Scanned for other hand-rolled/unwired elements while in these files; nothing else new found beyond what's already tracked in "Hand-rolled elements" and "Not fixed from the studio audit" below (`channel-designer/ColorSchemeFields`'s `<input type="color">` is now fixed by the `Input` `color` variant above; `channel-designer/VideoOrImageField`'s decorative full-bleed `<img>`/`<video>` backdrop preview is deliberately left hand-rolled, same reasoning as `ChannelView`'s backdrop image — `MediaArtwork` doesn't fit a non-square, non-interactive preview).

2026-09-22 (later): **show detail uploads a picked image before saving** now has a test (`useShowDetail.test.ts`) — the last of the 9 "Tests missing" items is covered.

## Open items after the studio pass (2026-09-22) — everything not done yet

Nothing above was dropped; this is the consolidated list of what is still open.

**Backend / API needed** — 2026-09-23: user authorized backend work in `../tahti-org`. Investigated all four via a subagent before touching anything (exact routes/Prisma models, effort estimate per item) — findings below. Implemented in a new `../tahti-org` worktree (`.claude/worktrees/god-module-api-slices`, branch `feat/god-module-api-slices`) rather than the main checkout, which had an unrelated in-progress interactive rebase (`docs/cleanup-nuclear-refs-2`) that must not be disturbed.
- [x] `fetchStudioRelease(id)` (Release detail loaded every release to find one). Backend: new `GET /api/me/releases/:id` in `apps/api/src/routes/releases/me.ts`, reusing a `meReleaseSelect`/`serializeMeRelease` extracted from the list route (same shape, artwork URL resolved, track audioUrl presigned, checklist computed) — 2 new tests (happy path + cross-user 404), `releases.test.ts` now 9/9. Frontend: `fetchStudioRelease(id)` in `api/studio/studio-releases.ts`, `useReleaseDetail.ts` swapped off the client-side `.find()`.
- [x] A counts endpoint for Studio Home (sounds/collections/releases). Investigation found releases needed **zero backend work** — `GET /api/me/releases` already returns `total` from a `prisma.release.count()`, the frontend was just reading `.releases.length` instead (real correctness bug for artists with >100 releases, now fixed). Sounds and collections got new `GET /api/me/sound/count` / `GET /api/me/collections/count` routes (`prisma.sound.count()`/`prisma.collection.count()`, ~15 lines each) plus a shared `CountSchema` in `@tahti/shared`'s `responses/sounds.ts` — 2 new tests. Frontend: `fetchStudioSoundCount`/`fetchStudioCollectionCount` added, `StudioHomeView.tsx` swapped off `fetchStudioSounds()`/`fetchStudioCollections()` (full-list fetches used only for `.length`); `StudioHomeView.test.tsx`'s mocks updated to match.
- [x] 2026-09-23 (later): `showId` on `UpcomingBroadcast` (Schedule links upcoming items to shows by title today). Turned out to be a **pure frontend bug, no backend change needed** — the earlier investigation (which fed the `RadioSlotBooking`→`LiveShowSeries` work below) had grepped the wrong API surface and missed that `UpcomingBroadcast` actually comes from `fetchUpcomingBroadcasts()` → `GET /api/me/channel/show-series`'s `scheduledShows`, backed by `ScheduledLiveShow` — which already has a required `seriesId` column, already serialized by `ScheduledLiveShowViewSchema`, already in the wire JSON. The frontend's `UpcomingBroadcast` type just didn't declare the field and `useScheduleForm.ts` was matching shows by title instead (`showByTitle.get(item.title)`, a real bug — two shows sharing a title would resolve to whichever the `Map` happened to keep). Fixed: `UpcomingBroadcast` gained `showId` (mapped from wire `seriesId`), `useScheduleForm.ts`'s title-based `Map` replaced with an id-based one shared by both the `scheduledShows` and `upcoming` rows. 2 new tests (`useScheduleForm.test.ts`) cover the exact bug — two shows with the same title, asserting the *correct* one's description/artwork win via `showId`, not whichever title-match happened to be in the map.
- Independently, `RadioSlotBooking` (a different model — used by `useShowDetail.ts`'s slot-booking flow, not the Schedule view's `UpcomingBroadcast`) really did have no direct FK to `LiveShowSeries`; that's shipped separately as [tahti-org#553](https://github.com/janiluuk/tahti-org/pull/553) (join through the optional `LiveShowEpisode.radioSlotBookingId`) — real and independently useful, just not the fix for *this* item as originally scoped.
- [x] 2026-09-23 (later): Top-list windows for "Custom" and "1 day" ranges. Backend (`../tahti-org` PR #552): `buildTopTracksStats`/`buildTopCountriesStats` gained the same optional `{from, to}` window `buildArtistPlaysStats` already had; both routes parse `from`/`to` the same way `GET /api/me/stats/plays` does. `top-lists` (period-bucketed: week/month/half_year/all_time, cached) is a separate coarser system with no day-level or arbitrary-range concept — left out, would need the cache-key scheme extended to a since/until pair. Frontend: `fetchStatsTopTracks`/`fetchStatsTopCountries` now accept `{range, from, to}` and send the real custom window instead of silently falling back to 30 days; also found and fixed a second bug on the way — the frontend was *additionally* falling back to 30 days for `range==='1'` even though the backend already supported it (`rangeDays('1')` returns 1), so "1 day" now shows real 1-day data too. `topRange` (used only for a "last N days" panel title, which broke for `range==='all'` → "last all days") replaced with a proper `topRangeLabel` covering all five range values including a custom `from to` string. `topListRange` keeps the 30-day fallback since top-lists genuinely has no finer granularity.

**UI library**
- [x] 2026-09-22: added `ExternalLink` to `@tahti-player/ui` (Storybook story included) and used it in `ReleaseOpsPanel`, `GuideDetail`, `GuidesTab`, `PressKitSection`'s ZIP download. 2026-09-22 (later): migrated the remaining flagged hand-rolled `<a target=_blank>` sites too — `release-detail/ReleaseTrackRow`'s and `StudioReleasesView`'s Bandcamp icon links, `plugin-store/radio-category/StationDetailsDialog`'s two links, `service-category/OAuthServiceCard`'s instructions link, `service-category/HearthisCard`'s track link. `StudioMasteringView`'s "Download WAV" `<a><Button/></a>` turned out to be the `<Link><Button/></Link>`-nesting issue, not a `target=_blank` case — still open, along with the rest of that nesting pattern elsewhere.
- [x] 2026-09-22: `<input>` in `channel-designer/ColorSchemeFields` → new `Input` `color` variant in `@tahti-player/ui`.
- Left alone (deliberate exception, same reasoning as `ChannelView`'s backdrop `<img>`): `<img>`/`<video>` in `channel-designer/VideoOrImageField`'s decorative full-bleed backdrop preview — `MediaArtwork` doesn't fit a non-square, non-interactive preview.

**Splits still to do** (baselined over 800 lines): `StudioSoundView` 533/`StudioStatsView` 462/`StudioScheduleView` 137 — all now under or near baseline, see 2026-09-22 entry below. `TrackEditDialog`/`LocalPlaylists`/`StreamManagerPanel`/`AdminStorageView` done 2026-09-23 (see sweep table). **`StudioGoLiveView` done 2026-09-23 (later):** 494→169-line shell + `go-live/{CopyField,SignalPanel,BroadcastCredentialsPanel,RecordingPanel}.tsx` (49-137 lines each), same whole-state-object-as-prop pattern as the other splits; `useGoLiveState.ts` gained the `analyser` selector and an exported `GoLiveState` type for the panels to share. **`StudioHomeView` done 2026-09-23 (later):** 562→123-line shell + `home/{useStudioHome,SummaryStatsSection,UpcomingShowsSection,GovernanceSection,MusicAudienceGrids}` (already-extracted `HomeTiles`/`RecentBroadcastRow`/`home-helpers` from an earlier pass reused as-is). Zero behavior change for both; `tsc`/`eslint`/full vitest (848/848) pass; both Storybook stories only import the top-level export, unaffected. Still open: the 11 `requestJson` near-copies that differ (see api splits).

### Third split pass (2026-09-22)

`distribution/ReleaseOpsPanel` (776→499: `CreditsEditor`, `DeliveryTab`, `GuidesTab` extracted), `StudioBrandingView` (724→166: `usePressKit` hook, `ProfilePictureSection`/`GallerySection`/`PressKitSection`), `StudioCollectionEditView` (919→730: `useCollectionPlayback`, `useCollectionImages` hooks), `StudioReleaseDetailView` (645→457: `useReleaseDetail` hook), `StudioShowDetailView` (712→521: `useShowDetail` hook), `StudioScheduleView` (776→137: `useScheduleForm` hook + `ScheduleEditorDialog`), `StudioGoLiveView` (645→798 total across view+`useGoLiveState.ts`, state/effects moved out of the view), `StudioSoundView` (773→533: `useSoundEditor` hook), `StudioStatsView` (730→462: `useStatsData` hook). All type-check, lint, and the full vitest suite (136 files / 825 tests) pass. `StudioHomeView` (562) was left alone — already under the 800-line baseline.

**Not fixed from the studio audit**
- [x] 2026-09-22 (later): Show detail's `bookNextInterval` now cancels the just-created booking (`cancelShowBooking`) when `createEpisode` fails afterward, instead of leaving an orphan slot with no episode; the message tells the user whether the release succeeded. A true pre-booking conflict check isn't implementable client-side — `bookings` only exposes the caller's own slots (`isMine`), so there's no way to see other users' bookings to check against; the server already rejects a conflicting `createShowBooking` and that error surfaces via `setMsg`. Tab state (`showTab`) now lives in the URL (`?tab=`) via a new `validateSearch` on `studioShowDetailRoute`, same pattern as `StudioSoundsView`'s `folder`. Re-checked the episode "Statistics" block: it already shows status/source/audio/created/scheduled and is upfront that listener totals aren't available yet — not actually a placeholder, the note above was stale.
- [x] Collection editor: details and backdrop gallery now save in one request (2026-09-23, tahti-org #557: `PATCH /api/me/collections/:slug` takes `gallery`, applied in the same row update). The same PR found `visibility` was stripped by the API schema, so "Unlisted"/"Private" never saved; it is accepted now (editor Private ↔ API `DRAFT`). The editor's `releaseDate`, `genres` and `backdropUrl` were dropped too (no columns); the user chose to store them, so the same PR adds the columns (migration `20260923170000_collection_details`) and the API returns the date as `YYYY-MM-DD`.
- [x] 2026-09-22 (later): Playlists list `create` and `reload` wrapped in try/finally / `.catch` (busy and loading no longer stick on a throw, load failure now toasts); Branding bio save and avatar upload already had try/catch from an earlier pass (todo was stale, no change needed); Updates' post list `reload` and delete-post `.then`, and GoLive's `MultistreamPanel` enable/disable and remove-destination `.then` chains all gained `.catch`. The playlist editor's own `reload` and drag-reorder `.then` chains (same file family, found during this pass) got the same fix.
- [x] 2026-09-22 (later): Sound view's `tab` now lives in the URL (`?tab=`) via a new `validateSearch` on `studioSoundItemRoute`. Re-checked the "six busy flags": there are five (`saving`, `pinBusy`, `rotationBusy`, `playBusy`, `quickBusy`) and each gates an independent action (save / pin / rotation / play / quick-render) with its own try/finally already in place from the earlier fix-queue pass — separate flags are correct here (merging them would let one action's spinner block an unrelated button), so left alone as a judgment call, not a bug.

**Tests missing** — **2026-09-22: 9 of 9 added.** Collection editor add-track keeps form edits, playlists confirm-before-remove, Branding (`usePressKit`) replace-upload order, Updates confirm-before-send, Distribution confirm-before-submit, Stats top-list-only refetch, Schedule disabled create-only fields, Go live confirm, and (later the same day) show detail's picked-image-uploads-before-save (`useShowDetail.test.ts`) all now have tests.

**Verification in the running app** (still nothing exercised visually): the plugin-store cards (Spotify, hearthis, Bandcamp/SoundCloud, Radio), channel edit mode, the designer, the Pro editor, and now the studio views changed in this pass. Blocked: the local API stack needs disk space (`stack-up.sh --seed` in `../tahti-org` failed when the disk filled; ~51 GB of reclaimable Docker volumes on this machine) — the dev login returns 500 until it is up.

### Tenth pass (2026-09-23): five more slices

Split the last five non-data files over the 800-line baseline. Each is now a small shell plus a folder next to it, using the same whole-state-object-as-prop pattern as earlier passes. `pnpm check:file-size --update` leaves only `api/client.ts`, `api/types.ts`, `channel-designer/useChannelLook.ts`, `nativeLibrary.types.ts` and `themes/presets.ts` in the baseline (data/type files, plus `client.ts`, which is already tracked in codebase-refactor-hotspots.md).

- `mcp/metadata.rs` 1004 → `mcp/metadata/{domains,methods,types}.rs` + re-exporting `mod.rs`. New tests: every method `list_methods` advertises has `method_details`, and unknown lookups list the alternatives. Previously the file had no tests.
- `admin/AdminAddonsView.tsx` 1075 → 214 + `admin/addons/{useAdminAddons,AddonCard,RegisterDialog,RejectDialog,ManageDialog,InstallPickerDialog,InstallsPanel,shared}`. **Bug fixed:** when half of a surface-install reorder failed, the error was wiped immediately, because `reloadInstalls` clears `installsError` and it ran after the error was set. New `useAdminAddons.test.ts` (5 cases: filters, install candidates, approve, reorder swap, half-failed reorder).
- `TrackDetailView.tsx` 1047 → 132 + `track-detail/{useTrackDetail,buildTrackPage,TrackHero,TrackBody,helpers}`. `buildTrackPage` is a plain function, not a hook: it holds everything the view computed after its loading/empty early return, so no hook order changed. New `buildTrackPage.test.ts` (5 cases: progress/active cue, other track current, timed-comment markers, toggle playback, buy visibility).
- `AppTopNav.tsx` 877 → 148 + `app-top-nav/{useTopNavState,ProcessingIndicator,BroadcastControls,NotificationsPopover,MessagesPopover,UserMenu,shared}`. New `AppTopNav.test.tsx` smoke test (signed-out vs signed-in actions; account menu opens and closes on Escape).
- `MoreView.tsx` 804 → 161 + `more/{features,FeatureCompareCard,SavedMapComments}`. **Fixed:** "Clear log" wiped every saved map comment with no confirmation. It now goes through `ConfirmDialog` and toasts on success. New `SavedMapComments.test.tsx` (3 cases).

Full web suite: 863 passing (848 before). Rust lib: 217 passing. `tsc`/`eslint` clean.

**Not done (flagged):**
- `AppTopNav` still has 16 hand-rolled `<button>`s using `iconBtnClass`. They were moved verbatim, not migrated to `Button`: this is the most visible chrome in the app, `Button`'s base classes (`rounded-md`, `active:scale-95`) would change its look, and nothing can be checked visually while the local stack is down.
- `useTopNavState` polls the full `fetchStudioSounds()` list every 5 s just to find PENDING/PROCESSING items. Candidate for a status-only endpoint (see api-slow-requests.md).

### Eleventh pass (2026-09-23): last two logic files out of the size baseline

- `channel-designer/useChannelLook.ts` 829 → 700: the picked-backdrop file (type/size checks, blob URL revoke on replace/discard/unmount) is now `usePendingBackdropFile`, and the saved-looks list with its save/delete dialogs is `useSavedPresets`. The three copies of the gallery newline split are one `splitGalleryImages` in `slideshowOptions.ts`. Small side effect: a save that uploads the picked file now revokes the current blob URL through the ref, so a file picked while the upload ran no longer leaks its URL. New `usePendingBackdropFile.test.ts` (2 cases). Existing designer tests (72) unchanged and passing.
- `lib/nativeLibrary.types.ts` 852 → 90: split into `lib/native-library/{tracks,playlists,catalog,analysis}.ts` (tracks also holds the page/import/root types). The old file keeps `TahtiNativeLibrary` and re-exports the rest, so no import changed.

Baseline now holds only `api/client.ts` (tracked in codebase-refactor-hotspots.md), `api/types.ts` and `themes/presets.ts` (data/type files). Web suite 865 passing; `tsc`/`eslint` clean.

### Twelfth pass (2026-09-23): open-list items that don't need the running app

- **Pro editor unsaved-changes prompt.** Edits from the waveform and mastering panels go through one `edit` wrapper that sets `dirty`. Saving a draft (or the save before a render) clears it only if nothing was edited meanwhile (edit revision counter, same as the designer). While dirty, the router's `useBlocker` stops in-app navigation with a "Leave without saving?" `Dialog` (Stay / Leave without saving) and `beforeunload` covers reloads and tab close. The duration read from the decoded audio does not count as an edit. First use of `useBlocker` in the app.
- New `StudioProEditorView.test.tsx` (4 cases): renders the whole view in mock mode; leaves freely with no edits; asks after an edit, Stay keeps the page, and after Save draft it leaves without asking; "Leave without saving" navigates.
- New `ChannelView.test.tsx` (2 cases): a visitor opening `?edit=true` gets the page without the editor; the owner gets edit mode from the URL (Save disabled while clean), and Done leaves it and clears `?edit`.
- `QueuePanel` test timeout fixed (see the item above).

Web suite 871 passing, `ui` 353 passing; `tsc`/`eslint` clean.

### Thirteenth pass (2026-09-23): close-out

- `AppTopNav`: all 16 hand-rolled `<button>`s now use `Button` (`variant="text"`, `icon-sm` or `flexible`), keeping the existing classes through tailwind-merge; the press-scale is neutralized and icon buttons gained a visible focus ring. Checked in the running app at desktop and phone widths.
- Pro editor: drafts saved before the server kept `pluginChain` come back without one while their plugins can still be enabled (and rendered). `withLegacyChain` rebuilds the chain from the enabled flags in the old render order on load; `chainForRender` sends only chained plugins whose add-on is installed, so preview and export agree. Tests in `plugins/audio-fx/chain.test.ts`.
- `ChannelView` preset look as a draft (see the item above).

Backend follow-ups done the same day (tahti-org #557): the top bar polls `GET /api/me/sound/processing` (processing items + watched upload ids) every 5 s only while something is processing, 30 s otherwise, instead of the full sounds list every 5 s; the collection editor's combined save is noted above.
