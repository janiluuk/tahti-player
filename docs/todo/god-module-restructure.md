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
| ~~P1~~ done | `packages/tahti-web/src/api/{shows,channel-design,studio-extras,sources,artist-settings}.ts` | 1000-1330 → 47-140 each (2026-09-22): barrels re-exporting `api/<name>/<domain>.ts`, imports unchanged | |
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
- [x] `RadioCategory.tsx` split + audit (2026-09-22, 1264 → 15): see below.
- [ ] Next offenders to split (baselined): see the sweep table (`TrackEditDialog`, `LocalPlaylists`, `StreamManagerPanel`, unassessed studio/admin views).
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
- Not changed: markers aren't persisted (not part of the edit list); playback ignores cuts by design (removed on render); no unsaved-changes prompt on leaving; no test renders the whole view.

## Next up (2026-09-22)

- [x] `ChannelDesigner.tsx` split (2026-09-22, 1697 → 757, out of the size baseline): `useChannelLook` (draft state, load/save/presets/gallery/backdrop), `useLookVisibility`, `useDockedControlsRail`, `ChannelPagePreview`, and pure `buildVisualPatch` / `buildLoadedLook` / `applyPresetToVisual` / `LookSnapshot`, with tests. Only the panel slot builders remain in the component.
- [x] `ChannelDesigner`: `dirty` no longer cleared by a save when the user edited while it was in flight (edit revision counter; no dedicated test yet).
- [x] `ArtistView.tsx` split + audit (2026-09-22, 1409 → 787, out of the baseline): see below.
- [x] `ServiceCategory.tsx` split + audit (2026-09-22, 1401 → 93, out of the baseline): see below.
- [ ] Visually verify the designer changes in the running app (slideshow reorder preview, Reset/Revert with a pending backdrop file, gradient toggles, right-rail collapse); only unit and smoke tests cover them so far.
- [ ] Visually verify in the running app: channel edit mode (no spinner on save, Done saves look+links, rail stays collapsed, layout toggles reach the parent) and the Pro editor (cut/trim merge, kept duration, stems, mastering chain, switching tracks).
- [ ] Pro editor follow-ups: persist markers (not in the edit list today), unsaved-changes prompt on leaving, a smoke test that renders the whole view.
- [ ] `ChannelView`: `applyPreset` saves the preset's look to the server immediately though its note says "save layout to keep it"; decide whether the look should be draft-until-Save; add a smoke test for the full view.
- [ ] `ui` `QueuePanel` test "skips offscreen layout only for long queues" failed once in a full `ui` run but passes alone; check whether it is flaky.

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

Scope: the five 1000+ line studio views (`StudioReleaseDetailView`, `StudioShowDetailView`/`StudioEpisodeReviewView`, `StudioScheduleView`, `StudioCollectionEditView`, `StudioDistributionView`) plus a mechanical scan of all of `views/studio/`. The scan found almost no hand-rolled elements (only two `<a>` for external/download links, no ui link component) and no `TODO`s; the problems are logic and structure.

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

Not audited yet: `StudioPlaylistsView` (800), `StudioGoLiveView` (798), `StudioBrandingView` (759), `StudioSoundView` (751), `StudioHomeView` (722), `StudioStatsView` (696), `StudioUpdatesView`, `StudioSoundsView`.
