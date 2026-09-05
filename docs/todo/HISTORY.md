# docs/todo history

Completed task notes folded here so `docs/todo/` stays current.

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
