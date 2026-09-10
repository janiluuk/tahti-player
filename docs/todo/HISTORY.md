# docs/todo history

Completed task notes folded here so `docs/todo/` stays current.

## 2026-09-10 — Waveform empty placeholder; motions cursor; theme default; Discover gateway; gallery lightbox delete

Workplan cycle after v0.0.107 (shipped as **0.0.108**):

- **Waveform:** peakless tracks use a flat dim placeholder instead of PRNG noise.
- **Governance #18:** motions list cursor pagination + Load more (`x-next-cursor`).
- **Theme:** tahti-web default `nuclear:tahti-dark`; viz settings for
  `nuclear:default`; ambient opacity / surface transparency bumped.
- **Discover:** `DiscoverGatewayBackground` subtle AURORA layer.
- **Press-kit:** lightbox owner delete control (confirm unchanged).

Leaves stay open where noted in INDEX (collection peaks, thumbnail glow,
Button audit, radio logo, bulk comments, voting window).

## 2026-09-10 — Admin audit topic filter + pagination; player/Discover peaks

Closed governance gap #7 residue and advanced waveform wiring:

- **AdminActivityView:** topic `FilterChips` (finance / subscriptions /
  membership / decisions / officers / meetings / radio) forwarded as
  `?topic=` to `GET /api/admin/audit`; real `Pagination` against
  `total`/`page`/`limit=50`; CSV export respects the selected topic.
  Client + mock filter coverage in `admin.test.ts`.
- **Waveform:** optional `peaks` on `TahtiPlayable`; `playerStore`
  keeps `currentPeaks`/`peaksById` across queue skips. Track detail
  play + Discover select (always loads track detail) + ConnectedPlayerBar
  render real peaks. Collection list still lacks peaks in the public
  collection payload — left open in `waveform-detail-accuracy.md`.

`governance-gap-list.md` and `waveform-detail-accuracy.md` stay open.

## 2026-09-08 — Governance: top-3 gaps + admin consolidation closed out

`governance-gap-list-top3.md` is done — all three priority gaps from
`governance-gap-list.md` shipped, plus a mid-task admin-nav consolidation
ask:

- **Admin consolidation** (2026-09-07): `/admin/governance`,
  `/admin/reports`, `/admin/grants` (bare), `/admin/agm` — four separate
  `AdminNav` entries/pages — folded into one `/admin/governance` page
  (`AdminGovernanceView.tsx`, tabs Overview/Annual reports/Grants/AGM,
  mirrors `AdminModerationView`'s tab-container pattern). Old routes
  redirect into `/admin/governance/$tab`. Deleted the three old standalone
  view files + their stories, folded into `AdminGovernanceView.stories.tsx`.
  Fixed `e2e/real-user-journeys.spec.ts`'s stale "AGM" tab assertion.
- **Gap #6 — meeting attendance management** (2026-09-07): admin can
  record PRESENT/ABSENT/EXCUSED per meeting from an `AttendancePanel` in
  the AGM tab, via new `fetchAdminGovernanceAttendance`/
  `upsertAdminGovernanceAttendance` mirroring `../tahti-org`'s
  `GET/POST /api/admin/governance/meetings/:id/attendance` exactly.
  Recorded by free-text display name (not member id) by design — the
  backend upserts by `memberId`, which the frontend member-list APIs
  don't expose; documented as a known limitation, not silently papered
  over.
- **Gap #1 — motion detail view** (2026-09-08): `fetchGovernanceMotion(id)`
  + `GovernanceMotionDetail` type + `/governance/motions/$id` route
  (`GovernanceMotionDetailView.tsx`). The list's per-motion card (badge,
  tally, vote buttons, board open/close controls, discussion thread) was
  extracted out of `GovernanceView.tsx` into a shared, self-contained
  `components/governance/MotionCard.tsx` so the detail page reuses it
  with `description` + `defaultExpanded` — all 6 existing
  `GovernanceView.test.tsx` tests passed unchanged after the extraction.
