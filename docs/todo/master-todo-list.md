# Tahti Player — Master TODO List (Performance + Structure + Bugs + Flaky)

**Created:** 2026-09-23
**Scope:** Code audit findings across `packages/tahti-web`, `packages/player`, `packages/plugin-sdk`, `packages/hifi`, and supporting packages. Also folds in all open/partial items from `docs/todo/INDEX.md` and `tahti-org/docs/remaining-work.md`.
**Rules:** When a task is finished → append summary to `HISTORY.md` → delete the todo file → update this list → update INDEX.md. Never leave `[x]` / "Done" rows here.

---

## P0 — Blocking bugs & data safety

| ID | Item | Source | Status |
|----|------|--------|--------|
| P0-01 | **Radio channel page `db push` skips migration data statements** — pipeline fix opened as tahti-org#532 but still needs the user to run a one-time prod baseline before/after merging. | radio-channel-page.md | 🟡 Open |
| P0-02 | **Release player workflow broken** — root cause fixed 2026-09-07, but needs user to run `gh secret set` for two GitHub secrets to complete the fix. | release-player-workflow-broken.md | 🟡 Open |

## P1 — Performance (memory leaks, rendering, startup)

| ID | Item | Source | Status | Details / Notes |
|----|------|--------|--------|-----------------|
| P1-01 | **setInterval leak audit** — 8 `setInterval` calls across packages. Verify every call has a corresponding `clearInterval` at all exit paths (unmount, error, conditional). | codebase-refactor audit | 🟡 Open | Files: `store.ts`, `notificationInboxStore.ts`, `MultitrackTimeline.tsx`, `ApiConnectionIndicator.tsx`, `ChannelDesigner.tsx`, `ChannelSlideshowBackdrop.tsx`, `usePolling.ts`, `ListenView.tsx`, `GapJumpController.ts`. `DiscordHandler` heartbeat also. |
| P1-02 | **562 `useEffect` hooks — verify cleanup on all** | codebase-refactor audit | 🟡 Open | High count suggests many have effects; audit for missing cleanup functions. Focus: any `useEffect` that registers an event listener (`addEventListener`, `EventTarget`) or starts a network request must return cleanup. |
| P1-03 | **ChannelDesigner still ~1800 LOC with ~20 closure variables** in the slideshow/gallery section (items 12, 20 from hotspots) | codebase-refactor-hotspots.md items 12 & 20 | 🟡 Open | Remaining body needs prop-threading or a shared custom hook before a real state/effects test is practical. First-ever smoke tests added 2026-09-18 (see item 21). |
| P1-04 | **ChannelView ~1576 LOC — `hero` case closes over 50+ variables** | codebase-refactor audit, hotspots item 14 | 🟡 Open | First slice done (items 17–19): extracted `renderBlock` cases to `ChannelViewBlocks.tsx`, `ChannelHeroBlock` extracted, `useChannelLayoutEditing` hook extracted. Remaining: hero/stagePlayer composition. No test coverage exists for this component. |
| P1-05 | **`notificationInboxStore.ts` store-level singleton — add visibility pause** (20s poll, Phase 3C) | performance-cleanup-bulk.md section 3C | 🟡 Partial | Poll timer at line 115 uses `setInterval`. Needs `document.visibilitychange` pause. |
| P1-06 | **Release-build CPU/native-memory profiling baseline** — not started (later-scheduled task) | player-performance-optimizations.md Phase 1 | 🔴 Not started | Profile a production release Tauri build: cold/warm startup, CPU samples/flamegraphs for Rust + WebView processes, native memory across process tree. Set explicit budgets. |
| P1-07 | **Queue virtualization** — scale to large queues (10k items) requires windowed rendering, stable indexed lookups, and isolated playback progress rerenders. | player-performance-optimizations.md Phase 3 | 🔴 Not started | `QueuePanel` rows currently full-render; virtualize while preserving drag reorder and keyboard access. |
| P1-08 | **Lazy-load remaining noninitial routes** + inspect eager shared imports that defeat splitting. | player-performance-performance-optimizations.md Phase 2 | 🔴 Not started | |
| P1-09 | **Visualizer work reduction** — keep renderer/scene lifetime independent of play/pause; update changing inputs without scene reconstruction; move resize/projection to actual size changes; suspend offscreen work. | player-performance-optimizations.md Phase 5 | 🔴 Not started | |
| P1-10 | **Unblocked primary listening content** — publish on-air content independently of slower widgets (shows, presets) with section-specific loading/error states; cache/reuse reads, narrow invalidation. | player-performance-optimizations.md Phase 6 | 🔴 Not started | |

