# docs/todo history

Completed task notes folded here so `docs/todo/` stays current.

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