- **Gap #3 — public resolutions page** (2026-09-08):
  `fetchTransparencyResolutions(year)` + new
  `TransparencyResolutionsView.tsx` at `/transparency/resolutions`
  (year picker, outcome badge, vote tally per resolution), linked from
  `TransparencyView.tsx`. Reused the existing `BoardResolution` type
  (already a superset of the backend's `TransparencyResolutionListSchema`)
  rather than adding a new one.
- Also closed the corresponding type-gap rows in `governance-gap-list.md`
  (#11 transparency resolution types, #12 attendance types, #13 motion
  detail description) — all now shipped as part of the above. That
  parent 16-gap list stays open with #2, #4, #7–#10, #14–#16, #18
  remaining, re-prioritized to #7/#9/#8 next.

Not live-browser-verified this pass (no Chrome extension available in
these sessions) — `tsc --noEmit`, `eslint`, and the full `pnpm vitest run`
suite (488/488) all passed after each piece.

## 2026-09-08 — Admin artwork presets: modal editor + guarded reset + Add new

`admin-artwork-presets-modal-redesign.md` — all 4 asks shipped in
`AdminArtworkPresetsView.tsx`:

1. Clicking a grid tile now opens a compact `Dialog` (preview + hover
   upload, "Assign from your artwork" swatches, Save/Cancel) instead of
   the inline section that used to sit below the grid.
2. Live grid update on upload/reassign — checked, already worked: the
   grid's `activeUrls` was already a `useMemo` derived from `assignments`
   state, so `assignToSelected` (called on both direct swatch-click and
   post-upload) already re-renders the grid with no reload. No code
   change needed for this one, just verification.
3. Added a top-right "Add new" icon button (`ViewShell`'s `actions` slot)
   that opens the existing `ArtworkPresetUploadDialog` in a new "pool"
   mode — adds to the custom-artwork library without auto-assigning it to
   whichever slot happened to be last selected, distinct from the
   per-slot upload triggers (hover overlay, dashed "+" swatch inside the
   editor) which keep the existing auto-assign-to-this-slot behavior.
4. "Reset to defaults" moved to an icon button next to "Add new" and now
   goes through a `ConfirmDialog` before clearing every custom
   assignment — previously a bare `Button` with zero confirmation on a
   destructive, all-slots-at-once action.

`tsc --noEmit`, `eslint` clean. No pre-existing tests or stories for this
view (none added — matches other admin-view precedent this session). Not
live-browser-verified.

## 2026-09-08 — Mentions: real sourceUrl/sourceTitle resolved in `../tahti-org`

`archive-mentions-source-url.md` was fully scoped from a prior pass;
this pass implemented it in a dedicated `tahti-org-worktrees/` worktree
(avoided the shared main checkout, which had another session's
uncommitted work at the time). `GET /api/v1/u/:username/mentions` now
resolves `Mention.sourceId` into a real `sourceUrl`/`sourceTitle` per
surface (BIO → `/u/:username`, TRACKLIST → `/t/:soundId` with the
sound's title, ANNOUNCEMENT → the mentioner's `/channel/:slug` — not
the announcement row itself, since it rotates out after 3 — CHAT →
parses the composite sourceId to the channel's `/chat/:slug`).
RELEASE/NEWSLETTER confirmed dead (no `recordMentions()` call site).
Also checked "notifications end to end": `GET /api/me/mentions` and
`Mention.notifiedAt` are both unused/dead (no frontend consumer
anywhere, notifiedAt never written) — left as-is, not built out
(would be new feature scope, not this ticket). `tahti-web`'s
`PublicMention` client type already had the fields typed, no client
change needed. PR: `tahti-org#481` (not merged by this session).

## 2026-09-08 — Studio EmptyState sweep: closed out, remaining items are intentional non-fits

`studio-emptystate-remaining.md` was a leftover from the already-closed
`studio-storybook-sweep.md` parent task. Its "Still open" list had two
items, both non-actionable as written: (1) Distribution's "No credits
yet" caption is a one-line inline hint above an editable, non-empty
list row (not a section-level empty state) — the shared `EmptyState`
component is a centered, padded block (even at `size="sm"`) meant for
a genuinely empty section, and would be a visual downgrade wrapped
around a one-line caption; (2) "Settings panels with SettingsHint
empties" turned out to reference a component that doesn't exist in
this codebase (`grep` found nothing) and was already flagged
out-of-Studio-scope in the doc itself. Closing rather than converting
— every real Studio `EmptyState` swap from that sweep already shipped
(see the "Done this pass" list this doc carried).

Also dropped `stream-overlay-auto-fill-and-avatar-placeholder.md` and
`admin-panel-left-padding.md` INDEX rows — both already shipped and
folded into HISTORY earlier (2026-09-07/08) but their INDEX rows/file
links had gone stale (file deleted, row left behind).

## 2026-09-08 — ViewShell page headers: last holdout converted, StudioPageHeader deleted

`StudioEpisodeReviewView` (in `StudioShowDetailView.tsx`) was the one
component still left on the plain `StudioPageHeader` (title +
episode-number badge, not a cover-overlay case, so it wasn't part of
the earlier 4-view "Remaining" cover-overlay batch). Converted to
`ViewShell` (`classes={{ root: 'px-0 pt-0' }}`, episode number badge
moved into the `actions` prop — same right-aligned slot `StudioPageHeader`'s
`action` used). Breadcrumb (`← {show title}`) and `BroadcastSubNav` stay
outside `ViewShell`, matching every other Studio detail page.

With that last consumer gone, `StudioPageHeader` (the component
definition in `StudioPanel.tsx`) was deleted per the todo's item 6.
Also removed its now-broken Storybook story (`StudioPanel.stories.tsx`)
and its row in `ElementLocations.stories.tsx`; the `ViewShell` element
row there had its stale "Remaining Studio/Admin still StudioPageHeader"
clause dropped since nothing does anymore.

`tsc --noEmit` (tahti-web) and `eslint` clean; `pnpm vitest run` 484/484
passing. Not verified in a live browser — doing so needs the sibling
`tahti-org` API running plus a seeded show/episode and studio login,
disproportionate for a change matching ~15 already-verified `ViewShell`
conversions elsewhere in the codebase.

This closes out `docs/todo/viewshell-page-headers.md` — the whole
Listener/Studio/Admin `ViewShell` migration is done.

## 2026-09-08 — Next-broadcast cards, status-bar icons, page-tour chrome

**Next-broadcast cards:** Studio schedule "Next"/"Upcoming" list puts the
label and title on one row, with a cover/backdrop banner strip (gradient
fallback when no artwork).

**Status bar:** `StatusBarContent` uses lucide icons + tooltips for sounds,
notifications, messages, and encoding; adds cloud storage used via
`/api/me/storage` (links to Settings → Account). Desktop local-track
count/size still open — see WORKPLAN Later.

**Page tour:** Inner pages only get a purpose annotation (+ page-specific
functionality steps such as Audience/Stripe). Sidebar/top-bar chrome
steps only on `/`. `annotationOnly` steps render without a DOM cutout.

## 2026-09-08 — Settings footer icons + onboarding/theme toast noise

**Settings footer:** GitHub / Discord / API docs in the settings modal nav
footer are now a single centered icon row (18px) with aria-label/title,
above SidebarBuildInfo.

**Onboarding toast:** At most once per browser session via sessionStorage
(`deferOnboardingPrompt`), even if the toast times out without a click.
"Not now" still permanently marks seen. Mock/seed logins
(`buildMockLoginUser`) pre-mark onboarding seen so demo users never get
the popup. Screenshot/e2e drivers should keep calling markOnboardingSeen
after sign-in (already done in `e2e/real-user-journeys.spec.ts`).

**Theme-in-review mock toast:** `dismissNotification` / mark-all under
`VITE_FORCE_MOCK` now persist dismissed ids in sessionStorage, so
Acknowledge actually removes the fixture from subsequent fetches across
reloads in the same session.

## 2026-09-08 — Admin panel left padding + Sounds empty library

**Admin left gap:** `.admin-page-layout` / `.admin-moderation-layout` still
used a CSS grid with an 11rem left column from the old docked-sidebar
AdminNav. After `AdminPageLayout` nested tabs/menu inside a flex wrapper,
that column stayed empty — content started ~11rem inset. Switched both
layouts to the same flex column as `.studio-page-layout`.

**Sounds empty in prod:** tahti-web still called `/api/me/archive*`; the
sibling API renamed those routes to `/api/me/sound*` (production Next client
already used the new paths). Failed GETs returned `{ data: [], meta:
apiErrorMeta }` with no UI surface, so a 404 looked like an empty library.
Fixed every `/api/me/archive` client path to `/api/me/sound`, and
`MyDiscographyView` now shows a retryable `PageError` when `meta.reason` is
set. Sort control moved into the filter row as a `DropdownButton` (dropped
the labeled `Select`).

## 2026-09-08 — Collection detail page: moved under /library, fixed wrong nav

User-reported via screenshot: opening a collection from Library
(`/library/collections` → `MyCollectionsView`) landed on
`/studio/collections/$slug`, which unconditionally rendered
`StudioNav`'s "Studio" submenu (Overview/Branding/Stats/Governance/
Posts/Audience/Releases/Editor) — none of which relate to a collection,
and none of which highlight as active for that route. Same bug family
as the "lost library issue" fixed 2026-09-07 (Studio's own chrome
leaking onto a Library-owned page) — `SECTION_PREFIXES`/`isSubmenuActive`
in `StudioNav.tsx` already had dead-code branches anticipating a
`/library/collections` route that didn't exist yet, confirming this was
a known, half-finished migration.

Fixed: added a `/library/collections/$slug` route (`router.tsx`)
rendering the same `StudioCollectionEditView`, now with a `nav` prop
(`'studio' | 'library'`, default `'studio'` for the untouched
`/studio/collections/$slug` call sites — `StudioPlaylistsView`,
`CollectionView`'s "Edit in Studio" link, `PluginStorePanel`,
`ChannelRadioPlaylistPanel` — which legitimately stay Studio-context).
Extracted `LibraryView.tsx`'s Overview/Sounds/Collections/… tab strip
into a reusable `LibrarySectionTabs` component so
`StudioCollectionEditView` can render it (with "Collections" active)
and point its back-link at `/library/collections` when `nav="library"`.
Updated `MyCollectionsView`'s row links to the new route.

**Verified:** `tsc --noEmit` and `eslint` clean on `tahti-web`;
`StudioNav.test.ts` (20 tests, unaffected) still passes. Confirmed the
new route resolves (no 404) and that `/library/collections` itself
still renders all 9 tabs correctly via a local `VITE_FORCE_MOCK=1`
dev server — could not screenshot the authenticated detail view itself
since typing into the mock login form was blocked by this session's own
credential-entry safeguard.

## 2026-09-07 — Fixed: Library's own tabs (incl. Local files) were unreachable from /library

User-reported ("the lost library issue"). Root cause, found via live
screenshot diffing: `LibraryView.tsx`'s `overviewTab` computation
resolved to `null` for the plain `tab === 'library'` case (the actual
`/library` landing route reached from the sidebar), and the tab strip
was only rendered when `overviewTab` was truthy — so the real Library
section tabs (Sounds/Collections/Recordings/Media/Stash/Embeds/Smart
links/**Local files**) never appeared on the page you land on by
clicking "Library" in the sidebar. What looked like a working tab bar
in its place was actually a second, unrelated bug: `/library` was
listed in `StudioNav.tsx`'s `SECTION_PREFIXES['/studio']`, so
`AppShell.tsx` rendered Studio's own tab strip (Overview/Branding/
Stats/Governance/…) on top of Library's page — visually plausible, but
navigating nowhere useful from a Library context.

Fixed both: added `'library'` (Overview) as a real first entry in
`LIBRARY_SECTION_TABS` so the strip always resolves to a valid tab
instead of hiding itself, and removed `/library` and its `/library/*`
sub-paths from Studio's `SECTION_PREFIXES` (confirmed via
`navigationActive.ts` that sidebar highlighting for Library already
short-circuits before reaching the Studio check, so this didn't depend
on the stale prefix list for anything else). Live-verified before/after
via Playwright screenshots against a local `VITE_FORCE_MOCK=1` session.

## 2026-09-07 — Stream Manager now-playing artwork (backend already had it)

Folded one bullet from `queued-ux-fixes-2026-09-05.md`. Re-checked the
"blocked on missing data" finding from 2026-09-05 against current
`../tahti-org`: `GET /api/channels/:slug` (`apps/api/src/routes/channels/get.ts`)
already selects and returns `nowPlayingArtworkUrl` as `nowPlaying.artworkUrl`
— a `PublicChannel.nowPlaying.artworkUrl` field tahti-web's own
`api/types.ts` already declared, just never consumed. The blocker had
been resolved by someone else's backend work without this doc being
updated. Wired it up purely on the frontend: `StreamManagerPanel.tsx`'s
`RotationPlayback` now carries `artworkUrl`, rendered via `MediaArtwork`
(`size="thumb"`) next to the current-track text, with `onPlay`/`isPlaying`
wired to the same rotation pause/resume transport the separate
play/pause button already uses.

## 2026-09-07 — Governance Account-tab duplicate entry point removed

Folded from `governance-out-of-account-section.md`, resolved via its own
Option 2 (the conservative choice — no navigation/discoverability
change, so no access regression for non-artist members who rely on
Settings → Account as their only path to governance): removed the
"Governance" link-out button from Settings → Account → Membership
(`SettingsPanels.tsx`), which duplicated the dedicated Settings →
Account → Governance tab right next to it — same `GovernanceView`
content, two ways to reach it from the same section. The dedicated tab
and the standalone `/governance` route both still exist unchanged.
Options 1 (new top-level nav entry) and 3 (something else) are real
product-IA decisions and were not attempted.

## 2026-09-07 — Fullscreen player: translucent backdrop, back arrow, hidden chrome

Folded from `fullscreen-player-background-translucent-layer.md` and
`fullscreen-player-topbar-and-back-arrow.md` (both pre-spec'd with exact
diffs from an earlier investigation pass; implemented as written, line
numbers had drifted slightly but the referenced code matched exactly).

`FullScreenPlayer.tsx`: the `ChannelVisualizer` backdrop now uses
`bg-background/35 backdrop-blur-md` (was flat `opacity-60`), matching the
title card's translucent treatment. The top-right `Minimize2Icon` became a
top-left `ArrowLeftIcon` back button (`size-12`, translucent black
circular background, "Back to player" tooltip) — bigger and easier to hit
than the old `size-8` control.

`AppShell.tsx`: `AppTopNav` and both `ConnectedPlayerBar` mounts (mobile
and desktop) now skip rendering while `fullScreenPlayerOpen` is true, so
the fullscreen overlay's cover art isn't cropped by chrome underneath it.

## 2026-09-07 — Onboarding: opt-in toast instead of forced redirect

Folded from `onboarding-cta-not-forced-redirect.md`. `AppShell.tsx`'s
first-sign-in `useEffect` no longer force-navigates to `/onboarding`; it
shows a dismissible `sonner` toast ("Finish setting up your profile?")
with a "Set up profile" action (navigates to `/onboarding`) and a
"Not now" action that calls the same `markOnboardingSeen` OnboardingView's
own "Skip for now" button already uses. Letting the toast time out without
a click marks nothing, so it offers again next session rather than either
nagging forever or permanently vanishing on inaction — the doc's own
open question ("skip vs. dismissed-forever") is resolved by reusing the
existing skip semantics for the explicit action only, not for a timeout.
The route and `/onboarding` page itself are unchanged.

## 2026-09-07 — Settings → Keyboard shortcuts deep link

Folded from `help-keyboard-navigation.md`. Added a "Keyboard shortcuts"
button to Settings → Account → Session (next to Log out), linking to
`/help/$slug` (`slug: 'keyboard-shortcuts'`) — the article shipped in the
0.0.58 pass this doc was already tracking. Closes the doc's one remaining
line ("Settings remapping deep link"); the remapping *store* itself
(player-only today, per the doc's original scope) was never in this deep
link's scope and isn't addressed here.

## 2026-09-07 — Storybook sweep docs fully closed

`storybook-ui-sweep.md` had nothing left unique to itself: its own
2026-09-06 note already found both of its "still open" lines done and
removed them, leaving only a pointer duplicate of `studio-storybook-sweep.md`.
`studio-storybook-sweep.md`'s own last remaining line — "CollectionEdit
track empty" — is now done too (this round's workplan-cycle-1
`StudioCollectionEditView` `EmptyState` swap, see
`packages/tahti-web/UI-REDESIGN-WORKLOG.md`); a fresh grep for unswept
hand-rolled `FilterChips`-shaped segment strips across Studio/Admin views
found none. Closed both docs.

## 2026-09-07 — ChannelView badge/share cleanup: last open thread resolved elsewhere

Folded from `channelview-badge-dedup-and-share-modal.md`. All real work
(on-air badge dedup, playlist-copy-link, social share icons, dropped
subtext) already shipped per that doc's own "What shipped" section. Its
one open thread — "move the player above the tabs" — was explicitly
superseded by a later, different user instruction to remove the tab strip
entirely in favor of a Stream Manager modal; that replacement already
shipped and folded (`channelview-stream-manager-modal-replaces-tabs.md`,
see the HISTORY entry above/below this one). Nothing left to implement;
closing the doc.

## 2026-09-07 — Signed-in map/atlas recapture (post-0.0.62 RightRailPanel fix)

Folded from `map-screenshot-refresh.md`. The signed-in blocker
(`RightRailPanel`'s unstable Zustand selector causing "Maximum update depth
exceeded") was already fixed upstream in 0.0.62; the recapture itself just
hadn't been re-run since. Ran `scripts/capture-map-screens.mjs` against a
local `VITE_FORCE_MOCK=1` dev server end to end: 141/142 shots captured
cleanly (all previously-blocked signed-in surfaces — Library, Feed,
Favorites, History, Messages, Studio, Admin, all three Governance contexts —
now show live chrome, not stale pre-ViewShell shots). One shot,
`show-episode`, still fails (`waitForFunction` timeout waiting for content)
on both the primary attempt and the soft retry; left as a known gap rather
than blocking the rest of the recapture on it. `sitemap.json` regenerated
(1121 images). No script changes were needed — the earlier suspicion of a
`/library/sounds`-specific hang did not reproduce this run.

Folded from `player-bar-fake-live-indicator.md`. Confirmed via
`../tahti-org` that `channel.state === 'LIVE'` is genuinely overloaded
(the 24/7 fallback rotation sets it too, `channel-fallback-reconciler.ts`)
and no public endpoint exposed real ingest signal — `manage-stats` is
owner/board-gated. User authorized editing `tahti-org` mid-session.

**Backend (`tahti-org`, implemented but uncommitted):** `GET
/api/channels/:slug` now also returns `signalConnected` (via the same
`fetchMountSignalStatus` manage-stats already uses, only when `state
=== 'LIVE'`), added to `PublicChannelViewSchema`. `get.test.ts` gained
2 assertions. Verified against a disposable Postgres, not the shared
dev DB. **Left uncommitted**: `tahti-org` has an in-progress git merge
(`origin/main` → `main`, conflicts already resolved, awaiting a final
commit from whoever started it) — concluding someone else's merge
under this session's commit isn't this session's call. The diff sits
cleanly on top of the merge; whoever commits it will see it as an
additional uncommitted change afterward.

**Frontend (`tahti-web`, committed):** `TahtiPlayable`/`PublicChannel`
gained `signalConnected`/`isRealLive`. New `playerStore.isRealLive`
(distinct from `isLive`, which still governs live-style playback UI
for both real broadcasts and rotations) is set from `item.isRealLive`
in `play()` — conservatively `false` in `playQueueIndex()` since
`playableFromQueueItem` can't reconstruct it from the queued `Track`.
`ConnectedPlayerBar`/`FullScreenPlayer`'s LIVE badge now gates on
`isRealLive`. Mock data (`mockChannel`) reflects the same contract:
Tahti Radio (rotation) never shows `signalConnected`, other live mock
channels do.

## 2026-09-06 — Channel Designer Links: hide/show eye icon confirmed shipped

Folded item 3 from `channel-designer-links-prefill-and-home-rename.md`,
previously flagged as needing a backend schema check before
attempting. Re-checked against `../tahti-org`: `ChannelLinkSchema`
(`packages/shared/src/dto/visual-preset.ts`) already has `hidden:
z.boolean().optional()` — the backend already had room for this field
(`channelLinksJson` is a loosely-typed JSON blob column, no migration
needed). Turns out the full feature was already shipped end-to-end
since this was written and just never folded back: `ChannelLink`
(tahti-web `api/channel-design.ts`) already carries `hidden?: boolean`,
`ChannelLinksEditor.tsx` already has the Eye/EyeOff toggle button per
link, and `ChannelView.tsx:949` already filters hidden links from the
public render (`editing || !link.hidden`). Nothing left to build here.

## 2026-09-06 — RadioListItem component + hover play on cover art

Folded from `radio-list-item-component.md`. Extracted the Listen
page's bespoke Tahti Radio row into `components/RadioListItem.tsx`
(cover art + live-audio-reactive backdrop + now-playing text + "Open
radio" link) with a Storybook story
(`Tahti/Radio/RadioListItem` — Idle/Playing/Offline/No-cover states).
The separate play/pause icon button moved to a hover overlay on the
cover art itself, using `MediaArtwork`'s existing `onPlay`/`isPlaying`
pattern (already built for exactly this, just not reused here yet).
`ListenView.tsx` now renders `<RadioListItem />` instead of ~75 lines
of inline markup.

## 2026-09-06 — HelpLayer port fully closed

Folded from `help-layer-component-port.md`. The component shipped and
was wired into `StudioGoLiveView.tsx` in an earlier pass; this
session confirmed its one flagged follow-up (`StreamOverlayEditor`'s
explanatory paragraph moving from the Help Center to `HelpLayer`) was
also already done — grepped and found `HelpLayer` already imported and
wired there ("How the stream overlay works").

## 2026-09-06 — Governance motion parity with prod dashboard

Folded from `governance-motion-parity.md`. `GovernanceView.tsx` gained
DRAFT-state badge + circulation-period copy, board-only open/close
motion controls (`patchGovernanceMotion`), turnout math against the
member directory count, and meeting quorum display — closing every
real gap found against `tahti`'s prod governance dashboard. New
`GovernanceView.test.tsx` (6 cases). Implementation was already complete before this session; this session
found and fixed a `window.matchMedia` crash in the test suite itself
(a regression from this same session's Tooltip fix, unrelated to
governance) that had been silently failing all 6 of its tests. Pending:
push + deploy + live verification (tracked with this branch's other
pending work).

## 2026-09-06 — Mobile player bar: real play/pause + full-screen queue

Folded from `mobile-player-bar-controls-and-queue.md`.

Root cause of "only a mute button, no working play/pause" on mobile:
`ConnectedPlayerBar.tsx` unconditionally hid the whole compact bar
whenever `isMobile && isPlaying` (added when the full-screen player
shipped, with nothing ever wired up to replace it — `ConnectedStatusBar`
filled the gap instead, showing sound-count/notification text with zero
playback controls). Removed that hide condition entirely; the compact
bar now stays mounted during mobile playback. Added a dedicated mobile
layout: tapping the now-playing info opens the full-screen player,
alongside a large primary play/pause button and the queue button
(desktop layout, with its Volume/shuffle/repeat/prev/next controls,
is unchanged). `shouldShowConnectedStatusBar` simplified to drop the
now-dead `isMobile`/`isPlaying` params.

Mobile queue button now opens a full-screen sheet (new `fullScreen`
prop on `MobileDrawer`) with `SidebarQueuePanel` — reusing `QueuePanel`'s
existing `currentItemId` highlight — instead of the narrow side-drawer
tabbed `RightRailPanel`.

Not verified live in a real mobile browser this session (Chrome
extension wasn't connected) — validated via `tsc --noEmit`, `eslint`,
and the existing `vitest` suite only. Worth a manual phone/DevTools
pass before shipping.

## 2026-09-06 — CatalogView invisible-title / support-widget items investigated

Two sub-asks folded from `queued-ux-fixes-2026-09-05.md`'s "CatalogView"
item (no such file/view exists in this repo or the sibling `tahti-org`
repo checked out at `../tahti-org`; closest match is the "Catalog" tab
inside `ArtistView.tsx`/`ChannelView.tsx`).

- **Support widgets showing before tiers configured — not a bug.**
  `../tahti-org`'s public-profile route already filters `fanTiers`/
  `purchaseTiers` to `where: { active: true }` server-side
  (`apps/api/src/routes/profile/public.ts:224-233`), so a disabled tier
  never reaches the client. `ArtistView.tsx`'s `fanTiers.length > 0`
  gates are already correct given that contract.
- **Invisible artist title — real bug, fixed.** `normalizeColorScheme`
  (`lib/colorScheme.ts`) filled `bg`/`text` independently from a shared
  fallback; a custom scheme setting only `bg` (no `text` override) kept
  falling back to white text regardless of how light the custom `bg`
  was. Added a luminance check so an unset `text` now picks black/white
  based on the actual custom `bg`'s brightness instead of always
  defaulting to white. New `colorScheme.test.ts`.

## 2026-09-06 — Stream Manager replace-rotation wipe

Folded from `stream-manager-rotation-replace-wipe.md`.

Stream Manager "Replace rotation" cleared every 24/7 fallback before
adding playlist tracks. Empty / release-only / embed-only playlists, or
a failed add, left the live rotation empty. Adds now run first; old
fallbacks are removed only after every add succeeds; programme state
refreshes after apply. Shipped in tahti-web 0.0.85.

---

## 2026-09-05 — CI snapshot digest + PR #2/#3

Folded from `ci-snapshot-digest.md` and `pr2-merge-ready.md`.

- Vitest snapshot digest reporter, Playwright PNGs, sticky PR comment,
  CI/coverage artifacts (`<!-- tahti-snapshot-digest -->`). Shipped in
  PR #3 (`perf/audit`), merged to master.
- PR #2 (`feat/studio-subtabs-help-layer`) merge-ready work completed and
  merged earlier the same day.

---

## 2026-09-05 — Channel Designer background + playlists

Folded from `channel-designer-background-playlists.md`.

Layers Background row + page color; shorter presets; removed Tune-in
actions and page Text overlay block. Add playlist from Studio library
(multi); Look settings choose playlist + Tracklist vs Cards display.
Shipped in tahti-web 0.0.78.

---

## 2026-09-05 — Studio Stats charts + subtabs help layer

Folded from `studio-stats-storybook-charts.md` and `studio-subtabs-help-layer.md`.

- Stats: compact map + DayOfWeekChart/CalendarHeatmap, ListeningClock day
  modal, Today/Custom ranges, TopList engagement units.
- Subtabs sit under Studio/Admin/Listen nav; header blurbs moved to Help.
- Sibling API: today/custom/hourly plays ([tahti-org#438](https://github.com/janiluuk/tahti-org/pull/438)).

---

## 2026-09-05 — Registry runtime: Last.fm scrobble

Folded from `docs/todo/registry-runtime-lastfm.md`.

Second SCROBBLE provider: Last.fm OAuth start/callback → session key +
`track.scrobble` after recorded listen-events. Nuclear Add-ons → Scrobbling
beside ListenBrainz. Needs `LASTFM_API_KEY` / `LASTFM_API_SECRET` on API.

---

## 2026-09-05 — Expired todo fold (UI sweeps)

Folded and deleted short-lived todos that already shipped or live in
worklogs:

- `beta-channel-detection-and-nav-cleanup.md` — StudioGate channel scope /
  nav cleanup (see earlier HISTORY + StudioGate work)
- `cardgrid-listen-discover.md` — DirectoryArtistCardGrid parity
- `media-artwork-thumbnails.md` — MediaArtwork thumb migration
- `news-widget-rss.md` — News widget RSS plan (not blocking; details in
  worklog if revisited)
- `settings-themes-compact.md` — Themes compact + footer
- `status-bar-idle.md` — BottomBar status when player hidden
- `toplist-storybook-sweep.md` — TopList on admin/studio rankings
- `viewshell-next-15.md` — ViewShell batches C–E notes

---

## 2026-09-05 — Registry runtime: ListenBrainz scrobble

Folded from `docs/todo/registry-runtime-listenbrainz.md`.

First Nuclear registry runtime slice among the backend-blocked set:
ListenBrainz **submit-listens** (not charts). Sibling integrations
`SCROBBLE` + validate-token on install + fire-and-forget scrobble after
recorded listen-events. Nuclear Add-ons → Scrobbling.

Documented in `packages/tahti-web/docs/PLUGIN-INTEGRATIONS.md`,
`PLUGINS.md`, `src/plugins/scrobble/README.md`, Help catalog, and
`packages/docs/plugins/tahti-web-authoring.md`. Remaining blockers:
bandcamp/deezer/listenbrainz dashboards, omnisource, youtube-liked-songs-sync.

---

## 2026-09-05 — Favorites page + Discover artists

Favorites is `/favorites` (standalone ViewShell). `/listen/favorites` and
`/library/favorites` redirect. Artist browse (search / active / type /
genres) is Discover → Artists (`DirectoryArtistsBrowser`); removed from
Listen home.


## 2026-09-04 — Look extras API source of truth

Sibling tahti-org#435 merged + prod migrated. Nuclear designer/artist/channel
prefer live look-extras; localStorage is cache-only (`mergeLookExtrasPreferApi`).
Channel Links/Text overlay save PATCHes visual (+ text-layer).

## 2026-09-04 — StudioGate channel scope + look-extras cache

### StudioGate: only require channel where needed

Catalog and tool Studio pages use `requireChannel={false}` so a missing
`user.channel` does not block Sounds, Library tools, editor, insights,
moderation, venues, etc. Channel-bound surfaces keep the default:
Branding, Schedule, Events, Go live, Shows, Upload, Updates.

### Look extras: API source of truth, localStorage cache

`mergeLookExtrasPreferApi` / `resolveChannelLookExtras` — live visual /
public channel fields win (including `false`/`null`); localStorage only
fills omitted keys. Designer caches only after successful PATCH. Channel
page Links/Text overlay save PATCHes the API.


## 2026-09-04 — Channel Designer artist-page full control

# Channel Designer → artist page full control

**Status:** client wired to look-extras API (2026-09-04). Sibling
`feat/channel-look-extras` adds Prisma columns + PATCH/GET; Nuclear sends
look extras on `/api/me/channel/visual` and normalizes `channelLinksJson`.

## Done on artist page (`ArtistView`)

- Header: `headerStyle` (GRADIENT/SOLID/VIDEO_LOOP), `videoBackgroundUrl`,
  color scheme, visualizer preset + `visualSettingsJson` via
  `EntitySocialHeader`
- Player stage: separate player gradient when enabled, visualizer preset /
  settings, `NowPlayingOverlay`, player text overlay
- Page: background palette + ambient `backgroundVisualPreset` visualizer
- Look extras reload after Channel Designer save
- Designer: background visualizer preset picker (Backdrop)

## Done on channel page (`ChannelView`)

- Player vs header color schemes when `usePlayerGradient`
- Page background palette + ambient background visualizer
- Hero uses `visualSettingsJson` when present (else radio default tuning)

## Remaining

1. ~~**Merge sibling [tahti-org#435](https://github.com/janiluuk/tahti-org/pull/435)**~~ — merged + prod deployed (migration live). Nuclear client `0.0.71+` already PATCHes look extras; localStorage remains a cache.
2. **`textOverlay*` ↔ `textLayer*`** — still a separate text-layer PATCH;
   naming mismatch is intentional (designer vs API).
3. E2E parity still targets `/channel/` more than `/u/:username` (spec exists:
   `e2e/channel-designer-artist-look.spec.ts`).

## Files

- `EntitySocialHeader.tsx`, `ArtistView.tsx`, `ChannelView.tsx`,
  `ChannelBackdropCard.tsx`, `ChannelDesigner.tsx`, `channel-design.ts`
- Storybook: EntitySocialHeader GRADIENT story


## 2026-09-04 — Fan-sub + track purchase e2e (mock Vite)

Playwright `e2e/fan-sub-and-track-purchase.spec.ts` green under
`VITE_FORCE_MOCK=1`. Mock commerce ledger (`mock-commerce-ledger.ts`) records
fan-sub activate + à la carte purchase tiers; Track detail shows Buy when
`accessMode=PURCHASE`; Audience/admin audit read the ledger; IndexedDB keeps
upload blobs across reload. Live Stripe path still separate.

Shipped on nuclear master (`bc1283993` … `36d44f30e`). Sibling purchase-tier
APIs already existed.

## 2026-09-04 — Icon Tooltip pass 4 (Admin + PluginStore)

Wrapped PluginStorePanel, AdminStreamManager, Storage, AGM, Disco widgets,
Missed shows, Selects, User edit, SettingsPanels add-on/theme icons,
Financial/Grants/I18n/StorageUser, PinnedAnnouncements, DiscordBotAddonCard.
Sweep marked done in `icon-button-tooltips.md` pending a residual scan.

## 2026-09-04 — Icon Tooltip pass 3 (Studio)

Wrapped Studio ProEditor, CollectionEdit, ChannelDesigner, Studio list/detail
views, channel panels, TrackEdit/StreamManager/Gallery/Stash, and related
editors. Admin + PluginStore remain in `icon-button-tooltips.md`.

## 2026-09-04 — Tabs Storybook migration (icons + count pills)

Canonical `@tahti-player/ui` `Tabs` + `TabLabel` (`icon`, `count` Badge pill).
Storybook `Layout/Tabs`: With icons, With count pills, Icons + count pills,
Vertical icon-only. App tab strips migrated across Listen/Studio/Admin/player;
Settings **nav** stays `SettingsPanel`. Collapsed right rail uses vertical
icon-only `Tabs` (kept the post-login notification `useMemo` fix).

Shipped in commit on master; Storybook + beta redeployed.

## 2026-09-04 — Entity social header + Admin/Studio KPI restore

Nuclear-style `EntitySocialHeader` on public Artist, Collection, Channel
(when designer hero off), Radio show, Venue, Smart link/release, Subscribe.
Track listen page stays immersive player.

Admin/Studio dashboard KPIs restored to large `StatNumber` panels (not
`StatChip`). StatChip remains only inside EntitySocialHeader and Stream
Manager live status cells.

Storybook: `Tahti/Page/EntitySocialHeader`.

## 2026-09-04 — Listing thumbnail ImageReveal sweep

Listing covers (rows, widget cards, directory tiles, news, radio logos,
add-on store rows) use Storybook `ImageReveal`. Playable row thumbs stay
on `MediaArtwork`. Left as-is: upload/edit pickers, channel designer,
entity heroes, fullscreen player, map atlas, comment avatars, video backdrops.

Details: `packages/tahti-web/UI-REDESIGN-WORKLOG.md`.

## 2026-09-04 — Fixed: post-login infinite-loop crash (React #185)

Root cause found and fixed. `RightRailPanel` selected from
`useNotificationInboxStore` with an inline `.filter()`:
`useNotificationInboxStore((s) => s.items.filter((item) => !item.readAt))`.
That returns a new array reference on every call, which trips React 18's
"the result of getSnapshot should be cached" infinite-render-loop guard
the instant `RightRailPanel` mounts — i.e. on every real login, since the
right rail only renders once `userId` is set. `VITE_FORCE_MOCK=1` never
reproduced it locally because nothing about the mock path was different —
the loop fires purely from mounting authenticated, not from any real-vs-mock
data shape.

Fix: select the raw `items` array (stable reference, only changes on the
store's own `set()`) and derive the filtered list with `useMemo` instead of
inside the selector.

Confirmed via a live repro against beta.tahti.live: logged in with a real
account through a Playwright session with real cookies, using route
interception to swap the served JS bundle for a local unminified
(`--mode development --minify false`) build of the same commit while
leaving `/tahti-api/*` calls hitting the real API untouched — this got a
real dev-mode React warning with a component name and stack
(`Warning: The result of getSnapshot should be cached... at RightRailPanel`)
without needing sourcemaps, a hosts-file domain spoof, or CORS changes.
Confirmed the fix by rebuilding the same way and re-running the repro: no
crash, onboarding renders normally post-login.

Grepped for the same inline-`.filter()/.map()`-in-selector pattern
elsewhere in tahti-web/ui/player — no other instances found.

## 2026-09-04 — ViewShell round 4: remaining Studio + all of Admin (27 views, 3 batches)

Closed out nearly all of docs/todo/viewshell-page-headers.md's remaining
`StudioPageHeader` → `ViewShell` backlog in three ~10-view batches, each
verified (`type-check`, `lint`, full `test` suite — 427 tests) and pushed
separately.

**Batch 1 (Studio, plain headers only):** StudioGovernanceView,
StudioModerationView (embedded-mode header extracted into a `content`
const so embedded skips ViewShell without duplicating ~200 lines),
StudioMasteringView, StudioStripeView, StudioTrackInsightsView,
StudioEventCreateView, StudioBrandingView, StudioDistributionView,
StudioEditorProjectView, StudioStatsDetailView.

**Batch 2 (Admin, first 10):** AdminActivityView, AdminAgmView,
AdminArtworkPresetsView, AdminDiscoWidgetsView, AdminFinancialView,
AdminGovernanceView, AdminGrantCycleView, AdminGrantsView, AdminI18nView,
AdminLogsView.

**Batch 3 (Admin, remaining 7) + 1 extra:** AdminRadioView,
AdminReportsView, AdminStorageUserView, AdminStorageView,
AdminVendorsView (its `AdminVendorsContent`, used both standalone and as
dashboard tab content), AdminVenuesView, `admin/moderation/
AdminModerationView`, plus `LibrarySmartLinksView` (found during the
final backlog-accuracy pass — missed by the original per-directory
triage since it lives directly under `views/`, not `views/studio/`).

Every conversion: `action` prop content moved to `ViewShell` children
(back-links first per the doc's own rule), `classes={{ root: 'px-0
pt-0' }}`, `StudioNav`/`AdminPageLayout` tabs stay outside. Left alone,
per the doc's own cover-image-overlay carve-out: StudioSoundView,
StudioReleaseDetailView, StudioShowDetailView, StudioCollectionEditView
(all four are entity-detail pages with the header text overlaid on cover
art, not a title/subtitle block) and StudioProEditorView (the doc flags
its maximized-vs-non-maximized chrome as needing verification before
swapping — deferred rather than guessed at). Cross-checked AdminNewsView/
AdminAnnouncementsView/AdminTopListsView/AdminOrphanPagesView — already
`ViewShell` from other concurrent work, nothing to do there.

Updated docs/todo/viewshell-page-headers.md's own checklist (Studio/Admin
sections, Order of work) to match — it had drifted behind several rounds
of incremental progress from other sessions.

## 2026-09-04 — ViewShell round 3: Transparency sub-pages + Revenue/Editor

Chat, MoreView, and TransparencyView turned out already converted by another
session. Converted the two still-open Transparency sub-pages
(`TransparencyMethodologyView`, `TransparencyGrantYearView`) — closes the
listener bucket. Extended into Studio (checked Stash/Recordings/Events/
Channel first — all four already done): converted `StudioRevenueView` and
`StudioEditorListView`. Screenshot-verified all 4 in the browser.

## 2026-09-04 — ViewShell rounds 1-2 (legal/governance/venues, onboarding/green room/subscribe)

Round 1: `LegalDocShell` (covers every legal page), `PublicGovernanceHistoryView`,
`VenueRegisterView`. Round 2: `OnboardingView`, `GreenRoomView` (all 8 return
branches), `SubscribeView`. Remaining listener items: Chat, More/map,
Transparency (+ methodology/grant-year).

## 2026-09-04 — ViewShell batches (next 5 + next 5-b)

Listener/Studio/Admin hubs migrated to ViewShell: Help, Radio, Studio Sounds,
Collections, Admin Dashboard (`viewshell-next-5.md`); then History, Radio
schedule, Studio Broadcast (Schedule), Go Live, Releases (`viewshell-next-5-b.md`).
Follow-on: Feed through Library in `viewshell-next-10.md`.

## 2026-09-04 — Icon Tooltip pass 2 (listener + UI leftovers)

Wrapped Collection/Artist/Channel/Radio/Schedule/Show, TrackDetail, Library,
Discography, MyCollections, Listen widgets/addons/NewsFeed, WidgetCard,
ImageLightbox, RadioBookingCalendar, ScheduleDialog; plus UI QueueItem,
TopBarNavigation, TahtiJam, HistoryRow, LogDateRangeFilter, PlayerWorkspace
sidebar, SettingsPanel back. ViewShell also landed on Help / Radio /
Studio Sounds+Collections / Admin Dashboard. Studio + Admin tooltips remain
in `icon-button-tooltips.md`.

## 2026-09-04 — Icon Tooltip pass 1 (UI + chrome + hubs)

Wrapped icon-only controls in Storybook `Tooltip` (kept `aria-label`):
DialogXClose, Pagination, PluginItem, PlayerBar transport/mute, MediaArtwork,
TrackTable Actions/Remove, NewsWidget + CardsRow chevrons; ConnectedPlayerBar,
FullScreenPlayer, MobileChrome, RightRail, GlobalSearch, SidebarQueuePanel,
Listen / Discover / Feed. Listen also moved onto ViewShell. Remaining Studio /
Admin / deep listener views still listed in `icon-button-tooltips.md`.

## 2026-09-04 — TrackContextMenu sweep complete

Checked queue (`ConnectedQueuePanel`/`SidebarQueuePanel`), history
(`HistoryListSection`/`HistoryView`), and feed (`FeedView`) for hand-rolled
context menus — none exist; those surfaces use inline icon buttons or card
click affordances, not row overflow menus, so there is nothing to migrate.
Sound-detail (`StudioSoundView`) Quick edits popover swapped from generic
`Popover`/`Popover.Item` to `TrackContextMenu` (Header + Action), matching
`StudioSoundRowMenu`'s pattern on the Sounds list. Added `disabled` support
to `TrackContextMenuAction` (Radix `data-[disabled]` styling) since the
generic `Popover.Item` had it and Quick edits needs it while an operation
is in flight.

## 2026-09-04 — SaveButton + StatChip sweep (0.0.57)

Persist-edit controls use Storybook `SaveButton` (custom labels, Saving/Disabled). Create/publish stay `Button`. Studio Sound toolbar left icon-only. Disabled story added.

`StatChip` now covers artist/channel followers, Studio home/stats/channel/schedule counts, track insights, fan-sub summary, admin dashboard/content KPIs, stream manager cells, admin user followers, and storage used/free/total. Chart-header totals and grant money stay `StatNumber`.

## 2026-09-03 — Playerbar/sidebar queue, revision picker, NewsWidget

Playerbar queue uses `QueueItem` (current expanded, others collapsed) plus
a count `Badge` and shared clear confirm. Sidebar Queue tab wires
`QueuePanel` with reorder, title→track, like, save-as-playlist, and
one-shot shuffle. `QueueItemPopover` is stream candidates, not archive
revisions — `AudioRevisionList` stays. `NewsWidget` is Storybook-only until
a news endpoint exists.

## 2026-09-03 — Storybook history/stats audit

Shared HistoryCharts primitives already match production. Added in-context
`HistoryStatsSection` and `HistoryListSection` stories. `StatChip` vs
`StatNumber` are different jobs (not a swap). `TrackTable` unused in
tahti-web at audit time.

## 2026-09-03 — CopyButton / ImageReveal / FilterChips audit

CopyButton gained 10s feedback and optional toast; truncated copy fields
made scrollable. Discover widget images use `ImageReveal`. FilterChips
already correct on Listen/Discover listings. Remaining grid-shaped `<img>`
candidates: `MyDiscographyView`, `LibraryMediaView`, `LibrarySmartLinksView`,
`StudioCollectionsView`.

## 2026-09-03 — CardsRow / Combobox audit

No safe CardsRow swap in tahti-web (per-item overlay controls would drop).
Added `TahtiRadioRow` story. Genre multi-select already `FilterChips` +
`CreatableCombobox`.

## 2026-09-03 — LogViewer / crowded artwork / DropdownButton

LogViewer: date-range popover, entry modal, Recent audit tab on LogViewer.
MediaArtwork hides queue/favorite overlays at sm/thumb/md. New
`DropdownButton`; Channel Designer More menu (Save preset / Reset).

## 2026-09-03 — Storybook-first ten slices (0.0.51)

# Storybook-first UI — ten slices (0.0.51)

Keep live data/features. Swap only Storybook primitives. Flag missing
states and orphans on stories.

## Instructions (this pass)

- Root `AGENTS.md` Storybook-first UI
- `packages/tahti-web/AGENTS.md` design-system order
- `.agents/skills/creating-components/SKILL.md`
- `.cursor/rules/storybook-first-ui.mdc`

## Slices

1. ChannelView editing Play/Favorite mock pills → `Badge`
2. Collection edit slideshow count → `Badge`
3. Player bar queue count → `Badge`
4. ImageLightbox photo → `ImageReveal`
5. Library media thumbs → `ImageReveal`; type overlay → `Badge`
6. Discography thumbs → `ImageReveal`
7. Smart links thumbs → `ImageReveal`; empty → `EmptyState`
8. Studio collections thumbs → `ImageReveal`; empty/filter miss → `EmptyState`
9. Global search thumbs → `ImageReveal`; searching → `Loader`; no results → `EmptyState`
10. Storybook: CardsRow orphan-in-tahti-web flag; Combobox missing states; ImageLightbox empty flagged

## 2026-09-04 — Add-on store header + ThemeStoreItem

# Add-on store header + UX sweep

## Goal

1. Remove always-visible category header subtext in Settings → Add-ons.
2. Keep the info (i) control on every category — it reveals the same
   description in a `Box` note.
3. Sweep add-on listings/config panels toward Storybook / `@tahti-player/ui`
   primitives (`PluginStoreItem`, `ThemeStoreItem`, `Box`, `EmptyState`,
   `Toggle`, `Tabs`, `PluginItem`, `Input`, …).

## Verify (category info icons) — done

All categories render through `CategoryBody` in `PluginStorePanel.tsx`, which
mounts an `About {label}` info button + expandable note for every
`PLUGIN_CATEGORIES` entry (themes, visualizers, export, import, multicast,
fingerprinting, audio-plugins, radio, listen, discovery, channel).

Top-level Add-ons section in `SettingsPanels` also uses an info button for
`SETTINGS_NAV` description (no always-visible subtext).

Discover page widgets subsection uses the same info pattern.

## Changes

- [x] Drop always-visible `{category.description}` beside the info button.
- [x] Hide Settings-level Add-ons description behind info.
- [x] Themes category uses `ThemeStoreItem` (apply / active / remove custom).
- [x] `ThemeStoreItem` only shows apply/uninstall when those callbacks exist.
- [x] Empty gates → `EmptyState`; visualizer/radio shells → `Box`; audio rows
      → `PluginItem` + `Toggle`; Installed/Available empties → `EmptyState`.
- [x] Disco widget installs → `PluginItem`; search → Nuclear `Input`; empties
      → `EmptyState`.

## 2026-09-05 — Bulk fold (agent-docs-audit)

Folded 28 completed `docs/todo/` files into history. Active open work lives in `docs/todo/INDEX.md`.

### Audio plugins/add-ons: Reference Match rename, icon toggle, access tier

Folded from `audio-plugins-relabel-and-access-tier.md`.

Status at fold: done (2026-09-05).

## What shipped

`packages/tahti-web/src/content/pluginStoreCategories.ts`:
- Category `audio-plugins`'s `label` renamed "Audio plugins" → "Audio tools".

`packages/tahti-web/src/components/PluginStorePanel.tsx`:
- The "Mastering (reference matching)" row is now named "Reference
  Match" with `author="Pro Editor"` (previously "Client-side · always
  available"), matching how the actual Pro Editor DSP chain plugins
  listed right below it already show `author="Pro Editor"` — the
  in-code comment there had explicitly called out these as two

---

### Channel Designer → artist page full control

Folded from `channel-designer-artist-full.md`.

Status at fold: done for look-extras persistence (2026-09-04). Sibling

[tahti-org#435](https://github.com/janiluuk/tahti-org/pull/435) merged +
prod migrated. Nuclear prefers live API fields; localStorage is cache-only.

---

### Channel Designer: gallery "+" tile replaces always-visible drop zone

Folded from `channel-designer-gallery-plus-tile.md`.

Status at fold: done (2026-09-05). Most of what was asked already existed.

## What was already there

Investigated `ChannelDesigner.tsx`'s gallery/slideshow section before
touching anything: **hover-reveal delete** (`Trash2Icon`, opacity-0 →
opacity-100 on `group-hover`) and **drag-and-drop reordering**
(`draggable`, `onDragStart`/`onDragOver`/`onDrop`,
`reorderGalleryImage`) were both already fully implemented on each
thumbnail. Only two things were missing from the request: a compact
"+" tile (there was instead an always-visible, full-width `FilePicker`
drop zone above the grid) and a modal for adding images (the picker was

---

### Channel designer menu rebuild

Folded from `channel-designer-menu-rebuild.md`.

Status at fold: shipping with Storybook Backdrop primitives (0.0.80).

## Problem

Header style tabs (Gradient / Solid / Video / Slideshow) always showed the
same color preset block; switching tabs felt broken. Panel scrolled with the
page and needed internal scrolling just to navigate chrome.

---

### Channel Designer: right panel height was covering Save/Reset

Folded from `channel-designer-panel-height-fix.md`.

Status at fold: done (2026-09-05), not manually verified live — see caveat.

## Root cause

`ChannelDesigner.tsx` is used in two structurally different contexts:

1. **`lookOnly`** — embedded inside `ChannelLayersMenu`'s fixed-height
   floating sidebar (`ChannelView.tsx`'s inline `?edit=true` editor).
   This is a well-formed flex chain (`aside h-full` →
   `div flex-1 min-h-0` → `div h-full min-h-0`) where `h-full` on the
   inner `ChannelElementEditor` correctly fills the available space and
   scrolls internally — this path has no Save/Reset row at all (that
   lives in `ChannelView.tsx`'s own "Save changes"/"Done" buttons

---

### Channel Designer: restore the previous save

Folded from `channel-designer-save-restore.md`.

Status at fold: done (2026-09-05).

## What shipped

`ChannelDesigner.tsx`'s "Save layout" (non-`lookOnly` mode) now tracks
what's currently live vs. what was live one save ago, so an artist can
undo their most recent save:

- Added `LookSnapshot`, a type capturing every field `save()` actually
  persists: `visual`, `scheme`, `playerScheme`, `backgroundScheme`,
  `visualSettings`, `galleryMode`, `galleryImages`, `videoBackgroundUrl`,
  the four `slideshow*` fields, `overlaySettings`, `previewPreset` — the
  exact same set `applyPreset` already fully re-applies when switching

---

### Channel Designer → Storybook elements

Folded from `channel-designer-storybook-elements.md`.

Status at fold: correction order complete — every listed element extracted and wired.

## Goal

Review and fix Channel Designer UI **one element at a time** in Storybook
(`Tahti/Channel/Designer/*`), without needing the full channel edit chrome.

---

### Channel Design crash + `edit=%221%22` URL

Folded from `channel-edit-hooks-url.md`.

Status at fold: shipped in tahti-web 0.0.77.

## Symptoms

- Clicking Design channel / Edit design opens
  `https://beta.tahti.live/channel/<slug>?edit=%221%22` and shows
  "Something went wrong".
- Channel page can crash after load for the same reason even without edit.

---

### ChannelView: Stream Manager modal replaces Overview/Manage tabs

Folded from `channelview-stream-manager-modal-replaces-tabs.md`.

Status at fold: done (2026-09-05).

## What shipped

`ChannelView.tsx` previously wrapped the owner/admin's channel page in a
top-level `Tabs.Root` ("Overview" / "Manage") — switching to "Manage"
replaced the entire page body with a "Command center"/"Stream manager"
section rendering `StreamManagerPanel` inline, `defaultExpanded`. This
was also the same tab strip flagged as unclear in an earlier session
pass (`docs/todo/channelview-badge-dedup-and-share-modal.md`'s "move the
player above the tabs" item) — this task supersedes that with an
explicit, unambiguous instruction instead: drop the tabs, add a Stream

---

### hearthis.at set embeds + "browse my sets" picker

Folded from `hearthis-set-embed-and-browser.md`.

Status at fold: done (2026-09-05).

## Background

Two user reports:
1. Pasting a hearthis.at **set** page URL (e.g.
   `https://hearthis.at/yaniho/set/recorded-sets-from-gigs/`) into the
   Listen "hearthis.at" add-on failed — `toEmbedUrl` only recognized a bare
   numeric track id or a `hearthis.at/embed/<id>/` URL, and set embeds use
   a different, token-bearing shape (`hearthis.at/set/<id>-<user>/embed/<token>/`)
   that isn't derivable from the page URL alone.
2. Feature request: once a hearthis.at username is entered, list that
   user's sets so they can be added with one click instead of manually

---

### Icon-button Tooltip sweep

Folded from `icon-button-tooltips.md`.

Status at fold: done for listed surfaces (2026-09-04). Re-scan before claiming absolute 0.

**Storybook:** `Components/Tooltip` → `SidebarIcons`.

Every icon-only control must use Storybook `Tooltip` for the hover/focus label. Keep `aria-label` for assistive tech. Do not treat native `title=` as the tooltip.

```tsx
<Tooltip content="Configure visualizer" side="top">
  <Button size="icon-sm" aria-label="Configure visualizer">
    <SettingsIcon size={15} aria-hidden />
  </Button>
</Tooltip>
```

---

### Library page showed Studio's submenu instead of its own tabs

Folded from `library-nav-showing-studio-submenu.md`.

Status at fold: done (2026-09-05).

## Root cause

Earlier today (commit `83163e200`, "Favorites: drop redundant Listen
tab; Library: back to main sidebar" — from an earlier session on this
same branch), Library was deliberately moved back to being its own
top-level sidebar destination, and its entries (`/library`,
`/library/sounds`, `/library/collections`, `/library/upload`) were
removed from `StudioNav.tsx`'s `SUBMENUS['/studio']` array — the commit
message explains "LibraryView already has its own internal tab strip
..., same shape as Listen or Studio, so it doesn't need to live inside

---

### Multistream "add destination": unify on the real configure dialog

Folded from `multicast-configure-dialog-unification.md`.

Status at fold: done (2026-09-05).

## Background

Report: Go Live's "Add destination" modal (`MulticastDestinationForm.tsx`)
was "unusable" — a cramped single-row layout with a raw `Select` dropdown
for provider, no address/port split for Custom RTMP, no ingest-server
hint, no enabled toggle, no save/error state (the `busy` prop it declared
was never even passed from its one caller). A much better version already
existed as `MulticastConfigureDialog` (local to `PluginStorePanel.tsx`,
backing Settings → Add-ons → Multistream): per-provider dialog with a

---

### Player bar queue → right rail + waveform seek

Folded from `playerbar-queue-right-rail.md`.

Status at fold: done (2026-09-04). BottomQueueStrip deleted.

- [x] `layoutStore.rightRailTab` + `toggleQueueRail`
- [x] `RightRailPanel` uses shared tab
- [x] `Tahti/Player/WaveformSeekbar` Storybook story
- [x] Wire player-bar queue button → `toggleQueueRail` (drop BottomQueueStrip)
- [x] Compact queue viewport + past-item fade
- [x] Swap seek to WaveformSeekbar; title/artist clicks
- [x] Signed-out/mobile queue popover

Full plan below.

---

Worklog: `packages/tahti-web/UI-REDESIGN-WORKLOG.md`
(2026-09-04 — Player bar queue on the right rail).

WORKPLAN: medium-priority Storybook backlog.

---

### Radio Browser directory → Add-ons store parity

Folded from `radio-browser-addon-store.md`.

Status at fold: executed. Shell + Browser tab, Stations Save → Listen, and the

Playwright smoke test (`e2e/plugin-store.spec.ts`, 2026-09-04) are all done.

Executed:
1. ConfigurableCard + Configure dialog (no inline dump on Activate)
2. Tabs Browser | Stations
3. Browser: Input startAddon SearchIcon, FilterChips multi-genre, flag Select
4. `searchStations` `tags` → `tagList`
5. Stations: favourites + Finnish suggestions

SaveButton → Listen tiles executed; Playwright smoke still open.

Details: worklog / WORKPLAN.

---

### Finnish catalog → Radio Browser Stations

Folded from `radio-finnish-into-browser.md`.

Status at fold: done (2026-09-04). Curated `RADIO_STATIONS` live under Radio

Browser → Stations; Installed/Available PluginStoreItem list removed;
`radio-cover` e2e uses Activate → Configure → Stations.

---

### RadioView: hero station play icon didn't reflect actual playback state

Folded from `radio-view-play-state-icon.md`.

Status at fold: done (2026-09-05).

## What shipped

`RadioView.tsx`'s "Tahti Radio" hero card used `MediaIconActions` with a
hardcoded `PlayIcon` and a `playStation` handler that always called
`play()` on a freshly-fetched playable, regardless of whether the
station was already the one currently playing — clicking it while
playing would just re-trigger playback instead of pausing, and the icon
never switched to a pause state. `ListenView.tsx`'s own separate Tahti
Radio card (a different render higher up on the Listen page) already
had this wired correctly, so that one was the reference pattern:

---

### Remove About from Settings footer

Folded from `settings-remove-about.md`.

Executed: About link removed from Settings modal footer. `/about` and Help
About remain. Storybook DeploymentFooter docs updated.

Details: `packages/tahti-web/UI-REDESIGN-WORKLOG.md`

---

### Show creation flow: what already existed vs. what was missing

Folded from `show-creation-flow-audit.md`.

Status at fold: done (2026-09-05). Most of the requested feature was already

built; only the auto-fill was actually missing.

---

### Show info form: dropdowns, layout, status button

Folded from `show-info-form-dropdowns-and-status-button.md`.

Status at fold: done (2026-09-05), with one interpretation call flagged below.

## What shipped

`BroadcastPreflightPanel.tsx`:
- `showType` and `visibility` were hand-rolled radio-button "segmented
  control" `fieldset`s (`role="radiogroup"`, `sr-only` radio inputs).
  Replaced both with the shared `Select` component, same 2-column grid
  they were already in.
- Show name and Tagline are now on the same row (`grid-cols-2`). Tagline
  used to be conditionally shown only when `episodeNumber !== null`
  (i.e. only for series episodes) — it's now always visible, since
  pairing it with Show name on one row only makes sense if both are

---

### Stream Manager: header/status cleanup + overlay-in-modal

Folded from `stream-manager-header-and-overlay-modal.md`.

Status at fold: done (2026-09-05), with some interpretation calls flagged below

— re-check against what the user actually pictured before considering
this fully closed.

---

### Stream overlay: cover upload UX fix + "show title" toggle + preview

Folded from `stream-overlay-cover-upload-and-title-toggle.md`.

Status at fold: done (2026-09-05).

## Background

Three user reports about `StreamOverlayEditor.tsx` (Manage → Multicast →
Overlay, and Go Live's Stream Manager Overlay tab):

1. Uploading a cover image showed "an empty thumbnail" — the component
   used a bare `FilePicker` dropzone (always visible, no ready
   placeholder) plus a conditional raw `<img>` above it, not the app's
   established upload-slot convention (see
   `packages/tahti-web/WORKPLAN.md`'s media-upload-convention entry).
2. Feature request: a "Show overlay title" toggle, default off, gating

---

### Studio hearthis playable path

Folded from `studio-hearthis-playable.md`.

Status at fold: done (2026-09-04).

Studio/Library play paths use `playableFromStudioHearthis` so HEARTHIS
embeds never use `fetchEditorSource` DEMO_MP3 or hotlinked `streamUrl`.
Shared helper: `packages/tahti-web/src/lib/embedPlayback.ts`.

---

### Top-nav: rotation dot fix + Stream Manager quick-access icon

Folded from `top-nav-broadcast-rotation-and-stream-manager-icon.md`.

Status at fold: done (2026-09-05).

## Bug found and fixed

`AppTopNav.tsx`'s collapsed broadcast icon computed `hasConnectionIssue`
as `user?.channel?.state === 'LIVE' && !broadcast.signalConnected` and
rendered it as a **red pulsing error** state. But per
`resolveBroadcastPresence` (`lib/broadcastPresence.ts`), a channel's DB
`state` reads `'LIVE'` both for a genuine live broadcast *and* for the
24/7 fallback rotation carrying the channel — only `signalConnected &&
state === 'LIVE'` is a real broadcast. So `hasConnectionIssue` was
mathematically identical to `broadcast.kind === 'rotation'`: the normal,

---

### ViewShell listener batch (Chat → Transparency)

Folded from `viewshell-listener-5.md`.

Status at fold: done.

**Date:** 2026-09-04

Migrated listener hubs from `PageHeader`/`PageFrame` to `ViewShell`:

| Page | Title | Subtitle |
| --- | --- | --- |
| Chat (picker) | Chat | Pick a channel to open chat. |
| Chat (slug) | Chat | `{slug}` |
| Governance | Governance | Vote on cooperative motions. |
| Feature requests | Feature requests | Propose and vote on what Tahti builds. |
| More | Tahti map | Screens, flows, and feature parity. |
| Transparency | Transparency | Public co-op ledger. |

Back/actions/meta moved into children. `embedded` Governance / Feature

---

### ViewShell batch — next 10 (2026-09-04)

Folded from `viewshell-next-10.md`.

Status at fold: done.

**Deploy:** push + `pnpm deploy:tahti-storybook` (or `gh workflow run "Deploy storybook"`) so storybook.tahti.live matches current stories.

1. Feed — `Feed` / Posts and releases from artists you follow (embedded feed unchanged)
2. Favorites — `Favorites` / Channels, radio, and tracks (embedded unchanged)
3. Account — `Account` / Membership and subscriptions (settings / logout in children)
4. Messages — `Messages` / Direct messages
5. Status — `Status` / Health of Tahti services
6. Studio Home — `Studio` / greeting as subtitle; role badges as children

---

### ViewShell post-batch-B: 3×5 (2026-09-04)

Folded from `viewshell-next-15-rounds.md`.

Status at fold: done (`0.0.61`). Deploy after push.

## Round 1 (`124f932cc` / `0.0.60`)
Feed, Favorites, Account, Messages, Status, Library, Studio Home/Stats/Shows/Playlists/Upload, Admin Users/Streams/Content/Selects/Status.

---

### ViewShell batch C (2026-09-04)

Folded from `viewshell-next-5-c.md`.

Status at fold: done.

1. Feed — `Feed` / Posts and releases from artists you follow
2. Favorites — `Favorites` / Channels, radio, and tracks
3. Studio Home — `Studio` / greeting as subtitle; role badges as children
4. Studio Stats — `Stats` / Audience, plays, and engagement; range chips as children; section Tabs outside
5. Studio Shows — `Shows` / Episodes, slots, and series; New show as child Button + Tooltip

Contract: `ViewShell` from `@tahti-player/ui`; `classes={{ root: 'px-0 pt-0' }}` (+ max-width if needed); StudioNav / section Tabs outside; keep all data/routes/CTAs/dialogs.

---

## 2026-09-05 — WORKPLAN shipped checklist fold

Removed completed `[x]` items from `packages/tahti-web/WORKPLAN.md` so that file stays open-only. Summary of what was stripped:

- One matcher (`src/lib/navigationActive.ts`) for desktop sidebar, mobile drawer, and mobile bottom bar
- Desktop `AppShell` uses the same `SidebarNavItems` as the drawer
- `SidebarNavigationItem` honors explicit `isSelected` for both paint and `aria-current`
- Listen section tabs follow the path (`activeListenTab`); sidebar Listen stays on for Feed/History, Favorites is the sibling chrome item
- Studio submenu maps archive/stash/playlists/insights/mastering/setup-channel/smartlinks onto existing items (no empty subtab row)
- Admin Map is a real Manage item; unmatched admin routes no longer fake-light Overview
- **Plugin integration guide and metadata parity** — documented plugin authoring/API checks, add-on types and current state; centralized visualizer metadata and added registry drift coverage ([docs/P...
- **Tahti Map refresh** — added privileged screenshots for recently ported Studio/Admin/Settings views and documented each screen’s actions and destinations with per-view Mermaid navigation diagrams ...
- **Beta feature-port consolidation** — Radio announcements/pinned announcements, Tahti Radio submissions, Clips, archive/Sounds parity, HEARTHIS shared playback, rotation drag-and-drop/capacity hand...
- Sparse sidebar + Studio/Sources/Library/Channel tabs
- Sources **CardGrid** big service icon tiles + detail pane
- **Settings** Nuclear-style (Themes under Settings; Account demoted)
- Go Live, catalog, upload, schedule, stats
- Profile-integrated channel designer (owner Design tab)
- Studio Channel design / profile / domain
- **Inline channel page design** — `/channel/$slug?edit=1`: presets, side Layers (hide/add), drag reorder; layout localStorage; Look via API
- Editor EQ/comp/limiter + markers + stems
- Newsletter send, DMs, releases, revenue, governance
- **Offline mock session** — auth `/me`, follow set, fan subscribe activate, Sources Connect, Stripe Connect in-app ([MOCKS.md](MOCKS.md))
- **Port checklist** — [FEATURES.md](FEATURES.md)
- **Demock wave 1** — prod builds skip silent mock fallback (`api/mode.ts`); chat WS → `wss://chat.tahti.live`
- **Demock waves 2–3** — Go Live / broadcast + upload/archive live paths (see FEATURES.md)
- **Demock waves 4–5** — fan subscribe + Connect; DMs + governance (see FEATURES.md)
- **Album-based designer** — `/studio/collections`
- **Add-to-playlist** — player bar, Music, tables
- **Visualizations** — ChannelView + analyser
- **Broadcasting wizard** — Connect → Live → Multistream
- **Email verify** — `/verify`
- **Fan-tier editor** — Settings → Money
- **Screen atlas on `/more`** — curated e2e thumbnails + Nuclear routes (`public/map/`, `ScreenAtlas`)
- Full Three.js visualizer presets (ten distinct analyser-reactive scenes, lazy-loaded in the channel hero and ambient page background)
- Stash share access (grant expiring read/download access + revoke)
- Sources OAuth callback-return verification (SoundCloud, Bandcamp, Google Drive, and Mixcloud production redirect shapes land on the matching source result in the SPA)
- Radio slots depth — weekly Tahti Radio and own-channel filters, two-hour selection, show type/notes, green-room links, cancellation, and mobile-safe horizontal schedule grid are implemented.
- **Channel moderator management** — `/studio/moderation` is exposed from Studio Manage, with owner-gated assignment/removal, chat-ban UI, and mock/API coverage for the delegated moderator contract.
- Multitrack timeline + press-kit polish — press-kit gallery and download flows are shipped; editor projects now have a typed, autosaved multitrack timeline with synchronized preview and responsive c...
- **Fan-sub vs track purchase (same original file)** — Playwright `e2e/fan-sub-and-track-purchase.spec.ts` green under mock Vite (`VITE_FORCE_MOCK=1`). Subscriber download and à la carte purchase bot...
- Move Help center and Settings to the bottom of the sidebar (`SectionSidebar`/`SidebarNavigation`), separated from the main nav groups above.
- Any widget with a play icon (Listen widgets, disco-widgets, etc.) should reflect the shared player's actual state — highlighted/active whenever its track is the one currently playing, not just a st...
- **Settings / Branding / Radio IA (first slice)** — Gallery and Channel Designer live only under Studio → Branding; multicast is a Radio subtab; Settings no longer embeds those duplicates.
- Artist-page Channel Designer element list (releases, tracks, latest, feed, news, player, backdrop) and the remaining look-only editor.
- Library as a Studio tab — `/library*` stays, Studio stays selected, mobile bottom nav still has Library.
- **Artist order management** — Studio → Audience (`/studio/revenue`) matches production `/dashboard/revenue` for stats, merged payout history (fan-subs + Revelator royalties), Connect warning, empty...
- Update stale Storybook stories after the navigation redesign: remove the deleted `AppTopNav` `minimal` variant stories and replace the removed Studio tools-panel story with the six-section Studio n...
- Add Storybook coverage for `SectionSidebar`, including active, inactive, no-current-route, deep-route, mobile overflow, and representative Studio/Admin variants.
- `SectionSidebar` now wraps Nuclear's existing `SidebarNavigation` and `SidebarNavigationItem`; explicit route selection is retained for beta deep/query routes.
- Normalize remaining custom page headers against `PageHeader` / `StudioPageHeader`: Collection, Track detail, Studio home, Studio archive detail, More/map, and any later raw `<h1>` findings.
- **Authoring and parity baseline** — added the agent-facing plugin contract, typed add-on settings, explicit sibling-API counterpart metadata, and a runnable example plugin/tutorial. The remaining i...
- **Bandcamp catalog import API** — complete the sibling API's Bandcamp album listing and import endpoint; the beta add-on UI, OAuth connection, release shop-link editor, and Bandcamp brand actions a...
- **Nuclear registry runtime parity (ListenBrainz + Last.fm scrobble)** — integrations `SCROBBLE`: ListenBrainz token install + Last.fm OAuth session + submit-listens / track.scrobble after recorded ...
- **Slice 4 — generic Audio FX chain host** — extracted add/remove/reorder operations and plugin-owned parameter metadata/controls from `StudioProEditorView`, with chain regression coverage.
- **Slice 5 — shared multicast destination form** — share the destination form between Go Live and Settings, keeping provider-specific credentials inside each provider configuration.
- Define and implement an `ExportProvider` only after `../tahti` exposes submit/status/webhook contracts — sibling `GET /api/me/export-plugins` + Nuclear `revelatorExportProvider` (PR tahti-org#433)....
- **Slice 6 — source capability contracts** — split Sources into OAuth, search, and link/tool adapter contracts and route the Add-ons Import host (ex-`SourcesView`) plus Studio Upload through them wi...
- Define the credential/permission lifecycle for a real integrations marketplace — documented in sibling `docs/technical/integration-credential-lifecycle.md` (`/api/me/integrations`).
- **ViewShell page headers:** ordinary chrome pages (listener, Studio, Admin) use Storybook `ViewShell` with a short **title** (page name only) and optional one-line **subtitle**. Header actions / ba...
- **Icon-button Tooltip sweep:** every icon-only `Button` (`size="icon"` / `icon-sm"`) wraps Storybook `Tooltip`; keep `aria-label`. Native `title=` is not enough. Re-scanned 2026-09-05: one systemic...
- **Remove About from Settings footer:** re-verified 2026-09-04 — `ConnectedSettingsModal`'s `navFooter` has GitHub/Discord/API docs/build info only, no About link; no `DeploymentFooter` component ex...
- **Player bar queue on the right rail:** Queue button toggles pressed only — do not grow or swap the compact player bar. Fade the queue in on the right rail (`QueuePanel` / `QueueItem`); if the rail...
- **Listen / Discover CardGrid:** shared `DirectoryArtistCardGrid` on Listen + Discover Artists; WidgetCard / embeds stay non-CardGrid. Details: [UI-REDESIGN-WORKLOG.md](UI-REDESIGN-WORKLOG.md).
- **TopList on Admin/Studio/Library rankings:** use Storybook `TopList` (History already compliant). Details: [docs/todo/toplist-storybook-sweep.md](../../docs/todo/toplist-storybook-sweep.md).
- **Radio Browser directory store parity:** ConfigurableCard + Browser/Stations tabs shipped; Save → Listen tiles shipped; Playwright smoke test added 2026-09-04 (`e2e/plugin-store.spec.ts`). Details...
- **TrackContextMenu on all track listings:** `PlayableTrackContextMenu` uses Header + playlist With Submenu + Audio tools; Studio Sounds more menu → `StudioSoundRowMenu`. Further surfaces still open...
- **Help — keyboard navigation page:** Help hub quick start → `/help/keyboard-shortcuts` with Storybook `KeyCombo` rows; Storybook `KeyboardNavigation` story. Settings remapping deferred. Details: [U...
- Replace hand-styled native controls in listener and Studio surfaces with Storybook-backed Nuclear components where behavior permits: `Input`, `Select`, and `Textarea` in `ChannelRadioPlaylistPanel`...
- Replace the native control in the Nuclear add-on configuration surface with the shared `Select`; the remaining listener/Studio form audit is still open.
- Normalize remaining loading, empty, error, and status treatments against `PageLoading`, `PageEmpty`, `EmptyState`, `Loader`, and `Badge`. Progress 2026-09-03 (0.0.43): stash / channel chat / add-to...
- **New: consolidate `toast` vs. a local `msg` state rendered as a raw `<p>`** for the same transient-feedback purpose — 2026-09-03 sweep found ~10 instances, several inside files (`StudioDistributio...
- **SaveButton sweep (first pass):** persist-edit controls use Storybook `SaveButton`. Create/publish stay `Button`. Studio Sound icon-only toolbar flagged and left. Disabled story added. Remaining: ...
- **StatChip sweep:** artist/channel, Studio home/stats/channel/schedule, track insights, fan-sub summary, admin dashboard/content KPIs, stream manager, admin user followers, and storage used/free/to...
- **System rule — URL-field copy convention:** every field that displays a URL (a share link, smartlink, RTMP server URL, embed src, etc.) must show it in a visible `<code>`/text field and pair it wi...
- **System rule — media upload convention:** every avatar/backdrop/image/video upload surface must (1) render a ready placeholder (avatar icon or backdrop placeholder), never a bare "choose a file" p...
- Add Storybook states for Studio deep routes, Admin nested/moderation routes, artist-page standard top navigation, mobile navigation, and active/inactive navigation states.
- Add a dedicated Storybook TypeScript check after updating legacy stories for required label props and adding the Vite/global declarations needed by imported `tahti-web` files.
- Run the Storybook render build for the current compliance batch and record intentional exceptions, especially for Admin operational tables, specialized editor controls, and legacy story prop contra...

---

## 2026-09-05 — FEATURES Remaining shipped fold

Removed completed `[x]` rows from FEATURES **Remaining / partial**. Summaries:

- Channel chat hardening — hCaptcha wired on anonymous join (`useHcaptcha` in `ChannelChatPanel`), one shared component powers both the rail and standalone `/chat/$slug` route (pa...
- Full Three.js visualizer preset set — all ten production preset names now have distinct Three.js scenes, use the shared analyser, honor reduced motion, and load from a separate ...
- Stash upload / delete
- Stats detail page (beyond summary) — `/studio/stats/detail` (`StudioStatsDetailView.tsx`) shipped, worklog row 14 approved
- Sources OAuth silent-mock demock polish — start URLs are real (`oauthStartUrl()` → `/api/me/*/oauth/start`, `api/sources.ts:189`) and mock-connect is hard-gated behind `VITE_FOR...
- Venue register
- Membership purchase (`/signup/payment`) — Stripe checkout + mock activate
- TOTP at login (manage/settings depth still thin)
- Account security — TOTP enroll/manage panel in Settings (`SecurityTotpPanel`); matches prod (TOTP is the only account security setting there too)
- Distribution (catalog + Revelator + Spotify profile)
- Channel moderators (`/studio/moderation`)
- Listener-only dashboard (`/dashboard` routes non-artists to `/library`)
- Board admin — all 22 pages ported, gated on `user.isBoard` (see UI-REDESIGN-WORKLOG.md admin table); several sub-pages deliberately scope-trimmed, see §6 note
- Radio slots depth — series and episodes are now **live-API**, matching bookings. Added `LiveShowEpisode` model + `intervalHours`/`scheduleNote` on the existing `LiveShowSeries` ...
- Settings modal mobile responsiveness — was broken two ways: (1) a horizontal-scroll tab strip with no scroll affordance made most sections undiscoverable, and (2) the section li...
- Player bar seek bar now spans the full bottom bar width — it lived inside the center controls column (capped by `max-w-xl`), so it only ever covered a fraction of the bar. Pulle...
- Discover dashboard (`/discover`) — six configurable widgets (this week most/least played, most played, latest tracks, new to you, loved), addable/removable/reorderable via a "+"...

---

## 2026-09-05 — queued-ux-fixes shipped fold

Folded 30 completed items from `queued-ux-fixes-2026-09-05.md`.

- **Admin panel left padding — fixed 2026-09-05.** Root cause: 9 of
- **Rename "Stream Playlist Manager" → "Stream Manager" — fixed
- **Stream overlay tab leaks after collapsing the manager — fixed
- **Collapse "Connect Broadcasting Software" by default — shipped
- **Go Live: proper toaster on save — shipped 2026-09-05 (partial;
- **Stream overlay text color picker — shipped 2026-09-05
- **StreamOverlayEditor subtext → HelpLayer — shipped 2026-09-05.**
- **Stream overlay cover placeholder + text auto-fill — 2 of 3
- **Stream Manager stats + overlay restructuring — shipped
- **Go Live multistream "Add destination" modal was broken/unusable —
- **Stream Manager: artist/track/status stat layout — shipped
- **Stream Manager: icon-button playlist edit, with confirm — shipped
- **Go Live: move header subtext into the help layer — shipped
- **Port `HelpLayer` from tahti, use it on Go Live — shipped
- **Top-nav broadcast icon: rotation dot + live-only flash + Stream
- **Show creation flow — shipped 2026-09-05.** Two of three parts
- **Show info form: dropdowns + layout + status button — shipped
- **ChannelView: duplicate OnAir badge, playlist-download → share
- **ChannelView: Overview/Manage tabs → Stream Manager modal —
- **Channel Designer: duplicate "Open my channel" link — fixed
- **Channel Designer layout save/restore — shipped 2026-09-05.**
- **Channel Designer: gallery "+" add-images modal + hover
- **Channel Designer: Background section fixes — 2 of 3 shipped
- **Channel Designer: PlayerVisualizerControls — already done,
- **Radio browser directory: layout, cover images, enable flow — 5
- **Audio plugins/add-ons: rename Mastering, relabel section, icon
- **Local files moved from right sidebar to a Library tab — shipped
- **Radio play icon didn't reflect actual play state — shipped
- **Channel Designer: Save/Reset layout buttons no longer visible;
- **Channel Designer: Links prefill + "Home"→"Stage" — 2 of 4

---

## 2026-09-05 — Agent docs audit (round 1–2) folded

Folded from `agent-docs-audit.md` after P0–P2 remediations on `perf/audit`.

- START-HERE, INDEX, todo→HISTORY, open WORKPLAN/FEATURES Remaining
- Sibling path `../tahti-org`; slim AGENTS + `docs/agent/*`
- alwaysApply start rule; Gitbook pointer; Status enum; Storybook surfaces table; FEATURES-REMAINING
- Canvas: agent-docs-audit.canvas.tsx

---

## 2026-09-06 — Settings menu mobile responsive

Folded from `settings-mobile-responsive.md`.

- Shell: drop unconditional nav `flex!` so list/detail hide works; `w-full` + `dvh` dialog.
- Add-ons category tabs wrap on mobile; TabsList defaults to `flex-wrap`.
- Settings section Tabs (Artist/Channel/Money/Themes/Broadcast) wrap; PluginStore toolbars use soft `min-w-0`/`basis-*`.
- tahti-web `0.0.84`.

---

## 2026-09-07 — Library showed Studio's tabs instead of its own

One half of a two-part report folded from `queued-ux-fixes-2026-09-05.md`
(the other half, missing tracks, is still open — needs live repro).

- Root cause: `StudioNav.tsx`'s `SECTION_PREFIXES['/studio']` listed every
  `/library/*` prefix, so `getStudioPrimaryRoute('/library/...')` resolved
  to `/studio` and `AppShell` rendered Studio's own submenu tab strip
  above `LibraryView`'s tab row — two tab rows stacked, Studio's showing
  as the "wrong" one. Pre-existing since `959073ed2` (2026-09-03).
- Fix: dropped the `/library*` entries from `SECTION_PREFIXES['/studio']`
  — Library already has its own top-level sidebar/bottom-nav entry via
  `navigationActive.ts`'s independent `/library` check, so nothing else
  depended on Studio claiming those paths.
- Added a regression test (`StudioNav.test.ts`) asserting
  `getStudioPrimaryRoute` returns `null` for every `/library/*` path —
  the existing "lights nothing in Studio for Library routes" test only
  checked derived submenu-item highlighting, not this primary-route gate
  that actually controls whether `AppShell` renders `StudioNav` at all.

---

## 2026-09-07 — Library missing tracks + full-player back arrow, both fixed and live-verified

Folded from `queued-ux-fixes-2026-09-05.md`. Launched the `tahti-web` dev
server with `VITE_FORCE_MOCK=1` and drove it with `claude-in-chrome` to
actually reproduce both reports instead of guessing from source.

**Library missing tracks.** `MyDiscographyView`'s `hasChannel` gate hid
the entire success branch — including already-fetched `items` — whenever
`user?.channel` was falsy, regardless of `loading`/whether the fetch
returned real sounds. Reproduced live: forced a mock session's persisted
`user.channel` to `null` via `localStorage`, kept 3 real mock sounds, and
the Sounds tab showed "No sounds yet" instead of them. Fix: reordered the
gate to only show the "go live" empty state when `!hasChannel &&
items.length === 0` — a channel-less state now only wins when there is
genuinely nothing to show, never over data the fetch actually returned.
Added `MyDiscographyView.test.tsx` (3 cases: channel-less with sounds,
channel-less with none, has-channel with sounds) and re-verified live
after the fix.

**Full player back arrow.** Genuinely broken, not a false alarm — but not
in the handler (`onClick={close}` was always correctly wired). Real
cause: `FullScreenPlayer.tsx`'s header (`absolute inset-x-0 top-0 z-10`)
and its only in-flow sibling, the centered content column (`relative
flex-1 z-10`), tied at `z-10` — and since the header is `absolute` (out
of flow), the content column's `flex-1` stretches it to cover the same
top strip. Equal z-index resolves hit-testing by DOM order, so the
content column (which paints nothing at that point, which is why the
arrow still looked correctly rendered) intercepted real pointer clicks
meant for the button underneath. A synthetic `.click()` on the button
bypasses hit-testing and "worked", which is exactly why this looked fine
from source alone and needed a real coordinate click (confirmed via
`document.elementFromPoint` at the button's own rect resolving to the
content div, not the button) to catch. Fix: bumped the header to `z-20`.
Added `e2e/fullscreen-player-minimize.spec.ts`, confirmed it fails
against the pre-fix code (Playwright's own error: "content column
intercepts pointer events") and passes after.

---

## 2026-09-07 — Channel Designer: opt-in Navigation tabs under the player

Folded from `queued-ux-fixes-2026-09-05.md` (both remaining items —
the original "dynamic tabs" request and its later refinement to
off-by-default/opt-in were the same feature, built as one).

Scoping first found the original request's premise partly stale: no
"Published on your channel" text exists anywhere in the codebase
(removed pre-existing), and `ChannelView.tsx` already had a static,
hardcoded Stage/Tracks/About nav bar below the player (not in the
header) — so "move tabs below the player" was already true; what
needed building was making that bar dynamic and opt-in.

**Data model** (`channelPageLayout.ts`): new `navigation` entry in
`CHANNEL_PAGE_ITEM_TYPES`/`CHANNEL_PAGE_ITEM_META`, a `navigationTabs?:
ChannelNavigationTab[]` field (`{id, label, itemIds}`) on
`ChannelPageItem`, and `setNavigationTabs()`. `addItemType('navigation')`
seeds a single "Home" tab holding every currently-visible block —
one tab alone never shows the bar (nothing to switch between), so
turning Navigation on changes nothing until a second tab exists.
`navigation` is a hidden default stub like `links`/`stats`/etc.
(off by default, not auto-shown), covered by the existing
`defaultChannelPageLayout` exhaustiveness test.

**Editor** (`ChannelNavigationEditor.tsx`, new): add/rename/remove
tabs, and per tab a `FilterChips` multi-select of which other visible
blocks appear under it — mirrors `ChannelLinksEditor`'s controlled
`onChange(nextArray)` pattern. Wired into `ChannelView.tsx`'s existing
click-to-configure `lookSlot` machinery (select the Navigation block →
its own editor swaps into the Layers panel), same mechanism `links`/
`playlist` already use.

**Rendering** (`ChannelView.tsx`): the old hardcoded Stage/Tracks/About
bar is now driven by `navTabs`; the bar renders only when 2+ tabs
exist, in both editing and view mode (what the artist sees while
editing is exactly what listeners see, not a preview-only stand-in).
An item assigned to any tab only shows while that tab is active; an
item never assigned to any tab always shows, so a block added after
tabs exist doesn't silently disappear. Tab-switch content fades via a
small local rAF-based transition (same technique as `FadeSwitch` in
`ChannelLayersMenu.tsx`/`ChannelElementEditor.tsx`, not extracted since
it's one 6-line effect).

Caught and fixed one real bug from this pass: the tab-derived state
and its content-fade `useEffect` had been placed after `ChannelView`'s
`if (loading)`/`if (!channel)` early returns, tripping "Rendered more
hooks than during the previous render" the moment a channel actually
loaded — moved above both early returns.

**Validation:** `tsc --noEmit` and `vitest run src` (487 tests) pass
clean; 5 new `channelPageLayout.test.ts` cases cover tab seeding,
reseeding a previously-hidden stub, preserving artist-configured tabs
across a hide/show cycle, and `normalizeLayout` accepting well-shaped
tabs while dropping malformed ones. Live-verified end-to-end in the
browser (`VITE_FORCE_MOCK=1`): added the Navigation block, added a
second "Releases" tab, moved Tracks into it out of Home, exited
editing, and confirmed the live tab bar renders, Home hides Tracks,
and clicking Releases swaps to show only Tracks with About/Subscribe
hidden.
## 2026-09-07 — Continue-listening pause icon + mobile topbar notifications/messages

Folded from `continue-listening-card-missing-isplaying.md` and
`mobile-topbar-notifications-messages-to-user-menu.md`.

- `ListenView.tsx`: "Continue listening" `Card` now derives
  `lastPlayedIsCurrent`/`lastPlayedIsPlaying` from `usePlayerStore`
  (same pattern as `radioIsPlaying`/`radioPreset` cards on the same
  page) and passes `isPlaying`, toggling pause instead of always
  restarting when already the current track.
- `AppTopNav.tsx`: on mobile (`useIsMobile()`), the standalone
  Notifications/Messages top-bar buttons are hidden (`isMobile &&
  'hidden'`, popovers untouched so they still anchor/render when
  opened) and two new menu items are added to the user-menu dropdown
  instead, each opening the same existing popover state
  (`setNotificationsOpen`/`setMessagesOpen`) and each carrying its own
  unread-count `Badge` (same pill/red styling as the original
  top-bar badges). A combined unread dot is added to the avatar
  trigger itself on mobile so unread state stays visible without the
  standalone icons. Desktop is untouched (`isMobile` false → same as
  before).
- Not live-verified on an actual narrow viewport — the browser
  automation's window-resize didn't take effect in this environment
  (viewport stayed desktop-width despite the resize call reporting
  success); desktop path was screenshot-confirmed unaffected (menu
  opens normally, no stray items, no badge). Flagging so it gets a
  real mobile-viewport check if anything looks off in practice.
- tahti-web `0.0.96`.

---

## 2026-09-07 — Broadcast dialog: booking calendar link + Stream Manager moved in

Folded from `broadcast-dialog-booking-link-and-stream-manager.md`.

- `AppTopNav.tsx`: the Broadcast-status popover (`RadioIcon` top-bar
  trigger) gained two new `role="menuitem"` entries — "Booking
  calendar" (`/studio/schedule`, confirmed live as the artist's own
  broadcast schedule: "Your next broadcasts" + analytics) and "Stream
  manager" (opens the existing `StreamManagerPanel` `Dialog` via
  `setStreamManagerOpen(true)`, closing the popover first).
- Removed the standalone top-bar Stream Manager icon button — its
  `Dialog` and `streamManagerOpen` state didn't move, only the
  trigger.
- Live-verified in the browser: popover shows all four items
  (broadcast status, Open broadcast studio, Open Green Room chat,
  Booking calendar, Stream manager), Stream manager opens the same
  dialog as before, Booking calendar correctly lands on
  `/studio/schedule`.
- tahti-web `0.0.97`.

---

## 2026-09-07 — Purchase-tier artist editor built (closes the PWYW reachability gap)

Folded from `purchase-tier-artist-editor-missing.md` and
`pay-what-you-want-pricing.md`. The buyer-side PWYW dialog shipped
earlier this session had no real path to a `PURCHASE`-gated track —
zero artist-facing UI existed to create a `PurchaseTier` or assign one.
Built both pieces:

- **`PurchaseTiersEditor.tsx`** (new): create/deactivate one-time
  purchase tiers — name, price, description, and a "pay what you want"
  toggle — mirroring `FanTiersEditor.tsx`'s exact pattern. Mounted in
  `StudioRevenueView.tsx`'s "Tiers" tab alongside (not replacing) the
  existing fan-subscription editor.
- **`PurchaseAccessSection.tsx`** (new): a "Sell this track" picker
  added to `TrackEditDialog.tsx`'s Sharing tab, selecting an active
  tier (or "No purchase gate") for the track; saved via the real
  `PATCH /api/me/sound/:id/access` contract alongside the main save.
- **Real bugs found and fixed along the way**, not just new UI:
  - `setSoundPurchaseAccess` (`api/purchase-tiers.ts`) was calling a
    wrong path (`/api/me/archive/:id/access` — the real route is
    `/api/me/sound/:id/access`) and couldn't clear a gate back to
    `FREE` (no support for `purchaseTierId: null`). Both fixed to match
    `apps/api/src/routes/me/sound.ts`'s real contract.
  - Mock mode has three disconnected mock stores for what should be
    one "sound" entity — `mockSoundStore` (studio.ts, read by the
    Studio editor), the `mock-uploads.ts` store (read by the public
    track-detail page), and `mock.ts`'s static `-archive-N` fixtures.
    Added `setMockSoundPurchaseAccess` (studio.ts) and dual-write both
    mock stores from `setSoundPurchaseAccess`, matching the existing
    `patchStudioSound` convention — but `patchMockUploadedSound`
    silently no-ops for tracks that only ever existed as static
    `mockSoundStore` seed data (never went through a real upload into
    the `mock-uploads.ts` store), so the public track-detail page still
    won't reflect a purchase-tier change made against one of those
    specific seed tracks in mock mode. Pre-existing mock-fixture
    architecture gap, not present in the real (non-mock) API path —
    flagging rather than attempting a full mock-store unification here.
  - `Toggle`'s `label` prop is `aria-label`-only, never rendered
    visibly (confirmed by reading `Toggle.tsx`) — the first draft of
    `PurchaseTiersEditor.tsx` used it bare, shipping an invisible
    checkbox label; caught before commit via live screenshot and fixed
    to match `TrackEditDialog.tsx`'s established bordered-row pattern
    (visible `<span>` beside the `Toggle`).
- Live-verified: created a tier from Studio → Audience → Tiers
  (including the pay-what-you-want toggle), assigned it to a track from
  `TrackEditDialog`, saved, reopened the dialog and confirmed the
  selection persisted. Buyer-side click-through to "Buy this track"
  itself was not re-verified past the mock-store gap noted above.
- tahti-web `0.0.98`.

---

## 2026-09-07 — Stream overlay scrim toggle: frontend piece, closes the doc

Folded from `stream-overlay-text-color.md`. The backend
(`Channel.streamOverlayScrimEnabled` + `video.add_rectangle` in
`buildRtmpMirrorOutput`, verified earlier this session against the real
`savonet/liquidsoap:v2.2.5` binary) shipped in `../tahti-org` PR #459,
which merged during this session. Wired up the frontend half that was
waiting on it:

- `api/broadcast.ts`: `StreamOverlay` type gained
  `streamOverlayScrimEnabled: boolean`, threaded through the mock
  store and API-error fallback object.
- `StreamOverlayEditor.tsx`: new "Darken behind text" toggle (visible
  bordered-row + `Toggle` pattern, gated behind "Show overlay title"
  same as the color picker), included in the save patch and initial
  load. `OverlayTextPreview` now swaps its always-on CSS gradient for
  a flat `bg-black/50` band when the scrim is on — a closer match to
  the real render, which has no gradient at all without the scrim
  (the gradient was always just a web-preview aesthetic choice, per
  the doc's own earlier investigation).
- Live-verified in the browser: Broadcast → Stream stats → Overlay
  chip → Stream overlay dialog. Typed a title, toggled "Darken behind
  text" on, confirmed the preview swapped from the fading gradient to
  a flat dark band, saved, reopened the dialog and confirmed both the
  toggle state and the preview persisted.
- tahti-web `0.0.99`.

---

## 2026-09-07 — CI: self-hosted deploy smoke checks retry instead of failing on first attempt

`.github/workflows/deploy-tahti-web-selfhosted.yml`'s "Smoke checks"
step ran `curl` immediately after `docker compose up -d
--force-recreate`, which returns before the container is actually
accepting connections — flaked with "Recv failure: Connection reset
by peer" on 2 of the last ~13 self-hosted deploy runs today, always on
the very first request. Wrapped both checks in a retry loop (up to
~15s) instead of failing on the first non-200/connection-refused
response.

Verified locally against three scenarios (connection refused,
connected-but-non-200, real 200) before shipping — caught a real bug
in an earlier draft where curl's own `%{http_code}="000"` fallback
plus a redundant `|| echo "000"` doubled up into `"000000"`. Confirmed
live: this fix's own push deployed cleanly (`spa:200`/`api-proxy:200`
on the first attempt, no retry needed that run).

---

## 2026-09-07 — Crossfade playback setting wired to the audio engine

Folded from `crossfade-playback-wiring.md`. The setting existed (Settings
→ Playback, 0-5000ms, persisted via Tauri store) and `CrossfadeSound`
(dual audio elements, full crossfade logic) existed, but
`SoundProvider.tsx` always rendered plain `Sound` -- nothing consumed
`crossfadeMs` at runtime.

- `SoundProvider.tsx`: renders `CrossfadeSound` when `crossfadeMs > 0`,
  falls back to `Sound` at `0`/`undefined`, passing the same prop set
  either way.
- `CrossfadeSound.tsx` had three real gaps vs `Sound`'s `SoundProps`
  contract, closed:
  - `volume` was destructured but never applied — now set on both
    underlying audio elements (both can be audible mid-crossfade, and
    the inactive one is rendered ahead of becoming active).
  - `onCanPlay` was missing entirely. Naively wiring it to both audio
    elements would have been a real bug: the inactive element preloads
    the next track ahead of a crossfade, and its `canplay` firing
    `onCanPlay` would signal "track started" before the track is
    actually audible. Wired per-element, gated on `id === activeIndex`.
  - `onSourceInvalid` is accepted for `SoundProps` interface parity but
    deliberately not wired to a call site: it's an MSE/HLS-exclusive
    signal (`useMseSource` → `MseController`) and confirmed (via
    `Sound.tsx`'s own native-audio `onError` handler) that it's never
    invoked for a plain `<audio>` error path even in `Sound` itself.
    `CrossfadeSound` has no MSE support at all, so there's no honest
    call site yet — left as a documented no-op for future MSE work.
- Added 2 new `CrossfadeSound.test.tsx` cases (volume applied to both
  elements; `onCanPlay` fires only for the active element's `canplay`,
  not the preloading one) alongside the existing crossfade-timing test.

**Validation:** `tsc --noEmit` and `eslint` clean on `hifi` and
`player`; `vitest run` on `hifi` (79 tests) and `player` (687 tests,
minus 2 timeouts confirmed pre-existing/environmental — both pass in
isolation) all green.

---

## 2026-09-07 — Studio orphan routes: stale premise; Storybook decorators fixed

Folded from `studio-orphan-routes-and-storybook-mismatch.md`.

**The "5 orphan studio routes" half was a false alarm.** Checked
`StudioNav.tsx`'s `isSubmenuActive` and its own test suite before
touching anything: `/studio/sounds`, `/studio/recordings`,
`/studio/collections`, `/studio/stash` are deliberately Library-domain
routes that light nothing in Studio's submenu by design — Library owns
them via its own main-menu sidebar entry (matching the earlier
"Library page showed Studio's submenu" fix already in this file) — and
`/studio/distribution` deliberately lights `/studio/releases`. All of
this is already asserted by `StudioNav.test.ts`'s
`'lights nothing in Studio for Library-domain routes'` and
`'lights exactly one Studio submenu item on covered catalog routes'`
tests. Not a gap; the doc's own "document as intentionally
navigation-less" option was already true before this pass.

**The Storybook half was real and is fixed:** `AdminActivityView.stories.tsx`
and `AdminMissedShowsView.stories.tsx` had `withTahtiRouter(...)`
decorators pointing at two now-redirected routes
(`/admin/activity` → `/admin/logs`, `/admin/missed-shows` →
`/admin/moderation/$tab` with `tab: 'missed-shows'`, both confirmed
against `router.tsx`). Repointed both decorators at the real
surviving routes.

**Validation:** `tsc --noEmit` clean on `storybook` (`tsconfig.tahti.json`)
and `tahti-web`; `eslint` clean on both changed story files.

---

## 2026-09-07 — "Registry runtime parity" WORKPLAN item was stale; closed as docs-only

Removed the WORKPLAN "Now" row for `bandcamp-dashboard`,
`deezer-dashboard`, `listenbrainz-dashboard` (charts), `omnisource`,
`youtube-liked-songs-sync` — investigated as the next queued item and
found there was no code left to write. The Nuclear-registry-parity
system these IDs came from (`apiCounterpart`/per-add-on
implementation-state metadata, per `docs/PLUGIN-INTEGRATIONS.md`'s own
description of it) no longer exists anywhere in `src/`
(`apiCounterpart`/`realFeature`: zero hits) — superseded by the current
`SERVICE_PLUGINS`/import-export/OAuth model in `PluginStorePanel.tsx`,
which has no personal "dashboard" concept for any provider at all.
`src/plugins/scrobble/README.md`'s own "Out of scope" section already
said these five are meant to "stay out of scope / constitutionally
blocked" — a deliberate product decision (Tahti owns credentials and
outbound calls server-side; there's no client-side aggregation layer
for cross-service personal charts/dashboards), not a technical
blocker waiting to be unblocked. `FEATURES.md` and
`docs/PLUGIN-INTEGRATIONS.md` both contradicted that (the former said
"still planned", the latter called them "remaining runtime blockers")
— corrected both to match the scrobble README's already-settled
answer.

---

## 2026-09-08 — Stream overlay cover placeholder: now-playing artwork

Finished the one remaining piece of
`stream-overlay-auto-fill-and-avatar-placeholder.md`. That doc had
marked the now-playing-track-artwork placeholder as blocked on a
missing backend field — true when it was written, but the 2026-09-07
Stream Manager artwork entry above found `PublicChannel.nowPlaying
.artworkUrl` already exists and is already read by
`StreamManagerPanel.tsx`. `StreamOverlayEditor.tsx` now fetches the
artist's own channel (`fetchChannel(channelSlug)` off
`useAuthStore`'s `user.channel.slug`) alongside its existing overlay/
preflight/profile calls, and the cover placeholder falls back through
`streamOverlayCoverUrl` → `nowPlaying.artworkUrl` → avatar → generic
icon, updating the `HelpLayer` copy to match. `tsc --noEmit`, eslint,
`pnpm test` (487 tests), and `pnpm build` all pass.

---

## 2026-09-08 — Library section: clean `/library/*` paths for Recordings/Stash/Media/Embeds

`LIBRARY_SECTION_TABS` (`LibraryView.tsx`) previously routed Recordings,
Media, Stash, and Embeds through `/library/collections?tab=X` query
params instead of their own paths, even though Sounds and Collections
already had clean top-level routes. Gave all four real routes
(`/library/recordings`, `/library/media` — already existed but was
mis-wired, `/library/stash`, `/library/embeds`), dropped the
`collectionTab`/`CollectionTab` indirection from `LibraryView` now that
`tab` maps directly to a section, and made `/library/collections?tab=X`
redirect forward to the new path for old bookmarks. `/studio/recordings`
and `/studio/stash` (the old duplicate standalone Studio pages using
the same `StudioRecordingsView`/`StudioStashView` components, just not
`embedded`) now redirect to their `/library/*` equivalents instead of
rendering — matches the existing archive/playlists redirect convention.
Repointed every hardcoded internal link (`StudioHomeView`,
`StudioGoLiveView`), `prodPathRedirects.ts` (tahti.live cutover
compatibility map), and the map/port-inventory/flow-diagram content
docs. `StudioSoundsView`/`StudioCollectionsView` (the full-featured
standalone `/studio/sounds` and `/studio/collections` pages, distinct
from `MyDiscographyView`/`MyCollectionsView` used at `/library/sounds`
and `/library/collections`) were deliberately left untouched — merging
those would mean picking a winner between two genuinely different
feature sets, not just a path rename, and wasn't asked for.
`tsc --noEmit`, `eslint`, `pnpm test` (487 tests), and `pnpm build` all
pass. Verified live in a running browser (`VITE_FORCE_MOCK=1`):
`/library/stash`, `/library/embeds`, `/library/recordings` all render
correctly; `/studio/stash`, `/studio/recordings`, and
`/library/collections?tab=stash` all redirect to the new clean paths.

---

## 2026-09-08 — Perform folded into Studio → Broadcast; nav-tab audit resolved

Closes `studio-nav-perform-to-broadcast.md`. Part 2 (the nav-tab
coverage audit) found Perform/go-live's own section was already fully
correct, and that five other Studio routes (Sounds, Recordings,
Collections, Stash, the playlist editor) light the Studio primary tab
with no submenu tab — Recordings and Stash are now resolved by the
`/library/*` path-cleanup entry above (they're pure redirects out of
Studio now, not real pages); Sounds/Collections/playlist-editor remain
open, tracked as a follow-up since fixing them means picking between
duplicate implementations (see the entry above) or growing a "Library
Domain" concept.

Part 1 (the actual move), on user direction: Perform's top-level
primary nav item is gone from `StudioNav.tsx`'s `PRIMARY`
(`StudioMainNavItems`, which used to render it in the sidebar beneath
"Studio", now maps over an empty list — a harmless no-op, not deleted,
since `PRIMARY` is still a real extensibility point). A single
"Broadcast" tab (`/studio/go-live`) was added to `SUBMENUS['/studio']`
instead. The six pages that used to be go-live's own submenu (Go Live,
Schedule, Events, Shows, Channel, Radio) needed a decision on where
they'd live — user chose nesting them one level deeper as their own
in-page tab strip rather than flattening all six into Studio's already
8-item submenu. Built `BroadcastSubNav` (`StudioNav.tsx`) for that,
reusing the exact match logic the old `/studio/go-live` submenu used,
and wired it into `StudioGoLiveView`, `StudioScheduleView`,
`StudioEventsView`, `StudioEventCreateView`, `StudioShowsView`,
`StudioShowDetailView`, and `StudioChannelView` — replacing a
`<StudioNav current="...">` call in each that turned out to already be
a dead no-op (`StudioNav` only renders when passed `global`, which none
of these per-page call sites did; the real nav bar is the one instance
AppShell renders globally). `isSubmenuActive` now folds all six former
go-live pages into lighting the single Broadcast tab.

`lib/navigationActive.ts`'s `activeSidebarItem`/`activeMobileItem` had
their own separate `'perform'` sidebar-icon id that never actually
matched anything in `AppShell.tsx` (`sidebarActive === 'perform'` was
never checked there) — meaning the desktop "Studio" sidebar icon never
actually lit up while browsing any Perform page, a pre-existing bug.
Removing the special-case naturally fixes it: those routes now resolve
to `'studio'` like every other Studio page, matching the user's "parent
and subparent tabs are active" ask.

`tsc --noEmit`, `eslint`, `pnpm test` (483 tests, all updated
call-sites and two new precise coverage tables — one for the folded
Studio submenu, one for `BroadcastSubNav`'s own per-page resolution),
and `pnpm build` all pass. Verified live in a running browser
(`VITE_FORCE_MOCK=1`, unauthenticated `/studio/go-live`): sidebar shows
only "Studio" lit, no separate "Perform" item.

## 2026-09-08 — Studio Collection/Playlist/Release: playlist routing, TrackTable swap, delete/export

Closes `studio-entity-edit-view-header-redesign.md`'s three remaining
"needs a decision, not a guess" items, all resolved by the user this
pass: wire up the playlist editor, swap to the shared `TrackTable`
primitive accepting the feature loss, and build delete/export.

**Playlist routing** — `StudioCollectionsView.tsx`'s title and row-action
`<Link>`s now route `PLAYLIST`/`DJ_SET_SERIES` styles to
`/studio/playlists/$slug` (the dedicated `StudioPlaylistEditorView`)
instead of `/studio/collections/$slug`, via a new `editorRouteFor()`
helper; every other style is unchanged. Fixed a stray
`content/mapScreens.ts` reference that still pointed playlists at the
Collection route. `/studio/playlists` stays a redirect to
`/studio/collections`; the dead `StudioPlaylistsView` grid component is
untouched.

**`StudioPlaylistEditorView` header parity** — now wrapped in
`EntitySocialHeader` (cover upload via `uploadCollectionCover`, subtitle
"Playlist"/"DJ set", description, track-count stat, a Play button, the
existing Save button), matching Collection's header shape. Its already-
correct `TrackTable` wiring (reorder/remove/play/queue) is untouched.

**TrackTable swap** — `StudioCollectionEditView.tsx`'s bespoke
`TrackRow`/native-HTML5-DnD/in-row waveform-decode/inline-embed-iframe
block is replaced by the shared `TrackTable` (reorder, trash column,
built-in filter toolbar — replacing the old manual search box), modeled
on the playlist editor's proven usage. Extracted a shared
`collectionItemToTrack()` helper (`lib/collectionTrackMapping.ts`) used
by both views. Accepted regression: no more in-row waveform preview or
inline embed-provider iframe playback; embed tracks fall back to the
same `playSound`/`playableFromStudioHearthis` path the playlist editor
already used. `StudioReleaseDetailView.tsx`'s Overview tab also gets a
`TrackTable` (read/play-only — no reorder or delete, since the Smart
Links tab already owns those for release tracks via its own
`ConfirmDialog`-gated flow, left untouched).

**Delete + Export ("⋮" menu)**, Collection and Playlist only (Release
has no delete endpoint and wasn't part of the original ask): new shared
`StudioCollectionMoreMenu` component, a `Popover` with "Export as JSON"
(client-side `Blob` + `<a download>`, no API call — no export endpoint
exists) and "Delete" (new `deleteStudioCollection()` in `api/studio.ts`,
hitting `DELETE /api/me/collections/:slug` — this endpoint already
existed in `tahti-org`, unused by the frontend until now). No `tahti-org`
changes were needed.

**Delete confirmation, unprompted user feedback mid-pass**: "always
confirm with modal with the delete buttons" — applied beyond just
`StudioCollectionMoreMenu`'s "Delete collection/playlist": `TrackTable`'s
per-track trash column in both Collection and Playlist editors now opens
the shared `ConfirmDialog` before calling `removeStudioCollectionItem`,
where before (playlist editor) and previously (Collection's old
`TrackRow`) it removed immediately on click.

`tsc --noEmit`, `eslint`, `pnpm test` (483 tests) and `pnpm build` all
pass. The repo's own `e2e/cutover-vital.spec.ts` (which covers both
`/studio/collections/midnight-archive` and
`/studio/playlists/favorites-mix`) targets the real `beta.tahti.live`
deployment and needs `TAHTI_E2E_PASSWORD` staging credentials not
available in this environment — verified manually instead
(`VITE_FORCE_MOCK=1`, live browser): Collection and Playlist headers,
"⋮" menus (correct "album"/"collection"/"playlist" labels), the
track-removal confirm dialog, the list-view routing split, and the
Release Overview `TrackTable` (no trash/reorder) all render and behave
correctly; the Smart Links tab's own reorder/delete UI is unaffected.

---

## 2026-09-08: Sounds view — silent-empty prod bug fixed + sort control redesign

Root cause of the reported "library shows empty under Sounds in
production" bug: `fetchStudioSounds()` (`api/studio.ts`) already
returned `{ data: [], meta: apiErrorMeta(err) }` on a non-mock fetch
failure, but `MyDiscographyView` never read `meta` — a real
backend/auth failure rendered identically to the genuine "All (0)"
empty state. Fixed by threading `meta.reason` into a new `error` state
and rendering the shared `PageError` component (`title`, `description`,
`onRetry`) instead of the empty state whenever `meta.source === 'api'`
carries a `reason`. Added a regression test asserting a real fetch
failure shows "Couldn't load your sounds" (not "No sounds yet").

Sort control redesign: swapped the labeled `Select` ("Sort all sounds")
for the shared `DropdownButton`, moved into the same top-bar row as the
filter chips/search instead of its own row below. Note left in the code
— `DropdownButton`'s `Popover` root is `position: absolute` so it drops
out of flex flow; needed an explicit `w-44` wrapper or the search
input's `flex-1` sibling grows over it.

`tsc --noEmit` (clean) and `pnpm vitest run
MyDiscographyView.test.tsx` (7 passed) verified.

---

## 2026-09-10 — Auto-run channel setup wizard on `/studio`

`StudioHomeView` now auto-opens the existing channel-setup wizard
(`useChannelSetupModalStore`, the same modal `/studio/setup-channel`
opens) once per mount when a signed-in artist/board user has no channel,
instead of relying only on the small "Create your channel" text link.
Guarded with a ref so closing the dialog doesn't reopen it mid-visit; a
fresh visit still re-prompts until a channel exists. Kept the inline
text link as a manual fallback. Verified live in the browser (mock
session, channel forced to `null`): dialog opens automatically on
landing at `/studio`, closes cleanly via Cancel, does not reopen.
`tsc --noEmit` and `eslint` clean on the changed file.

---
