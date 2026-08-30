# UI redesign worklog — Nuclear (artist + admin)

## 2026-08-30 — Backlog round 1: five slices closed (plus a real backend fix)

Working through the queued backlog below in batches of 5, per explicit request. This round, in order:

**Slice 1-3 — Admin → Storage → Files (detail modal, sortable list, linked user editor):** Extracted the Admin → Users detail/edit column (identity, role/membership form, suspend/restore, DM) into a new standalone `AdminUserEditPanel.tsx` — `AdminUsersView.tsx` now renders it inline exactly as before (682 → 178 lines), and `AdminStorageView.tsx`'s file rows open the *same* component in a `Dialog` when you click the artist name, rather than a second, drifting implementation. The files list is now sortable by name/type/size/length, shows size and content type inline in the row, and a new "View details" action opens a modal with filename, size, length, uploader, upload date, genre, visibility, and revision count (`ArchiveItemVersion` count — real, wired end to end, see below) — storage location (local vs. R2) stays honestly labeled "Not tracked yet" since `ArchiveItem` has no per-item R2-mirror field in the schema, unlike `ReleaseTrack`/`ReleaseTrackVersion` which do.

**Backend (`../tahti`, explicitly authorized this round):** `/api/admin/files` now returns a real `revisionCount` per file (`_count.versions` on the Prisma query) — added to `AdminFileRowSchema` in `@tahti/shared`, with a new test asserting a track with one `ArchiveItemVersion` reports `revisionCount: 1`.