## P2 — Structural hotspots (god modules, coupling, maintainability)

| ID | Item | LOC | Source | Status |
|----|------|-----|--------|--------|
| P2-01 | **`ChannelDesigner.tsx`** — remaining body (state, effects, save/preset logic, ~180-line slideshow), tightly closure-coupled. Needs 15-30+ closure variables → prop-threading or shared custom hook. First smoke test added 2026-09-18. | ~1800 | hotspots item 12/20 | 🟡 Open (partial) |
| P2-02 | **`ChannelView.tsx`** — hero + stagePlayer still inline orchestration (~1576 LOC). No test coverage. Hooks-order bug fixed (PR #94), low-coupling blocks extracted, layout state moved to hook. | ~1576 | hotspots item 14 | 🟡 Open (partial) |
| **StudioProEditorView.tsx** — studio god component | ~1497 | audit table | 🟡 Open |
| P2-04 | **`TrackEditDialog.tsx`** - studio god component (duplicate code, duplicate with `StudioReleaseDetailView`). | ~1174 | audit table + hotspots | 🟡 Open |
| P2-05 | **`StudioReleaseDetailView.tsx`** | ~1149 | audit table | 🟡 Open |
| P2-06 | **`Artist-settings.ts`** (API module) | ~1054 | audit table | 🟡 Open |
| P2-07 | **`TrackDetailView.tsx`** — studio god component (duplicate code, merge with `StudioReleaseDetailView`). | ~1054 | audit table + hotspots | 🟡 Open |
| P2-08 | **`AdminAddonsView.tsx`** | ~1075 | audit table | 🟡 Open |
| P2-09 | **`StudioDistributionView.tsx`** (studio god component) | ~1026 | audit table + hotspots | 🟡 Open |
| P2-10 | **Parallel HTTP stacks** — `admin.ts` embeds own `apiBase`/`getJson`/`sendJson`; `client.ts` has `requestJson` + mock-fallback wrappers. One shared transport reduces "fix auth once, miss admin." | hotspots coupling note | 🟡 Open | Extracted/shared transport in `api/http.ts` exists; audit remaining modules for direct HTTP calls instead of using it. |
| P2-11 | **Import fan-out — barrel re-exports** make file splits cheap but renaming symbols expensive. | hotspots | 🟡 Done | admin ~39 importers, client ~56, studio ~77, router ~147. |
| P2-12 | **`mock.ts` (~1470 lines) + per-domain mocks** keep client modules fat. When splitting, move mock branches with the domain instead of one larger mock god-file. | hotspots | 🟡 Open | Prefer extracting with domains. |

## P3 — Code quality + bug risks (audit findings from live scan)

| ID | Item | Count/Loc | Category | Status |
|----|------|-----------|----------|--------|
| P3-01 | **`any` type usage** — grep found zero in non-comment code; excellent. `packages/tahti-web/src/components/SoundShareLinksSection.tsx`, and others appear to use `any` only in comments (`// System rule: any field...`), not as actual type annotations. N/A ✅ | 0 real findings | Type safety | ✅ Verified clean |
| P3-02 | **`console.log`/debug leak audit** — grep returned zero results. Clean. ✅ | 0 findings | Debug hygiene | ✅ Verified clean |
| P3-03 | **38 `.catch()` patterns** — verify each has proper error logging/reporting (not silently swallowed). | 38 matches | Error handling | 🟡 Open | Check especially for silent catches like `data?.catch(() => {})` or empty handlers. |
| P3-04 | **Untracked TODOs/FIXMEs/HACKs** — none found in grep scan, meaning either they're all tracked as PLAT/x issues or genuinely not commented. Good. ✅ | 0 findings | Task tracking | ✅ Verified clean |

## P4 — Player performance optimizations (deferred, later scheduling)

| ID | Item | Scope | Source | Status |
|----|------|-------|--------|--------|
| P4-01 | **Establish baseline** — profile production release Tauri build on target desktop. Record commit, flags, hardware, fixture sizes. Separate StrictMode overhead from real metrics. | Phase 1 (player) | player-performance-optimizations.md | 🔴 Not started |
| P4-02 | **Reduce startup work** — lazy-load remaining noninitial routes + dialogs; inspect eager shared imports. | Phase 2 | Same document | 🔴 Not started |
| P4-03 | **Queue virtualization** — windowed rendering, stable indexed lookups, isolated playback rerenders. | Phase 3 | Same document | 🔴 Not started |
| P4-04 | **Stabilize playback updates** — memoize/select current item and playable metadata; update MediaSession metadata only when fields change. | Phase 4 | Same document | 🔴 Not started |
| P4-05 | **Visualizer optimization** — renderer/scene lifetime independent of play/pause; resize work on actual size changes; offscreen suspension. | Phase 5 | Same document | 🔴 Not started |
| P4-06 | **Unblock primary content first** — publish on-air independently of slower widgets; cache/reuse reads with narrow invalidation. | Phase 6 | Same document | 🔴 Not started |

## P5 — Open todo items from INDEX.md (product/ops tasks)

| ID | Item | Notes | Dependencies |
|----|------|-------|-------------|
| P5-01 | **Desktop pro library** — missing file check, file relink work end-to-end. Root watching/new-file discovery, folder relink, reveal-in-folder, progress/cancellation, full metadata extraction and batch/resumable indexing remain open. Phase 2 TrackTable started; Phases 3–7 untouched. | Source: desktop-pro-library.md — partial | Needs product decision on local lib browser-fallback |
| P5-02 | **Hide local library Soulseek for non-desktop** — Soulseek gated to desktop via `hasNativePlayer()`, confirmed plugin store can run in browser, gate needed. Local library browser-fallback intentional-by-design; needs product decision before hiding it. | Source: hide-local-library-soulseek-non-desktop.md — partial | Product decision needed |
| P5-03 | **Atlas navigation structure widget** — Atlas navigation draft widget supports persisted reorder/add/remove; runtime wiring intentionally deferred. | Source: atlas-navigation-structure-widget.md — partial | Deferred until atlas feature needs live data |
| P5-04 | **Go-live header subtext cleanup** — Calendar view restore still open. Need to verify that calendar views correctly restore the go-live state without requiring an extra click or manual action. | Source: go-live-header-subtext-cleanup.md — partial | Needs testing against prod baseline |
| P5-05 | **Admin panel management** — built install/reorder/toggle/remove on shared surface for admin-governed plugins (discovery + channel categories already covered, just relabeled; other 11 categories don't fit pattern). Bundle upload/publish UI + unified-page question needs user confirmation. | Source: admin-plugin-management-panel.md — partial | User confirmation needed |
| P5-06 | **Listen widget** — auto-fill username + embed-bug fix shipped, icon-button config UI needs user to point at specifics for remaining refinements. | Source: listen-widget-hearthis-config-and-set-embed-bug.md — partial | User input required |
| P5-07 | **Mobile player hide nav swipe reveal** — built against 4 documented assumptions; user confirmation needed before finalizing. OS bar part deliberately unimplemented (no PWA manifest to hook into). | Source: mobile-player-hide-nav-swipe-reveal.md — partial | User testing required |
| P5-08 | **AI-DJ Radio DJ port** — offline-only content review; killswitched by default in staging. Stage 1 is offline-only before any production wiring. | Source: ai-dj-radio-dj-port.md — open (not committed) | Needs staging + killswitch validation |
| P5-09 | **Tahti CLI tool** — v1 shipped for `packages/tahti-cli`. Playback/TUI still a stretch goal, not started. | Source: tahti-cli-tool.md — partial | TUI/plaback playback needs scoping |

## P6 — Tahti-core (tahti-org) parallel todo items that affect the player

| ID | Item | Repo | Status |
|----|------|------|--------|
| P6-01 | **STREAM-011** — live/24-7 multi-bitrate HLS; tier-aware MP3/AAC masters shipped, true lossless fMP4 deferred pending Liquidsoap release and browser validation. | tahti-org | 🟡 Partial |
| P6-02 | **PLAT-053** — Tahti Radio → Mixcloud Live multstream (blocked: radio `.liq` not in-repo). | tahti-org | ❌ Blocked |
| P6-03 | **M11 hardening** — Upptime fork deploy (ops); rate limiting, hCaptcha, audit log, `/api/v1/status`, OpenAPI. | tahti-org | 🟡 Partial |
| P6-04 | **M29 backup & DR** — pgBackRest PITR deferred; `backup.sh` exists for pg_dump/minio dr mirror + restore tests. Operator drill (timed exercise). | tahti-org | 🟡 Partial |
| P6-05 | **PLAT-010** — Turbo remote cache secrets in CI. | tahti-org | ❌ Blocked |
| P6-06 | **PLAT-012** — Vitest Testcontainers + parallel workers (replace `maxWorkers: 1` + memberNumber bands). | tahti-org | 🔴 Not started |
| P6-07 | **Governance system hardening** — member-motion review, seconding, circulation deadline, AGM scheduling; official voting rules (eligibility snapshot, quorum, majority, ballot method); signed minutes upload/approval/redaction/publication; legal association info; annual filing checklist. All pending board/legal decisions. | tahti-org | ❌ Blocked on org |
| P6-08 | **Session leftovers** — studio page stream manager playlist name in collapsed rotation block; channel designer block system (logo + addon blocks); public list/play `audioUrl` still ungated; unify uploaders on `FileDropzone`; deduplicate chat panel logic (`chat-panel.tsx` / `fan-chat-panel.tsx`); collapse e2e seed scripts; verify cron consolidation in prod; hearth.at real-audio import; fallback cover for releases without artwork; Sounds player verify live; Your feed redesign verify live; Setup-channel wizard confirm step 5 + genre cap. | tahti-org | Various stages |

---

## Status legend

| Symbol | Meaning |
|------|--------|
| 🔴 | Not started / blocked on external decision or upstream work |
| 🟡 | Partial — some work done, remaining notes in source file |
| ✅ | Verified clean during audit (no bug found) |
| ❌ | Blocked on non-code item (legal, board, ops config) |

## Execution plan

1. **P0 first** — unblock prod baseline work; these prevent deployment of fixes.
2. **P1 next** — memory leak audit (setInterval/cleanup, useEffect cleanup) prevents runtime regressions in production. Player profiling establishes real baselines before optimization guesses.
3. **P2 parallel** — structural code smells block feature velocity. ChannelDesigner needs prop-threading or hook extraction to enable future slices.
4. **P3/P5** — low-risk items can be interleaved; P5 items need user decisions.
5. **P6 is upstream** — tahti-org tasks don't directly affect player but inform the roadmap. Don't block on them for this repo work.

## Completed since session start (2026-09-18 to 2026-09-23)

(Empty — this list was created during audit session.)