**Bug fix (`../tahti`) — Admin → Storage total-used-0B, found while wiring the above:** confirmed and fixed. `recordUsageDelta`/`hasRoomFor` in `storage-quota.ts` (the functions that were supposed to keep `UserStorageQuota.usedBytes` in sync on every upload) are dead code — nothing in the entire API calls either of them, and never has per the git history available here. `/api/me/storage` was already migrated to the correct model months ago (compute usage live from `ArchiveItem`/`StashFile` via `computeUserStorageUsedBytes`, quota is `User.softTargetBytes`, per `docs/storage-policy.md`'s no-hard-caps policy) but `/api/admin/storage` was never updated to match, so it kept reading the stale, always-zero `UserStorageQuota` table — explaining exactly the reported symptom (a real user with real uploads showing 0B). Added `computeAllUsersStorageUsedBytes` (3 grouped queries total, not one query per user) and switched both the overview `GET` and the quota-override `PATCH` to the live/`softTargetBytes` model, matching `/api/me/storage`. Updated the existing test suite (which asserted the old dead-code path) and added a new direct unit test for the bulk aggregation. Verified against a real disposable Postgres (`docker run postgres:16-alpine` + `prisma db push`) — 12/12 `admin/storage.test.ts`, 3/3 `user-storage.test.ts`, 5/5 `admin/files.test.ts` passing; API type-check and lint clean.

**Slice 4 — Track editor save feedback:** `TrackEditDialog.tsx`'s save/upload-artwork/radio-submission results now show as a `sonner` toast instead of inline text sitting in the form. The one exception kept inline: the initial track-load failure, which can leave the dialog with nothing else to show, so it stays a visible `role="alert"` message rather than a toast that could be missed.

**Slice 5 — Player bar: swapped queue/full-screen buttons, moved the count badge:** `ConnectedPlayerBar.tsx`'s right-hand cluster now reads full-screen → volume → queue-toggle (previously queue-toggle → volume → full-screen), so the outer-right corner opens the queue strip. The queue-count badge moved from the full-screen button to the queue-toggle button, and only shows above 1 item (was `> 0`). This intentionally partially reverses "2026-08-27 — Player bar expand control" below, per explicit newer request.

**Validation:** tahti-web type-check, lint, and the full vitest suite (292/292) pass. `../tahti/apps/api` type-check, lint, and the affected test files pass against a real (disposable) Postgres. Not click-verified in a live browser this session.


## 2026-08-30 — Backlog round 2: five slices closed

Second batch of 5 through the queued backlog, per the same "5 slices, push,
deploy, repeat" instruction as round 1. In order:

**Slice 1 — Admin: dropped the Vendors left-nav item:** `AdminNav.tsx`'s standalone `/admin/vendors` submenu entry is gone — `AdminVendorsView.tsx` no longer renders its own page chrome (`AdminGate`/`AdminNav`), keeping only the shared `AdminVendorsContent()` that the dashboard's Vendors tab already used. `/admin/vendors` now redirects (`router.tsx`, `beforeLoad`) to `/admin?tab=vendors`, and `AdminDashboardView.tsx` reads that `?tab=` param to open the right tab on load. Updated `AdminVendorsView.stories.tsx` to render `AdminVendorsContent` directly, since the removed component broke its import.

**Slice 2 — Channel Designer: tuning controls consolidated under the preset picker:** `ChannelDesigner.tsx`'s visualizer tuning sliders (speed/intensity) previously rendered in one of two different places depending on `hasLivePreview` — inline under the preset picker when there was no live preview, or in a separate card (the public-channel preview mockup, above the picker) when there was. They now always render in the same card as the preset picker, directly below it, regardless of `hasLivePreview` — removing the duplicate render block from the preview card entirely. This was the concrete, verifiable half of the "explicit save, controls in same container" backlog request — the persistence half was already true: `patchChannelVisual` is only ever called from `save()`, and preset-switching (`changeVisualizer`) only ever touches local state (`applyLocal`) plus the `dirty` flag — nothing persists to the server, or to any other viewer, until Save is clicked. So the actual gap was purely the control placement, now fixed; no change was needed (or made) to the save-gating.

**Slice 3 — Nuclear plugins: removed real duplicates:** `content/nuclearPluginAddons.ts` had two near-identical entries each for Bandcamp (`bandcamp-dashboard` and `bandcamp`) and SoundCloud (`soundcloud-dashboard` and `soundcloud`) — same underlying feature (this repo's real "connect + import your own catalog" source, confirmed against `api/sources.ts`'s actual `SourceDef`s) filed twice under different categories, with their `apiCounterpart` notes having already drifted to contradict each other (one pair claimed the import endpoint was still pending, the other claimed it existed — only the latter is true: `/api/v1/imports/bandcamp/add` and `/api/me/soundcloud/import` are both real, wired routes per `api/sources.ts:394,481`). Merged each pair into one accurate entry per provider, `status: 'available'`/`'implemented'`, listing both real routes.

**Slice 4 — Settings → Channel & Design: fixed the always-blank visualizer preview:** `SettingsPanels.tsx`'s `ChannelPanel` passed `livePreview={false}` unconditionally to `ChannelDesigner`, so the preview never rendered a visualizer for anyone — the comment explained this was to avoid a second concurrent WebGL `ChannelVisualizer` context, since `AmbientBackground` (mounted globally in `AppShell`) can already be running one behind the modal. That risk is real but conditional, not universal: `AmbientBackground` only renders its visualizer when `useAmbientStore().enabled` is true and `isThemeVisualizationEnabled(themeId)` passes. `ChannelPanel` now checks the same two conditions and only disables the live preview when there's an actual conflict, so the preview works normally for anyone with ambient background off (or on a non-visual theme).

**Slice 5 — Study: mikseri.net import**, written up at `docs/studies/mikseri-import-study.md`. Summary: no public API, no OAuth, no developer docs exist. mikseri.net's `robots.txt` explicitly reserves rights against automated access under the EU DSM directive's TDM opt-out (blocks every major AI/scraping bot by name, sets `ai-train=no`), which rules out a scraped files-import source as a good-faith option — there's also no OAuth handshake to verify "this is actually your own upload" the way the four real oauth sources here have. There *is* an artist-initiated embeddable per-track player (`about.php`: "make a player from your tracks that you can embed elsewhere") that matches this repo's existing `EmbedProvider` shape (`lib/embedSrc.ts`) exactly — recommended as the one legitimate integration path, once a real embed snippet is captured from a live track page (not done in this pass). Recommendation: build the embed provider later; don't build a scraped import source.

**Investigated, not fixed — Settings/modal flicker:** Traced through `DialogRoot`/`SettingsPanel`/`ConnectedSettingsModal`/`AccountPanel` and ruled out several theories with code evidence: no double-mounting of the modal, no unstable component identities causing remounts, `SettingsPanelContent` has a fixed, scrolling-internally height so async data arriving late can't resize the dialog mid-animation, and the settings-store/auth-store wiring doesn't show an obvious double state-flip. React `StrictMode` is enabled (`main.tsx`) and would double-invoke mount effects in `pnpm dev`, which is a classic source of this exact symptom — but that's dev-only and wouldn't reproduce against the deployed beta build the user is presumably testing, so it's a weak lead, not a confirmed cause. Didn't find a conclusive root cause through static reading alone; this needs live browser reproduction (devtools Performance/Rendering paint-flashing, or screen recording) to pin down, which wasn't available this session. Left open below with these ruled-out leads recorded so the next pass doesn't repeat them.

**Validation:** tahti-web type-check, lint, and the full vitest suite (292/292) pass. Not click-verified in a live browser this session (no browser automation available in this environment) — the Channel Designer and Settings preview changes in particular are worth a manual look before relying on them.


## 2026-08-30 — Planned: queued requests, not yet implemented

Logged for a future session. Several items from the previous version of this
list were completed this round — see "Round 2: five slices closed" above;
this entry now reflects what's actually still open.

**Admin → Logs: R2 and encoding entries (start/finish, what, total time):** Admin → Logs (`AdminLogsView.tsx`) is a raw Loki-backed log tail — `fetchAdminLogs()`/`AdminLogEntry` (`api/admin.ts:4130-4208`) just displays whatever `{timestampMs, service, line}` rows the real `/api/admin/logs` endpoint returns; the mock's example line (`[transcode] archive item 8f2c… done in 4.2s`, `api/admin.ts:4156`) shows the *shape* wanted but isn't backed by anything real. Getting genuine R2-operation and encoding-lifecycle entries here is **not a tahti-web change** — it means the actual R2 client and transcode/encoding worker (in `../tahti/apps/api` and/or `../tahti/apps/worker`) need to emit structured log lines for: an R2 operation (upload/delete/etc., which object); an encoding job starting (what's being encoded — track/archive item — and its target format); and an encoding job finishing (same identifying info, plus total elapsed time). Once those services actually emit that, this repo's existing log viewer displays it with no changes needed. Start on the backend side, not here.

**Studio/Admin navigation active-state sweep, plus refreshed sitemap docs:** On a number of tabs the active nav highlighting breaks — the top-level "Studio" tab should always stay highlighted while anywhere under Studio, and every subtab (Library, Perform, Manage, etc. — see `StudioNav.tsx`'s `PRIMARY`/`SUBMENUS`/`SECTION_PREFIXES`) should stay highlighted whenever any of its own subtabs is selected, which isn't holding on every route today (this session already had to patch one specific gap — `/studio/mastering` missing from `SECTION_PREFIXES['/library']` — while adding the mastering plugin; there are more). Sweep every Studio and Admin route against `SECTION_PREFIXES`/`AdminNav`'s equivalent and fix the ones that don't highlight correctly. Once fixed, regenerate the Tahti Map's screenshots and Mermaid navigation diagrams (see the `capture-map-screens.mjs` / Tahti Map entries earlier in this file) so the documented sitemap matches the corrected navigation, not the stale one.

**mikseri.net embed provider.** Per the completed study (`docs/studies/mikseri-import-study.md`, round 2 above), add a `MIKSERI` `EmbedProvider` (`lib/embedSrc.ts`) once a real embed snippet is captured from a live mikseri.net track page — the URL shape/query params weren't captured in the study pass. Do not build a files-import `SourceDef`; the study found no API and an explicit `robots.txt` objection to automated access.

**Settings → Themes: per-theme configure icon + modal, drop the inline form.** Themes that have their own configuration (today: only Tahti) should show a small configure/gear icon on the theme tile; clicking it opens a modal with that theme's settings form, instead of the form living inline on the main Themes page as it does now. The modal should include a live preview window so the visualizer/theme preset can actually be seen while configuring it, not just edited blind.

**Settings → Artist: port the press kit editor from `../tahti`, consolidate branding tabs.** Port the press-kit download/editing forms from the sibling `../tahti` repo into this app, placing them under Settings → Artist → Branding (this app already has *press-kit preview* per "2026-08-28 — Press kit preview parity" — this is the editing/download side, which is apparently still missing or divergent). Move "Channel & Design" to live under the Artist settings tab (as its own "Channel & Design" icon tab there) rather than wherever it currently sits. Once moved, remove the now-duplicate channel/branding editor that currently exists separately from it — check `ChannelDesigner.tsx` and Settings → Artist → Branding for which one becomes the single source of truth before deleting the other.

**Settings → Artist: compact circular profile image upload.** The current profile-image add/upload UI in Settings → Artist takes up more space than it needs to. Make it a compact circle (matching how avatars render everywhere else in the app) with an upload affordance that only appears on hover, opening the existing drag-and-drop uploader (`FilePicker`/`uploadUserMediaFile`) rather than a permanently-visible large upload block.

**Channel Designer: an actual backdrop image/gradient control.** Today the channel designer only lets you change the elements *surrounding* the channel backdrop, not the backdrop banner image itself — add a way to upload a backdrop image, or set it to a gradient (or another fill option), directly. Check what's already ported from the sibling channel-design workflow (per "2026-08-28 — Tahti channel design parity") to see whether backdrop-source selection already exists in the underlying data model and just isn't exposed in this UI, versus genuinely missing end to end.

**Settings/modal flicker on open.** Opening Settings (and reportedly other modals too) visibly flickers a couple of times. Round 2 above traced through the obvious static candidates (double-mount, unstable component identities, dialog resizing mid-animation, store double-flips) and ruled all of them out from code alone — see that round's "Investigated, not fixed" note for exactly what was checked and why each was ruled out, so a future pass doesn't repeat the same dead ends. What's left: live browser reproduction (devtools Rendering → paint flashing, or a screen recording of the actual open) to see what's *actually* repainting, since static reading alone couldn't pin it down. This file's "2026-08-28 — Settings theme flicker" entry fixed a related but narrower preview-lifecycle flicker; still unconfirmed whether this is the same root cause resurfacing.

**Venues — gallery, links, admin-only booking contact, and events:**
- Drag-and-drop gallery upload on the venue form (`VenueRegisterView.tsx` and whatever the edit-venue equivalent turns out to be — `venue.photos?: string[]` already exists on `VenueDirectoryItem`/`VenueProfile` in `api/types.ts`, but there's no upload UI for it yet, only a couple of hardcoded photo slots rendered in `VenueDetailView.tsx:109-121`). Should reuse the shared drag-and-drop upload widget / `uploadUserMediaFile` flow this app already uses everywhere else (see `ImageUploadField.tsx`), not a bespoke uploader.
- A website + social media links section. `externalLinks?: Record<string, string>` already exists and already carries a single `website` link (`VenueDetailView.tsx:133-141`, `VenueRegisterView.tsx:172`); extend the form to a proper multi-platform social links section, not just the one website field.
- An optional contact-person email for booking inquiries, visible **only to admin** — a new field, not on `VenueDirectoryItem`/`VenueProfile` today. Needs a way to keep it out of the public venue API response entirely (not just hidden client-side) so it's genuinely admin-only, and a mention of it in the venue registration flow (`VenueRegisterView.tsx`) so venues understand who sees it and why.
- On the venues page (`VenueDetailView.tsx`), always show both upcoming and past events — remove the "upcoming broadcasts" section for now (`VenueUpcomingBroadcast`/`venue.broadcasts` in `api/types.ts:326-337`, rendered in `VenueDetailView.tsx`). Events should render richly — background image and cover art, the same card treatment as a normal user-facing event/show, not a plain list row.
- Add a CTA contact button on the venue page for event inquiries (distinct from the admin-only booking email above — this is the public-facing "get in touch about playing/booking this venue" action).
- **e2e tests to write once this is built** (to run later, not now): registering a venue with gallery photos and social links persists them; the admin-only contact email is present in an admin-scoped fetch but absent from the public venue API/page; the venue page shows both past and upcoming events with artwork, no broadcasts section; the contact CTA opens/submits an inquiry.

**Stash gets the Sounds player, plus a common tracklisting component sweep:**
- Studio → Stash should use the same player as Studio → Sounds (`StudioArchiveView.tsx`) instead of whatever Stash currently has.
- Before sweeping anything else: verify (or, if needed, refactor) the Sounds tracklisting/player UI so it is a genuinely reusable, standalone component first — not a page-specific implementation being copy-pasted into Stash. Confirming it's truly common is a precondition for the rest of this, not optional groundwork to skip.
- Once that's confirmed, add a standing instruction (likely to `AGENTS.md`, matching this repo's convention for standing UI rules — see the existing "Per-page widgets configure from Add-ons" section) that any track-listing surface should use this shared component rather than a one-off.
- Then write a workplan (a punch list, same shape as the 2026-08-26 design-system compliance audit's format in this file) enumerating every Studio and Admin surface that currently hand-rolls its own track list, to be swept onto the shared component in follow-up batches.

**Go Live: relocate Info, restructure the Preview controls:**
- Move Studio → Info out of the main left-hand Studio navigation; it becomes the second tab under Perform → Go Live instead (alongside the Go Live tab itself). Note: a prior entry in this file ("2026-08-28 — Go Live info and recording controls") already moved Info from the old Go Live page into its own `/studio/info` submenu tab — this request goes further, nesting it as a tab *within* Go Live rather than a sibling submenu item, so re-check the current `StudioNav.tsx`/`SUBMENUS['/studio/go-live']` shape before implementing.
- On the main Go Live tab, move the play controls inside the "current track" display, and add a distinct "play stream" button in a separate, clearly separated spot from those track controls (not merged into the same control cluster).
- Title that current-track playback area "Preview".

## 2026-08-30 — Matchering port: reference mastering plugin

**Completed:** Ported [`matchering`](https://github.com/sergree/matchering) (the open-source Python audio-mastering library, checked out at `../matchering`) into `src/plugins/mastering/` as a genuinely working, entirely client-side feature — not a stub, not boundary-gated. Given a track already in Tahti and a reference track the artist uploads, it matches the track's loudness and tonal balance toward the reference and produces a downloadable/playable mastered WAV. tahti-web has no backend of its own and the algorithm is pure numeric signal processing with nothing Python-specific about it, so this runs entirely in the browser (Web Audio for decoding, a Web Worker for the actual number-crunching so the UI thread stays responsive) — no new server contract was invented, and none was needed.

**DSP core** (`src/plugins/mastering/dsp/`, one module per concern, each with its own `*.test.ts`): a hand-rolled radix-2 FFT/`rfft`/`irfft` (no FFT library existed anywhere in the monorepo, and none was added — this is small, self-contained, auditable math, same philosophy as `audio-fx/testAudioContext.ts` hand-rolling only what it needs); mid/side decomposition and RMS-based level matching (`levels.ts`); average-magnitude-spectrum EQ matching via a log-frequency LOWESS-smoothed FIR, applied through overlap-add convolution (`frequencies.ts`); a natural cubic spline for the linear↔log-frequency resampling that needs (`cubicSpline.ts` — a different but comparably smooth boundary condition than matchering's own not-a-knot B-spline, not a materially different curve); the Hyrax lookahead limiter, including a closed-form order-1 Butterworth filter design plus `filtfilt`/`lfilter` (`butterworth.ts`, `limiter.ts`); and a hand-rolled PCM16 WAV encoder (`wav.ts`). `match.ts` orchestrates the full pipeline (mirrors `stages.py`'s `__match_levels`/`__match_frequencies`/`__correct_levels`/`__finalize` stages exactly), using matchering's own **default** `Config`/`LimiterConfig` values throughout.

**What's faithfully ported vs. deliberately simplified** is written up in full in `src/plugins/mastering/README.md` — the short version: the actual DSP math (levels, EQ matching, the limiter) is a faithful port of matchering's default behavior; loading uses the browser's native audio decoder instead of matchering's ffmpeg-based one; matchering's dozens of config knobs aren't exposed as UI controls yet; its `checker.py` heuristics aren't ported (only the hard requirements it actually enforces — stereo, minimum length — are checked, with a clear error); only the "with limiter" output is produced (not the "no limiter"/"normalized" variants matchering can also emit); and the mastered result is download/preview-only, not written back into the user's archive as a new track (that would need a new "create an archive item from raw client-side audio" server contract that doesn't exist — a natural, separately-scoped follow-up, not attempted here).

**UI:** New `StudioMasteringView.tsx` at `/studio/mastering/$id`, titled "Reference mastering" (deliberately not "Mastering" — that name is already the Pro Editor's own EQ/Comp/Limiter/Filter chain panel). The source track loads automatically via the existing `fetchEditorSource(id)`; the artist uploads a reference file through the shared `FilePicker`, decoded client-side and never persisted anywhere. Reachable from all three places a "track editor" reasonably means: `TrackEditDialog`'s Audio tab (next to the existing "Open audio editor →" link), `StudioArchiveItemView`'s toolbar (next to "Open audio editor", same disabled-state gating), and `StudioProEditorView`'s breadcrumb row (a new "Mastering" entry alongside Music/Metadata/Projects). No new `StudioNav` menu item — reached only via these inline links, the same "not a distinct nav row" precedent the Pro Editor itself already sets; `/studio/mastering` was added to `StudioNav`'s `SECTION_PREFIXES` so the Library section still highlights correctly while on it.

**Validation:** Every DSP module's correctness is checked against synthetic signals with known, verifiable properties (not bit-exact Python parity, which isn't practically checkable without a Python runtime in this repo) — FFT round-trips and a brute-force DFT cross-check, the Butterworth filter's DC gain and zero-phase property, the sliding-max filter against a naive O(n·w) reference, RMS matching landing at the expected coefficient, the EQ-matching FIR measurably brightening a dull target toward a bright reference, the limiter bringing a clipping peak down to threshold while never raising any sample's amplitude. 65 unit tests across 10 files, plus an end-to-end `match.test.ts` (a quiet target measurably closes its loudness gap against a louder reference, without exceeding the limiter's threshold). A quick perf check (10s of stereo audio at 44100Hz, full default config) processed in ~1.2s — comfortably fast enough for a background-worker "wait a moment" UX on a real multi-minute track. Full tahti-web suite: 292/292 passing; type-check and lint clean.

**e2e:** `e2e/mastering.spec.ts`, following this repo's established Playwright conventions (duplicated local `signIn` helper, `VITE_FORCE_MOCK=1` dev server, `getByRole`/`getByLabel` locators) — both tests run the **real** in-browser DSP pipeline against small checked-in WAV fixtures (`e2e/fixtures/mastering-*.wav`, ~2s sine tones), not a mocked result. One real bug found and fixed along the way: the mock `fetchEditorSource` URL (`DEMO_MP3`, a real soundhelix.com file used widely across this app's mocks) sends no `Access-Control-Allow-Origin` header, so the plain `fetch()` this feature needs to actually decode the track's audio fails with a CORS error in a real browser — harmless everywhere else `DEMO_MP3` is used today (a `<audio src>` tag or a best-effort peaks fetch that fails silently), but fatal here since mastering can't proceed without the real samples. Rather than touch the shared `DEMO_MP3` constant (27 call sites across 6 files — too wide a blast radius to safely re-verify in this pass), the e2e test routes that specific URL to a local fixture with CORS allowed, which is also just better practice for not depending on a live third-party host inside a test. Both e2e tests pass; confirmed the 4 pre-existing failures in `plugin-store.spec.ts` (multistream provider options, export target registry text, a Three.js visualizer strict-mode locator violation) are unrelated and already present on `master` before any of this session's changes (verified via `git stash`).

**Not done:** `PLUGIN-STORE-PLAN.md` wasn't given a new sub-section — on reading it in full, that doc is specifically about `Settings > Add-ons`' browsable-plugin architecture (7 pre-existing subsystems unified under one browser panel), a different discovery mechanism than this feature's inline-link-only placement; forcing an entry in there would misrepresent it as part of that system. The plugin's own README carries the equivalent documentation instead.

## 2026-08-30 — Three embed-playback follow-up slices

Checked the codebase directly (not the worklog prose) for the 2026-08-26 design-system compliance audit's remaining items first — `text-red-400`/`bg-green-500`-style raw Tailwind palette colors and bare `<p>Loading…</p>` markup, its two most mechanically-checkable categories — and found zero remaining instances outside already-legitimate exceptions (`ChannelDesigner`/`ChannelVisualizer` brand colors, Settings' `SettingsHint` component). That audit's punch list is exhausted; these three slices instead close out gaps found while finishing today's Bandcamp/Spotify embed-playback work.

**Slice 1 — EMBED_ONLY tracks can no longer be added to 24/7 rotation:** `ChannelRadioPlaylistPanel.tsx`'s rotation library list came straight from `fetchStudioArchive()` with no `embedProvider` filter, so a Bandcamp/Spotify/hearthis.at/Mixcloud track could be added to the automated fallback rotation, where it would never play — a 24/7 rotation has no listener to click a provider widget. `ProgrammeItem` (`api/studio-extras.ts`) gained an `embedProvider` field, and the panel now filters embed-only items out of the rotation candidate pool before building any of its library groups.

**Slice 2 — EMBED_ONLY tracks no longer open in the Pro Editor's "Open from library":** same root gap in `StudioEditorListView.tsx` — the audio editor has nothing to trim for a track Tahti doesn't host a file for, so embed-only archive items are now filtered out of that picker too.

**Slice 3 — Favoriting an embed-only track from its own page no longer creates a dead Favorites entry:** `TrackDetailView.tsx`'s `playableFromDetail` never set the shared player's `embed` field, so a favorited hearthis.at track (the one provider the shared bottom bar/fullscreen player can actually replay) silently failed to play from Favorites/History. It now sets `embed: { provider: 'hearthis', embedUri }` for hearthis tracks specifically, matching the pattern used everywhere else `TahtiPlayable.embed` is read. Mixcloud/Spotify/Bandcamp have no shared-player-wide widget anywhere in the app (they only ever play through a local inline iframe, e.g. this page's own widget or `EmbedTrackRow`), so favoriting one of those from the track page is now disabled with an explanatory tooltip rather than silently saving something that can never play again.

**Validation:** Type-check, lint, and the full vitest run (227/227) pass for all three slices.

## 2026-08-30 — Weekly "What's New" grouping and changelog-quality note

**Completed:** The in-app What's New tab (`packages/player`) listed every `changelog.json` entry one row per entry, so a week with several shipped changes read as several separate timeline rows. Added `groupChangelogByWeek` (new `WhatsNew/groupChangelogByWeek.ts`) to collapse entries into one row per ISO week: same-week entries merge into a single row whose type badge picks the most notable type present (feature > fix > improvement > plugin > docs > chore), whose tags/contributors are deduped across the week, and whose description lists each merged item as its own line. `TimelineEntry` and `WhatsNew` now render/paginate over these weekly rows instead of raw entries.

**Completed:** Added a note to the root `AGENTS.md` Changelog section: every `changelog.json` entry's description must explain how a change makes things better for the person using it, in plain language, not what changed at the implementation level — the worklog and commit message are where the technical detail belongs.

**Validation:** Added `groupChangelogByWeek.test.ts` (5 tests) and rewrote `WhatsNew.test.tsx`'s fixture/assertions for the new grouped output (13 tests, all passing). Full player vitest run has 17 pre-existing, unrelated `Themes.test.tsx` snapshot failures (stale `text-foreground`/`text-primary-foreground` token snapshot) — confirmed pre-existing on master via `git stash` before this change, not caused by it. Type-check and lint pass on the changed files.

## 2026-08-30 — Untimed comments on embed-only tracks

**Completed:** The listener track page's comment composer always stamped `[0:00]` on new comments for EMBED_ONLY tracks (hearthis.at, Mixcloud, Spotify, Bandcamp), because Tahti never puts an embed track into the shared player and so never observes a real playback position for it — every comment looked timed but was silently wrong. Comments on those tracks now post untimed (no `[m:ss]` prefix, which `parseTimedComment` already treats as a plain comment), and the composer placeholder/aria-label drop the misleading "at 0:00" for embed tracks specifically.

**Validation:** Tahti web type-check and lint pass. Full vitest run: 227 passed. Could not do a live browser check of `/t/:id` for the new Spotify/Bandcamp mock rows (`*-archive-4`/`*-archive-5`) — no Chrome extension connection was available this session; this needs a manual/browser pass before shipping.

## 2026-08-30 — Bandcamp embed playback and add-on help detail

**Completed:** Bandcamp joins hearthis.at, Mixcloud, and Spotify as a fourth `EmbedProvider`: `embedSrc.ts` gained `bandcampEmbedSrc`, and the Studio archive filter, collection views, and release track rows all pick it up through the existing generic `EmbedProvider`-keyed plumbing. `sourceCapabilities('bandcamp').playback` is now `true`. The listener track page (`/t/:id`) previously assumed every track had a Tahti-hosted `audioUrl` and left EMBED_ONLY tracks with a permanently disabled play button and a blank waveform; it now renders the provider's own widget in that slot (with a "via {Provider}" label) for hearthis.at, Mixcloud, Spotify, or Bandcamp tracks, and disables Download/Expand player for them since there is no Tahti-hosted file to serve.

**Completed:** Extended the Help → Add-ons and plugins catalog with a `description` field ("what it does") alongside the existing `help` field ("how to use it") on every entry, and added a matching "What it does" column to the rendered table. Updated the Bandcamp and Spotify catalog copy to describe the in-app playback path now that it exists, and reworded the article's "Ready plugins" intro to state which providers are reference-only (audio comes from the provider's widget, including on a track's own page) rather than implying playback never works for a partial-state add-on.

**Validation:** Added `embedSrc.test.ts` (dispatcher coverage for all four providers, `bandcampEmbedSrc`/`spotifyEmbedSrc` URI parsing) and extended `pluginHelpCatalog.test.ts` for the new `description` field. Full vitest run: 227 passed. Tahti web type-check and lint pass on the changed files.

## 2026-08-30 — Help Center add-on catalog

**Completed:** Added Help → Add-ons and plugins with a table of every usable Settings → Add-ons integration (name, category, state, how to use it). Planned Nuclear registry entries stay out of the table until they have a Tahti contract.

**Validation:** Catalog unit tests plus Help Center article wiring.

## 2026-08-29 — Listener track page

**Completed:** Rebuilt `/t/:id` for listeners in the hearthis-style layout: blurred artwork hero, circular play, dense waveform with played/unplayed colors, timed comment bar, share/add/download, artist chip, description + cue tracklist, and related collections/tracks.

**Validation:** Unit tests for tracklist parsing, timed comments, and hour-long clocks; tahti-web type-check and lint.

## 2026-08-29 — Tahti theme accent contrast

**Completed:** Light cyan, green, yellow, orange, and coral fills no longer use page-white text. Added `--accent-foreground` (ink on Tahti) and applied it to pills, toasts, log chips, danger buttons, and remaining solid accent surfaces.

**Validation:** Badge/Toaster/LogEntry token updates plus a Tahti-theme CSS fallback for leftover `text-foreground` on solid accent fills.

## 2026-08-29 — Channel page in-page tabs

**Completed:** Removed the Channel and 24/7 radio tabs from `/studio/channel`. Channel design is the page itself; Radio remains a Manage sidebar destination.

## 2026-08-29 — Perform Info tab and show visibility

**Completed:** Moved the broadcast Info form out of Go Live into a Perform submenu tab (`/studio/info`). Go Live now opens on the live panel. Show visibility sits on the Info form instead of under More options, and the Go Live live-audience block was removed.

**Validation:** Browser check of Go Live and Info, plus lint of the touched files.

## 2026-08-29 — Channel editor preset and controls

**Completed:** In the artist channel editor, speed/intensity and the look controls now sit below the visualizer inside the same preset card. The visualizer strip is taller and no longer covered by an overlay.

**Validation:** Type-check and lint of ChannelDesigner.

## 2026-08-29 — Player bar expand control

**Completed:** Full-screen expand now sits on the right edge of the player bar, with the queue length as a badge on that icon. The hide/minimize control was removed so the bar stays available.

**Validation:** Type-check and lint of the player bar component.

## 2026-08-29 — Library left nav Overview and Collections

**Completed:** Renamed the first Library submenu item from Library to Overview so it matches the catalog snapshot page. Added Collections as a dedicated left-nav destination (`/library/collections`), with Studio collection and playlist editor routes still highlighting that item.

**Validation:** Tahti web type-check, lint, and diff checks.

## 2026-08-29 — Image upload UX sweep

Replaced image URL text fields with the shared drag-and-drop upload widget across
channel backgrounds, show and episode artwork, track and collection backdrops,
venue images, news images, widget covers, broadcast covers, and stream overlays.
Uploads now use the existing user media storage flow and retain previews. Removed
duplicate URL fallbacks where a proper upload control was already available;
external source and website URL fields remain intentional URL inputs.

**Validation:** Tahti web type-check, lint, and diff checks pass.

## 2026-08-29 — Performance follow-up route slices

**Slice 1:** Help Center hub and article routes now load on demand, so the
structured guide and support form are not part of the initial listener bundle.

**Slice 2:** Public legal pages (`About`, `What is Tahti?`, `How it works`,
and `For artists`) now share one deferred Legal route module.

**Slice 3:** Public transparency, status, governance, and feature-request
pages now load only when opened. The persistent app shell remains mounted while
these route modules resolve.

**Validation:** Tahti web type-check and lint pass. The remaining performance
candidate is the shared `api/admin.ts` dependency reachable from plugin settings.

## 2026-08-28 — Shared Tahti logo treatment

**Completed:** Matched the app logo to `../tahti`'s `BrandLogo`: medium-weight display typography, 18px wordmark sizing, 3px amber bar, 1px bar radius, and the same tracking. The existing home link and mark-only variant remain compatible with the Nuclear shell.

## 2026-08-28 — Tahti API documentation parity audit

**Completed:** Added `docs/API-REFERENCE.md`, documenting the sibling API authentication model, listener/artist/admin contract areas, permission boundaries, and the procedure for adding API-backed features. Added `scripts/check-api-docs.mjs` and the `check:api-docs` package command; it hashes the sibling `../tahti/openapi.json` paths object and fails when the local reference needs review. The current audit matches all 546 OpenAPI paths.

## 2026-08-28 — Source adapter contract slices

**Batch 1:** Split source integrations into typed OAuth, search, and tool/upload adapter groups. The registry now exposes those groups and tests enforce that every source belongs to exactly one group while retaining its capability metadata.

## 2026-08-28 — YouTube Liked Songs plugin port

**Batch 2:** Ported the upstream YouTube Music Liked Songs response parser into `src/plugins/youtube-liked-songs`, with tests for nested renderer extraction, artists, artwork, and invalid rows. The Nuclear add-on configuration now includes private cookie and authorization fields, destination playlist name, and sync frequency with inline guidance.

**Boundary:** The upstream plugin depends on Nuclear’s private local playlist API. Tahti does not yet expose a secure server-side YouTube Music OAuth/credential and playlist-sync contract, so the add-on is configurable but remains explicitly partial rather than offering an unsafe browser-only sync.

**Batch 3:** Replaced the remaining native add-on select with the shared Nuclear `Select` component and added a Storybook catalog story for filtering and configuring Nuclear registry entries. The complete Storybook build remains the render sweep for these states; the dedicated Tahti story type-check stays isolated from known legacy story prop errors.

**Multicast follow-up:** Added the Multicast destinations plugin entry to the Nuclear catalog with provider, label, stream-key, and custom-RTMP configuration fields. It points to the existing RTMP target API and shared Multicast destination form, so it is ready to configure without creating a second persistence path.

## 2026-08-28 — 3×3 source and Storybook compliance slices

**Batch 1:** Added typed source capabilities for connection, search, import, and playback; converted the import-source plugin contract to a structural type; and added registry coverage requiring every provider to declare all capabilities.

**Batch 2:** Added Storybook coverage for Studio deep routes, Library, Admin moderation/logs, and mobile overflow. Migrated the Sources search, destination, URL, and radio forms to Nuclear `Input` and `Select` components.

**Batch 3:** Documented the capability contract, added a dedicated Storybook TypeScript check, and updated the workplan to distinguish explicit metadata parity from providers that still need real API runtime contracts.

**Validation:** Tahti web type-check, source registry tests, and Storybook build/type-check are required before the release push.

## 2026-08-28 — Performance follow-up slices

**Slice 1:** Settings and the Tahti Map/More route are now lazy-loaded, keeping their large secondary workflows out of the initial listener bundle.

**Slice 2:** The Radio add-on’s admin-only station suggestion API is dynamically imported at submit time, removing that admin API dependency from the initial Settings/plugin path.

**Slice 3:** Heavy Studio archive/editor/detail routes remain route-lazy and now load in dedicated chunks. The production build entry bundle improved from 3.54 MB minified / 1.020 MB gzip to 3.345 MB / 968 KB gzip across the two performance passes.

**Remaining:** Vite still reports `api/admin.ts` as shared with admin route modules, and the initial bundle remains large because several broad listener/studio modules are statically reachable from the router. Mermaid and visualizer payloads are deferred but individually large. These are documented optimization candidates; further splitting should be measured against route transition cost.

## 2026-08-28 — Tahti Map screenshot and navigation refresh

**Completed:** Regenerated the Tahti Map atlas from the local mock API with a privileged board user, covering public/listener views plus current Studio and Admin pages. Added Admin Overview, Financial, Storage, Logs, Content, Moderation, and Streams captures. Added a Mermaid graph for the stable app shell and current Studio/Admin section menus. Legacy Money Fan subs and TOTP interactions remain documented as soft-capture cases because those views no longer expose the old controls in the current app.

## 2026-08-28 — Consistent Studio and Admin create actions

**Completed:** Standardized new/create controls across Studio and Admin page headers, empty states, and nested tools to the shared 32px icon-button treatment. Each compact control retains an accessible label and tooltip title.

## 2026-08-28 — Stable Studio and Admin navigation slots

**Completed:** Reserved a stable desktop slot for the Studio and Admin submenus so switching between Perform, Manage, and other sections no longer moves the page content up or down when submenu lengths differ. Mobile navigation remains content-sized, and the existing stable-route transition continues to avoid a full-page fade.

## 2026-08-28 — Admin vendors overview placement

**Completed:** Admin → Vendors is now a single Overview submenu item immediately before Logs. Removed the duplicate Manage placement while preserving the existing vendors route and page.

## 2026-08-28 — Admin storage overview placement

**Completed:** Moved Admin → Storage from Manage into Overview, placing it before Logs. The existing storage routes and file-management tab remain unchanged.

## 2026-08-28 — Admin financial overview placement

**Completed:** Moved Admin → Financial from Manage into Overview, immediately after Dashboard. Logs and Status remain available after it, and the existing financial route is unchanged.

## 2026-08-28 — Tahti shared branding

**Completed:** Replaced the app-shell star mark with the sibling Tahti website's amber-bar `TAHTI` wordmark. The web app now serves the matching SVG, ICO, 16px, 32px, and Apple touch favicon assets from `../tahti`.

## 2026-08-28 — Listen playback control state

**Completed:** The Tahti Radio play control on Listen now follows the shared player state. It switches to Pause while the station is loading or playing, switches back to Play when paused, and resumes the current station without unnecessarily fetching it again.

## 2026-08-28 — Listen Feed and History tabs

**Completed:** Moved the personal Feed and listening History into the Listen page as dedicated tabs. The main sidebar no longer carries a separate History entry, and the old `/library/history` and `/history` URLs redirect to `/listen/history` for compatibility. Feed and History retain their existing playback, statistics, listening-history, and clear-history behavior.

## 2026-08-28 — Compact Admin stream manager

**Completed:** Admin stream rows now show channel thumbnails when supplied by the API, with an initials fallback, total stream duration, listener metrics, zebra striping, and all row actions as consistent accessible icon buttons. The active-stream list is collapsed by default and can be expanded from the panel header.

## 2026-08-28 — Vendor launch-readiness register

**Completed:** Admin → Vendors now records the live-readiness state of every critical and integration vendor. Each entry identifies whether it is live, needs verification, or blocks launch, with the concrete credentials, contract, callback/webhook, DPA, approval, or operational-test dependency. The page summarizes unresolved launch blockers and lets API-reported integration status override the static register when a live check is available.

## 2026-08-28 — Tahti Map navigation and sitemap refresh

**Completed:** Renamed the board-only More entry to its own Tahti map tab in desktop and mobile navigation. Removed the map page’s top row of shortcuts to unrelated application pages, keeping only in-page map section navigation. Added current route-based Mermaid diagrams for the beta sitemap, listener journey, and artist/governing-person journeys in the Flow gallery.

## 2026-08-28 — 3×3 Storybook action and navigation sweep

**Batch 1:** Admin stream controls, Studio moderator management, and Admin missed-show actions now use compact shared icon buttons with accessible labels and tooltips.

**Batch 2:** Added rendered Storybook states for the Admin stream manager, Studio moderation workspace, and Admin missed-show queue.

**Batch 3:** Added mobile and nested-route navigation states for Admin and top chrome, plus a Settings deployment-footer story covering GitHub, API docs, About, and the build fingerprint.

**Validation:** Affected files pass formatting, lint-staged checks, type-check, and diff checks. The Storybook package has no standalone type-check script; its stories are included in the repository TypeScript configuration and are covered by the Storybook build.

## 2026-08-28 — Deployment version in settings footer

**Completed:** Settings now places the build version and deployment fingerprint beneath the GitHub, API docs, and About links. Deploy builds receive a UTC millisecond timestamp, so the displayed version changes on every deployment while retaining the package version as its base.

## 2026-08-28 — Top-bar schedule, broadcast, and messages previews

**Completed:** The top navigation now follows the sibling Tahti interaction model: schedule opens its compact upcoming-show preview, broadcast opens a live/offline status preview with a link to the broadcast studio, and messages opens a conversation preview with unread counts and direct thread links. Each preview can still be opened as a full page where appropriate.

## 2026-08-28 — Full schedule link in booking modal

**Completed:** The Tahti Radio booking/calendar modal now includes an “Open full schedule” link alongside the existing close action, taking listeners and artists to the full-screen schedule view.

## 2026-08-28 — Stash track management and audience access

**Completed:** Studio → Stash now opens on an All stash tab listing private archive tracks with the normal track editor, while uploaded locker files remain under a separate Files tab. Track editors now share an Audience control for Public, Not listed, Private, or Stash visibility. Stash visibility shows the artist’s fan tiers with selectable access and a compact add-tier action when no tiers exist.

## 2026-08-28 — Metadata-first audio upload

**Completed:** Upload no longer asks for a title before the file is transferred. The upload API now allows the server to use embedded audio metadata first, falling back to the filename when metadata is absent; the resulting item can then be named in the editor after upload.

## 2026-08-28 — Recent recordings on Upload

**Completed:** Studio → Upload now shows the five latest recorded broadcasts with compact waveform progress bars. Archived recordings can be played, paused, scrubbed, and opened directly in the recording editor; recordings that are not archived remain clearly identified as unavailable for playback until promoted.

## 2026-08-28 — Compact rotation transport controls

**Completed:** While a 24/7 rotation is playing, previous, stop, and skip controls now sit centered in the stream manager header and use icon-only buttons with accessible labels. The stop/start rotation control is highlighted red and remains available as a compact centered control when the rotation is paused.

## 2026-08-28 — Go Live info and recording controls

**Completed:** Go Live pre-flight details now live in a compact Info tab. Duplicate simulcast controls were removed because Multistream is the single destination manager. The separate auto-record action was removed; the page uses one Record broadcast toggle, initialized from the current show/pre-flight default. Show creation and show editing now expose “Record broadcasts by default,” which is persisted with the show and inherited by new broadcasts.

## 2026-08-28 — Release smartlink navigation

**Completed:** Removed Smartlinks from the Library submenu so release smartlink setup has one clear home in the release drafting/editor flow. Release rows now expose an icon-only copy action for the public `/r/:slug` URL, with accessible labeling and success/failure feedback; the existing open-smartlink action remains available.

## 2026-08-28 — Admin content overview

**Completed:** Admin → Content now has its own landing page with overall track, show, upload, and listen totals, a latest-system-content list, and latest recorded broadcasts. Top lists is now a separate Content navigation item and no longer occupies the overview position.

**API contract:** The overview reads `/api/admin/stats/content` with aggregate counts and the latest content/broadcast rows.

## 2026-08-28 — Compact admin and artist tabs

**Completed:** Reduced the shared tab button size to the compact `xs` treatment across the application. Added contextual icons to the admin moderation queues, logs, storage, and studio release, distribution, events, moderation, stats, channel, visualizer, and color/design tab rows so the top-level page navigation is easier to scan and remains consistent with the smaller navigation language.

## 2026-08-28 — Help Center releasing guide

**Completed:** Added a Help Center → Releasing category covering the available release methods in non-technical language: UPC/EAN, MusicBrainz, Discogs, smart links, and automated delivery. It includes a practical workflow, plain-language MusicBrainz and Discogs instructions, and explanations for MBIDs, copyright lines, and label metadata.

## 2026-08-28 — Distribution catalog method toggles and guides

**Completed:** Distribution → release operations now groups catalog setup into independent method toggles for UPC/EAN, MusicBrainz, Discogs, and rights/label metadata. Only the fields for enabled methods are shown, while values remain preserved when a method is temporarily disabled. The Guides tab now uses large icon choices with focused instructions, direct links, MusicBrainz/Discogs prefill and export actions, and Revelator automation guidance.

## 2026-08-28 — Spotify import add-on configuration

**Completed:** Moved Spotify artist-profile linking out of Studio → Distribution and into the Spotify add-on configuration dialog. Once a profile is linked, the add-on provides a HearThis-style content picker with search, multi-select, and import feedback; selected Spotify items are submitted as provider embeds for the user’s library. Unlinking the profile is available in the same configuration surface.

**API contract:** Profile setup uses `/api/me/spotify-profile`; content search uses `/api/v1/imports/spotify/search`; selected content uses `POST /api/v1/imports/spotify/add` with `{ tracks: [{ trackId, title, externalUrl }] }`.

## 2026-08-28 — Release smart-link draft editor

**Completed:** Added a dedicated Smart links tab to the release editor, matching the sibling release draft destinations for Spotify, Apple Music, Bandcamp, SoundCloud, YouTube Music, and Tidal. Spotify and Bandcamp URLs now live in that tab, alongside the public smart-link shortcut and view count.

The tab also includes a standard release playlist editor: tracks can be dragged into a new order, played through the Tahti player, removed from the release, or added from the user’s library. The library picker supports basic text search and content-type filtering and prevents duplicate additions.

**API contract:** Uses the existing `POST /api/me/releases/:id/tracks` endpoint for library additions and the corresponding release-track reorder/delete client routes for playlist editing. The beta API should expose `PUT /api/me/releases/:id/tracks/reorder` and `DELETE /api/me/releases/:id/tracks/:trackId`.

## 2026-08-28 — Artist post deletion

**Completed:** Artist → Posts now confirms before deleting a published post, removes it from the list after the owner-only delete API succeeds, and reports success or failure with a toast. The existing `/api/me/posts/:id` authorization boundary remains the source of ownership enforcement.

## 2026-08-28 — Artist channel stream manager

**Completed:** Ported the sibling artist-channel Stream manager into the public artist page using the existing shared stream widget. Channel owners get the full live stream, overlay, transport, and rotation controls; Board administrators can also see the selected artist channel’s signal, bitrate, output, listeners, peak, and duration in a read-only management view.

## 2026-08-28 — Press kit preview parity

**Completed:** Merged the sibling artist design press-kit preview into Artist → Branding → Press kit. It now shows the lead included photo, artist name, short bio, and up to four additional included gallery images using the same data as the downloadable press kit.

## 2026-08-28 — User media library

**Completed:** Channel background image and video uploads now use the dedicated user-media prepare → Cloudflare R2 upload → complete flow. Added Library → Media as a separate tab with image/video previews, direct open links, file sizes, and confirmed deletion. The channel designer keeps using the returned media URL for the artist backdrop.

**API contract:** The client uses `/api/me/media`, `/api/me/media/prepare`, `/api/me/media/complete`, and `DELETE /api/me/media/:id`; the beta API must expose these endpoints against the user R2 bucket.

## 2026-08-28 — Video loop backdrop sources

**Completed:** Kept channel video backdrop controls inside the Video loop header option, with the standard drag-and-drop upload box as the primary action and a link icon for an optional YouTube URL field. Direct MP4/WebM uploads and YouTube watch, shorts, and short-link URLs now preview in the designer and render as muted looping public-channel backdrops.

## 2026-08-28 — Channel background media effects

**Completed:** Ported the sibling channel editor’s background-media flow into Artist → Branding. The standard drag-and-drop image picker uploads up to 10 artist images, shows a live thumbnail and header preview, cycles multiple images automatically, offers slideshow effect controls, and exposes single-image gallery/WebGL effects when only one image is present.

## 2026-08-28 — Color scheme presets

**Completed:** Added a sixth live color scheme preset, Rose night, to Artist → Branding → Color scheme. It follows the existing preset behavior: selecting it immediately updates the channel preview, and the change is persisted only when the user saves the branding look.

## 2026-08-28 — Visualizer preset editor parity

**Completed:** Ported the sibling preset-editor behavior into the shared artist branding designer. Visualizer selection and Color scheme controls now have separate tab pills, while the artist channel preview remains available as the persistent live example. Preset previews now continue to pulse with a synthetic modulation when no track is playing, and playing audio still drives the analyser-reactive level.

## 2026-08-28 — Artist backdrop visualizer preview

**Completed:** Artist → Branding now presents the channel backdrop as an artist channel preview. Presets can be browsed without changing the saved look, animated presets expose a configuration icon, and their parameters open in a modal while the full preview stays visible. Applying a preset still controls the public artist channel backdrop through the existing channel visual API.

## 2026-08-28 — Artist creative role tags

**Completed:** Artist → Identity now includes compact tag-style role selection for production, DJing, live performance, instruments, vocals, songwriting, composition, engineering, visual work, and curation/label work. Selections persist through the existing profile metadata contract and are preserved when Connections is saved.

## 2026-08-28 — Artist info editor and image purposes

**Completed:** Artist settings now follows the sibling editor’s Identity, Story, and conditional People structure; People is shown only for collective profiles. Identity includes a multi-image drag/drop picker that asks for a purpose per image before upload: Profile image, Gallery, or Press kit. Profile images update the artist avatar, while gallery and press-kit images use the existing press-kit image API with the selected inclusion setting.

## 2026-08-28 — Active love icon treatment

**Completed:** Standardized favorited/loved icon states across artwork overlays, track context menus, and track information dialogs. Active hearts now use the red accent and filled icon treatment, while inactive hearts remain neutral.

## 2026-08-28 — Broadcast slot end times

**Completed:** Broadcast schedule cards, show details, and scheduled episode rows now show the complete local time range. End times are derived from each show’s configured one- or two-hour slot duration, with the channel-level next broadcast using its configured duration.

## 2026-08-28 — Audio editor waveform scaling

**Fixed:** The editor now normalizes API waveform buckets before drawing. Tahti’s editor peaks are commonly encoded as `0–255`, while the canvas renderer expects normalized amplitude; previously values above `1` were clamped and produced an almost solid block instead of a waveform. The main waveform and zoom minimap now use the actual peak range, preserve normalized inputs, and continue to render safely when server peaks are unavailable.

## 2026-08-28 — Mention controls and Storybook references

**Completed:** Added reusable @mention autocomplete to track descriptions and artist story fields, plus artist tagging on DJ-set tracklist pins. The public artist profile now renders a conditional “Tagged in” section and links to the source when the API provides one. Storybook now has interactive entries for `MentionTextarea` and `TracklistEditor`, with each entry documenting the production view and source file where the element is used.

**API note:** The UI uses the sibling API’s authenticated user search (`/api/me/users/search`) and public mentions endpoint (`/api/v1/u/:username/mentions`). The sibling tracklist contract supports `artistUsername` and mention notifications. Source title/link fields are optional because the current public response does not yet return them; the profile falls back to the mentioning artist until that API response is extended.

## 2026-08-28 — Audio plugin activation and filter controls

**Completed:** Added persisted activation state for Pro Editor audio add-ons. The editor's chain and picker now exclude plugins that are not activated in Settings → Add-ons → Audio plugins, and both the add-on catalog and active chain use prominent switch controls. Filter configuration now presents response-curve previews for low/high-pass and shelf types, plus clear 12 dB/octave, 24 dB/octave, and brickwall slope choices.

## 2026-08-28 — Schedule show details and Library upload

**Completed:** Show names in the Schedule page now open a promo details modal with the show's banner or artwork, description, tagline, time, location, episode number, and an optional link to manage the show. Upload now belongs to the Library route and submenu (`/library/upload`); the former Studio upload URL remains a compatibility redirect.

## 2026-08-28 — Theme editor controls and custom theme library

**Completed:** Added a color picker and simple hue slider to every curated theme section, with the existing live preview updating on every edit. Theme JSON import is now available from an icon-triggered modal, validates against the shared AdvancedTheme schema before applying, and stores the result in the user theme library. User-owned themes can be renamed and exported as formatted JSON.

## 2026-08-28 — Visualizer gallery and live preview

**Completed:** Ported the sibling Tahti visualizer-gallery interaction into Settings → Add-ons → Visualizers. The gallery now keeps one full-size visualizer mounted while presets are browsed, provides a clear preview selection state, and gives each configurable visualizer a gear button that opens its tuning dialog without removing the preview from the page. Speed and intensity controls now include concise footnotes explaining their effect, and the preview exposes an audio-reactivity toggle when the selected visualizer supports animated response.

## 2026-08-28 — Mobile app-shell navigation audit

**Completed:** Audited the mobile shell, bottom navigation, mobile drawer, top bar, and Studio contextual navigation. Removed lower-priority Schedule, Go live, Upload, and Book actions from the narrow top bar so the menu button, logo, Messages, and account controls remain usable at phone widths. The same actions remain reachable from the mobile drawer and Studio pages. Help center is retained on desktop and hidden from the mobile Studio menu to prevent navigation clutter. The mobile header now clips accidental horizontal overflow instead of becoming a scrolling strip.

## 2026-08-28 — Nuclear registry add-on catalog

**Completed:** Added a dedicated Settings → Add-ons → Nuclear plugins category for the remaining practical Nuclear registry integrations: Discogs, Deezer, ListenBrainz, Last.fm, YouTube provider tools, Bandcamp and SoundCloud dashboards, and OmniSource. Each entry has its own configuration dialog, labelled fields, status, and API/runtime explanation. Existing Tahti behavior is marked available or partial; integrations without a Tahti runtime contract remain explicitly planned rather than being presented as working providers.

**Pending:** The configuration surface is in place, but Last.fm/ListenBrainz scrobbling, Deezer/Discogs provider search, YouTube provider streaming/playlists, and OmniSource need server-side contracts and runtime adapters before activation. NetEase and KHInsider remain intentionally excluded per the existing plugin parity decision.

## 2026-08-28 — Admin and Studio role-access audit

**Audit result:** All admin views are wrapped in `AdminGate`, which requires the canonical Board role, and legacy admin URLs redirect to those gated views. The sibling API admin route set was also checked: admin endpoints use `requireBoard`. Studio views use `StudioGate`; the audit found that it previously checked only authentication/channel presence, allowing an authenticated lower-level account to reach channel-less Studio pages.

**Completed:** StudioGate now requires Artist or Board access for every Studio view, including channel-less dashboard, governance, revenue, and channel setup flows. The setup-channel redirect also rejects lower-level accounts before opening the wizard. Direct navigation is covered by the gate; API ownership/authorization remains enforced server-side by the sibling API.

**Follow-up:** The direct `/studio/branding` route was also wrapped with StudioGate after route-level review found it rendered artist settings directly.

## 2026-08-28 — Admin governance activity context

**Completed:** Admin → Governance now shows total recorded votes, discussion subjects, and comments, plus a recent voting activity table with actor, action, time, and subject context. Governance actions in the shared audit log now render as readable actor-focused messages instead of generic action names.

## 2026-08-28 — Governance dashboard signals

**Completed:** Added a Governance section to the artist dashboard. It surfaces open motions and feature topics where the member has not yet voted, plus unresolved motions and topics with active discussion comments, with direct links to review each area.

## 2026-08-28 — Clips in library browsers

**Completed:** Added Clips as a dedicated content group in the rotation editor’s “Add from library” browser and as a clearly labelled type in the audio editor’s “Open from library” dialog. Audio clips no longer appear mixed into the ordinary Tracks group.

## 2026-08-28 — Bandcamp release links and importer surface

**Completed:** Added Bandcamp as a first-class importer add-on surface with connected discography browsing, release import actions, mock coverage data, and shop links. Release editing now accepts a Bandcamp shop URL; configured album/EP releases and their track rows show the Bandcamp brand icon linking to that shop page. The UI targets the sibling API's Bandcamp album/import contracts and keeps the existing OAuth connection flow.

**Pending:** The sibling API currently exposes the album listing as a stub and does not yet expose the `/api/v1/imports/bandcamp/add` write endpoint. The beta UI is ready for those API responses, but production Bandcamp catalog import remains blocked until that server-side Bandcamp API approval/import implementation lands.

## 2026-08-28 — Three.js ambient background

**Completed:** Added a persistent, low-intensity Three.js ambient canvas based on the sibling Tahti public-site background approach. Settings → Themes now provides Aurora, Particles, and Reactive grid presets plus a persistent off switch; the canvas uses the shared player analyser for gentle playback response and stays pointer-inert behind the app.

## 2026-08-28 — Library overview tabs

**Completed:** Reworked the Library overview into a Library page with All sounds as the default tab, Collections as the second tab, and Recordings as the third tab. Removed the duplicate Sounds, Collections, and Recordings entries from the contextual Library menu, removed the embedded collections list from All sounds, and kept existing deep routes available through the new tabs.

## 2026-08-28 — Library playback state

**Completed:** Library sound rows now highlight only the track that is actively playing. Paused or loading tracks keep the normal play button treatment, while pinned-row styling remains visible independently.

## 2026-08-28 — Stats plays layout

**Completed:** Kept the Plays & listeners tab inside its own grid container so the charts cannot enter the Studio sidebar column. The listener map remains first and the Plays over time chart now sits below it at full content width.

## 2026-08-28 — Stable Studio navigation and dashboard status

**Completed:** Wrapped the Studio top navigation, contextual menu, and Help center link in one stable grid item so changing sections cannot create an extra layout row or move the navigation vertically. Studio content now receives a consistent inset on desktop while retaining the responsive mobile flow. The Studio dashboard now shows clear account-role, membership, and channel-state badges beside the greeting.

## 2026-08-28 — Preserve sessions through temporary API failures

**Completed:** Auth refresh no longer clears the persisted user when `/api/auth/me` temporarily fails due to a network or server error. A genuine unauthorised response still signs the user out, while transient failures keep the current session visible until the next successful refresh. The API already issues a 30-day session cookie; extending that server expiry requires the sibling API configuration.

## 2026-08-28 — Channel chat setting placement

**Completed:** Moved “Enable live chat on my channel” from Account → Notifications & visibility to Settings → Channel → Discovery, alongside the other public channel discovery controls. It still uses the same profile API field with optimistic update rollback and save feedback.

## 2026-08-28 — Conditional artist location and country suggestion

**Completed:** Artist Identity now shows City / location only when a country is selected. When an existing profile has no country, the form makes a best-effort suggestion from the browser’s locale region using the supported country list; it remains editable and is saved only with the normal identity save action.

## 2026-08-28 — Artist Press kit navigation consolidation

**Completed:** Removed the duplicate top-level Press kit tab from Settings → Artist. Press kit editing remains available from the Branding panel’s own Branding / Gallery / Press kit navigation, keeping the Artist settings tabs focused and avoiding two entry points to the same content.

## 2026-08-28 — Conditional custom channel genre

**Completed:** The Channel & design genre picker now keeps the “Add a genre” field hidden for the standard genre choices. It appears only after `Other` is selected, while existing custom genre chips remain visible and removable. Added component coverage for both states.

## 2026-08-28 — Studio Help Center entry and contained help layout

**Completed:** Added a persistent Help center link below the contextual Studio submenu, so artists can reach help without leaving the Studio navigation model. The Help hub and article layout now explicitly allow shrinking inside the app content pane, with full-width bounded framing, min-width guards on sections/cards, and responsive grids that do not push the container wider.

## 2026-08-28 — Tahti Map screenshots and navigation atlas refresh

**Completed:** Refreshed the Map capture set with admin-privileged/mock-authenticated screenshots for the newly touched Studio Radio, announcements, Tahti Radio, governance, events, Admin Vendors, Admin Disco Widgets, Admin Status, and Account Notifications views. Added the missing screenshot IDs to `capture-map-screens.mjs` so the set can be reproduced with `MAP_SHOT_IDS`.

**Completed:** Added a “Recently ported beta views” section to the Tahti Map atlas. Each view now has a plain-language explanation, verified in-screen actions, verified destinations, and the same zoomable Mermaid navigation diagram used by the other map cases. Production-only panes are marked explicitly instead of showing invented screenshots.

## 2026-08-28 — Section sidebar uses Nuclear primitives

**Completed:** Replaced the duplicated Studio/Admin section-sidebar markup with Nuclear’s shared `SidebarNavigation` and `SidebarNavigationItem` components. The wrapper retains the beta shell’s responsive horizontal-to-vertical layout and explicit route selection, while the shared item now supports both router-derived and caller-provided active state so deep and query routes keep one stable highlighted item.

## 2026-08-28 — Beta feature-port and UI audit consolidation

**Completed:** Consolidated the latest beta work from the sibling Tahti application and the Storybook/Nuclear UI audit. Studio and Admin navigation now expose the ported artist/admin surfaces through stable section sidebars and top-level tabs, including governance, vendors, Disco Widgets, announcements, pinned announcements, Radio, Tahti Radio submissions, moderation, logs, and account/settings parity. The audit screenshots and navigation notes remain part of this worklog so each view can be reviewed against the shared layout.

**Completed:** Added the Studio Radio workflow for announcements, pinned announcements, five-track Tahti Radio submissions, submission status, and channel opt-in. Added Clips as a library content type for uploaded audio and radio announcements. The Sounds archive now follows the sibling archive listing, suppresses HEARTHIS provider labels, supports original-file downloads where enabled, and opens track statistics in a large modal.

**Completed:** Unified HEARTHIS playback with the shared player when a provider stream is available, including shared pause/stop behavior. Rotation editing now has a five-track capacity guard with clear replacement feedback and drag-and-drop ordering in the channel and stream-manager editors. Notification preferences were merged with the sibling notification model and grouped into clearer settings cards.

**Completed:** Added the compact channel video-URL reveal control and retained the existing URL fallback for channel media configuration. The latest beta deployment completed successfully with build and SPA/API smoke checks.

**Pending:** Backdrop file uploads and the slideshow media-picker storage workflow still require the corresponding backend upload/storage endpoints; the current editor keeps its URL-based fallback until those APIs are available.

## 2026-08-28 — Studio governance section

**Completed:** Ported artist governance into Studio as a dedicated Governance submenu page. It reuses the member-gated motions, voting, discussion, and feature-request experience with the stable Studio navigation shell.

## 2026-08-28 — Settings tab parity audit

**Completed:** Verified all sibling Connections services are available in Artist settings and exposed the previously hidden Broadcast and Audience settings as top-level tabs. Their existing Radio, Green room, Moderators, Multistream, Fan tiers, Fan subs, Grants, and Your subs tabs are now reachable directly from Settings.

## 2026-08-28 — Account storage and privacy tabs

**Completed:** Ported the missing artist-panel Account features into separate settings tabs: storage usage with quota progress, account data and press-kit exports, GDPR privacy guidance, and a manual account-deletion request flow.

## 2026-08-28 — Help center refresh

**Completed:** Reworked the Help center into a Storybook-aligned guide hub with clear Start here, Broadcasting, Account and support, and Build with Tahti sections. Added an essentials summary, direct About Tahti link, and a link to the public help center.

## 2026-08-28 — Playlist action and fullscreen player parity

**Completed:** Integrated the playlist picker into the fullscreen player alongside the compact player action, and adjusted live/station artwork to display artist and station logos contained within the viewport instead of cropping them.

## 2026-08-28 — Admin Disco Widgets catalog

**Completed:** Ported the Disco Widgets admin catalog with listener, artist, and admin type filters, cover art, widget registration and editing in a modal, editable categories/parameters metadata, and confirmed deletion.

## 2026-08-28 — Admin overview vendors tab

**Completed:** Ported the sibling Tahti Vendors & DPA tracking view into a new Vendors tab under Admin → Overview. Distribution status, critical vendors, integration vendors, and DPA indicators share the same reusable content as the standalone Vendors route.

## 2026-08-28 — Artist live shows and recordings

**Completed:** Artist profiles now show a Live shows section when the artist has upcoming radio bookings or past shows. Upcoming broadcasts and past recordings are separated, with show details and published recording links where available.

## 2026-08-28 — Merged artist channel profile

**Completed:** Merged the sibling Tahti artist-channel behavior into the Nuclear artist profile: the Three.js visual stage now receives persisted visualizer settings, the owner channel editor remains available, and public library tabs are shown only for meaningful content. Existing track info modals, detail navigation, and fullscreen playback behavior were preserved.

## 2026-08-28 — Subscription and station profile links

**Completed:** Fan subscription is now shown only on eligible artist profiles, only when the artist has subscriptions enabled and tiers configured, as an icon action in the profile header. Removed artist-profile links from Tahti Radio and its show view.

## 2026-08-28 — Artist connections and profile links

**Completed:** Reworked the Artist settings Social links tab into Connections with streaming destinations and profile links from the sibling Tahti app, including hearthis.at, Mixcloud, Twitch, Kick, Spotify, TikTok, X, and Facebook. Added consistent service marks to the editor and public artist profile, plus a Notifications & visibility toggle to hide all connections publicly.

## 2026-08-28 — Upcoming shows on Studio dashboard

**Completed:** The artist dashboard now loads upcoming scheduled shows, displays them only when present, and provides a direct View & edit action to the show details page for each booking.

## 2026-08-28 — Platform status moved to Admin

**Completed:** Consolidated the map’s platform status data into Admin → Status, including version, uptime, timestamp, and any additional health checks alongside the existing service, queue-health, and cron-job data. Removed the standalone Status quick link from the Tahti map.

## 2026-08-28 — Audio editor sidebar focus

**Completed:** Opening a track or project editor now collapses the persistent left app sidebar to give the editor the full working width. The user’s previous sidebar state is restored when leaving the editor.

## 2026-08-28 — Audio clips content type

**Completed:** Added the Audio clip content type to archive editing and announcement uploads. Clip editing keeps the shared title, description, visibility, comments, downloads, audio, and visual controls while hiding musical metadata, rotation, playlist, and MusicBrainz controls.

## 2026-08-28 — Audio editor library browser

**Completed:** Replaced the inline archive shortcuts with an Open from library modal. It starts on All, provides a content-type browser on the left, searchable matching library contents on the right, and opens the selected item in the pro editor.

## 2026-08-28 — Audio editor empty state

**Completed:** The audio editor now shows a single New session action when no projects exist; the header action is only shown once existing projects are available.

## 2026-08-28 — Playlists nested under Collections

**Completed:** Removed the standalone Playlists view switch from Studio Collections. Playlists remain available as collection entries and open through the unified collection contents editor.

## 2026-08-28 — Collection names open contents

**Completed:** Collection and playlist names in the library and Studio collection views now open the unified collection contents editor, so every collection type drills into its track contents consistently.

## 2026-08-28 — Collection track and visibility tabs

**Completed:** Collection editing now opens on an icon-led Tracks tab, with Visibility in its own tab. The add-from-library browser supports title, genre, and content-type search; collection rows show genre metadata; and the trash action removes only the item from the collection.

## 2026-08-28 — Organized rotation library additions

**Completed:** The Active rotation tab now organizes library additions into Tracks, DJ Sets, Releases, and Playlists. Adding a group opens an explicit Append or Overwrite confirmation, de-duplicates tracks, and respects the rotation capacity before publishing.

## 2026-08-28 — 24/7 active rotation tab

**Completed:** Split the channel 24/7 panel into Programme and Active rotation tabs. Active rotation now pulls ready content from the full library, supports drag-and-drop ordering, and provides a play action for every track while retaining playlist-based bulk additions.

## 2026-08-28 — Uploaded channel video backdrop

**Completed:** Replaced the Header → Video loop URL field with a short MP4/WebM uploader. Files are limited to 10 MB, preview locally in a muted looping container before approval, and upload through a user-scoped presigned R2 flow only when the channel design is saved. Existing backdrops can be previewed or removed.

## 2026-08-28 — Radio announcements

**Completed:** Added the Tahti artist announcement library as a dedicated Studio → Manage → Radio → Announcements tab. Artists can upload, enable, preview, remove, and assign ready station-ID clips as public page music. The existing Admin → Announcements route remains the site-wide system announcement manager for generic announcements.

## 2026-08-28 — Artist identity, story, and people

**Completed:** Ported the Tahti artist-info structure into Settings → Artist. Identity now owns the public artist essentials, Story provides short and long-form biography editing, and People combines solo/collective selection with the public member and credit list. Existing branding, gallery, social links, and press-kit tabs remain available.

## 2026-08-28 — Tahti channel design parity

**Completed:** Replaced the channel designer's limited visual controls with the Tahti channel-design workflow: shared visual styling, background gallery modes, public image sources, optional channel backdrop, slideshow transition presets, interval, transition speed, and autoplay. Gallery and visual settings are loaded and published through the channel APIs, with HTTPS image validation and the source repo's WebGL/gallery preset names.

## 2026-08-28 — Collapsible channel controls

**Completed:** Added `ChannelControlsWidget` as the shared channel-control shell. Channel designer controls now use consistent collapsible sections in Studio, Settings, channel setup, public channel editing, and the artist channel surface. Added a Storybook story covering expanded and collapsed sections.

## 2026-08-28 — Compact section navigation

**Completed:** Studio and Admin top-level section tabs now show their section icons in a smaller, tighter control. Shared shell content receives a slightly larger inset while the left navigation remains fixed in place.

## 2026-08-28 — Sounds canvas player

**Completed:** Tracks opened from Sounds now use the standalone canvas player route. The view combines cover art, a cover-colour visual background, the channel visual preset, a large seekable waveform, playback controls, and the track comments thread. Explicit channel background colours override the cover-derived tint.

## 2026-08-28 — Amber active-state contrast

**Completed:** Tahti’s amber primary fill now consistently uses the dedicated primary foreground token instead of the normal page foreground. Active navigation, filters, calendar selections, messages, selects, pagination, and other highlighted controls remain readable on the orange background.

## 2026-08-28 — Spotify import configuration CTA

**Completed:** The Spotify artist profile panel now shows the required Web API client ID, client secret, and server-side access requirements, with a direct Configure button to Admin → Vendors when the integration is unavailable.

## 2026-08-28 — Channel share action

**Completed:** Added the Tahti-style share icon to the public channel header and Go Live. It opens the native share sheet when supported and otherwise offers a copyable channel link. Settings → Channel → Discovery now controls visibility, enabled by default.

## 2026-08-28 — Go Live pre-flight

**Completed:** Ported the Tahti pre-flight workflow into Go Live. Artists can set the broadcast name and type, select a series episode, add a tagline, choose visibility, toggle simulcast targets, and control auto-recording before going on air.

## 2026-08-28 — Conditional DJ mix tracklist

**Completed:** Added the reference editor’s Tracklist section only for DJ mix tracks; changing the content type away from DJ mix hides it and resets the editor to Basics.

## 2026-08-28 — Track editor workflow

**Completed:** Aligned the track editor with the Tahti reference workflow by adding Basics, Audio, Cover & visuals, Sharing, and Advanced sections. Playlist and export actions remain available from Advanced.

## 2026-08-28 — Playlists under Collections

**Completed:** Removed the broken standalone Playlists sidebar entry and made the Collections page’s Playlists view filter playlists in place.

## 2026-08-28 — Clarify Sounds stash tab

**Completed:** Renamed the Sounds Files tab to “Move to stash” while preserving the existing private-file view and route.

## 2026-08-28 — Track insights and export placement

**Completed:** Extracted the track insights content into a reusable panel and embedded it directly in the track Insights tab without a second navigation button. Removed the release-header MusicBrainz action and placed it in the release Export tab.

## 2026-08-28 — Live show image picker

**Completed:** Show creation and show-detail editing now use the shared Storybook image picker for thumbnails and backdrops. The picker supports drag-and-drop, image type filtering, local preview, and retained URL editing for existing remote artwork.

## 2026-08-28 — Edit next broadcast

**Completed:** Added an edit action to the next scheduled broadcast card. It reopens the existing schedule form populated with the saved timing, show, description, artwork, type, and duration, and persists those fields when saved.

## 2026-08-28 — Shared live rotation editor

**Completed:** Extracted the editable channel 24/7 rotation list into `ChannelRotationEditor`. Go Live and Studio → Manage → Radio now share the same capacity-aware quick-add, reorder, duration, and remove controls.

## 2026-08-28 — Radio booking form overlay

**Completed:** The Tahti Radio calendar modal now shows the calendar and bookings without the full booking form. The form opens in a wider dedicated overlay from the Book a slot icon or action, preserving the selected date and show details.

Page-by-page loop: redesign → screenshot → **wait for comment or `approved`** → next page.

Screenshots: `docs/redesign-shots/{page-slug}-v{n}.png`

Workflow rules: one page at a time; do not advance until user approves.

## Cross-repo parity audit — Tahti-org → beta (2026-08-27)

Compared the artist and admin routes in `../tahti` with the current beta panels.

- Governance: beta has motions, voting, comments, and feature requests, but the artist overview is missing the org-style “Needs your attention” and “Top topics” summary; admin governance cards for member register, audit, resolutions, annual report, and venue verification are mostly informational rather than actionable.
- AGM: beta has the editable agenda, motions list, and notice checklist, but is missing the org links for member-register export, board resolutions, annual report generation, audit log, and governance portal.
- Grants: beta shows disbursement history only; org has year/cycle preview, pool validation, recipient breakdown, and an approve/disburse action.
- Feature requests: beta has status filtering and row status changes, but not the org quarterly review report.
- Missed shows: missing as an admin route and navigation entry in beta; org provides status filters, artist/show context, inspect/message actions, and review/action/dismiss transitions.
- Support queue: beta has the primary list, detail, status changes, replies, and search; no material route-level gap found in this pass.
- Tahti Selects: beta has the editor, search/add, ordering, removal, preview, and stream controls; it is merged under Moderation rather than a standalone page.
- Posts/newsletter: beta combines these under Updates and supports create/edit/delete drafts; org’s separate surfaces make the workflows clearer, so parity review remains for publish/scheduling and delivery reporting.
- Channel: beta combines design, profile, domain, gallery layers, and 24/7 radio in one view; org splits text, gallery, links, widgets, schedule, and playlist into dedicated pages. Beta needs a deeper control-by-control audit before claiming parity.

First implementation slice: add the missing admin Missed shows queue as an addressable beta view.

---

## Artist studio (POC routes)

| # | Page | Route | Status | Shot |
|---|------|-------|--------|------|
| 1 | Studio home | `/studio` | **approved** | `docs/redesign-shots/studio-home-v1.png` |
| 2 | Go Live wizard | `/studio/go-live` | **approved** | `docs/redesign-shots/studio-go-live-v1.png` |
| 3 | Music / Archive (Library) | `/studio/archive` | **approved** | `docs/redesign-shots/studio-archive-v1.png` |
| 4 | Archive item | `/studio/archive/$id` | **approved** | `docs/redesign-shots/studio-archive-item-v1.png` |
| 5 | Upload | `/studio/upload` | **approved** | `docs/redesign-shots/studio-upload-v1.png` |
| 6 | Releases | `/studio/releases` | **approved** | `docs/redesign-shots/studio-releases-v1.png` |
| 7 | Release detail | `/studio/releases/$id` | **approved** | (panels + Save CTA) |
| 8 | Collections / album designer | `/studio/collections` | **approved** | `docs/redesign-shots/studio-collections-v1.png` |
| 9 | Collection editor | `/studio/collections/$slug` | **approved** | |
| 10 | Audio editor list | `/studio/editor` | **approved** | (panels + icon row actions) |
| 11 | Editor project | `/studio/editor/$id` | **approved** | |
| 12 | Schedule | `/studio/schedule` | **approved** | `docs/redesign-shots/studio-schedule-v1.png` |
| 13 | Stats | `/studio/stats` | **approved** | `docs/redesign-shots/studio-stats-v1.png` |
| 14 | Stats detail | `/studio/stats/detail` | **approved** | (panels + range chips) |
| 15 | Channel designer | `/studio/channel` | **approved** | `docs/redesign-shots/studio-channel-v1.png` |
| 16 | Shows | `/studio/shows` | **approved** | `docs/redesign-shots/studio-shows-v1.png` |
| 17 | Show detail / episode review | `/studio/shows/$id`, `…/episodes/$episodeId` | **approved** | |
| 18 | Playlists | `/studio/playlists`, `…/$slug` | **approved** | `docs/redesign-shots/studio-playlists-v1.png` |
| 19 | Updates / newsletter | `/studio/updates` | **approved** | `docs/redesign-shots/studio-updates-v1.png` |
| 20 | Revenue / Connect | `/studio/revenue` | **approved** | `docs/redesign-shots/studio-revenue-v1.png` |
| 21 | Stash | `/studio/stash` | **approved** | `docs/redesign-shots/studio-stash-v1.png` |
| 22 | Sources hub | `/sources` | **approved** | `docs/redesign-shots/sources-v1.png`, `docs/redesign-shots/sources-detail-v1.png` |
| 23 | Settings — account | `/settings/account` | **approved** | already Nuclear shell (no redesign needed) |
| 24 | Settings — artist | `/settings/artist` (etc.) | **approved** | `docs/redesign-shots/settings-artist-v1.png` |
| 25 | Settings — money / fan tiers | `/settings/money` | **approved** | already Nuclear shell (no redesign needed) |
| 26 | Settings — connections | `/settings/connections` | **approved** | already Nuclear shell (no redesign needed) |

## Admin (prod `/admin/*`)

Porting into a Nuclear admin shell, gated on `user.isBoard`. Page-by-page loop, same as artist studio above. Inventory from prod `admin-nav`:

| # | Page | Prod route | Status | Shot |
|---|------|------------|--------|------|
| A1 | Dashboard | `/admin/dashboard` → `/admin` | **approved** | `docs/redesign-shots/admin-dashboard-v1.png`, `…-expanded-v1.png` |
| A2 | Beta applications | `/admin/beta` | **approved** | `docs/redesign-shots/admin-beta-v1.png` |
| A3 | Users | `/admin/users` | **approved** | `docs/redesign-shots/admin-users-v1.png` |
| A4 | Radio | `/admin/radio` | **approved** | `docs/redesign-shots/admin-radio-v1.png` |
| A5 | Radio submissions | `/admin/radio-submissions` | **approved** | `docs/redesign-shots/admin-radio-submissions-v1.png` |
| A6 | News | `/admin/news` | **approved** | `docs/redesign-shots/admin-news-v1.png` |
| A7 | Tahti Selects | `/admin/tahti-selects` | **approved** | `docs/redesign-shots/admin-selects-v1.png` |
| A8 | Streams | `/admin/streams` | **approved** | `docs/redesign-shots/admin-streams-v1.png` |
| A9 | Support | `/admin/support` | **approved** | `docs/redesign-shots/admin-support-v1.png` |
| A10 | Top lists | `/admin/top-lists` | **approved** | `docs/redesign-shots/admin-top-lists-v1.png` |
| A11 | Announcements | `/admin/announcements` | **approved** | `docs/redesign-shots/admin-announcements-v1.png` |
| A12 | Storage | `/admin/storage` | **approved** | `docs/redesign-shots/admin-storage-v1.png` |
| A13 | Files | `/admin/files` | **approved** | `docs/redesign-shots/admin-files-v1.png` |
| A14 | Content reports | `/admin/content-reports` | **approved** | `docs/redesign-shots/admin-content-reports-v1.png` |
| A15 | Financial | `/admin/financial` | **approved** | `docs/redesign-shots/admin-financial-v1.png` |
| A16 | Governance hub | `/admin/governance` | **approved** | `docs/redesign-shots/admin-governance-v1.png` |
| A17 | Feature requests | `/admin/feature-requests` | **approved** | `docs/redesign-shots/admin-feature-requests-v1.png` |
| A18 | Grants | `/admin/grants` | **approved** | `docs/redesign-shots/admin-grants-v1.png` |
| A19 | AGM | `/admin/agm` | **approved** | `docs/redesign-shots/admin-agm-v1.png` |
| A20 | Vendors | `/admin/settings/vendors` → `/admin/vendors` | **approved** | `docs/redesign-shots/admin-vendors-v1.png` |
| A21 | Status | `/admin/status` | **approved** | `docs/redesign-shots/admin-status-v1.png` |
| A22 | i18n languages + CSV import | (new — see Phase 0) | **approved** | `docs/redesign-shots/admin-i18n-v1.png` |

**i18n (Approved):** Admin creates languages + imports English-base CSV — [CUTOVER-PHASE0.md](./CUTOVER-PHASE0.md).

---

## Entries

### 2026-08-27 — Studio navigation audit and follow-up fixes

**Audit:** Captured 31 Studio views across Studio, Library, Perform, and Manage, including submenu routes, detail pages, query tabs, and the new event page. Verified the persistent top menu, fixed-position left navigation, one active top section, one active submenu item, and settled layout geometry. Screenshots are in `docs/redesign-shots/studio-audit/`.

**Findings and fixes:**

- Removed route-transition animation from stable Studio/Admin/Library shells so the left menu does not jump between views.
- Removed desktop grid row gaps that were creating blank bands between section navigation and page content.
- Added a direct working Insights route and included it in Studio navigation.
- Added Studio event Upcoming/Past tabs, thumbnails, and a dedicated Add event page.
- Added single-show versus continuing-series creation; episode controls render only for continuing series.
- Removed Radio stations from the Admin Content navigation because it is handled by Moderation.

**Status:** audit captured all requested views; the remaining duplicate-active warnings are audit-harness locator artefacts: visual inspection shows one highlighted submenu item per view. The harness now filters hidden and zero-size nodes and is retained for future audits.

### 2026-08-27 — Admin Content navigation

- Made Top lists the default Overview destination in the Content section.
- Content top-tab selection now navigates to its first submenu item.
- Removed Radio stations from the Content navigation because it belongs with moderation review.

### 2026-08-12 — Page 1 Studio home v1 (`in-review`)

**Goal:** Nuclear simplicity — group by context; one primary action; hide secondary clutter.

**Changes:**

- Removed flat 13-tile CardGrid + duplicate button row + “full production dashboard” escape hatch on the home surface
- Hero: channel name/state + single **Go Live** CTA
- Three context groups: **Broadcast**, **Music**, **Audience & channel** (primary links only)
- **More tools** disclosure for editor, stash, sources (collapsed by default)
- Dropped API/source jargon from the subtitle
- Kept `StudioNav` for deep navigation on other pages; home relies on groups

**Screenshot:** `docs/redesign-shots/studio-home-v1.png`

**Status:** approved (user: “move with next”).

### 2026-08-12 — Page 2 Go Live wizard v1 (`in-review`)

**Goal:** Simpler Nuclear wizard — clear steps, one job per panel, hide optional multistream noise.

**Changes:**

- Title → **Go Live**; dropped “Broadcast wizard” + API source jargon
- Compact step rail (1 Connect · 2 Live · 3 Multistream) with done ticks
- Connect: credentials + signal status; checklist as compact chips
- Live: single status card + primary actions only
- Multistream: destinations list first; **Add destination** form collapsed until opened
- Weekly usage moved to a quiet footer line

**Screenshot:** `docs/redesign-shots/studio-go-live-v1.png`

**Status:** approved (user: continue worklog).

### 2026-08-12 — Page 3 Music archive v1 (`in-review`)

**Goal:** Catalog list with one primary action; secondary row actions hidden.

**Changes:**

- Header: title + single **Upload** CTA (dropped Sources / Editor clutter)
- Empty state with Upload CTA
- Row: Play + Edit primary; playlist / audio editor / delete under **More**
- Removed API jargon from subtitle
- Shared **StudioNav** slimmed: primary 5 pills + collapsed “More studio tools”

**Screenshot:** `docs/redesign-shots/studio-archive-v1.png` (captured mock Vite + Playwright)

**Status:** approved (user: continue / next slice).

**Note:** Same ship commit (`60f5d875a`) also included artist gallery on profiles (fan-facing; not a studio worklog row).

### 2026-08-12 — Page 5 Upload v1 (`in-review`)

**Goal:** One job — pick file, upload.

**Changes:**

- Human subtitle (no prepare/PUT/complete jargon)
- Filename hint after pick; success → Open in Music only
- Link back to Music

**Screenshot:** `docs/redesign-shots/studio-upload-v1.png` (captured mock Vite + Playwright)

**Status:** approved (user: continue / next slice).

**Shared note:** StudioNav slim (primary 5 + collapsed “More studio tools”) ships with these pages; review on both shots.

### 2026-08-12 — Page 4 Archive item v1 (`in-review`)

**Goal:** One job — edit metadata; hide audio editor until needed.

**Changes:**

- Human subtitle + status/visibility chips (no middle-dot status line)
- Header **Save** as the only primary CTA
- Fields: title, description, genre, public toggle
- **More tools** disclosure for Audio editor

**Screenshot:** `docs/redesign-shots/studio-archive-item-v1.png`

**Status:** in-review — awaiting comment or `approved`.

### 2026-08-12 — Page 6 Releases v1 (`in-review`)

**Goal:** Catalog list with one primary action; create form collapsed.

**Changes:**

- Human subtitle (no API path jargon)
- Header **New release** CTA; create form opens on demand
- Empty state with New release CTA
- Row: Edit primary; public link / distribution under **More**
- Dropped always-visible Distribution button in the header

**Screenshot:** `docs/redesign-shots/studio-releases-v1.png`

**Status:** in-review — awaiting comment or `approved`.

### 2026-08-12 — Shows + Playlists + Channel designer (studio pillars)

**Goal:** Ship the accumulated studio pillars with Nuclear panel depth (padded titles, containers).

**Nav IA:** Primary = Overview · Go Live · Library · Releases · Shows. More = Playlists · Channel designer · Upload · Albums · …

**Shows (`/studio/shows`):**

- Create show (interval chips); episode # auto-increments; inherit description/cover
- Detail: book intervals via radio-slot bookings API; upload or attach broadcast; approve gate with trim/normalize via archive editor render
- Series/episodes persisted in **localStorage** until a real Show API exists (honest demock gap)

**Playlists (`/studio/playlists`):**

- List + TrackTable editor; add archive tracks and releases; public/private + collaborative
- Icon-only add-to-playlist affordances on Music rows

**Channel designer (`/studio/channel`):**

- Tabs: Design · 24/7 radio · Profile · Username/domain
- 24/7 radio: a compact three-part editor for playlist source, playback settings, and active rotation; supports pick/create/edit, direct archive adds, enable/mode/auto-enroll/announcements, and icon-only reorder/remove controls (max 5 items)
- StudioPanel / StudioPageHeader polish

**Status:** in-review — screenshots captured; awaiting comment or `approved`.

### 2026-08-12 — Release detail + Albums polish + link-out cleanup

**Goal:** Finish next worklog rows with StudioPanel depth; remove easy prod dashboard link-outs.

**Release detail (`/studio/releases/$id`):** Artwork / Details / Tracks panels; header Save CTA; Distribution in-app link.

**Albums (`/studio/collections` + editor):** Human subtitle (no API jargon); StudioPanel list; Playlists cross-link; album editor panels + Save.

**Show detail:** Defaults / Schedule / Episodes as StudioPanels.

**Setup channel:** StudioPageHeader + panel; home CTA → `/studio/setup-channel` (no tahti.live wording).

**Settings:** Dropped “Full media builder” and “Manage on production” moderator link-outs.

**Screenshots:** `studio-shows-v1`, `studio-playlists-v1`, `studio-channel-v1`, `studio-collections-v1` (+ releases refresh).

**Status:** in-review — awaiting comment or `approved`.

### 2026-08-12 — Schedule + Stats (+ Editor panel parity)

**Goal:** Next pending studio tools with Nuclear panel depth; icon-dense secondary chrome.

**Schedule (`/studio/schedule`):**

- StudioPageHeader + Save CTA; human subtitle (no API source jargon)
- Next broadcast + Offline programme as StudioPanels
- Mode chips; quiet link to Channel 24/7 radio
- Empty rotation points to Channel designer

**Stats (`/studio/stats` + detail):**

- Summary metric panels; Top tracks / countries lists
- Detail CTA → plays chart; track titles link into Library
- Revenue note is in-app (`/studio/revenue`), not a prod escape hatch
- Detail: StudioPageHeader + range chips; drop API path jargon / middle-dot meta

**Editor list / project (also pending; brought to same shell):**

- StudioPageHeader / StudioPanel; icon-only Open / Pro editor row actions
- Project page: Pro editor primary CTA; archive link into Library

**UX / icons (studio sweep):**

- Library: Play / More / Pin / Audio editor / Delete → icon-only with aria-label
- Albums tracklist: Up / Down / Remove → chevron / trash icons
- Releases More: Public link / Distribution → icons; release detail secondary same

**Screenshots:** `studio-schedule-v1.png`, `studio-stats-v1.png`

**Status:** in-review — awaiting comment or `approved`.

### 2026-08-13 — Mock content pass + map notes export

**Goal:** Data/content richness across the listen directory and studio calendar, plus a reviewer tool on the Tahti map page — not a page-by-page layout redesign, so it sits outside the usual one-page loop above.

**Mock stations (`src/api/mock.ts`):** Grew the listen directory from 2 to 8 stations (Northern Lights, Screenshot Demo, Midnight Cartography, Tundra Static, Saimaa Sessions, Kaiku Collective, Valo Radio, Metsänpeitto), each with its own bio, genre tags, two releases with real descriptions, follower count, and distinct track titles — replaces the single repeated "Mock channel for the Nuclear × Tahti listen POC" blurb.

**Gig calendar (`src/api/events.ts`, `StudioEventsView`):** Added a `description` field end to end (type, form, list rendering) and seeded 7 representative events across Finnish venues with full descriptions.

**Shows/schedule (`src/api/shows.ts`):** 1 → 4 show series (added Route 550 Live, Kaiku Cypher Sessions, Boathouse Talk) with matching episodes and radio-slot bookings.

**Map notes export (`ScreenAtlas.tsx`):** Added a CSV export button next to "Screen atlas" — exports `view_id, view_name, case_title, commentary` for every case with a saved note, so review notes left on `/more` can be saved to a file and revisited later instead of only living in this browser's localStorage.

**Screenshots:** `listen-artist-rich-v1.png` (new — enriched artist profile), `studio-events-v1.png` (new), `map-more-v1.png` (new — export button), refreshed `listen-home-v1`, `listen-radio-v1`, `listen-artist-v1`, `studio-shows-v1`, and the rest of the atlas set against the new mock data.

**Status:** in-review — awaiting comment or `approved`.

### 2026-08-16 — Page 19 Updates / newsletter v1 (`in-review`)

**Goal:** Bring the last un-styled studio page to the StudioPageHeader/StudioPanel shell used by Schedule and Releases; one primary action per tab.

**Changes:**

- `StudioPageHeader` with tab-aware primary CTA (**New post** / **New draft**) instead of a right-aligned button row
- Tabs restyled to match Channel designer (`shadow-sm` active state, `role="tablist"`/`role="tab"`)
- Posts and drafts lists moved into `StudioPanel` with `divide-y` rows (was ad-hoc bordered `<li>` cards), matching Releases
- Dropped the "Source: mock/live" jargon from the subtitle
- No behavior changes — same create/delete/send handlers and dialogs

**Screenshots:** `docs/redesign-shots/studio-updates-v1.png` (Posts tab), `docs/redesign-shots/studio-updates-newsletter-v1.png` (Newsletter tab)

**Status:** approved.

### 2026-08-16 — Page 20 Revenue / Connect v1 (`in-review`)

**Goal:** Same StudioPageHeader/StudioPanel shell; replace the yes/no status list with the ✓/○ chip pattern from the Go Live wizard; drop dev jargon from user-facing copy.

**Changes:**

- `StudioPageHeader` with a plain subtitle — dropped "Source: mock" and the `VITE_FORCE_MOCK=1` dev-env line that was leaking into the UI
- Stripe Connect status (configured / charges enabled / details submitted / payments ready) now reads as compact ✓/○ chips instead of a `yes`/`no` bullet list
- Fan-sub Connect, grant estimate, and past grants are each a `StudioPanel`; past grants moved to `divide-y` rows
- No behavior changes — same onboarding/portal handlers

**Screenshot:** `docs/redesign-shots/studio-revenue-v1.png`

**Status:** approved.

### 2026-08-17 — Page 21 Stash v1 (`in-review`)

**Goal:** Same StudioPageHeader/StudioPanel shell as the rest of studio; the page still used the pre-redesign bordered-`<li>` list and a raw flex header.

**Changes:**

- `StudioPageHeader` with Upload as the single header CTA (file input stays hidden, triggered via ref)
- File list moved into `StudioPanel` with `divide-y` rows, matching Releases/Stash's siblings
- Empty state gets its own Upload CTA
- Play/Delete stay icon-only, switched to `variant="text"` for consistency with other row actions
- No behavior changes — same upload/download/delete handlers

**Screenshot:** `docs/redesign-shots/studio-stash-v1.png`

**Status:** approved.

### 2026-08-17 — Page 22 Sources hub v1 (`in-review`)

**Goal:** Lighter pass than most pages — the overview grid and per-source detail panels already had good Nuclear treatment (service-branded tiles, status chips) from an earlier "plugin-store style" pass. Mainly a chrome/jargon cleanup.

**Changes:**

- Outer page switched from a raw `<h1>` block to the shared `PageFrame`/`PageHeader` (matches Listen/Radio/Feed instead of a bespoke header)
- Dropped "Opened from Music when you add tracks (alongside upload)" implementation detail from the subtitle
- Removed the "Status source: mock" debug line from the per-source detail header — the existing status chip (Mock/Connected/Needs auth/etc.) already conveys this
- No behavior changes — grid, tabs, connect/disconnect, and import flows untouched

**Screenshots:** `docs/redesign-shots/sources-v1.png` (overview grid), `docs/redesign-shots/sources-detail-v1.png` (SoundCloud detail tab)

**Status:** approved.

### 2026-08-17 — Pages 23–26 Settings account/artist/money/connections

**Finding:** these four rows were tracked as `pending`, but the worklog was stale — the Settings modal (`SettingsPanels.tsx`) already uses the Nuclear `SettingsPanel` shell consistently across every section (sub-tabs, bordered `SettingsInfo` rows, real Save CTAs, tier cards). No layout/chrome work was actually outstanding.

**Verified via screenshot, no changes needed:** Account (Session/Security/Membership/Notifications sub-tabs, read-only `SettingsInfo` rows are intentional — editable display name lives under Artist → Profile), Money (Fan tiers list with New/Deactivate, matches the Releases/Stash divide-y pattern), Connections (short redirect notice pointing to Sources, intentionally minimal).

**One real fix, already shipped in the Source:/API sweep:** Account → Membership had a raw `Source: {source}` debug line — removed there, not here.

**Screenshot:** `docs/redesign-shots/settings-artist-v1.png` (representative — Profile sub-tab with Save CTA)

**Status:** approved.

### 2026-08-17 — Page A1 Admin dashboard v1 (`in-review`)

**Goal:** First admin page — reverses the earlier CUTOVER.md "out-of-scope" call (confirmed with user). Establish the board-gated shell + nav pattern the remaining 21 admin pages will build on.

**Changes:**

- New `AdminGate` component (mirrors `StudioGate`) — gates on `user.isBoard` instead of channel ownership; shows sign-in or "board access required" states
- New `AdminNav` (mirrors `StudioNav`'s `InPageNav` chip pattern) — starts with just Dashboard, grows page-by-page
- `isBoard?: boolean` added to `AuthUser`; new "Admin" sidebar item (shield icon), visible only when `user.isBoard`
- `/admin` route renders `AdminDashboardView`, reusing `StudioPageHeader`/`StudioPanel` for visual consistency with the rest of the app rather than inventing new admin-specific chrome
- Content follows the same disclosure pattern as Studio home: KPI row (active members, live now, beta queue, open tickets) + Needs action queue + System health up front; Finance YTD, live streams, queue health, cron jobs, and audit log tucked behind a "Finance, streams, queues & audit" toggle
- `api/admin.ts`: prod's dashboard fans out to ~12 separate `/api/admin/*` calls — batched into one `fetchAdminDashboard()` for this first port, with a rich mock payload for offline demo

**Screenshots:** `docs/redesign-shots/admin-dashboard-v1.png` (collapsed), `docs/redesign-shots/admin-dashboard-expanded-v1.png` (More expanded)

**Status:** approved.

### 2026-08-17 — Pages A2–A6 Beta / Users / Radio / Radio submissions / News v1 (`in-review`)

**Goal:** Continue the admin port — five pages in one pass, all reusing the AdminGate/AdminNav/StudioPanel foundation from A1. `AdminNav` grows to 6 entries.

**A2 Beta applications** (`/admin/beta`): status filter chips (All/Pending/Approved/Rejected); Approve opens a `Dialog` for username/display name, shows the resulting setup link inline; Reject and Resend-setup-link stay inline row actions.

**A3 Users** (`/admin/users`): search + tier/member selects (debounced, client-side filter under mock), divide-y list with board/suspended tags and live-state coloring. Dropped the per-row detail link and CSV export — no detail page or export endpoint exists yet, out of scope for this pass.

**A4 Radio** (`/admin/radio`): Now playing, Eligible channels (Move to front / Opt out), Opted out (Re-enable), Feature history — four `StudioPanel`s matching prod 1:1.

**A5 Radio submissions** (`/admin/radio-submissions`): auditing panel plays through Nuclear's real player bar (`usePlayerStore`) instead of a bespoke audio element like prod's — one less thing to build, and it's consistent with how every other page in the app plays audio. Approve/reject with an optional rejection note.

**A6 News** (`/admin/news`): compose in a `Dialog` (Publish / Save as draft), list rows with inline Edit (swaps to a form in place, no separate route) / Publish-Unpublish / Delete.

All five: `api/admin.ts` mock + live fetchers (`fetchAdminBetaApplications`, `fetchAdminUsers`, `fetchAdminRadio`, `fetchAdminRadioSubmissions`, `fetchAdminNews` + mutations), same forceMock()-first pattern as the rest of the app.

**Screenshots:** `docs/redesign-shots/admin-beta-v1.png`, `admin-users-v1.png`, `admin-radio-v1.png`, `admin-radio-submissions-v1.png`, `admin-news-v1.png`

**Status:** approved.

### 2026-08-17 — Pro audio editor v2 (`/studio/archive/$id/editor`) (`in-review`)

**Goal:** Rows 10/11 (Editor list, Editor project summary) were marked approved earlier, but that swept past the actual waveform tool at `/studio/archive/$id/editor` (`StudioProEditorView`) without a real pass — it was still the pre-redesign raw layout. User flagged it specifically: give it space, make it look correct.

**Problems found:** capped at `max-w-4xl` (896px) on a page whose whole job is a waveform; waveform canvas fixed at 96px tall and its render effect never re-ran on resize; raw `<h1>`/bordered-`<div>` chrome instead of `StudioPageHeader`/`StudioPanel`; dev jargon in copy ("Real: PATCH draft + POST render (ffmpeg job). Mock: local draft store...") and a raw `EditList JSON` `<details>` dump; limiter had a checkbox but no way to actually adjust its ceiling.

**Changes:**

- Widened to `max-w-[1400px]`; waveform panel is full-width
- `WaveformCanvas`: height now driven by its own `clientHeight` (was hardcoded 96px) so the CSS class controls it; added a `ResizeObserver` so it redraws on layout/viewport changes instead of only on data changes; bumped to 224px tall
- Mastering (EQ/Compressor/Limiter) spread across a 3-column grid instead of 2, each control gets room; limiter's ceiling is now a real slider (-6..0 dB) instead of static text
- Stems and Export moved into side-by-side panels instead of stacking full-width
- Dropped the PATCH/POST/ffmpeg jargon line and the EditList JSON debug dump; save/render feedback stays in the Export panel as a plain status line
- Play/Save/Render buttons got icons, matching the rest of studio

**Screenshots:** `docs/redesign-shots/studio-editor-project-v1.png` (1280px), `docs/redesign-shots/studio-editor-project-wide-v1.png` (1680px, shows it scaling)

**Status:** approved.

### 2026-08-17 — Pages A7–A11 Tahti Selects / Streams / Support / Top lists / Announcements v1 (`in-review`)

**Goal:** Finish the admin nav's first row — 11 of 22 pages now built. Same AdminGate/StudioPanel foundation as A1–A6.

**A7 Tahti Selects** (`/admin/tahti-selects`): Start/stop stream as the header action; current-rotation list with up/down reorder + remove; debounced search-to-add from public archive. Dropped prod's Liquidsoap/`TAHTI_RADIO_AUDIO_URL` infra paragraph — that's ops detail, not something a board member editing rotation content needs to see.

**A8 Streams** (`/admin/streams`): live-channel list, each row gets Restart/Skip/Pause/Resume/Force offline — matches prod's control set exactly, confirm dialogs kept on the destructive ones.

**A9 Support** (`/admin/support`): status filter chips + ticket list. No detail page (same scope trim as Users/Beta) — ticket detail/reply isn't built yet.

**A10 Top lists** (`/admin/top-lists`): three filter rows (period/dimension/sort) driving per-bucket progress-bar lists; built a small inline bar (`bg-primary` fill over `bg-background-secondary` track) since Nuclear UI doesn't have one.

**A11 Announcements** (`/admin/announcements`): system on/off toggle, upload button (mirrors the stash prepare→PUT→complete pattern), per-clip enable/schedule-mode/Nth-interval/delete, preview plays through Nuclear's real player bar instead of a raw `<audio>` element like prod. No separate clip editor page (out of scope, same as the `announcements/editor/[id]` sub-route in prod).

**Screenshots:** `docs/redesign-shots/admin-selects-v1.png`, `admin-streams-v1.png`, `admin-support-v1.png`, `admin-top-lists-v1.png`, `admin-announcements-v1.png`

**Status:** approved.

### 2026-08-17 — Pages A12–A21 Storage / Files / Content reports / Financial / Governance / Feature requests / Grants / AGM / Vendors / Status v1 (`in-review`)

**Goal:** Close out the remaining board-admin nav — all 21 built pages now live under `/admin/*`, gated on `user.isBoard`. AdminNav grew from 11 to 21 entries.

**A12 Storage** (`/admin/storage`): total used/quota/user-count summary + per-user usage list with an inline MB quota editor (mirrors prod's `QuotaEditor`). Per-user file browser (`/admin/storage/[userId]`) stays out of scope — folded into A13 instead.

**A13 Files** (`/admin/files`): board-wide archive browser — debounced search by title/artist/username, public/private badge, inline play preview, delete. Prod's `_admin-files-browser.tsx` (856 lines: facets, bulk edit, saved filter presets) trimmed to single-item search + delete for v1; bulk operations deferred.

**A14 Content reports** (`/admin/content-reports`): status filter chips + report list with resolve-with-note actions (start review / mark actioned / dismiss) — ported prod's flow directly, it was already simple.

**A15 Financial** (`/admin/financial`): folded prod's link-only hub plus its `ledger` and `fansubs/overview` sub-pages into one page — fan-sub stats (active subs, MRR, pending/failed payouts) + ledger entries with an add-entry form. `fansubs` (per-subscriber payout retry) and `legacy-members` (Stripe migration queue) sub-pages stay out of scope.

**A16 Governance** (`/admin/governance`): prod is a pure link hub to 6 sub-tools; ported as an info-card grid instead, with live counts where available (open motions, pending venue verifications, resolutions this year). Only AGM links through to a built page — Audit log, Annual report generator, Board resolutions, and Member register stay informational cards for v1 (no dedicated pages yet).

**A17 Feature requests** (`/admin/feature-requests`): status filter chips + vote-ranked list with Plan/In progress/Done/Decline/Reopen actions. Dropped the "close as duplicate + merge target" flow (low-value complexity for a first pass) and the quarterly report panel.

**A18 Grants** (`/admin/grants`): disbursement history table (year, recipients, total). Per-year preview/run flow (`/admin/grants/[year]`, a dry-run + irreversible disbursement trigger) stays out of scope — too high-stakes for a v1 port without a real confirm-and-audit flow.

**A19 AGM** (`/admin/agm`): agenda builder ported verbatim (fully client-side in prod — add/reorder/remove/copy-to-clipboard) + open/draft motions list + the member-notification-requirements disclosure. Minutes/records links point at pages that don't exist yet in this shell, so that section was dropped rather than link to nothing.

**A20 Vendors** (`/admin/settings/vendors`, mounted at `/admin/vendors` here): static critical-vendor and integration-vendor reference tables + live Mixcloud/Revelator distribution status. Dropped raw env-var names (`MIXCLOUD_CLIENT_ID` etc.) — board members need to know a DPA is required, not which env var holds the secret.

**A21 Status** (`/admin/status`): service health table (state, criticality, latency, detail) with an overall operational badge — direct port, prod page was already clean.

**Screenshots:** `docs/redesign-shots/admin-storage-v1.png`, `admin-files-v1.png`, `admin-content-reports-v1.png`, `admin-financial-v1.png`, `admin-governance-v1.png`, `admin-feature-requests-v1.png`, `admin-grants-v1.png`, `admin-agm-v1.png`, `admin-vendors-v1.png`, `admin-status-v1.png`

**Status:** approved.

### 2026-08-17 — Mobile pass + icon-only media actions + mock-text sweep

**Goal:** Not a page-by-page redesign — a cross-cutting cleanup requested directly: kill redundant text links next to icon buttons, strip leftover "(mock)" jargon from user-facing copy, and fix concrete mobile breakage (found via a Playwright audit at a 390×844 viewport, since no live browser session was available this pass).

**`MediaIconActions`:** Dropped the auto-generated hint line under the icon row (`Play Radio · Queue · Favorite`) — every action already carries `title`/`aria-label`, so the caption was pure duplication. Used on `RadioView` and `ChannelView`.

**Mobile layout bug (`RadioView`):** The member-relay banner (`Live now on the member relay: …`) put raw text and inline elements as direct children of `Box`, which is `display: flex` — on a 390px viewport each text fragment became its own flex item and wrapped word-salad style instead of flowing as a sentence. Fixed by wrapping the sentence in a single `<span>`.

**Mock jargon removed from content strings:** `src/api/mock.ts` had "(mock rotation)", "(mock HLS)", "(mock chat)" etc. baked directly into now-playing titles, chat messages, and revenue line items — these render as real UI copy, not just an internal flag. Also cleaned `(mock)` suffixes in `client.ts`, `broadcast.ts`, `channel-provision.ts`, `sources.ts` error/label strings.

**Live vs browsable artists (`mockChannel`/`mockDirectory`):** Every one of the 9 demo channels was hardcoded `state: 'LIVE'` with a working `hlsUrl`, so every artist card in the Listen directory offered a misleading "Play" as if they were all broadcasting. Only `tahti-radio` and `northern-lights` (the member-relay slug used by `mockRadio()`) are actually live now; the rest report `OFFLINE`/`hlsUrl: null`/`nowPlaying: null`. `ChannelDirectoryItem` gained an optional `live` flag so the Listen grid only shows the Play/Queue overlay on genuinely-live cards — offline artists are click-through to their profile, which already had a real per-artist archive (`mockArchiveItems` → `trackTitles`) and releases; that infrastructure just wasn't being reached from the directory.

**Screenshots:** `mobile-shots/radio-fixed.png` (banner fix), `mobile-shots/channel-offline-artist.png` (offline-artist profile), `mobile-shots/home-v2.png` (Listen directory) — captured to scratch, not committed to `docs/redesign-shots/`.

**Status:** shipped — verified via `tsc --noEmit`, `eslint`, and `vite build`; no automated screenshot regen against `docs/redesign-shots/` this pass.

### 2026-08-17 — Music page folds in Stash as a Files folder

**Goal:** User request — archive items should live under "Music," with an Archive folder sitting alongside the artist's other files, instead of Archive (`/studio/archive`, labelled "Library") and Stash (`/studio/stash`, private uploads) being two disconnected nav entries.

**Changes:**

- `StudioArchiveView` renamed "Library" → **Music**; added an Archive/Files folder-tab switcher (`?folder=files` search param, same `role="tablist"` pattern as Updates' Posts/Newsletter tabs) — Archive tab is the unchanged catalog list, Files tab renders the Stash file browser inline
- Extracted Stash's upload/list/play/delete UI into a shared `StashFilesPanel` component so it's not duplicated between the standalone Stash page and the new Files folder
- `StudioStashView` now just wraps `StashFilesPanel`; page stays reachable directly (Sources hub and Studio home's "More tools" still deep-link there) and its subtitle now points back at Music → Files
- `StudioNav`: primary pill relabelled "Music"; dropped the separate "Stash" entry from More studio tools (folded into Music)
- Studio home's Music group card relabelled "Library" → "Music" to match

**Screenshots:** `mobile-shots/music-archive-tab.png`, `mobile-shots/music-files-tab.png` (scratch, not committed).

**Status:** shipped — verified via `tsc --noEmit`, `eslint`, and `vite build`.

### 2026-08-17 — Page A22 Languages (i18n) v1 (`in-review`)

**Goal:** Last row on the admin nav — per the Phase-0 decision log, board must be able to create a language and import a CSV whose base/source column is English. Same AdminGate/AdminNav/StudioPanel foundation as the rest of admin.

**Changes:**

- `AdminI18nView` (`/admin/i18n`): language list with a translated/total progress bar per row (English is the non-removable `Base`); **New language** opens a `Dialog` for code + name; each non-base row gets an **Import CSV** action that opens a native file picker
- `api/admin.ts`: `fetchAdminLanguages`, `createAdminLanguage`, `importAdminLanguageCsv` — CSV parsing (header-row detection, `english,translation` columns) happens client-side so the imported/skipped count and progress bar update immediately in mock mode; the live-API path posts the file as `multipart/form-data` to `/api/admin/i18n/languages/:code/import` (endpoint doesn't exist yet — same "port ahead of the real API" pattern as the rest of this admin sweep)
- `AdminNav` gained a 22nd entry, **Languages**

**Verified functionally** (not just visually): created a language via the dialog, imported a 3-row CSV against Swedish's mock 214/812 baseline, confirmed it read 217/812 (27%) afterward.

**Screenshot:** `docs/redesign-shots/admin-i18n-v1.png`

**Status:** approved. This closes out all 22 rows of the admin port.

### 2026-08-17 — Studio panel consistency pass: Moderation / Events / Embeds / Upload / Channel designer + shared PageHeader

**Goal:** Cross-cutting consistency pass, not a page-by-page loop entry — several studio pages still used ad-hoc `<section>`/`<h2>` chrome instead of the `StudioPageHeader`/`StudioPanel`/`Tabs` shell already established across the rest of studio, and the fan-facing `PageHeader` lagged Studio's heading weight.

**Changes:**

- **Studio Moderation / Events / Embeds** (`StudioModerationView`, `StudioEventsView`, `StudioEmbedsView`): raw `<section>` blocks replaced with `StudioPageHeader` + `StudioPanel`, each split into a `Tabs` view (Moderators/Chat bans, Upcoming/Add event, Pinned tracks/Add embed) instead of stacking every control on one page
- **Studio Upload** (`StudioUploadView`): same `StudioPageHeader`/`StudioPanel` shell
- **Channel designer visualizer picker** (`ChannelDesigner.tsx`): replaced the per-preset enable/disable toggle list (`visualizerPrefsStore.ts`, deleted) with a single "Use visualizer" toggle plus a flat pick-list of presets — the old per-preset visibility toggle was speculative config nobody had asked to hide individual presets with; the picker now just shows what's usable and which one's active. Design/24-7 Radio/Profile/Username-Domain reorganized into `Tabs`.
- **`PageHeader`** (shared fan-facing page shell): heading now `font-display font-extrabold` to match Studio's headings, instead of a plain `font-bold`
- **Chat / Venues / Status / Collection / Messages / Themes**: migrated onto the shared `PageFrame`/`PageHeader` for the same heading treatment and back-link pattern Studio already uses, replacing bespoke `<div>`/`<h1>` headers

**Verified:** `tsc --noEmit` and `eslint` clean on `tahti-web` (pre-existing markdown/script lint errors in files untouched by this diff aside); live-screenshotted every changed route (`VITE_FORCE_MOCK=1`, mock auth) against `tahti-dark` — no visual regressions, tabs/panels render and switch correctly.

**Status:** shipped — not captured into `docs/redesign-shots/` (scratch-only this pass, same as the earlier "Mobile pass" entry above).

### 2026-08-22 — Full visualizer catalog

**Goal:** Close the visualizer parity gap without adding Three.js to the initial mobile listen bundle.

**Changes:**

- Replaced the three-effect canvas/WebGL approximation with ten distinct Three.js scenes matching the production preset catalog: Water ripple, Waveform bars, Particle field, Aurora, Reactive grid, Cloudscape, Line tangle, Backdrop box, Lens flares, and Spotlight
- Kept the shared Web Audio analyser wiring, custom channel colors, artwork-driven water ripple, reduced-motion fallback, and per-preset speed/intensity settings
- Lazy-loaded the Three.js renderer as its own chunk; static gradients remain the no-WebGL/reduced-motion fallback
- Layered the active Three.js scene behind the full public channel page at Tahti's ambient live/offline opacity while retaining the stronger hero visualizer

**Status:** shipped — verified with type-check, lint, production build, and browser screenshots.

### 2026-08-23 — Tahti route and capability parity sweep

**Goal:** Compare the current Tahti `apps/web` page tree with the Nuclear SPA by route and behavior, distinguish missing features from intentionally consolidated ones, and repair legacy links that were landing on the Studio home.

**Navigation repaired:** Distribution, Events, Embeds, Recordings, artist Venues, Posts, broadcast recordings, archive editor deep links, track Insights, collection creation, and production settings destinations now resolve to their existing Nuclear surfaces. Regression coverage lives in `prodPathRedirects.test.ts`.

**Missing list added:** `FEATURES.md` now records public venue detail, transparency methodology, public/member feature requests, upload job detail, and guided signup sub-steps as missing; support submission, member venue governance, routed DM threads, reduced admin detail operations, multitrack depth, and dynamic SEO/OG as partial.

**Map updated:** `/more` no longer says Press kit and Board admin are absent. It shows their current parity and exposes the newly audited missing/partial surfaces as reviewer-visible comparison cards.

**Status:** implementation gaps logged; navigation fixes included in the current release batch.

### 2026-08-23 — Artist identity, radio rotation, imports, and Library consolidation

**Goal:** Bring the artist-facing media identity workflow into one professional surface, make the board’s radio view reflect what listeners actually hear, and remove duplicate or silent import/archive paths.

**Branding and press kit:** Added `/studio/branding` with Branding, Gallery, and Press kit tabs. Artists can upload or replace their profile picture and open it full size, reuse the channel outlook designer, append to or replace the existing gallery, choose gallery visibility during upload, and select press-kit images. The press kit keeps at most ten selected images and automatically excludes the oldest selection when the limit is exceeded. Public gallery viewing now has a fullscreen slideshow, previous/next controls, wraparound keyboard arrows, Home/End, and Escape.

**Admin identity and radio:** User management now combines account, membership, payment, channel, engagement, public-profile, follower, bio, pronoun, and catalog information, with an expandable avatar. Tahti Radio admin reads the actual station output separately from the live-member relay, so rotation playback is no longer called offline. It shows current track and transport controls plus the shared draggable `TrackTable`, removal actions, and total rotation duration. Tahti Selects uses the same editor.

**Sources and imports:** Removed “From broadcast” from Sources; saved captures stay in Studio → Recordings. hearthis.at single, batch, set, and collection imports now emit started/completed notifications, link to the new track or collection, retain cover-art import, and disable source items already imported by the signed-in user.

**My Library:** Studio’s primary Music entry now opens My Library. All sounds remains its first section and gains pinned filtering, pinned-first ordering, inline pin/unpin actions, high-contrast pinned rows, stronger zebra striping, visibility filters, search across title/artist/genre, and discography sorting.

**Collections, Recordings, and Messages:** Albums and Playlists no longer compete as separate Studio tools. One Collections hub now searches and filters albums, EPs, DJ sets, and playlists, creates each type, and opens the correct design or ordering editor. Album and EP metadata includes release date, up to five genres, and public, unlisted, or private visibility both at creation and in the full editor. Recordings is now a first-class My Library section. Messages moved out of My Library to `/messages`, with global sidebar and top-bar access plus compatibility redirects for old links.

**Release tools:** Embeds moved out of the Grow/miscellaneous area and into the Release tool group, the Studio music overview, and the Releases header so pinned external players are managed alongside release publishing.

**Queue feedback:** Add-to-queue actions now flash and disable during the add transition, then remain visibly checked and disabled while the track is queued. The bottom player’s queue control uses upward/downward expand and collapse cues, and Clear queue is a subdued icon-only action beside the lower playback controls.

**Status:** implemented; type-check, lint, unit tests, build, and focused browser acceptance are the release gate.

### 2026-08-23 — DM thread deep-links, public venue detail, country flags

**Goal:** Close three of the smaller gaps from the same-day route/capability sweep: DM threads lost their identity on refresh, the venue directory promised a "shareable venue profile" that didn't exist, and every country display in the app showed a bare two-letter code instead of a flag.

**Direct-message thread URLs:** `MessagesView` used to track the open conversation only in local state. Added a `/messages/$id` route; opening a thread now navigates there (`fetchConversation` still drives the panel), so refreshing or sharing a DM link lands back on the same conversation instead of an empty inbox view.

**Public venue detail:** New `/v/$slug` route + `VenueDetailView`, built entirely from the existing `fetchVenues()` directory list (no new backend endpoint — `VenueDirectoryItem` already carries name/city/country/capacity/description). Handles loading and not-found states with the shared `EmptyState`. `VenuesView` now links each card and its former "Open on tahti.live" external link to this in-app page instead of out to prod.

**Country flags:** Ported `flagEmoji`/`countryName` from prod's `apps/web/src/lib/flag-emoji.ts` + `country-options.ts` into `src/lib/countries.ts` (kept this repo's larger 58-country list rather than prod's 15-entry subset), plus a combined `countryFlagAndName` helper. Replaced every bare country-code render with flag + name: `VenuesView`, `VenueDetailView`, Studio Stats' "Top countries" and Stats Detail's "Download countries" panels, and the country `<select>` options in Onboarding and Settings → Artist (matching prod's own `{flag} {name}` option label pattern). Left `VenueRegisterView`'s raw code input alone — prod's own venue-register form is the same plain 2-letter text input, no flag preview there.

**Status:** implemented; `tsc --noEmit`, `eslint`, and the full `vitest` suite (52/52, excluding the pre-existing unrelated Playwright/vitest config collision on `e2e/cutover-vital.spec.ts`) are clean. Not yet click-verified in a live browser — the Chrome extension wasn't connected this session.

### 2026-08-23 — Guided page tour (H key) and a keyboard-shortcuts help article

**Goal:** Port prod's contextual help spotlight (`packages/ui/src/brand/HelpSpotlight.tsx` on tahti.live — a "?" button that highlights and explains a page's tabs one at a time) into a keyboard-triggered tour covering nav, not just tabs: explain the sidebar everywhere, the top bar only on the homepage, and Studio/Admin panel items while inside those sections. Prod's own version has no keyboard trigger and is desktop-only tab-level help; this is a from-scratch reimplementation of its visual mechanism (four veil divs cutting a highlight box out of a dark overlay, plus a glow ring) generalized to whole nav trees via a `data-tour-id` targeting scheme instead of prod's per-page ref map, since one page here can have 50+ explainable items across four independently-owned nav components instead of prod's handful of same-component tabs.

**New:** `lib/pageTour.ts` (pure `getPageTourSteps(pathname)`, unit-tested in `pageTour.test.ts`), `stores/tourStore.ts` (open/stepIndex/toggle — zustand, same shape as the existing modal stores), `components/PageTourSpotlight.tsx` (the veil+ring+card overlay, mounted once in `AppShell`). `StudioNav`/`AdminNav` gained a `description` on every nav-item object and export their own `*_TOUR_STEPS`; `InPageNav` auto-tags every item it renders with `data-tour-id="nav-item-{id}"` so any future page built on it gets tour support for free, mirroring prod's `DashboardTab.helpDescription?` generic-wrapper pattern rather than its per-page duplicated-tab-list pattern. Sidebar items (`AppShell`) and top-bar icon buttons (`AppTopNav`) got matching `data-tour-id`s and hand-written step copy in `pageTour.ts` since they aren't data-driven components.

**H key:** added to `AppShell`'s existing global keydown handler (same `isEditing` guard as the pre-existing Alt+1–5 and V shortcuts) — confirmed Alt+1–5 and V are unmodified and still work, and shortcuts stay suppressed while typing, via a throwaway Playwright/Chromium script (browser extension wasn't connected this session either) signing in against the mock API and walking the tour with real keypresses.

**Two real bugs the script caught, both fixed:**
- Studio's "Studio tools" panel starts collapsed on Overview, so its 17 tool links weren't mounted yet when the tour's one-shot `getPageTourSteps().filter(exists in DOM)` ran — `StudioNav` now force-expands the panel while the tour is open (`useTourStore` subscription), but that's a second render-commit cycle after `open` flips, so `PageTourSpotlight` also had to move its step-availability scan from a single rAF to a 60ms deferred check to give that cycle time to land.
- The highlight ring reused `border-primary`/`ring-primary`, prod's own accent color — on an already-active nav pill (`bg-primary` styling) the ring and the pill's own highlight blended and the label became unreadable. Switched to `border-accent-cyan`/`ring-accent-cyan`, matching prod's original choice of cyan specifically to contrast against whatever it's highlighting. Also found (via fast synthetic ArrowRight presses, faster than a human would ever go) that the rect measurement lagged the step-label update by one render when both changed in the same tick; moved the per-step measurement from `useEffect` to `useLayoutEffect` so the ring is never visibly one step behind the card.

**Help center:** added a `keyboard-shortcuts` article to `content/help.ts` listing H/←/→/Esc for the tour and the existing Alt+1–5 / V shortcuts (also verified live, not just read from source) — `HelpArticle.productionPath` had to become optional since this article has no prod equivalent.

**Status:** implemented; `tsc --noEmit`, `eslint`, and the full `vitest` suite (58/58 — 6 new for `pageTour.ts`) are clean. Live-verified via the throwaway Playwright script on `/`, `/studio` (including the force-expanded tools panel), and `/admin/users` (via a localStorage role patch, since the mock login flow has no board-role path) — screenshots confirmed correct highlight placement, legible ring contrast, and correct step-order after both bug fixes; the script and its screenshots were scratch-only, not committed.

### 2026-08-23 — Transparency methodology page

**Goal:** Next `FEATURES.md` gap — prod's `/transparency/methodology` explains how Tahti ry's co-op ledger is recorded (revenue/cost categories, the grant-pool formula, the monthly data pipeline, the public read-only API); the POC's `/transparency` dashboard had the live numbers but no explanation of where they come from.

**New:** `TransparencyMethodologyView` (`/transparency/methodology`) ports prod's static content (`apps/web/src/app/transparency/methodology/page.tsx`) into the POC's own header/section conventions rather than prod's `@tahti/ui` `PublicPageHeader`/`Heading` components — no new API dependency, it's pure copy. Linked both ways: a "How this data is recorded and published" link from the `/transparency` dashboard header, and a back-link + footer "Platform status" link (pointed at the POC's own `/status` route instead of prod's external status-page helper, since this app has a live one).

**Status:** implemented; `tsc --noEmit`, `eslint`, and the full `vitest` suite (58/58) are clean. Live-verified with a throwaway Playwright script — both nav links work, content renders, no console errors; script and screenshot were scratch-only, not committed.

### 2026-08-23 — Support ticket form, member feature requests, and a `FEATURES.md` correction

**Goal:** Continue down the route-sweep gap list. Before building anything, forked a research pass into prod's actual backend (`/home/jani/workspace/tahti` — `apps/api`, `packages/db/prisma/schema.prisma`) for the five remaining items, since building UI against a nonexistent endpoint would be worse than not building it. Findings: support and feature-requests both have real, complete Prisma-backed APIs; venue governance in prod is board-only (same as this POC already has) — not actually a gap despite `FEATURES.md`'s wording; upload job detail and signup-step parity are lower value (the former is fundamentally session-scoped even in prod, the latter is prod's own "deliberately consolidated" call).

**Support contact form:** `SupportContactForm` (new component, mounted into `HelpArticleView` only for the `support` slug) posts to the real `POST /api/support/contact` — `subject`/`message`/`category` (`ENGAGEMENT_DISPUTE | TECHNICAL | FINANCIAL | OTHER`, matching the Zod enum in `packages/shared/src/dto/admin-support.ts`) plus `contactEmail` only when signed out, mirroring prod's own `support-contact-form.tsx` field-for-field. `api/client.ts` gained `submitSupportTicket` with the usual mock/live split.

**Member feature requests ("Topics"):** New `FeatureRequestsView` at `/governance/feature-requests`, modeled directly on the existing `GovernanceView.tsx` (same member-gate/forbidden-state pattern, same expand-to-discuss comment thread) since it's the closest sibling in this codebase — list sorted by vote count, upvote/un-vote toggle, a collapsible "Propose an idea" composer, and status badges for prod's real `FeatureRequestStatus` enum (`OPEN | PLANNED | IN_PROGRESS | DONE | DECLINED | DUPLICATE`, with `DUPLICATE` rows showing which request they were merged into and voting disabled). `api/client.ts` gained `fetchFeatureRequests`/`createFeatureRequest`/`voteFeatureRequest`/`fetchFeatureRequestComments`/`postFeatureRequestComment` against `/api/v1/governance/feature-requests` — the member-facing route, distinct from the pre-existing admin-only `fetchAdminFeatureRequests` review queue in `api/admin.ts` (`/api/admin/feature-requests`), which stays as-is. Comments reuse the existing `MotionComment` type since prod's own Prisma schema comment says `FeatureRequestComment` "mirrors `MotionComment`'s shape... for the same reason" (nullable author survives user deletion).

**`FEATURES.md` correction:** struck "Public venue governance" as a gap — prod's own `/governance/venues` is board-only ("Venue verification"), same as this POC's existing board/studio venue tooling. There's no member-facing prod route to be missing.

**Status:** implemented; `tsc --noEmit`, `eslint`, and the full `vitest` suite (58/58) are clean. Live-verified via a throwaway Playwright script signing in against the mock API: submitted a support ticket both logged-in and logged-out (email field correctly required only when signed out), and on feature requests — navigated from `/governance`, upvoted a request, posted a comment, and proposed a new idea, all reflected immediately in the UI. Script and screenshots were scratch-only, not committed.

**Remaining from the sweep, deliberately not built:** upload job detail (`/dashboard/upload/:uploadId`) is buildable only as within-tab-session parity — a `File` object can't survive a real refresh in prod either, so a route wouldn't close the actual gap `FEATURES.md` describes; signup profile/broadcast step parity is prod's own "deliberately consolidated" design, redundant with what Onboarding/Settings already cover here. Flagged rather than built silently.

### 2026-08-24 — hearthis.at Studio Archive playback, dynamic appearance mode, chat reconnect debounce

**hearthis.at embeds "not working in the player":** Root cause wasn't the embed widget itself — `lib/embedSrc.ts`'s `hearthisEmbedSrc` was verified byte-for-byte against the canonical `packages/shared/src/hearthis-embed.ts` in the main tahti repo and confirmed live via `curl` (200, real embed HTML, no blocking CSP/X-Frame-Options). The actual bug: `StudioArchiveItem` (the "My Library" list type) never carried `embedProvider`/`embedUri` at all, so an artist's own hearthis.at-imported tracks were indistinguishable from real uploads in Studio → Music. Clicking Play called `fetchEditorSource` — an endpoint that expects a real Tahti-hosted file — against a track Tahti never hosts, so it silently failed. Every *other* embed surface (`CollectionView`, `StudioCollectionEditView`) already filtered/branched on these fields correctly; only Studio Archive was missing them. Added the fields to the type, a mock hearthis.at row for testability, and swapped the Play button to open the same `EmbedTrackRow`-style inline iframe used elsewhere when a row is embed-only (also hides the now-meaningless "Audio editor" action for those rows). Live-verified: the real hearthis.at widget mounts and plays.

**Dynamic appearance mode:** `themeStore.ts` gained a `colorMode: 'light' | 'dark' | 'dynamic'` alongside the existing `dark` boolean — `dynamic` re-resolves against the local clock (dark 19:00–06:59) on a 5-minute interval so it keeps tracking day/night while the tab stays open, without needing a page reload. A brand-new user with no persisted preference now defaults to `matchMedia('(prefers-color-scheme: dark)')` instead of the old hardcoded dark default — same fallback duplicated in `index.html`'s pre-React boot script so there's no flash of the wrong theme. Onboarding gained an "Appearance" tab (Light / Dark / Dynamic) that applies live as it's picked and pre-selects whichever option matches the OS, exactly as asked; `ThemesView.tsx` and Settings → Themes both got the same 3-way control so `dynamic` remains a live, undoable choice rather than a onboarding-only dead end. New `isDynamicDark` unit tests (7 cases, hour boundaries).

**Chat reconnect flicker:** `ChannelChatPanel`'s viewer-connect `useEffect` depended on `[slug, mode]` — but its own WebSocket's `onclose` handler demoted `mode` from `'live'` back to `'rest'` on any drop, which re-triggered that same effect and opened a *second* connection as an accidental, undocumented reconnect path with no backoff and no visible-state debounce, so a flaky connection flickered the "Live" badge on every drop/reconnect cycle. Replaced it with an explicit, owned reconnect: `connectWs`'s `onclose` now schedules a retry (linear backoff, capped at 5 attempts, skipped on intentional close from unmount/slug-change) instead of relying on the mode-change side effect, and the effect itself now depends only on `[slug]`. Separately, the "Live" badge is now driven by a debounced `liveDisplay` state that only flips to false after 8 continuous seconds of disconnection (`DISCONNECT_GRACE_MS`) — a quick drop-and-recover never touches the UI. The real send-message gate still checks the live `wsStatus`, not the debounced display, so nothing sends over a socket that only *looks* connected.

**Status:** implemented; `tsc --noEmit`, `eslint`, the full `vitest` suite (65/65 — 7 new for `isDynamicDark`), and a production build are clean. hearthis.at fix and onboarding appearance defaults live-verified with a throwaway Playwright script (including both `light`/`dark` `colorScheme` contexts confirming the pre-selected option tracks the OS exactly). The chat reconnect/backoff logic could not be timing-verified live — mock mode never opens a real WebSocket, so this needs a manual check against a live Centrifugo connection (kill the network, confirm the badge survives an 8s blip and only drops on a sustained outage).

### 2026-08-24 — CI lint fix, beta API proxy regression, GitHub Actions deploy flow, TrackTable accessibility bug

**Goal:** GitHub CI was red and beta.tahti.live couldn't reach the live API at all; also wanted a GitHub Actions deploy flow (ported from the sibling `tahti-org` repo) so a merge to `master` deploys the beta build automatically instead of needing a manual `pnpm deploy:tahti-beta` from a dev machine.

**CI lint root cause:** `TAHTI-PORT-CHECKLIST.md` had `12b. [ ]` as a checklist marker — not a valid ordered-list token, so remark parses that line as a plain paragraph where `[ ]` becomes an empty shortcut reference link instead of a task-list checkbox, failing `markdown/no-missing-label-refs`. Renumbered the item into the real sequence (13–15). While pushing the fix, `origin/master` had already moved — someone (or an earlier session) had pushed a competing "fix" that left the actual `12b.` bug untouched and instead truncated two unrelated sentences to `[...]`, reintroducing the identical empty-reference-link bug it claimed to fix. Rebased onto it and resolved by hand: kept the real numbering fix, restored the two corrupted sentences to their original full text.

**Beta → API connectivity root cause:** the earlier same-day DNS re-resolve fix (`ce5210d0`, switching `nginx.conf`'s `proxy_pass` to a variable host so it wouldn't cache `api.tahti.live`'s IP forever) has a documented nginx side effect: with a variable host, nginx stops doing its usual location-prefix path rewriting and forwards only the literal static text written after the variable, dropping the actual request path. Every proxied call on beta — `/tahti-api/...`, `/api/...` — was collapsing to plain `/` (or `/api/`) on the upstream and landing on the API's own docs/reference page (200, HTML) instead of the real JSON endpoint, regardless of what path the client actually asked for. Confirmed live via `curl` (byte-identical 805-byte response body across unrelated endpoints), root-caused via `git log` on `nginx.conf`, and reproduced + fixed by actually building the Docker image and round-tripping real requests against `api.tahti.live` on a Compose-equivalent user-defined bridge network (the default `docker run` bridge doesn't have Docker's embedded DNS at `127.0.0.11`, so an initial local repro attempt gave a false negative before switching networks). Fixed with `rewrite ^/tahti-api/(.*)$ /$1 break;` + URI-less `proxy_pass` for the prefix-stripping `/tahti-api/` location, and `proxy_pass https://$upstream$request_uri;` for the pass-through `/api/` location. The currently-running beta container still has the broken config loaded and needs a redeploy to pick this up.

**Deploy flow:** new `.github/workflows/deploy-tahti-web.yml`, porting the jumphost-SSH pattern from `tahti-org`'s `deploy-production.yml` (vimage sits on a private LAN behind `sparkki.dudeisland.eu`, unreachable directly from GitHub-hosted runners) and pointing it at this repo's existing `deploy-vimage.sh` target instead: build `tahti-web`, rsync `dist/` + `deploy/`, rebuild the container, restart via `docker compose`, smoke-check both the SPA and the (now-fixed) API proxy. Triggers on `workflow_dispatch` (deploy latest `master` on demand) and on `workflow_run` after `CI` succeeds on `master`, so every merged change ships automatically once green. Registered `DEPLOY_SSH_PRIVATE_KEY` as a repo secret from the same key already authorized on the jumphost for `tahti-org`'s own deploys.

**Accessibility regression, caught as a side effect:** fixing the lint failure let the `Test` CI stage run for the first time in a while (it had been skipped every run while `Lint` failed first), which surfaced a real, previously-invisible bug in `packages/ui`'s `SortableRow` (used by every `TrackTable`, including this repo's own read-only playlist rows): it only spread dnd-kit's `attributes` (which carries `role`, `tabindex`, `aria-roledescription`, and `aria-disabled`) when a row was reorderable — exactly backwards, since the disabled/read-only case is precisely when `aria-disabled="true"` needs to be present. Fixed to always spread `attributes`; the actual interactive `listeners` stay gated on `isReorderable`. Regenerated the 18 player-package snapshots and the `ui` package's own 4 `TrackTable` snapshots that were stale from this fix plus an unrelated, already-shipped button press/hover style change (`5cde3d6e`) that Test had never gotten a chance to catch either.

**Status:** implemented; full monorepo `pnpm lint` (12/12 workspaces) and `pnpm test` (14/14 turbo tasks — 673 player tests, 242 ui tests, all others) are clean locally and pushed to `master`. Not yet verified against a real deploy: the new workflow needs a green `CI` run on `master` to fire for the first time, and the running beta container needs that deploy (or a manual `pnpm deploy:tahti-beta`) to actually pick up the nginx fix.

Follow-up in the same session: the beta proxy fix and deploy workflow above both landed and were verified live — `beta.tahti.live` round-trips real API responses again, and a manual `workflow_dispatch` run of the new Deploy workflow went fully green end-to-end (its `DEPLOY_SSH_PRIVATE_KEY` needed re-authorizing on the jumphost first; once done, every step including the jumphost→vimage SSH hop and both smoke checks passed).

### 2026-08-24 — Legal pages bind to the real terms/privacy/AGPL text

**Goal:** Next open P0 cutover blocker (`CUTOVER.md` §P0 / §1.2): `/terms`, `/privacy`, and `/agpl` were a short in-app summary that told the reader to go read the binding version at `tahti.live/...` — exactly the "POC summary + link-out" shape the checklist calls out as not good enough for cutover.

**Changes:** Ported prod's actual page copy verbatim from `tahti/apps/web/src/app/(info)/{terms,privacy,agpl}/page.tsx` — every section, list, and link, not a re-summarized version. The existing `content/legal.ts` → generic `LegalView` renderer only supports flat paragraphs per section, too thin for these three (definition lists on Privacy, ordered/unordered lists throughout, inline links including a cross-link from Terms to Privacy and mailto links). Rather than bend that shape to fit, gave each page its own view (`TermsView`, `PrivacyView`, `AgplView`) built on a new shared `LegalDocShell`/`LegalDocSection` (`components/LegalDocShell.tsx`) that reproduces `LegalView`'s existing header/back-link/hub-footer chrome exactly, so the visual shell stays identical and only the body content differs. `content/legal.ts` lost the `terms`/`privacy`/`agpl` entries (dead weight once real components own that content) and gained `LEGAL_HUB_LINKS`, a plain `{slug, title, to}` list so the cross-page footer nav (shared by `LegalView` and the three new pages) has one source of truth instead of being derived from page content that no longer lives in that file; the three titles there now match the ported pages' real headings ("Terms of service", "Privacy policy", "Source code & AGPL licence") instead of the old summary-page titles.

**Status:** implemented; `tsc --noEmit`, `eslint`, and a production build are clean — confirmed the real content (e.g. "District Court of Helsinki", the `tietosuoja@tahti.live` contact address, the `tahti-live/tahti-org` repo link) actually lands in the built JS bundle rather than only existing in source. `CUTOVER.md`'s "Legal pages" P0 line and its §1.2 duplicate both flipped to done. Not click-verified in a live browser — the Chrome extension wasn't connected this session.

### 2026-08-24 (continued) — Bot-facing OG proxy, part 2 of the SEO/OG plan

**Goal:** Close the last open piece of `SEO-OG-NOTES.md`'s two-part plan (part 1 — client-side metadata sync once each view's data resolves — landed earlier the same day). Non-JS-executing unfurl bots (Facebook/Slack/Discord/etc.) never run the SPA's own `syncDocumentMetadata`, so they were all getting the single static `index.html` — identical generic preview for every `/c`, `/u`, `/r` URL.

**Changes:** `nginx.conf` gained an `$og_bot` user-agent `map` (Facebook/Twitter/Slack/Discord/LinkedIn/WhatsApp/Applebot) and three regex locations for `/c/*`, `/u/*`, `/r/*` that rewrite matched bot requests to an internal `/og-proxy/` location, proxying to a new `GET /api/og/{channel,profile,release}/:slug` in the production `tahti` repo's `apps/api` — a small, cacheable HTML document with just `<meta>`/`<title>` tags, mirroring this repo's own `src/lib/seo.ts` copy formulas so client-side and bot-facing previews say the same thing. Real browsers and JS-executing crawlers are completely unaffected — same SPA fallback as before, unless the UA matches the bot list.

**A same-feature collision, resolved live:** a parallel session (`tahti-06`) had independently built the identical `apps/api` route around the same time — discovered via `git fetch` before pushing, both sides checked in and reconciled without racing: their version won (used the shared zod route-param schemas already used elsewhere in that codebase, plus an HTML 404 page — a better fit than this session's own draft), this session dropped its local duplicate commit rather than push over it.

**Nginx routing logic verified end-to-end**, not just read — ran a real nginx container with the actual (unmodified) config file, a live upstream (the real `api.tahti.live`, since this is a read-only public GET matching normal beta traffic): confirmed a bot UA on `/c/foo` gets rewritten through `/og-proxy/` to the correct upstream path, a normal browser UA gets the untouched SPA fallback, nested paths like `/u/foo/subscribe` are correctly NOT intercepted, and direct external access to `/og-proxy/` itself is correctly blocked (`internal;`, 404).

**Status:** implemented and pushed on both repos. `CUTOVER.md`'s SEO checklist item and `SEO-OG-NOTES.md` both updated to reflect both parts done; the only remaining step noted there is a live crawler QA pass (Phase 7.4) against the deployed `tahti` API route.

### 2026-08-25 — Accessibility pass, studio UX fixes, per-screenshot navigation atlas, admin Activity + Logs

**Goal:** Continue down `CUTOVER.md`'s remaining P0/P1 items — the accessibility pass (keyboard/focus/live regions), the bundle-budget item, and the "everything mixed up" single mermaid diagram the map page's Screen atlas had been using — plus two feature requests that came up mid-session: a real system-events admin page and a container-logs admin page.

**Player bar accessibility:** the seek bar was a mouse-only `<div onClick>` with no `role`, no keyboard support, and no ARIA value attributes at all — a keyboard or screen-reader user couldn't seek at all. Gave it `role="slider"` with `aria-valuemin/max/now/valuetext`, arrow-key/Home/End/PageUp/PageDown handling (mirroring the existing `Slider` primitive's own step convention), and a visible focus ring. The volume slider had no accessible name — its `Slider.Header` (the thing that supplies `aria-labelledby`) was never rendered, since `PlayerBarVolume` passed `showValue={false}` with no `label`; fixed by composing `Slider`'s subcomponents directly with a visually-hidden (`sr-only`) label instead of the default visible header, so the compact player bar's layout doesn't change. The mute button existed but had no `onClick` at all — wired it to the player store's pre-existing (unused) `toggleMute` action, added `aria-pressed`/an icon swap. Previous/Next/Shuffle/Repeat/Discovery buttons had no `aria-label` (Play/Pause was the only one that did) — added them, reusing the same label text already passed to their `Tooltip`. Tooltips themselves only ever appeared on mouse hover (`onMouseEnter`/`onMouseLeave` only) — added `onFocus`/`onBlur` so keyboard-focused controls get the same tooltip a mouse user would, a fix that benefits every other `Tooltip` consumer in the app too, not just the player bar.

**Chat accessibility:** the message list had no live region at all — new messages gave screen-reader users zero indication anything had happened. Added `role="log"` + `aria-live="polite"` + `aria-relevant="additions"` (the ARIA spec's own canonical example for exactly this "chat room" case). The seven emoji reaction buttons had no accessible name beyond the raw glyph — added `aria-label="React with {description}"` for each, plus `role="status"` + a screen-reader-only description on the ephemeral "Sent 💜" confirmation.

**Studio upload → durable landing:** `StudioUploadView` used to stay on the form after a successful upload, showing a local "Open in Music" link that vanished on refresh (ephemeral React state, no route) — this was `FEATURES.md`'s open "Upload job detail" gap. It now navigates straight to `/studio/archive/$id`. That page itself previously rendered the full edit UI even while a track was still `PENDING`/`PROCESSING` — Play, the waveform, Normalize, and Auto-trim would silently act on audio that didn't exist yet. `StudioArchiveItemView` now polls while non-`READY`, shows a processing banner, and disables the audio-dependent actions until the track is ready (or shows a distinct error state for `ERROR`).

**A real navigation gap, found and fixed:** while grep-verifying every real `<Link>`/`navigate()` call in every Nuclear view against the map page's route claims (see next section), found that `StudioNav`'s persistent "Music" tool group listed Upload, Collections, Recordings, and Audio editor — but not the Music/Archive catalog itself, despite it being one of the most central artist surfaces. Added it (`ListMusicIcon`, first in the group). Logged this and every other finding — including things checked and found to actually be fine, like Governance's apparent lack of a top-level nav entry turning out to be intentionally gated behind Settings → Account instead — in a new `NAVIGATION-GAPS.md`.

**Per-screenshot navigation atlas:** the Screen atlas's single ~90-node "every user option on one canvas" mermaid diagram was unreadable and, per the user, "mixed up." Replaced it with one small diagram *and* an accessible text list per screenshot (`actions`/`goesTo` fields added to `MapCase` in `content/mapScreens.ts`, a `caseFlowchart()` generator that turns that same data into a mermaid chart so the two representations can't drift apart — the text list is the actual accessible source of truth, the diagram is a supplementary visual). Every `goesTo` edge for all 46 cases is grep-verified against real source, not guessed; the persistent chrome (`AppShell`'s sidebar, `StudioNav`) is deliberately excluded from each screen's edge list since it reaches nearly everywhere and would make all 46 diagrams identical noise — that's also why the Music-in-sidebar gap above mattered, it's a hole in the one nav surface that *isn't* per-screen. The old monolithic diagram (pack `current`, i.e. apps/web) was replaced with a short redirect note pointing at the new atlas rather than mechanically split, since re-verifying a different repo's routes wasn't in scope this session.

**Bundle budget:** mermaid and Three.js were already correctly code-split (confirmed via a real production build, not assumed) — the actual problem was that all 22 admin pages were statically imported at the top of `router.tsx`, bundling board-only pages into the JS every anonymous listener downloads. Converted them to `lazyRouteComponent`, each into its own small chunk (~1-15 KB apiece) — a real if modest win (~95 KB off the main chunk); the true bulk of the ~2.6 MB main chunk is elsewhere and wasn't chased further this session.

**Admin → Activity:** a new page reusing the Nuclear desktop player's `LogViewer` UI (`@nuclearplayer/ui`, already shared — no porting needed, just composed via its `Root`/`SearchInput`/`LevelFilter`/`ScopeFilter`/`EntryCount`/`VirtualizedList` subcomponents rather than its default `Toolbar`, since "Clear"/"Open log folder" don't make sense for a real audit trail), fed by real system events — logins, uploads, releases, likes, follows, new fan subscriptions — not mocked. The backend half (separate repo, `tahti`) extended the existing board-gated `AuditLog` (already paginated/filterable/CSV-exportable) with three new action types rather than building a parallel system, instrumented at each real create path, verified against a live DB that repeat likes/follows/subscription-renewals each write exactly one row, not one per call. "Listened track" is deliberately absent — `ListenEvent` rows are anonymous by design (no `userId` column, for listener privacy), so there's no real per-user event to show; the page notes this and points at Stats for aggregate counts instead of fabricating attribution the data doesn't have.

**Admin → Logs, and a real architecture correction caught before it shipped wrong:** built to reuse the same `LogViewer` pattern for real container logs. First attempt added a whole new Loki + Grafana-datasource setup to `tahti/infra/docker-stack.yml` — which turned out to be a dormant, never-deployed aspirational Swarm migration file; the actual production stack on `vimage` runs via plain `docker compose` against `docker-compose.stack.yml`, and Loki + Grafana + a Loki datasource *already exist*, running on `vimage6` (confirmed by SSH, not assumed from repo docs). Corrected before merging: removed the redundant Loki service and datasource-provisioning from the unused file, pointed both files' logging config at the real `192.168.2.105:3100`, and added the actual `GET /api/admin/logs` route (queries Loki's `query_range` API server-to-server, board-gated, degrades to `lokiReachable:false` instead of throwing if Loki's down) — verified against the live vimage6 Loki, not mocked. Installed the missing Loki Docker logging-driver plugin on `vimage` and ran the real production deploy (`scripts/deploy_prod.sh`, coordinated with the concurrent `tahti-06` session to avoid racing a second deploy on the shared checkout): confirmed post-deploy that all 14 services now have real log streams flowing into Loki with exactly the labels the frontend's scope-parser expects, and that the new endpoint is live and correctly board-gated (401 with no session).

**In progress at session end — vimage7 GPU stem-separator:** asked to make the `worker` on `vimage7.local` use its NVIDIA GPU for "encoding." Checked before touching anything: every ffmpeg job in `apps/worker` is audio-only (`libopus`/`libmp3lame`/`flac`/`aac`) — NVENC only accelerates video codecs, so GPU passthrough for the transcode worker's actual workload would do nothing. The real GPU-shaped workload already in the fleet is `services/stem-separator` (ML source-separation inference, explicitly `[cpu]`-only today per its own Dockerfile comment, written when the only known hosts were colo/Hetzner with no GPU) — confirmed the GPU is real and working on vimage7 (`nvidia-smi`, GTX 950, driver 580.173.02) but the NVIDIA Container Toolkit wasn't installed. Since `separate-stems` is already in the `transcode` lane already running on vimage7, moved stem-separator into the same `docker-compose.worker-remote.yml` project (GPU device reservation, `audio-separator[gpu]` swap, no code change needed — `main.py` never hardcoded a device, the library auto-detects CUDA) rather than adding a new host. Deliberately no `depends_on` between the two services — stem-separator failing to start (e.g. toolkit not yet installed) must not block `worker-transcode`, matching the pre-existing "not required to boot" resilience design. Removed it from the main stack on vimage, repointed `STEM_SEPARATOR_URL` there at vimage7 instead. Blocked on: `sudo` on vimage7 needs an interactive password this session doesn't have, so the toolkit install itself needs a human; deploy of the new colocated services was kicked off and left running in the background (large image — torch + two baked-in model checkpoints + CUDA wheels) at the point this entry was written, not yet confirmed complete.

**Status:** the accessibility, studio UX, navigation atlas, bundle-budget, and Activity-page work above are implemented, tested (existing PlayerBar/Tooltip snapshot tests updated and passing, new archive-likes/artist-follows/fansubs/admin-logs tests added in the `tahti` repo and passing against a real Postgres, full `tahti-nuclear` suite — 69/69 — and `tahti` suites all clean), and pushed + deployed to production. The stem-separator GPU move is code-complete and pushed but not yet confirmed live — see above.

### 2026-08-25 (continued) — Stem separation UI, listener widgets, Plugin Store, History page port, MediaSession

**Goal:** vimage7 deploy confirmed live (worker-transcode up; stem-separator built but blocked on the toolkit install, as expected). From there: wire the stem-separation feature's frontend (backend already existed, built independently by the concurrent `tahti-06` session), then a long run of feature requests and `CUTOVER.md` slices.

**Stem separation:** found the backend (DB model, worker job with 7-day retention + sweep, API routes, DTOs) already fully built server-side with no consumer UI, and a real bug blocking it — the frontend requested `stemSet: '2STEMS'`, the API's zod schema only accepted `TWO_STEM`/`FOUR_STEM`, so every real request would 400. Fixed the mismatch and built a synced multitrack `StemPlayer` (one transport plays every stem together, per-stem mute keeps it silently in sync rather than pausing, per-stem download) into the Pro Editor's Stems panel, replacing bare download links.

**Listener widgets (SoundCloud/YouTube embeds + internet radio):** new `Settings → Widgets` — install a widget type, paste a URL, get the real platform embed (`w.soundcloud.com/player`, YouTube's `-nocookie` embed), not a proxy. Internet radio is a curated catalog (7 Finnish stations sourced from `streamurl.link/country/fi/`, fetched live rather than invented) with big-artwork cards reusing the same `Card`/`CardGrid` the channel directory uses; stream URLs are honestly `null` until verified — streamurl.link's actual stream links are behind client-side JS a static fetch can't reach, so rather than guess a URL, unverified stations show "Stream pending" and a real link to their own page. Built a listener station-suggestion → admin-review pipeline (`AdminRadioStationSuggestionsView`, distinct from the pre-existing track-submission review) so the catalog can grow past the seed 7 without guessing more URLs. Enabled widgets render on the Listen page itself, not just in Settings.

**UX consistency sweep:** forked a survey across every admin/studio view for crowding and styling drift, then fixed the top 5 findings — `StudioDistributionView` (rewired onto `StudioPanel`/`Tabs`, six unlabeled toolbar buttons got icons), `StudioVenuesView` and `StudioChannelView` (same `StudioPanel`/icon-button treatment), `AdminNewsView`'s three bare row-action buttons, and a literal `×` glyph in `StudioGoLiveView` replaced with a `Trash2Icon`. One low-priority finding (`StudioCollectionEditView`'s track-list density) was left as-is per the survey's own recommendation.

**Map page mermaid diagrams:** the per-screenshot diagrams added in the previous entry started overlapping once a screen had more than ~5 actions/links — `flowchart LR` was fanning every single action/nav item off the screen node as its own edge, and dagre couldn't lay that out cleanly at scale. Redesigned `caseFlowchart()` to group actions and nav targets into two `subgraph` clusters instead (at most two edges out of the screen node regardless of case size; dagre stacks cluster members cleanly on its own) — a structural fix, not a sizing tweak. Also added a second, distinct `MapCommentForm` (`kind="flow"`) next to each diagram specifically for navigation-flow feedback, separate from the existing per-case comment box, and filled in one real missing case (`/studio/archive/$id`'s detail view had two inbound links from other cases but no card of its own).

**Rotation controls collapse:** `StreamManagerPanel`'s "rotation is playing" state showed the full live-stream stats grid, playlist-add form, and multistream target list even when nothing was actually live — collapsed by default to just the transport buttons and artist/title/time-left line, with a chevron (matching the existing collapse-icon convention from the Pro Editor's mastering panel) to expand the rest. Scoped only to the rotation-fallback state; the real "you're live" view is unchanged.

**History page, ported from Nuclear desktop exactly:** the referenced screenshot turned out to be a real Nuclear production screenshot, confirming the existing `@nuclearplayer/ui` History components (`HistoryDayGroup`, `HistoryRow`, `CalendarHeatmap`, `ListeningClock`, `DayOfWeekChart`, `TopList`) were already ported into this fork's design system with zero consumers — built the actual page around them (`HistoryView` → `HistoryStatsSection`/`HistoryListSection`, same two-tab Stats/Listening-history layout). Nuclear tracks real per-play listening duration from a local SQLite log; this app only logs a play-event timestamp deduped to one row per track, so listening time is *approximated* from each track's own duration (documented inline, not left implicit) and "Top albums" — plays aren't grouped by album here — became "Top channels" instead of a fabricated list. Matched the reference screenshot's exact copy ("Time of day", "Listening calendar", the date-range header text). Added a sidebar "History" entry (was only reachable as a nested Library tab). This dragged `react-activity-calendar` into the main bundle (+367 KB) via `LibraryView`'s eager import — caught by a before/after build comparison, fixed by lazy-loading `LibraryView` the same way the admin pages already were.

**`CUTOVER.md` slices, several rounds:** closed §1.4's "document localStorage keys" (new `LOCALSTORAGE-KEYS.md` — confirmed `libraryStore`'s favorites/history are already scoped per-user/anon via a key suffix, so no migration step is needed at cutover) and its "no IndexedDB/service-worker, no Next server-actions" pair (both genuinely clean by construction — grepped, not assumed). Audited the "chat captcha + access gating (already hardened)" claim in the `tahti` repo rather than taking it on faith: server-side hCaptcha verification fails closed, `ChatBan` is checked at both token-issue and message-send, message length is schema-capped, and the Centrifugo publish-proxy webhook is locked to internal-network-only callers (a previously-fixed real vulnerability, SEC-007) — it genuinely is hardened, now with evidence recorded instead of an unverified checkbox. Removed two dead "open on tahti.live" escape-hatch links in `GovernanceView`/`FeatureRequestsView` (same membership check, same result, just extra friction) in favor of an in-app settings shortcut. Traced a real functional gap while auditing Next-only route handlers for hidden capability: the old Next app streamed live SSE render-progress via a route handler with no SPA equivalent at all, so `StudioProEditorView`'s render fired-and-forgot with a one-time toast and no way to know when it actually finished — added the same PENDING/PROCESSING-polling pattern the stems flow already used.

**Plugin Store, built from scratch then substantially reworked:** first pass was a read-mostly directory across the app's 7 plugin-shaped subsystems (themes/visualizers/export/import/multicast/fingerprinting/audio-plugins), each reading its real existing data source, with a companion `PLUGIN-STORE-PLAN.md` mapping what actually extracting each into a standalone package would take (ranked by cost — themes and audio-plugins are already closest to a real registry shape; Export/Fingerprinting have no per-implementation behavior to extract yet, since "Export" today is one Revelator call regardless of which DSP box is checked). Second pass added real inline configuration: a shared gear-toggle fold-out (`ConfigurableCard`) instead of every card being launcher-only, per-preset visualizer speed/intensity sliders backed by the real `patchChannelVisual` API, and a `MusicBrainz` fingerprinting plugin wiring a complete OAuth connect/disconnect flow that existed server-side (`apps/api/src/routes/me/musicbrainz.ts`) with no SPA UI at all before this. Third pass unified Import/Export/Fingerprinting into one tagged registry (`SERVICE_PLUGINS`, each entry carrying a `tags: PluginCategoryId[]`) instead of one array per category, so hearthis.at — genuinely both an import source and an export target — is a single entry with two tags rather than a duplicated card; its username config moved from a generic "Social links" profile field onto its own plugin card (same underlying storage, no longer only reachable by first navigating elsewhere).

**Nuclear plugin registry gap list:** `/home/jani/workspace/nuclear` (the reference checkout used earlier for the History port) had disappeared from disk mid-session; re-cloned fresh from the `upstream` git remote already configured in this repo (`nukeop/nuclear`) rather than working from memory, then found the *actual* live registry Nuclear's marketplace reads from (`NuclearPlayer/plugin-registry` on GitHub, served via jsDelivr) instead of guessing at what's "official." Of its 17 real plugins, one — MediaSession — was ported outright this session (see below); several others (Bandcamp/SoundCloud/Spotify/MusicBrainz) are partially covered from a different angle (import/embed/connect rather than Nuclear's browse-and-play or search-metadata framing); the rest (Discogs, Deezer/ListenBrainz/Bandcamp/SoundCloud dashboards, Last.fm scrobbling, YouTube streaming/playlists, KHInsider, OmniSource, NetEase) aren't ported, several of which may not even be the right fit for a co-op radio platform rather than a general-purpose player — flagged as a product decision, not assumed.

**MediaSession:** the one clean 1:1 port from that gap list — `navigator.mediaSession` had zero usage anywhere, so lock-screen/notification/headset media-key controls (play/pause/prev/next) didn't work at all. Wired into `AudioEngine` (the component that already owns the `<audio>` element and playback lifecycle): action handlers route through the exact same `setStatus`/`next`/`previous` store actions the player bar's own buttons use, metadata and `playbackState` stay in sync with the current track.

**Status:** all of the above is implemented, typechecked, linted, and built clean at each step; pushed to `master` across several commits (auto-deploys to beta.tahti.live via the existing CI workflow). Not click-verified in a live browser this session — no Chrome extension connection and no local Playwright install were available, so verification was static (tsc/eslint/production build/targeted code tracing) rather than an actual rendered page. A large batch of unrelated work from other concurrent sessions (admin moderation consolidation, disco-widgets, a shared `SaveButton` component, catalog/track-listing consistency, live-show recurrence in the `tahti` repo) landed via merges during this stretch — merged cleanly except one real conflict in `deploy/nginx.conf` (a regex-quoting fix from the other session was kept over this session's older version of the same lines).

### 2026-08-26 — tahti-web Storybook, and a design-system compliance sweep (admin/artist/listener)

**Goal:** Two related pieces of work. First, extend the existing `@nuclearplayer/storybook` package (previously only `packages/ui`'s Nuclear player components) to also catalogue every unique UI element in `tahti-web` itself — panels, dialogs, admin/studio chrome, listener-facing widgets — so there's one browsable, authoritative reference for what compliant tahti-web UI looks like, linked from the board-only `/more` page (the closest thing this app has to an "admin menu more page" — it's gated on `user.isBoard && diagnosticsEnabled`, same gate as the rest of this map/diagnostics hub). Second, once that reference existed, run a real compliance sweep — admin, artist/studio, and listener surfaces — checking the actual app against it, and log what doesn't comply rather than silently drifting further.

**Storybook extension:** `packages/storybook/.storybook/main.ts` gained a `@tahti-web` Vite alias to `packages/tahti-web/src`, a `staticDirs` entry pointing at `tahti-web/public` (mock fixture assets like avatar SVGs live there), and `define`s for `VITE_FORCE_MOCK=1` plus the `__APP_VERSION__`/`__COMMIT_HASH__`/`__BUILD_TIME__` globals tahti-web's own `vite.config.ts` normally bakes in (`SidebarBuildInfo.tsx` reads them and crashed without a definition). `VITE_FORCE_MOCK=1` means every one of tahti-web's `api/*.ts` fetchers short-circuits to its own realistic fixture data with zero network calls — see `api/mode.ts` — so self-fetching admin/studio views render real-looking content for free, no per-story mocking needed. New shared decorators in `packages/storybook/src/tahti-web/_lib/decorators.tsx`: `withTahtiRouter(path)` (a throwaway single-route TanStack Router context for anything using `<Link>`/router hooks) and `withMockAuth(user)` (seeds `useAuthStore` with one of three ready-made `MOCK_USERS` — board/artist/listener — for gated components like `AdminGate`/`StudioGate`).

**Coverage:** 93 component/view titles, 278 total story entries (216 non-docs stories), across every file in `tahti-web/src/components/` and `tahti-web/src/views/admin/` — including the hard cases (Three.js `ChannelVisualizer`, canvas `WaveformCanvas`/`WaveformMinimap`, the `AudioEngine` side-effect component, `AppShell`'s full router-driven shell). Verified two ways: a full `pnpm build` (clean), and a headless Playwright sweep loading all 216 non-docs stories and checking for console/page errors — 214 clean, 2 with benign expected warnings (`AudioEngine`'s idle story genuinely tries a live HLS URL and hits CORS offline; `ListenerWidgetsSection`'s embed story 404s on an external thumbnail offline). Both noted in-story, not bugs.

**Linked from `/more`:** new "Design system" `StudioPanel` section (`MoreView.tsx`, anchored `#design-system`, added to the page's own top nav) with an `Open Storybook →` button to `http://localhost:6006` (`pnpm storybook`) — not deployed anywhere, so the link only resolves when someone has it running locally alongside the app, same as every other dev-only surface on this page.

**Compliance sweep — three parallel audits, admin/artist-studio/listener, findings not yet fixed:**

**Admin** (`views/admin/**`) — 6 findings, mostly clean. `AdminFinancialView.tsx:88,180` and `AdminLogsView.tsx:64` use raw `text-red-400`/`text-green-400`/`bg-red-500` Tailwind palette colors instead of the semantic `text-accent-red`/`text-accent-green` tokens (breaks theming across light/dark/tahti-dark — compliant sibling: `AdminStorageView.tsx:317`). `AdminUsersView.tsx:363,368` hand-rolls role/suspended pills as raw `<span>` instead of `Badge variant="pill"` (doesn't even import `Badge`). `AdminRadioStationSuggestionsView.tsx:95-97` and `moderation/tabs/RadioSubmissionsTab.tsx:215-217` render the same `PENDING/APPROVED/REJECTED` status as plain text instead of a `Badge` — notable because the sibling `BetaTab.tsx` already has a `statusBadge()` helper for the identical enum one file over. `AdminLogsView.tsx:58,68` leaks the literal internal hostname "vimage6" into board-facing copy — the exact class of implementation detail past sweeps have stripped elsewhere.

**Artist/studio** (`views/studio/**`, `views/settings/**`) — 6 findings (one systemic, ~15 files). `StudioArchiveItemView.tsx:491-524` and `TrackEditDialog.tsx:252-280` hand-roll a `role="tablist"` tab widget instead of `@nuclearplayer/ui`'s `Tabs` (already used correctly for the same pattern in `StudioModerationView`/`StudioEventsView`). `api/revenue.ts:234-235,264,270` returns literal strings like `"Mock Connect onboard complete — payments ready."` that get displayed verbatim to the artist in `StudioRevenueView.tsx`/`SettingsPanels.tsx` — this file was missed by the earlier mock-jargon cleanup pass. `StudioGoLiveView.tsx:308-313` hand-rolls channel-state coloring instead of `Badge` (sibling `StudioDistributionView.tsx:13` does it right). `StudioTrackInsightsView.tsx:56-58` hand-copies `StudioPageHeader`'s exact markup instead of using the component. `ChannelLayersMenu.tsx:176-194`'s Hide/Remove row actions are raw styled `<button>` instead of `Button size="icon" variant="text"`. Systemic: essentially every view under `views/studio/` renders a bare `<p>Loading…</p>` instead of `PageStates.tsx`'s `PageLoading` — the fan-facing surface and even in-scope `ReleasesPanel.tsx` already use it correctly, but zero studio views were ever migrated onto it.

**Listener** (top-level `views/*.tsx`, excluding admin/studio/settings/legal) — 9 finding categories, ~40 instances, across 13 files; the largest of the three. One real bug, not just a style gap: `ChatView.tsx:6,15` unconditionally calls `mockDirectory()` for its channel-suggestion links instead of the real `fetchDirectory()` API already used correctly elsewhere — every real user sees fabricated channel slugs, not gated behind `VITE_FORCE_MOCK` like `SourcesView.tsx`'s legitimate fallback. Ten-plus views (`ChannelView`, `ArtistView`, `GovernanceView`, `FeatureRequestsView`, `TransparencyView`, `TransparencyMethodologyView`, `HelpView`, `SubscribeView`, `SmartLinkView`, `OnboardingView`) render a raw `<h1>` with no `PageHeader` import at all. Several (`MyCollectionsView`, `GovernanceView`, `FeatureRequestsView`, `VenuesView`, `FeedView`, `RadioView`) use ad-hoc bordered `<li>` rows instead of the `divide-y` pattern (`ArtistView.tsx` is inconsistent with itself — `CardGrid` in one place, bordered `<li>` in another). `ArtistGalleryPanel.tsx` has 4-5 icon-only gallery actions as raw unstyled `<button>` instead of `Button size="icon-sm"`. `FanSubscriptionStats.tsx`, `SupportContactForm.tsx`, and `ArtistGalleryPanel.tsx` mix in `text-red-400`/hand-rolled pills instead of the semantic token/`Badge`. A dozen views show ad-hoc `<p>Loading X…</p>`/bare "not found" text instead of `PageLoading`/`EmptyState` (`VenueDetailView.tsx:63-73` is the compliant sibling already in the same folder).

**Not flagged (checked and found legitimate):** raw hex in `ChannelDesigner`/`ChannelVisualizer`/`TrackExportPanel` is real channel-branding/brand-color data, not app chrome; raw `<button>` in tab/chip nav widgets (`InPageNav`, `StudioNav`, `AdminNav`) is the established correct pattern, not a deviation; the fixes already shipped in the 2026-08-25 "UX consistency sweep" (`StudioDistributionView`, `StudioVenuesView`, `StudioChannelView`, `AdminNewsView`, `StudioGoLiveView`'s `×` glyph) hold, no regressions found.

**Total: ~21 finding categories / ~55+ individual instances across admin/artist/listener, none fixed in this pass** — logged here as the punch list for the next page-by-page slice, same convention as every other row in this file. `packages/tahti-web/AGENTS.md` gained a standing instruction (below) to check new/changed UI against the Storybook catalogue going forward, so this kind of drift gets caught before merge instead of accumulating for another sweep.

**Status:** Storybook extension implemented and verified (build + full headless render sweep, both clean); `/more` link implemented, typechecked, and linted clean. The compliance findings above are documented only — not fixed — per the scope of this pass. Not click-verified in a live browser (no Chrome extension connection this session); verification was the build/lint/typecheck/headless-Playwright chain described above.

### 2026-08-27 — Track-row icon fixes, Recently played → Library, Add-ons reorg, theme editor, and 9 worklog slices closed

**Goal:** Several independent pieces landed in one session. First, three UI requests: fix the queue-button/play-button overlap on track-row thumbnails, move "Recently played" from the Listen page to the Library dashboard, and fold the separate Settings → Widgets section into Settings → Add-ons (renamed from Plugin store) as four new categories. Then, per explicit request, close out 9 of the findings logged in the 2026-08-26 compliance-sweep entry above, in three batches of three, using the real cataloged components rather than one-off fixes. Also added a theme editor (previously JSON-paste-only) and updated `AGENTS.md` with the now-established "widgets configure from Add-ons" convention.

**Track-row icons (`@nuclearplayer/ui`, affects every `TrackTable` with a thumbnail — Listen, Library, Studio, anywhere):** the queue button used to render as a top-right overlay on the 48px thumbnail, stacked on top of the centered play button — `ThumbnailCell.tsx` no longer passes `onQueue` to `MediaArtwork`; `ActionsCell.tsx`'s queue button (previously suppressed whenever a thumbnail was shown) now always renders in the actions column, immediately next to the favorite heart. The thumbnail's play button switched from a solid `variant="default"` circle to `variant="text"` (transparent, white icon, no shadow) at `size="thumb"` specifically — `md`/`lg`/`fill` contexts (channel/artist hero art) keep the solid button.

**Recently played → Library dashboard:** removed from `ListenView.tsx` (was signed-in-only, at the top of Listen); added to `MyDiscographyView.tsx` (the `/library` landing tab) for every signed-in user, ahead of "All sounds." Previously, a signed-in listener with no channel landed on `/library` to a bare "No sounds yet — Open Studio" empty state and nothing else; that gate now only covers "All sounds" (the artist's own archive), not the whole page.

**Settings → Widgets folded into Settings → Add-ons:** `content/pluginStoreCategories.ts` gained four categories — `radio` (internet radio stations + suggest-a-station form), `embed` (SoundCloud/YouTube embeds), `discovery` (Listen-page disco-widgets), `channel` (channel/artist-page disco-widgets) — ported into `PluginStorePanel.tsx` verbatim from the old `WidgetsPanel` (no behavior change), which is then deleted from `SettingsPanels.tsx` along with its nav entry in `settingsNav.ts`. `plugin-store` replaces `widgets` in `PUBLIC_SETTINGS_SECTION_IDS` so anonymous access is preserved. `DiscoWidgetManagerPanel`'s `description` prop became optional (the category body already shows one above it — no more duplicate text). `AGENTS.md` gained a new section: per-page widgets configure from Add-ons as one category per concern, not a separate settings section; split a category into its own sub-tabs if it has enough to configure.

**Theme editor:** new `components/ThemeEditor.tsx` — a curated set of CSS-variable fields (core colors + the 7 accents), live-previewed via `@nuclearplayer/themes`' `applyAdvancedTheme` on every keystroke (restores the actually-active theme on unmount), saved via the existing `importCustomTheme` store action. Blank fields are left out of the saved theme entirely (partial overrides, inheriting the base palette), rather than baking in every field. `ThemesPanel` in `SettingsPanels.tsx` restructured from one long scroll into three `Tabs`: **Browse** (mode toggle + built-in/custom theme grids, unchanged), **Editor** (new), **Import JSON** (the existing paste-a-theme textarea, moved as-is). Saving from the editor lands the theme in the same `customThemes` store state the Browse tab's "Your imported themes" grid already reads from, and that grid's existing per-theme "Remove" button already covers deleting an editor-created theme — both requested explicitly, both already true of the existing store wiring, no extra code needed.

**9 compliance-sweep slices closed (batches of 3, admin → artist/studio → listener), all against the 2026-08-26 audit findings:**

- **Admin (3):** `AdminFinancialView.tsx`/`AdminLogsView.tsx`'s raw `text-red-400`/`text-green-400`/`bg-red-500` → `text-accent-red`/`text-accent-green` tokens, plus `AdminLogsView`'s "vimage6" hostname leak stripped from board-facing copy. `AdminUsersView.tsx`'s hand-rolled role/suspended `<span>` pills → `Badge variant="pill"`. `AdminRadioStationSuggestionsView.tsx` and `moderation/tabs/RadioSubmissionsTab.tsx` gained a `statusBadge()` helper (mirroring `BetaTab.tsx`'s existing one for the identical `PENDING/APPROVED/REJECTED` enum) and now render a `Badge` instead of plain uppercase text.
- **Artist/studio (3):** `StudioArchiveItemView.tsx` and `TrackEditDialog.tsx`'s hand-rolled `role="tablist"` bars replaced with `@nuclearplayer/ui`'s `Tabs` (items-array mode) — `TrackEditDialog`'s `TABS` metadata array simplified to a plain `TAB_ORDER` id list once its label/icon fields became redundant with the new inline tab labels. `api/revenue.ts`'s "Mock Connect onboard complete", "Mock Connect onboard updated", "Complete mock onboarding first", and "Mock Stripe portal for X — no redirect offline" strings reworded to plain artist-facing copy (the last one keeps the real "nothing will happen, this is a demo" caveat, just without naming Stripe/mock internals). The systemic "bare `<p>Loading…</p>`" pattern across every `views/studio/*` file (24 files total, 5 more than the original audit found — `StudioProEditorView`, `StudioEventsView`, `StudioStatsDetailView`, `StudioModerationView` ×2, `StudioEditorProjectView`) replaced with `PageStates.tsx`'s `PageLoading`.
- **Listener (3):** `ChatView.tsx` — the one real bug in the sweep — was calling `mockDirectory()` unconditionally for its channel-suggestion links instead of the real `fetchDirectory()` API, so every real user (not just `VITE_FORCE_MOCK` sessions) saw fabricated channel slugs; now fetches for real, async, same as `ListenView.tsx`. Raw `<h1>` → `PageHeader` across 10 files (`ChannelView`, `ArtistView`, `GovernanceView`, `FeatureRequestsView`, `TransparencyView`, `TransparencyMethodologyView`, `HelpView` ×2, `SubscribeView`, `SmartLinkView`, `OnboardingView`). Bordered-`<li>` rows → the `divide-y` container pattern across 7 files, 9 list spots (`MyCollectionsView`, `ArtistView`, `GovernanceView` ×2, `FeatureRequestsView` ×2, `VenuesView`, `FeedView`, `RadioView` ×2 — `RadioView`'s "now playing" row highlight switched from a full colored border to a `border-l-4` accent border, since a full border no longer fits inside a shared-border `divide-y` list).

**Not touched, deliberately:** the remaining ~12 finding categories from the 2026-08-26 audit not covered by these 9 slices (e.g. `ChannelLayersMenu.tsx`'s raw icon buttons, `StudioTrackInsightsView.tsx`'s duplicated `StudioPageHeader` markup, `StudioGoLiveView.tsx`'s hand-rolled channel-state color, `FanSubscriptionStats.tsx`'s hand-rolled pill) — still open, next slices whenever picked back up.

**Status:** implemented; `tsc --noEmit`, `eslint`, and the full `vitest` suite (179/179) are clean for every batch, checked incrementally as each landed rather than once at the end. The two systemic sweeps (studio Loading→PageLoading, listener h1/li fixes) were done by parallel subagents working from this same audit's file lists, each independently typechecked/linted before merging back. Not click-verified in a live browser this session.

### 2026-08-27 — Next 9 compliance-sweep slices

**Goal:** Continue the remaining design-system punch list in three batches of three, committing and pushing after each batch.

**Batch 1:** `ChannelLayersMenu` hide/remove actions now use shared icon buttons; `StudioTrackInsightsView` uses `StudioPageHeader`; `StudioGoLiveView` uses semantic channel-state badges.

**Batch 2:** `FanSubscriptionStats` uses semantic payout badges; `ArtistGalleryPanel` uses shared icon actions and semantic error color; `VenueDetailView` uses `PageLoading`.

**Batch 3:** `ChannelView`, `ArtistView`, and `VenuesView` use shared loading and empty states.

**Status:** implemented; all three batches passed tahti-web type-check, lint, and diff checks. Pushed as three commits to `master`.

### 2026-08-27 — Collection page header normalization

**Goal:** Continue the remaining custom page-header cleanup against the shared Nuclear `PageHeader` component.

**Collection detail:** replaced the bespoke collection title/description markup with `PageHeader` inside the existing artwork hero, retaining the artist link, collaborative marker, description, and all collection actions.

**Status:** implemented; tahti-web type-check, lint, and diff checks pass.

### 2026-08-27 — Another 9 shared-control slices

**Goal:** Continue the Storybook compliance sweep in three batches of three, migrating remaining bespoke controls to the shared Nuclear `Button` while retaining specialized row-selection and drag interactions.

**Batch 1:** Playlist cards, radio rotation controls, and fan-tier perks now use shared buttons.

**Batch 2:** Admin Support, Beta, and Feature Requests filters now use shared buttons.

**Batch 3:** Content Reports filters, Top Lists filters, and the Admin Dashboard expand/collapse action now use shared buttons.

**Status:** implemented; all three batches passed tahti-web type-check, lint, and diff checks. Pushed as three commits to `master`.

### 2026-08-27 — Another 9 compliance-sweep slices

**Goal:** Continue the Storybook compliance sweep in three batches of three, standardizing the remaining loading and navigation presentation gaps.

**Batch 1:** Onboarding profile setup, Admin logs, and the Admin users list now use shared `PageLoading` states.

**Batch 2:** The Tahti map, legal hub, and legal document shell now use the shared `PageHeader` component.

**Batch 3:** SectionSidebar gained deep-route and mobile-overflow stories; AdminNav gained nested moderation-route coverage; StudioNav gained nested Perform-route and mobile-overflow coverage.

**Status:** implemented; all three batches passed tahti-web type-check, lint, and diff checks. Storybook production build also completed successfully. Pushed as three commits to `master`.

### 2026-08-27 — Another 9 shared-control slices

**Goal:** Continue the Storybook compliance sweep in three batches of three, migrating remaining bespoke controls to the shared Nuclear `Button` while preserving their behavior and accessibility semantics.

**Batch 1:** Playlist selection cards, radio rotation-mode toggles, and fan-tier perk toggles now use shared buttons.

**Batch 2:** Radio Schedule, Studio Channel, and Studio Branding tab controls now use shared buttons.

**Batch 3:** Studio Archive, Studio Updates, and Artist profile tab controls now use shared buttons.

**Status:** implemented; all three batches passed tahti-web type-check, lint, and diff checks. Pushed as three commits to `master`.

### 2026-08-27 — Another 9 loading and theme-token slices

**Goal:** Continue the remaining design-system cleanup in three batches of three, committing and pushing after each batch.

**Batch 1:** `GovernanceView`, `ChannelDesigner`, and `DiscoWidgetManagerPanel` now use shared loading states.

**Batch 2:** `ChannelDesigner`, `AppTopNav`, and `ScreenAtlas` now use semantic warning/error colors.

**Batch 3:** `TrackEditDialog`, `AddToPlaylistPanel`, and `AccountView` now use shared loading states.

**Status:** implemented; all three batches passed tahti-web type-check, lint, and diff checks. Pushed as three commits to `master`.

### 2026-08-27 — Another 9 state and navigation slices

**Goal:** Continue remaining design-system cleanup in three batches of three, committing and pushing after each batch.

**Batch 1:** `GovernanceView`, `ChannelDesigner`, and `DiscoWidgetManagerPanel` now use shared loading states.

**Batch 2:** `SignupPaymentView` and `VerifyView` use semantic error colors; `StudioShowDetailView` uses `StudioPageHeader`. Listen on-air cards no longer expose queue actions.

**Batch 3:** `HelpView` and `LegalView` use `PageEmpty`; `AdminUsersView` uses `PageLoading`. Go Live rotation transport now uses one stateful Pause/Resume control; desktop Listen play controls retain hover-only behavior through shared artwork.

**Status:** implemented; all three batches passed tahti-web type-check, lint, and diff checks. Pushed as three commits to `master`.

### 2026-08-27 — Another 9 cleanup slices

**Goal:** Continue the remaining design-system cleanup in three batches of three, committing and pushing after each batch.

**Batch 1:** `FeatureRequestsView`, `TransparencyView`, and `EmbedViews` now use shared loading/empty states.

**Batch 2:** `StudioArchiveItemView`, `StudioProEditorView`, and `VenueRegisterView` now use semantic error colors.

**Batch 3:** `ForgotPasswordView`, `ResetPasswordView`, and `SetupPasswordView` now use semantic success/error colors.

**Status:** implemented; all three batches passed tahti-web type-check, lint, and diff checks. Pushed as three commits to `master`.

### 2026-08-27 — Another 9 compliance-sweep slices

**Goal:** Continue the remaining design-system cleanup in three batches of three, committing and pushing after each batch.

**Batch 1:** `CollectionView`, `SubscribeView`, and `SmartLinkView` now use shared loading and empty states.

**Batch 2:** `DiscoverView` and all `VenueRegisterView` states now use `PageHeader`; `SecurityTotpPanel` uses the semantic error token.

**Batch 3:** `SupportContactForm`, the remaining `ArtistGalleryPanel` error path, and `StudioGoLiveView` status errors now use semantic accent colors.

**Status:** implemented; all three batches passed tahti-web type-check, lint, and diff checks. Pushed as three commits to `master`.

### 2026-08-27 — Another 9 Admin loading-state slices

**Goal:** Continue the design-system compliance sweep by replacing remaining Admin bare loading paragraphs with the shared `PageLoading` treatment, in three batches of three.

**Batch 1:** AGM, Radio, and Streams use `PageLoading` with context-specific labels.

**Batch 2:** Dashboard, Storage overview/users/files, and Languages use `PageLoading` with context-specific labels.

**Batch 3:** News, Service status, and Announcements use `PageLoading` with context-specific labels.

**Status:** implemented; all three batches passed tahti-web type-check, lint, and diff checks. Pushed as three commits to `master`.

### 2026-08-27 — Money navigation consolidation, batch 1 of 3

**Goal:** Move artist money management into the Studio Fanbase panel while keeping listener subscriptions under Account.

**Batch 1:** Removed Settings → Money; added Fan tiers to Studio → Fanbase; moved the Your subs tab into Settings → Account while retaining its subscription links and state display.

**Status:** implemented; tahti-web type-check, lint, and diff checks pass. Pushed as the first commit of this three-batch cycle.

**Batch 2:** Beta applications, Radio submissions, and Content reports moderation tabs now use shared `PageLoading` states.

**Batch 3:** Support tickets, Feature requests, and Tahti Selects moderation tabs now use shared `PageLoading` states.

**Final status:** all three batches passed tahti-web type-check, lint, and diff checks. Pushed as three commits to `master`.

### 2026-08-27 — Another 9 shared loading-state slices

**Goal:** Continue the Storybook compliance sweep by replacing remaining bare loading paragraphs with the shared `PageLoading` treatment, in three batches of three.

**Batch 1:** What's New announcements, Add-ons multistream destinations, and Account two-factor authentication use `PageLoading` with context-specific labels.

**Batch 2:** Admin activity, financial overview, and top lists use `PageLoading` with context-specific labels.

**Batch 3:** Admin radio-station suggestions, grant cycles, and storage-user details use `PageLoading` with context-specific labels.

**Status:** implemented; all three batches passed tahti-web type-check, lint, and diff checks. Pushed as three commits to `master`.

### 2026-08-28 — Storybook navigation states after the Studio redesign

**Goal:** Refresh stale navigation stories so the Storybook catalogue reflects the current Studio/Admin information architecture and does not point at removed routes.

**Studio navigation:** The Manage story now uses the current Channel route instead of the removed Branding route, with dedicated Radio and Sources route states. Sources uses its own router decorator so the nested route is represented correctly.

**Sidebar coverage:** Added representative Studio Manage and Admin Moderation SectionSidebar stories, including active and inactive sibling items and route context. These preserve the six-section Studio navigation and the fixed left-menu pattern in the design-system reference.

**Status:** implemented; tahti-web type-check, lint, targeted Storybook ESLint, and diff checks pass. The Storybook package-wide type-check remains blocked by existing unrelated story prop errors and missing Vite/test globals; no errors came from the changed stories. Changes remain uncommitted.

### 2026-08-28 — Artist/admin parity and library privacy slices

**Goal:** Continue the unfinished parity work in five focused slices and audit the production admin information architecture.

**Slice 1:** Events now expose a clear tickets/event link field, can select an existing venue from the directory, and link to venue registration for a new venue.

**Slice 2:** The listener feed is hidden from the Listen page when signed out.

**Slice 3:** Stash can move owned tracks and collections from the library into private visibility; track settings now has a direct Stash action. Private items are excluded from public listings by the existing visibility contract.

**Slice 4:** Playlists are restored as a Library submenu entry and Audience replaces Fanbase, with fan tiers separated into an Audience → Tiers view.

**Slice 5:** Track insights are available as a track-local tab, while the standalone Studio Insights navigation entry is removed. Production admin audit found missed shows, support, announcements, governance, grants, AGM, and aggregate stream monitoring represented in beta; remaining parity work is channel-scoped stream/programme management and richer per-channel admin drill-down from `../tahti`.

**Status:** implementation in progress; validation, commit, push, and beta deployment follow.
### 2026-08-28 — Stable Studio/Admin shell width audit

**Workplan:**

1. Inventory every Studio and Admin route wrapper and identify layout rules that can change the navigation or content origin.
2. Make the shared shell geometry invariant: full available width, fixed left navigation column, flexible content column, and stable scroll space.
3. Sweep every top section and representative submenu route with Playwright at a fixed desktop viewport, measuring the navigation and content bounds after each navigation.
4. Fix any remaining route-specific width or overflow regressions, then run type-check and lint.

**Findings:** Studio and Admin pages used mixed `max-w-2xl` through `max-w-7xl` wrappers, so the centered shell changed width between routes. The shared sidebar was also absolutely positioned without a fixed shell width, making the content origin sensitive to the individual page wrapper.

**Implementation:** Standardized the Studio, Admin, and Admin Moderation shells to the full available content width with an 11rem fixed navigation column, a flexible content column, consistent gap, and stable scrollbar space. Library and Sources now use the same unconstrained outer frame so they cannot reintroduce a narrower shell.

**Status:** implementation complete; Playwright route-width verification and final quality checks pending.
### 2026-08-28 — Responsive and broadcast administration follow-up

**Workplan:**

1. Audit mobile rendering and keyboard access across the shared AppShell, Studio navigation, Admin navigation, and all submenu routes; keep controls reachable without horizontal clipping.
2. Finish the shared width contract and verify stable shell/sidebar/content bounds at desktop and mobile viewports with Playwright.
3. Bring Admin Overview up to parity with `../tahti`: embed stream-manager controls, current listeners, stream listening/details, and recent broadcast recordings; use compact icon actions with accessible labels and a details modal.
4. Consolidate missed shows under Moderation, add Schedule analytics, remove offline-programme controls from Schedule, and preserve the existing schedule booking flow.
5. Move visualization configuration into each add-on card’s Configure modal; keep Manage → Channel limited to channel data and expose the setup wizard only from its modal action.
6. Add the remaining Studio/Admin parity links and help-center entry points, then run type-check, lint, and the full responsive Playwright audit.

**Completed in this pass:** The shared Studio/Admin shells now consume the full available pane with a fixed 11rem navigation column and flexible content column; narrow mobile shells are explicitly width-constrained to prevent overflow; Listen, Studio, and Admin surfaces now link directly to Help center.

**Status:** responsive shell, mobile overflow audit, Help center links, and dedicated Admin Manage → Selects navigation are implemented. Playwright covers every listed Studio/Admin submenu route at desktop and mobile viewports; broadcast/admin parity items remain queued in the workplan above.

### 2026-08-28 — Follow-up queue: Sounds, media backdrops, and modal theming

**Completed:** Sounds filters are collapsed by default with an accessible toggle next to search. Track and collection metadata now carry a backdrop image URL. Admin Selects is a dedicated Manage side tab and no longer appears in Moderation. Theme hydration completes before the app mounts, preventing dialogs from flashing in the light theme.

**Queued:** Extract the reusable Admin stream-manager panel for Overview (programming, duration, listener count/peak, channel link, details modal, and recent broadcast recordings); make Missed shows a Moderation tab; add Schedule analytics and remove offline-programme controls; finish provider-specific addon configuration dialogs and explanatory copy.

### 2026-08-28 — Radio add-on station configuration

**Completed:** Radio stations in Add-ons → Radio remain configurable even when no stream source has been set. The station dialog edits metadata, artwork, station links, and stream source; changes persist in the listener widgets store. The Listen-page station cards now consume those saved overrides, so a configured source can be played without leaving the site.

**Validation:** tahti-web type-check, lint, unit tests (29 files / 183 tests), and `git diff --check` pass. Changes remain uncommitted.

### 2026-08-28 — hearthis.at Embed add-on

**Completed:** Added hearthis.at to the Embed add-ons alongside SoundCloud and YouTube. Users can install it, configure a numeric track ID or official hearthis.at embed URL, and render the provider's player inline on Listen. Added provider-specific help text and URL coverage tests.

### 2026-08-28 — Remove redundant Settings Connections section

**Completed:** Removed the standalone Connections entry and panel from Settings. Artist social links remain under Artist, while source imports/exports and add-on configuration stay in their dedicated Studio/Add-ons destinations.

### 2026-08-28 — Broadcast settings moved into Studio Manage

**Completed:** Removed Broadcast from Settings. Studio → Manage now provides Radio with its stream, 24/7, and settings tabs, plus separate Green room and Multicast destinations. Multicast providers without credentials remain visibly disabled with Configure actions; configured targets can be activated or deactivated, and Custom RTMP accepts its own ingest address.

### 2026-08-28 — Artist branding settings tabs

**Completed:** Artist settings now expose Branding, Gallery, and Press kit as separate top-level tabs. The existing Studio branding editor supports a section-only mode so the unique branding, gallery, and press-kit controls are reused without duplicated fields or nested navigation in Settings.

### 2026-08-28 — Admin action and audit visibility

**Completed:** Admin Overview needs-action rows now expose direct queue actions and detail dialogs. Admin → Logs now includes a Recent audit tab showing the latest dashboard audit entries alongside Audit events and Container logs.

### 2026-08-28 — Tahti Selects in Studio Manage

**Completed:** Added Tahti Selects as a Studio → Manage submenu. It reuses the Selects rotation editor with stream start/stop/listen controls, the current rotation list, drag ordering, and searchable public-track selection.

### 2026-08-28 — Broadcast administration follow-up

**Completed:** Missed shows are now a Moderation tab with the old route redirecting to it. Schedule no longer contains the redundant offline-programme panel and now includes recent broadcast analytics. Admin Overview links directly to the live Stream manager, while the existing manager retains its live controls.

### 2026-08-28 — Reusable admin stream manager

**Completed:** Admin Overview now embeds the same live stream manager used by Admin → Streams. The shared panel includes duration, channel and listen links, a details modal, and restart, skip, pause, resume, and force-offline controls.

**Queued:** Add server-backed listener count, listener peak, current programming, and recent broadcast recordings when those fields are available from the admin API; continue provider-specific add-on configuration dialogs and explanatory copy.

### 2026-08-28 — Account notifications and visibility

**Completed:** Added a dedicated Account → Notifications & visibility tab based on tahti-org. It now owns profile join date, followers, following, daily listener count, and live-chat visibility, alongside the existing notification preferences. Visibility changes persist through the profile API and show success/error feedback.

### 2026-08-28 — API tokens in Account Security

**Completed:** Ported tahti-org personal API token management into Account → Security. Users can create read-only or read/write tokens, copy the secret during its one-time reveal, review token usage metadata, and revoke tokens.

### 2026-08-28 — Stream overlay configuration

**Completed:** Added an icon-only Stream Manager action that opens a modal for configuring the shared RTMP mirror overlay title, subtitle, and cover image. Values load from and save to the channel stream-overlay API.

### 2026-08-28 — Live show scheduling parity

**Completed:** Ported the remaining live-show scheduling behavior from tahti-org into Studio → Schedule: recurring schedules can be stopped, recurrence duration supports minutes, and new show scheduling carries tagline, audience visibility, automatic archive publishing, and episode-numbering defaults.

### 2026-08-28 — Focused Studio Radio surface

**Completed:** Studio → Manage → Radio now uses a dedicated Radio heading and hides the channel setup/designer/profile navigation while the radio stream and 24/7 rotation are being managed. Channel setup remains available through the separate create-channel wizard.

### 2026-08-28 — Channel designer creation step

**Completed:** Removed the channel designer from the Manage surface and added it as a separate step in the create-channel dialog after provisioning. The Radio page now contains only radio management controls.

### 2026-08-28 — Library smartlinks

**Completed:** Added Library → Smartlinks based on the tahti artist panel. Releases now have a dedicated view showing artwork, state, track count, DSP targets, smartlink views, public-page links, and release management actions.

### 2026-08-28 — Archive stats modal and compact video URL control

**Completed:** Added an in-place stats modal to Music → Sounds with the existing track insights view, and replaced the always-visible video URL field with a compact link icon that reveals it on demand. Archive downloads and hearthis embed suppression remain part of the Sounds parity work.

### 2026-08-28 — Sounds archive parity

**Completed:** Aligned Studio → Music → Sounds with the Tahti Discography archive behavior, removed hearthis.at embed rows from the archive listing, and added an original-file download action when the item is downloadable. Downloads use the authenticated archive endpoint and the browser’s local file save flow.

### 2026-08-28 — Notifications settings parity

**Completed:** Ported the Tahti notification preferences into Settings → Account → Notifications & visibility. Money-movement email and in-app notifications, daily listener-activity digest, and weekly recap are now grouped in clear cards with previews and optimistic saves with rollback on API errors.

### 2026-08-28 — Channel rotation capacity and drag ordering

**Completed:** Enforced the five-track limit consistently in both channel rotation editors, added an explicit full-rotation message, and strengthened the drag-and-drop data transfer/drop handling for stable reordering.

### 2026-08-28 — Shared hearthis.at playback

**Completed:** hearthis.at tracks now resolve into the shared Tahti player when a provider stream is available, so the global play/pause and stop lifecycle controls them. The official hearthis embed remains available as a fallback when no stream can be resolved.

### 2026-08-28 — Radio announcements and Tahti Radio submissions

**Completed:** Ported the artist radio controls into Studio → Channel → Radio. Audio station announcements remain manageable as Clips, pinned chat announcements have their own editor with the three-item limit, and Tahti Radio now has a five-track submission dialog with optional notes, opt-in control, and pending/approved/rejected result status.

### 2026-08-28 — Studio stats tabs

**Completed:** Ported the tahti stats organization into Studio → Stats with Overview, Plays & listeners, and Top lists tabs. Existing plays, downloads, smart-link, follower, listening, broadcast, engagement, listener geography, top-track, and top-country metrics are now grouped into the matching views, with the existing 7-day, 30-day, and all-time ranges shared across the page.

### 2026-08-28 — Unified upload page

**Completed:** Reworked Studio → Upload to match the Tahti upload experience: local upload and broadcast publishing are presented together at the top, alternate import methods are grouped into a compact source grid, and the collections shortcut remains visible below the upload choices.

### 2026-08-28 — Primary History navigation

**Completed:** Moved History out of the Studio/Library submenu into the primary navigation immediately before More. The same placement is available in the desktop sidebar, mobile drawer, and mobile bottom navigation, with the duplicate Studio submenu entry removed.

### 2026-08-28 — Settings theme flicker

**Completed:** Fixed the Settings theme editor preview lifecycle so it applies preview CSS without restoring the base theme between draft updates. Theme restoration now happens only when the editor unmounts, preventing palette flashes while opening Settings or switching its sections.

### 2026-08-28 — Admin stream manager metrics

**Completed:** Admin → Streams now enriches each live stream with the existing channel manage-stats endpoint, showing current listeners, listener peak, and server-tracked live duration both in the stream row and details dialog. Current programming and recent recordings remain pending dedicated admin API fields.

### 2026-08-28 — Studio/Admin navigation screenshot audit

**Completed:** Expanded the Playwright audit to capture 59 Studio, Library, Perform, Manage, Admin, and Admin Moderation views, including addressable submenu/query-tab routes. The audit now compares each fixed sidebar’s left/top/width geometry against the Library → Sounds shell, verifies one active top section and submenu item where applicable, and stores screenshots under `docs/redesign-shots/studio-audit/`. Fixed fuzzy parent-link activation in the shared SectionSidebar and removed obsolete Studio navigation from Favorites and History. Final capture completed without meaningful shell-position or duplicate-active warnings; the Library overview gap warning was a harness heading-selection false positive and is excluded because that page intentionally starts with the overview metrics panel.

### 2026-08-28 — On air replay status

**Completed:** Listen → On air now derives its badge from the API tier: only channels in the live collection are labeled Live now, while archive rotations are labeled Replay even if their channel state reports a generic active value.
### 2026-08-28 — Random artist of the week widget

**Completed:** Added the Discover widget “Random artist of the week”. It rotates deterministically each week across public artists, shows a large profile image and bio, and links to the artist’s channel for listening.

### 2026-08-28 — DJ-set tracklist editor

**Completed:** Replaced the read-only DJ-mix tracklist tab in the track editor with an editable timeline tool. DJ sets can import Traktor `.nml` playlists or line-separated text, add and remove track pins, place timestamps by clicking the waveform, distribute entries equally across the duration, and choose whether the current track appears as a minimal label, card, or ticker overlay. The tab remains hidden for non-DJ content types.

### 2026-08-28 — Nuclear plugin parity inventory refresh

**Ported already:** Themes, visualizers, the Audio FX registry/preview graph (EQ, compressor, limiter, and filter), multicast provider registry (including TikTok, Mixcloud Live, and Instagram), AcoustID fingerprinting, source connection status, radio stations, SoundCloud/YouTube/hearthis.at embeds, discovery/channel widgets, and MediaSession playback controls. MediaSession is wired in `AudioEngine` to the shared player’s metadata, play/pause, previous, next, and playback-state lifecycle.

**Registry coverage:** Added the complete current 17-entry Nuclear plugin-registry inventory to the Tahti Add-ons catalogue: Discogs, YouTube, Bandcamp, SoundCloud, Spotify, Deezer Dashboard, MusicBrainz, ListenBrainz Dashboard, Last.fm, YouTube Playlists, KHInsider, OmniSource, Bandcamp Dashboard, MediaSession, YouTube Liked Songs Sync, SoundCloud Dashboard, and NetEase Cloud Music. Each entry now records whether Tahti has an implemented, partial, or missing API/runtime counterpart.

**Still unimplemented:** Discogs/Deezer/MusicBrainz provider search, Last.fm and ListenBrainz scrobbling, YouTube provider streaming and playlist import, KHInsider, OmniSource, NetEase, and the Nuclear dashboard variants need provider or account contracts that are not present in `../tahti`. They remain explicitly planned or partial in the catalogue; no fake successful playback or mutations were added. Bandcamp and SoundCloud remain partial because Tahti currently provides connection/import flows rather than Nuclear’s provider contracts.

### 2026-08-28 — Listen SoundCloud and hearthis.at widgets

**Completed:** The Listen → Your widgets add-on now exposes both SoundCloud and hearthis.at official embed players. SoundCloud configuration reads the signed-in account’s `socialLinks.soundcloud` profile URL and pre-fills it; when the account link is missing or invalid, the configuration form requires a valid profile URL, saves it back to the account links, and uses that profile as the widget instance. Added focused SoundCloud profile URL normalization/rejection coverage; hearthis.at numeric IDs and official embed URLs remain supported.
## 2026-08-28 — Discover filter controls

**Completed:** Genre filters on Discover are now tucked into an expandable Genres control, while the content-type filters remain visible. Added a persisted “Tracks I haven’t heard” filter backed by the personalized new-to-you API; it narrows the other Discover widgets to tracks the listener has not heard.

## 2026-08-28 — Latest surface extraction into Storybook

**Completed:** Added real Storybook coverage for the Sounds library (`StudioArchiveView`), Go Live (`StudioGoLiveView` and `BroadcastPreflightPanel`), Admin Stream Manager, channel rotation editing, and track insights. Added `ElementLocations` as a reference story mapping the latest tahti-web components and views to the listener, artist, Studio, and Admin pages where they live.

**Validation:** New stories pass formatting and targeted lint. The Storybook package-wide type-check still has the previously tracked failures in legacy core stories and tahti-web build/test globals; the new stories introduce no reported type errors.

**Follow-up:** Added rendered route stories for the latest Admin Content, Missed Shows, and Selects surfaces plus Studio Schedule, Stats, and Upload. These sit beside the Element locations reference so both the visual surface and its product destination are discoverable.

## 2026-08-28 — Public sitemap refresh

**Completed:** Regenerated the static sitemap from the current public router surface. It now includes Discover, Radio, Schedule, Chat, Venues, Status, Transparency methodology, Help, Join, Apply, Governance, and the current informational/legal pages. Dynamic channel, profile, and release URLs remain in the API-fed sitemap entries.

## 2026-08-28 — Admin stream-manager 3×3 follow-up

**Slice 1:** Admin Overview now keeps the live stream manager visible instead of hiding the primary operational control behind the secondary dashboard disclosure.

**Slice 2:** Stream metrics are collected with settled requests, so one unavailable channel-stats response no longer prevents the remaining live streams from rendering.

**Slice 3:** Added an accessible refresh action and explicit API-load feedback to the shared stream manager. The dashboard disclosure now only controls finance, queue, and audit details.

**Status:** implemented; tahti-web type-check, lint, tests, and diff checks pass. Changes are ready to commit and deploy.

## 2026-08-28 — Next 3×3 Studio Storybook sweep

**Batch 1:** Added rendered stories for Studio archive detail, Collections, and Releases.

**Batch 2:** Added rendered stories for Studio Revenue, Distribution, and Manage → Channel.

**Batch 3:** Added rendered stories for Studio Branding, Moderation, and Events, each with its product destination in Storybook docs. Refreshed the static sitemap with the current `/listen` and `/whats-new` public aliases.

## 2026-08-28 — hearthis.at shared-player sync follow-up

**Completed:** Studio → Music → Sounds now keeps hearthis.at archive references visible. When hearthis.at exposes a playable stream, the row resolves it into the shared Tahti player with the provider title, artist, artwork, and source metadata, keeping global transport controls in sync. If the provider does not expose a stream, the official hearthis.at iframe remains the fallback instead of playing an unrelated preview file.

### 2026-08-28 — Next 3×3 shared-surface slices

**Batch 1:** Replaced native playlist controls with the shared Nuclear `Select` in channel radio playlist setup, Admin Stream Manager, and Studio editor archive seeding.

**Batch 2:** Normalized Studio home, Studio archive detail, and public track detail around the shared Studio/Page header primitives while preserving their existing metadata, actions, and descriptions.

**Batch 3:** Replaced native venue selection, release credit-role selection, and channel rotation quick-add controls with the shared `Select` component.

**Status:** Implemented; validation follows for the affected web package.

### 2026-08-28 — Roadmap 3×3 shared input slices

**Slice 1:** Radio booking now uses the shared Nuclear `Input` for start-time entry.

**Slice 2:** Prepared-show selection in radio booking now uses the shared Nuclear `Select` while retaining the create-new-show path and automatic detail fill.

**Slice 3:** Studio release creation now uses the shared Nuclear `Input` for release dates, with date input semantics preserved.

**Status:** Implemented; the shared UI package and tahti-web checks are next.

### 2026-08-28 — Twitch and YouTube multistream widget

**Completed:** Confirmed Twitch and YouTube as supported multicast providers and extracted the shared multistream destination form used by both Settings → Broadcast → Multistream and Studio → Go Live. Provider selection, optional labels, custom RTMP addressing, and masked stream-key entry now share one widget; adding either Twitch or YouTube creates the same live RTMP mirror target used by the broadcast runtime.

### 2026-08-28 — Spotify playlist listener widget

**Completed:** Added Spotify to Listen → Your widgets. Users can install the widget and add a specific public Spotify playlist URL; it renders Spotify’s official playlist embed as a row alongside SoundCloud, YouTube, and hearthis.at widgets. Track, profile, non-Spotify, and unsupported Spotify URLs are rejected so the configuration remains playlist-specific.

### 2026-08-28 — Next roadmap 3×3: multistream Storybook surfaces

**Slice 1:** Added dedicated Storybook states for the shared multistream destination form, covering Twitch, YouTube, and Custom RTMP.

**Slice 2:** Added the multistream form to the Element locations reference with its Settings and Studio destinations.

**Slice 3:** Recorded the deployed multistream widget surface as the next roadmap verification point; provider runtime remains backed by the existing RTMP target API.

### 2026-08-28 — Roadmap follow-up verification: three shipped items

**Slice 1:** Verified and closed the remaining shared page-header cleanup: Collection and More already used `PageHeader`, while Track detail, Studio home, and Studio archive detail now use the shared header primitives.

**Slice 2:** Verified and closed the Bandcamp catalog import contract: the API client now consumes `/api/me/bandcamp/albums` and submits `/api/v1/imports/bandcamp/add`, with the Sources UI exposing listing, metadata, and import actions.

**Slice 3:** Verified and closed the shared multicast destination form slice: Settings and Go Live both use the reusable form, including Twitch, YouTube, and custom RTMP configuration.

**Next open implementation:** Nuclear registry runtime parity remains the next substantive plugin/API item; planned providers still need real contracts before activation.

### 2026-08-28 — Plugin roadmap contract follow-up

**Slice 1:** Extracted Audio FX chain add, remove, and reorder operations into a reusable host utility with regression tests; `StudioProEditorView` now consumes the shared chain operations.

**Slice 2:** Audited Nuclear registry parity. The remaining planned entries still lack Tahti provider/search/scrobble contracts, so they remain explicitly partial or planned rather than being activated as fake runtime providers.

**Slice 3:** Confirmed `ExportProvider` remains contract-gated: no sibling submit/status/webhook API exists to implement against. The existing export targets therefore remain metadata/deep-link integrations until that API is available.

### 2026-08-28 — Responsive UX audit and next workplan items

**Radio slots:** The weekly schedule keeps its intentional horizontal scroll on narrow screens, now with an explicit minimum canvas width, stacked mobile controls, and accessible labels for every available/unavailable hour. The station filter, week navigation, booking form, and green-room actions remain usable without viewport overflow.

**Channel moderation:** Moderator and chat-ban forms now stack on phones and expand into inline controls from the small breakpoint; long usernames and fingerprints remain constrained by the surrounding layout.

**Multitrack boundary:** Press-kit gallery work is already complete. The full multitrack timeline remains unimplemented until the sibling API defines a persisted track/timeline model and the player/editor rendering architecture is agreed.

### 2026-08-28 — Moderator API coverage and production cutover audit

**Moderator follow-up:** Added API contract tests for moderator listing, owner-scoped assignment/removal, and channel-scoped chat bans. `StudioGate` continues to restrict the surface to artist or board accounts with a channel; the remaining gap is an explicit rendered permission test for the gate.

**Production cutover:** Rechecked the cutover boundary in `FEATURES.md`. The official client remains protected by the no-drop ledger requirement, and Admin remains canonical in the production web client. No cutover flag or route ownership was changed.

**Responsive audit:** Reviewed the next workplan surfaces at phone and small-tablet constraints. Schedule controls and the seven-day grid now have deliberate stacked/scrolling behavior; moderation forms stack on phones. The editor and Admin operational tables retain horizontal scrolling where dense data requires it rather than clipping controls.
## 2026-08-28 — Responsive UX follow-up and workplan audit

**Audit result:** The existing Playwright layout-stability audit was run against the mock app at 1440px and 390px. It currently stops before measuring layout: the mock sign-in flow lands on the Listen view when the test navigates to `/studio`, so `.studio-page-layout` is absent. This is an auth/route harness failure, not evidence of horizontal overflow. The stale process occupying the audit port was replaced before the run.

The next contract-gated workplan items were checked against the implementation. Slice 4 (generic Audio FX chain host) is implemented in `src/plugins/audio-fx/chain.ts` and consumed by the pro editor, with regression tests, so it is now marked shipped. Production cutover remains a no-drop ledger gate; ExportProvider remains blocked on sibling submit/status/webhook contracts. These two items were not marked complete without their required external contracts.

The multitrack timeline keeps its intentional horizontal scroll region isolated to the canvas, stacks track controls above it on narrow screens, and uses bounded flex children (`min-w-0`) so it does not intentionally widen the page. A follow-up audit should first repair the mock auth navigation precondition, then rerun the full route matrix and record per-route overflow dimensions.

## 2026-08-28 — Web performance audit

**Build baseline:** The production build completed successfully. Before this pass, the entry bundle was 3.54 MB minified / 1.020 MB gzip. `StudioArchiveItemView`, `StudioCollectionEditView`, `StudioDistributionView`, `StudioProEditorView`, and `StudioShowDetailView` were statically reachable from the router.

**Completed:** Those studio detail/editor routes now use `lazyRouteComponent`, producing route chunks instead of loading their code in the entry bundle. The entry bundle is now 3.45 MB minified / 997 KB gzip, a reduction of approximately 87 KB minified / 22 KB gzip. The build still passes type-checking and reports no new dynamic-import warning for those studio views.

**Remaining issues and opportunities:**

- The entry bundle remains large because broad listener/studio modules are still statically imported by the router. A follow-up should lazy-load additional infrequently visited studio/admin routes while preserving the shared shell.
- Vite reports `api/admin.ts` cannot be split because `PluginStorePanel` statically imports it while admin routes also import it. Moving admin API access behind a settings/plugin-specific dynamic boundary is the highest-value next split candidate.
- Mermaid-related chunks remain large (`mermaid.core` ~598 KB, `cynefin` ~688 KB, plus diagram chunks). They are already deferred from the entry path, but the diagram renderer could be split by diagram family or loaded only after the first `/more` flow interaction.
- The Three.js visualizer remains correctly deferred to its own ~351 KB chunk; avoid importing visualizer presets from listener routes or shared shell code.
- The responsive Playwright matrix is not yet a valid performance/layout signal because its mock sign-in flow lands on Listen before `/studio` assertions. Repair that fixture/navigation precondition before using route timing or overflow results as release evidence.

## 2026-08-28 — Theme background visualization controls

The Themes surfaces now share one theme-aware visualization settings panel. The Tahti theme exposes the ported Aurora background preset with a visibility toggle, opacity, motion speed, intensity, and audio-reactivity controls. Settings are persisted locally and the renderer is disabled automatically for themes that have not opted into visualizations yet.

## 2026-08-28 — HearThis player embed integration

HearThis tracks now remain embed-only, matching the sibling Tahti API contract. They enter the shared queue without the old demo-audio fallback, and the official widget is rendered from the global player bar and full-screen player. Native player transport remains available when a real provider stream URL exists; HearThis-only transport is delegated to the provider widget because no documented iframe control API is available.

## 2026-08-28 — Content-only route loading

Top-level navigation now keeps the app shell, top bar, and workspace mounted while routes change. A lightweight loading overlay is scoped to the routed content viewport across desktop, mobile, and public artist layouts, reducing the impression of a full-page reload while lazy route content is resolving.
