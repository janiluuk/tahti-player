# UI redesign worklog — Nuclear (artist + admin)

## 2026-09-04 — Artist look: brandAccent + textLayer live mapping (0.0.70)

**Status:** executed.

Public channel carries `brandAccentPreset` for GRADIENT washes on artist and
channel pages. `fetchChannel` maps live `textLayer*` → `textOverlay*`; save
also PATCHes `/api/me/channel/text-layer`. Mock exposes player/background
look extras on PublicChannel. E2E covers artist header `data-header-style`.

Todo: `docs/todo/channel-designer-artist-full.md`.

## 2026-09-04 — Channel Designer controls the artist page look (0.0.69)

**Status:** executed (client). API extras still localStorage-only.

Artist page header follows Channel Designer header style (gradient / solid /
video), color scheme, and visualizer tuning. Music-tab player stage uses the
player gradient/visualizer/now-playing overlay. Page background palette and
background visualizer apply on artist + channel. Designer Backdrop tab gained
a background visualizer picker.

Remaining: promote look extras to live API; brandAccentPreset on public
channel DTO; textLayer↔textOverlay rename; e2e for `/u/:username`.

Todo: `docs/todo/channel-designer-artist-full.md`.

## 2026-09-04 — hearthis embed play + Finnish radio in Radio Browser (0.0.68)

**Status:** executed.

Studio/Library hearthis rows play through the shared player widget
(`embedPlayback`: empty `streamUrl`, `sourceProvider: 'hearthis'`) instead
of DEMO_MP3 / hotlinked streams that were silent for ~3 minutes.

Curated Finnish stations (`RADIO_STATIONS`) live under Add-ons → Radio →
Radio Browser → Stations (Enable / Configure / Preview). Separate
Installed/Available per-station add-on rows removed. Listen tiles still
use `enabledStationIds` + overrides.

Todos: `docs/todo/studio-hearthis-playable.md`,
`docs/todo/radio-finnish-into-browser.md`.

## 2026-09-04 — Tabs Storybook migration (icons + count pills)

**Status:** executed.

Canonical `@tahti-player/ui` `Tabs` + `TabLabel` (`icon`, `count` Badge pill).
Storybook `Layout/Tabs`: With icons, With count pills, Icons + count pills,
Vertical icon-only. App tab strips migrated; Settings **nav** stays
`SettingsPanel`. Collapsed right rail uses vertical icon-only `Tabs`
(keeps the post-login notification `useMemo` fix).

Todo: [`docs/todo/tabs-migration.md`](../../docs/todo/tabs-migration.md).

## 2026-09-04 — Listing thumbnail ImageReveal sweep (0.0.67)

**Status:** executed.

Listing covers (directory rows, widget cards, add-on store rows, news
tiles, schedule/show lists) use Storybook `ImageReveal`. Playable track
rows stay on `MediaArtwork` (`thumb`/`md`/`fill`), which already runs
`ImageReveal`. Initials/icon fallbacks move into the `placeholder` slot
so empty art still goes through the same primitive.

Widgets included: Discover `WidgetCard` collections + artist-of-the-week,
Disco-widget store icons, Admin Disco-widget catalog, Listen radio logo,
News timeline, Radio Browser favicons, Bandcamp import rows.

Todo: [`docs/todo/listing-thumbnail-reveal.md`](../../docs/todo/listing-thumbnail-reveal.md).

Left as-is: upload/edit previews, Channel Designer, `EntitySocialHeader`,
fullscreen player, map screenshots, comment avatars, video backdrops.

## 2026-09-04 — Independent desktop player (pro library, Soulseek, Tahti chrome)

**Status:** planning + first slice in progress (`0.0.66`).

Roadmap: independent music player with pro management and Soulseek.
Todo: [`docs/todo/desktop-pro-library.md`](../../docs/todo/desktop-pro-library.md).

The desktop player is a Tahti product. Window chrome is Storybook
`TitleBar` + `TopBar`. No Nuclear atom logo and no “Nuclear” wordmark in
that chrome (epic **F**). Local files and Soulseek live in a **Library**
right-rail tab, not a Listen widget (epics **A–E**).

### Epic F — TitleBar + header, no Nuclear

Storybook already demos `Components/TitleBar` as “Tahti Player” and
`Layout/TopBar` with `TahtiLogo`. Live player still injected
`TopBarLogo` (Nuclear atom) into `TitleText`, and `ConnectedTopBar` used
the same mark when the custom title bar was off. Tahti Jam’s header
still said “Nuclear Jam”.

**F1 (this slice):** title text only on `TitleBar`; `TahtiLogo` /
`TahtiMark` move into `@tahti-player/ui` and replace `TopBarLogo` on the
player header; Jam header says Tahti. Tests use “Tahti Player”, not
“Nuclear”. Custom title bar stays **opt-in** (F2: consider default-on).

### Epics A–E — Library rail, metadata, import, Soulseek, pro tools

| Epic  | v1                                    | This slice                                  |
| ----- | ------------------------------------- | ------------------------------------------- |
| **A** | Library tab on the desktop right rail | Tab + `DesktopLibraryPanel`                 |
| **B** | Metadata DB                           | not started                                 |
| **C** | Import + play in the shared player    | Session blob import / play / queue          |
| **D** | Soulseek native add-on                | Help + Add-ons Configure stub (no protocol) |
| **E** | Bulk / BPM / M3U / virtualize         | not started                                 |

Web cannot speak Soulseek or watch folders. Do not relay P2P through
Tahti servers. Legal copy ships before any search UI.

**v1 non-goals:** mobile Library-rail parity; replacing Studio Sounds;
server-side Soulseek; `CardsRow` for the panel list.

### First execution slice

- `RightRailTab` includes `'library'`; persist migrate v5; hide Library
  on `useIsMobile`.
- `DesktopLibraryPanel`: Storybook `FilePicker` + `EmptyState`; play and
  queue via blob URLs (`sourceProvider: 'local'`).
- Settings → Add-ons → Import: `SoulseekAddonCard` (`PluginStoreItem`
  Configure, Test connection disabled).
- Help: getting-around mentions the Library rail; desktop-library
  article; Soulseek row in the add-ons table (`partial`).

## 2026-09-04 — KPI StatChip revert + subscribe header (0.0.65)

**Status:** executed.

Reverted dashboard-style statistics that had been swapped to compact
`StatChip` (social-header style) back to large number panels:
Admin Storage disk cards, Studio Home/Stats/Channel/Schedule overview
metrics, Fan subscription summary, Track insights, Admin user followers.
Admin Dashboard/Content already use `StatNumber`. Stream manager keeps
operational status chips. Subscribe page now uses `EntitySocialHeader`.

## 2026-09-04 — Entity social header sweep + admin KPI restore (0.0.64)

**Status:** executed.

`EntitySocialHeader` now also wraps Channel (no designer hero), Radio
show, Venue, and Smart-link/release pages. Playlists remain the same
public `CollectionView` as collections. Admin Dashboard and Content
restore large `StatNumber` KPI panels — no compact StatChip strip and
no stream-manager embed on `/admin`. Finance / live / queues / cron /
audit stay under “more”.

## 2026-09-04 — Entity social header (0.0.63)

**Status:** executed.

Nuclear-style `EntitySocialHeader` on Artist + Collection: `bg-primary`
card, round/square artwork, actions top-right, icon `StatChip`s inside
the header, optional image backdrop or `ChannelVisualizer` under a
scrim. Replaces the separate stats strip below the old hero. Storybook:
`Tahti/Page/EntitySocialHeader`. Todo:
[`docs/todo/entity-social-header.md`](../../docs/todo/entity-social-header.md).

## 2026-09-04 — RightRail unread selector (0.0.62)

**Status:** executed.

`RightRailPanel` selected unread notifications with
`s.items.filter(!readAt)` inside the Zustand selector. That allocated a
new array every snapshot, so `useSyncExternalStore` looped
(`getSnapshot should be cached` → Maximum update depth) on every
signed-in chrome surface. Select `s.items` and filter in the component,
same as `AppTopNav`. Map recapture of Library / Studio / Admin /
governance can retry after this.

## 2026-09-04 — Signed-in map recapture blocked (RightRail)

**Status:** blocked (docs only — no PNG overwrite, no version bump).

Re-probed signed-in atlas routes after ViewShell `0.0.60` / `0.0.61`.
Sibling API on `:15011` is healthy, but session cookies are
`Domain=.tahti.live; Secure`, so capture stayed on local Vite +
`VITE_FORCE_MOCK=1`. Every signed-in chrome surface (`/library`, Listen
tabs, Messages, `/governance`, all probed Studio/Admin including
`/studio/governance`, `/admin/governance`, `/admin/agm`) still hits
React “Maximum update depth exceeded”. Stack points at
`RightRailPanel` (`getSnapshot` / Zustand selector
`s.items.filter(!readAt)`). Existing signed-in PNGs left untouched.
Notes: [`docs/todo/map-screenshot-refresh.md`](../../docs/todo/map-screenshot-refresh.md).

## 2026-09-04 — Tahti Map screenshot + diagram refresh

**Status:** executed (docs / atlas only — no app version bump).

Recaptured public Nuclear atlas PNGs under `public/map/nuclear/` via
`scripts/capture-map-screens.mjs` (local Vite + `VITE_FORCE_MOCK=1`; sibling
seeded API was down). New rich shots: Listen, Radio, Discover, Channel,
Help hub + getting-around + keyboard-shortcuts, Settings modal Themes and
Add-ons (About gone from footer). Signed-in Studio / Admin / member
Governance / Library / Messages / Feed recapture hit a React update-depth
loop during concurrent ViewShell WIP — crash overlays were discarded and
those PNGs restored from HEAD.

`mapScreens.ts` / `flowDiagrams.ts` / `NAVIGATION-SITEMAP.md` / ScreenAtlas
Storybook docs now match current chrome (Listen tabs, three governance
contexts, Settings without About). Flag list:
[`docs/todo/map-screenshot-refresh.md`](../../docs/todo/map-screenshot-refresh.md).

## 2026-09-04 — ViewShell 3×5 rounds (listener + Studio + Admin)

**Status:** executed (`0.0.61`).

Round complements after `0.0.60`:

- Stash, Recordings, Events, Updates, Venues, Channel → `ViewShell`
- Chat, Governance, Feature requests, More/map, Transparency → `ViewShell`
- Admin News, Announcements, Top lists, Orphan pages → `ViewShell`

Then push + deploy beta. Remaining entity detail / Pro Editor chrome / remaining Admin still open. [docs/todo/viewshell-next-15-rounds.md](../../docs/todo/viewshell-next-15-rounds.md).

## 2026-09-04 — Tahti Map screenshot + diagram refresh

**Status:** executed (docs / atlas only — no app version bump).

Recaptured Nuclear atlas PNGs under `public/map/nuclear/` via
`scripts/capture-map-screens.mjs` against local Vite + `VITE_FORCE_MOCK=1`
(sibling seeded API was not running; live beta would empty privileged
screens without a real session). Coverage includes Listen tabs, Help hub +
keyboard-shortcuts, Settings modal sections (About removed from footer),
member `/governance`, Studio `/studio/governance`, Admin `/admin/governance`

- `/admin/agm`, and the rest of the mapped Studio/Admin set.

`mapScreens.ts` / `flowDiagrams.ts` / `NAVIGATION-SITEMAP.md` / ScreenAtlas
Storybook docs now match current chrome. Flag list:
[`docs/todo/map-screenshot-refresh.md`](../../docs/todo/map-screenshot-refresh.md).

## 2026-09-04 — ViewShell next 10 (Feed through Library)

**Status:** executed (`0.0.60`).

- Feed, Favorites, Account, Messages, Status → `ViewShell`
- Studio Home, Stats, Playlists (+ editor), Upload, Shows → `ViewShell`
- Library overview + catalog tabs → `ViewShell` (section Tabs outside; dynamic title)
- Admin Users, Streams, Content, Selects, Status → `ViewShell` (`AdminPageLayout` outside)
- Actions / badges / New playlist / New show / Save moved into children; `StudioNav` outside; `px-0 pt-0`
- Live Storybook deploy required on push (`pnpm deploy:tahti-storybook` / `Deploy storybook` workflow)

Still open: remaining Studio (Stash, Recordings, Events, Channel, …) and rest of Admin. [docs/todo/viewshell-next-10.md](../../docs/todo/viewshell-next-10.md), [docs/todo/viewshell-page-headers.md](../../docs/todo/viewshell-page-headers.md).

## 2026-09-04 — Generic Storybook UI sweep

**Status:** executed (`8a8c4544b`). Data and actions kept.

- Listen / Discover → `ViewShell` (short title/subtitle; actions in children; section tabs kept)
- Icon `Tooltip` on UI primitives + chrome (Dialog close, Pagination, PlayerBar, PluginItem, TrackTable, CardsRow, NewsWidget, MediaArtwork, player/rail/search)
- Upload Configure Enable/Disable → `Toggle`
- Label-only segments → `FilterChips`: Admin Top lists, Radio schedule show type, Branding Append/Replace, radio playlist Shuffle/In order, Shows mode + duration
- Empty copy → `EmptyState`: Sounds, Stash, Recordings, Venues, Shows, Stats empties

Tracked: [`docs/todo/storybook-ui-sweep.md`](../../docs/todo/storybook-ui-sweep.md).

## 2026-09-04 — ViewShell batch B (History, Radio schedule, Broadcast, Go Live, Releases)

**Status:** executed.

- History, Radio schedule, Studio Broadcast (Schedule), Go Live, Releases → `ViewShell`
- Actions / status badges / Clear all moved into children; StudioNav outside; short subtitles

Follow-through: Feed through Library in [docs/todo/viewshell-next-10.md](../../docs/todo/viewshell-next-10.md). Remaining Studio/Admin still open.

## 2026-09-04 — ViewShell batch (Help, Radio, Sounds, Collections, Dashboard)

**Status:** executed.

- Help hub, Radio, Studio Sounds, Studio Collections, Admin Dashboard → `ViewShell` (short title/subtitle; actions in children; `StudioNav` / Admin tabs outside; `px-0 pt-0`)
- Icon `Tooltip` pass on remaining listener views/widgets + leftover UI primitives (TopBar nav, TahtiJam, HistoryRow, LogViewer, QueueItem expand, SettingsPanel back, lightbox, radio calendar, etc.)

Still open at time of landing: see batch B below for History / Schedule / Releases follow-through. Remaining: other listener hubs; rest of Studio/Admin; Studio/Admin icon Tooltip lists. [docs/todo/viewshell-page-headers.md](../../docs/todo/viewshell-page-headers.md), [docs/todo/icon-button-tooltips.md](../../docs/todo/icon-button-tooltips.md).

## 2026-09-04 — ViewShell headers + icon-button Tooltip (planned)

**Status:** in progress (batches above).

1. **ViewShell:** remaining list pages from `PageHeader` / `StudioPageHeader` → Storybook `ViewShell`. Entity covers, full-screen player, share canvases, and maximized Pro Editor stay out. [docs/todo/viewshell-page-headers.md](../../docs/todo/viewshell-page-headers.md).
2. **Icon-button Tooltip:** Studio toolbars then Admin / PluginStore. [docs/todo/icon-button-tooltips.md](../../docs/todo/icon-button-tooltips.md).

## 2026-09-04 — Player bar queue, Input startAddon, Radio Save, Studio FilterChips

**Status:** executed (three push rounds → `0.0.59`).

1. Queue button → right-rail Queue (`toggleQueueRail`); waveform seek; title expand; artist → `/u/$username`; compact faded queue; mobile drawer / signed-out panel. Removed `BottomQueueStrip`.
2. Help / Admin Users / Top lists / Storage / Global search / Studio Sounds+Collections / MyDiscography use `Input` `startAddon` SearchIcon. Radio Browser `SaveButton` pins stations onto Listen tiles via `savedBrowserStations`.
3. Studio Stats (+ detail) range / top-list segments → `FilterChips`.

## ## 2026-09-04 — Remove About from Settings footer

Dropped About from the Settings modal `navFooter`. GitHub, Discord, API docs,
and the deployment fingerprint remain. `/about` and Help hub About are unchanged.

## 2026-09-04 — Radio Browser directory in Add-ons (partial)

**Status:** shell + Browser tab executed.

Radio Browser directory uses `ConfigurableCard` + Configure dialog with
Browser | Stations tabs. Browser: `Input` `startAddon` SearchIcon, multi
`FilterChips` genres, flag country `Select`, `tags`→`tagList` API.
Stations: favourites + Finnish suggestions. Activate no longer dumps UI
inline under the card.

### Still open

- Stations `SaveButton` → Listen radio tiles
- Playwright / store smoke

## 2026-09-04 — TopList Storybook on all top lists

**Status:** executed for Admin / Studio / Library. History already compliant.
Discover widget rankings stay `WidgetTrackRow`.

## 2026-09-04 — Player bar queue right rail (in progress)

Lifted `rightRailTab` (+ `toggleQueueRail`) into `layoutStore`.
`RightRailPanel` reads shared tab state. WaveformSeekbar Storybook story
added (`Tahti/Player/WaveformSeekbar`). Bottom strip removal and waveform
seek swap still open.

## 2026-09-04 — Studio Storybook primitive sweep (planned)

**Status:** planned (audit done) — tracked in [`WORKPLAN.md`](WORKPLAN.md)
and [`docs/todo/studio-storybook-sweep.md`](../../docs/todo/studio-storybook-sweep.md).

**Goal:** Studio views, Library-under-Studio routes, and Studio-owned
panels use Storybook `Components/*` / `Tahti/*` where a ready primitive
already matches: `FilterChips`, `Slider`, `Input` (search addon),
`Toggle`, `EmptyState`, `ImageReveal` / `MediaArtwork`, `Badge`. Keep
live data and overlays. Do not invent `SegmentedControl` in this pass.

Does not replace the 2026-09-03 UX sweep (icons, Tooltip help, panel
clones). Search addons overlap the Input sweep — do Studio surfaces here.

### Audit — swap

- **FilterChips (single, labels only):** Stats + StatsDetail 7d/30d/All
  (duplicate strips); Stats top-list dimension/sort; Branding
  Append/Replace; radio playlist Shuffle/In order; broadcast preflight
  type/visibility; Shows SERIES/SINGLE + duration; editor library type;
  schedule frequency days (`multiple`).
- **Input:** Sounds / Collections / Editor library / Library discography
  - collections + ReleasesPanel search without `startAddon` SearchIcon;
    Release detail library dialog (orphan Search/Filter icons beside the
    field); Sounds “Uploaded to” native date (sibling already `Input
type="date"`).
- **Toggle:** Upload Configure Enable/Disable `Button` + ToggleLeft/Right
  icons.
- **EmptyState:** ~15 “No … yet” blocks (Sounds, Releases, Shows, Stash,
  Recordings, Venues, Events, Home, Moderation, Updates, Revenue,
  Distribution, FanTiers, revisions, radio submissions, booking empty,
  schedule empty).
- **ImageReveal / Badge:** MyCollections and ReleasesPanel covers;
  Updates post image; PortInventory status pill.

### Audit — leave

Pro Editor / Channel Designer already on `Slider`. Mastering has no
slider UI. Stats plays bars and booking calendar are not heatmap/clock
charts. Track rows with pin/embed/edit are not `TrackTable`. Icon chips
(`StyleChip`, `TypeChip`, `PerkChip`, Live/Talk) stay until FilterChips
gains an icon slot. Schedule cards/list is icon-only, not FilterChips.

### Slices

1. Stats range + top-list filters → FilterChips
2. Other label-only chip groups
3. Studio search + date Inputs
4. Upload Toggle
5. EmptyState pass
6. Covers + PortInventory Badge

**Chrome:** Studio nav and section tabs stay mounted.

## 2026-09-04 — Remove About from Settings (planned)

**Status:** planned — tracked in [`WORKPLAN.md`](WORKPLAN.md) and
[`docs/todo/settings-remove-about.md`](../../docs/todo/settings-remove-about.md).

**Goal:** Remove the **About** footer link from the Settings modal. Keep
`/about` and Help → About Tahti.

### Today

`ConnectedSettingsModal` `navFooter`: GitHub, Discord, API docs, About
(`/about`), then `SidebarBuildInfo`. About is not a Settings tab.

### Do

Drop the About row, `ABOUT_URL`, and `InfoIcon`. Update Storybook
`DeploymentFooter` docs (GitHub, Discord, API docs, fingerprint). Leave
the public about page.

## 2026-09-04 — Input Storybook sweep (planned)

**Status:** planned — tracked in [`WORKPLAN.md`](WORKPLAN.md) and
[`docs/todo/input-storybook-sweep.md`](../../docs/todo/input-storybook-sweep.md).

**Goal:** Replace remaining hand-rolled fields with Storybook `Input` (or
`Textarea` / `Select` / `CreatableCombobox` / `Slider` / `Toggle` /
`FilePicker` when that is the right primitive). Search and filter fields
embed the icon **in** the control — `startAddon` `SearchIcon`,
`endAddon` `FilterIcon` — not a sibling Search button and not an
absolutely positioned icon over `pl-9`.

### Today

- Many surfaces already use `Input` but leave search bare (Listen
  artists, Studio Sounds, collections, discography, releases, Disco
  widgets, global search).
- Help, Admin Users, Top lists, and Storage overlay `SearchIcon` +
  `pl-9` instead of `startAddon`.
- PluginStore directory searches (Radio Browser, HearThis, personal
  stream) still use a labeled Search `Button` with the icon beside the
  field.
- Native leftovers: Feature Requests comments, Theme Editor hex,
  Studio Sounds “Uploaded to” date, plus a few Governance / tracklist /
  onboarding / preflight fields.

Reference that already embeds the icon: Studio recordings, collection
edit track search, Admin Support/Selects (`endAddon`). Prefer
`startAddon` for search (quiet); keep `endAddon` for filter.

### Leave alone

Hidden inputs, media-upload file pickers, Theme Editor `type="color"`
until a Storybook color field exists, Pro Editor ranges (`Slider`
already planned), Discord bot files unless asked.

**Chrome:** no nav changes.

## 2026-09-04 — Radio Browser directory in Add-ons (planned)

**Status:** planned — tracked in [`WORKPLAN.md`](WORKPLAN.md) and
[`docs/todo/radio-browser-addon-store.md`](../../docs/todo/radio-browser-addon-store.md).

**Goal:** Settings → Add-ons → Radio **Radio Browser directory** matches
the other configurable add-ons: Storybook `PluginStoreItem` plus the
standard configure gear, configuration in that dialog (not an inline dump
on Activate). Split configure into **Browser** and **Stations**. Compact
search with the icon inside the field, multi-genre chips, flag country
dropdown, Save on Stations.

### Today

- `RadioBrowserDirectoryCard` uses `AudioPluginToggleRow` (Activate
  `Toggle` only). **No** `ConfigurableCard` gear — unlike Personal radio
  stream on the same tab.
- Enabling unfolds a tertiary `Box`: Finnish stations banner, then
  `Input` + single genre `Select` + country `Select` (plain names) +
  labeled Search `Button` with `SearchIcon`.
- Favourites go to `libraryStore` (`radio:{id}`). `radioBrowserStore`
  only persists `enabled`.

### Storybook-first

`PluginStoreItem`, `ConfigurableCard` gear (`Button` `icon-sm` +
`SettingsIcon` → `Dialog` “Configure Radio Browser directory”), `Tabs`
(Browser | Stations), `Input` `startAddon` `SearchIcon`, `FilterChips`
`multiple` for genres, `Select` country labels via `flagEmoji` (same as
Settings/Onboarding — not `DropdownButton`), `SaveButton` on Stations,
`EmptyState` / `Loader` / `FavoriteButton`. Add
`Tahti/Settings/RadioBrowserDirectory` (card closed, Browser open,
Stations open) before swapping production.

### Configure tabs

- **Browser** — directory search only. Compact name field (icon in the
  input, Enter to search; drop the extra Search button). Multi-genre
  `FilterChips`. Country `Select` with flag + name. Extend
  `searchStations` with `tags[]` → radio-browser.info `tagList` (today
  is a single `tag`). Finnish suggestions do not live on this tab.
- **Stations** — your favourited Radio Browser channels; Finnish
  station suggestions; `SaveButton` writes the selection to Listen radio
  tiles (`listenerWidgetsStore`), not a second hidden list. Suggest-a-
  station stays the existing Radio-tab create `Button`.

### Card shell

Activate only gates the third-party API. Browsing and station lists open
from the gear, same as other add-ons. Do not keep the large inline Box
under the card.

**Chrome:** Settings modal / Add-ons Radio tab stay mounted.

## 2026-09-04 — Player bar queue on the right rail (planned)

**Status:** planned — tracked in [`WORKPLAN.md`](WORKPLAN.md) and
[`docs/todo/playerbar-queue-right-rail.md`](../../docs/todo/playerbar-queue-right-rail.md).

**Goal:** Player-bar queue button only toggles pressed/enabled. The compact
bar does not grow or swap to `BottomQueueStrip`. Queue fades in on the
**right rail** (if the rail is already open, only switch to the Queue tab).
Seek becomes a **waveform**; title click expands it; artist click opens
`/u/$username`.

### Today (replace)

- `ConnectedPlayerBar` + `bottomQueueOpen` → `BottomQueueStrip` (hides
  NowPlaying, restyles the bar).
- Right rail Queue tab already uses Storybook `QueuePanel` via
  `SidebarQueuePanel`, but tab state is local and the list is full-height.
- Seek is `PlayerBar.SeekBar`. `WaveformSeekbar` has no Storybook story.
- Mobile and signed-out desktop have no right sidebar.

### Storybook-first

`QueuePanel` / `QueueItem`, `ScrollableArea` + `Button` chevrons on overflow,
`PlayerBar` + `NowPlaying`, `RightRailPanel`, `ConnectedPlayerBar`. Add
`Tahti/Player/WaveformSeekbar` (compact / expanded / live) before swapping
seek. Flag then delete `BottomQueueStrip` (explicit replace).

### Queue surface

Compact viewport (named max-height, ~5–7 rows): 1–2 **past** items faded,
current highlighted, upcoming below. Not a full-rail dump. Lift
`rightRailTab` into `layoutStore`. Toggle off restores previous tab if the
rail was already open. Signed-out / mobile: `QueuePanel` popover on the
button — still no bottom strip.

### Player bar

Keep NowPlaying + controls. Waveform seek (`WaveformSeekbar`); live keeps
`PlayerLiveBadge`. Title expands/collapses waveform height. Artist navigates
when `channelSlug` (or username) exists. HearThis embed stays.

**Chrome:** Opening the right rail is intended. Do not unmount left nav or
the compact player.

## 2026-09-04 — Help: keyboard navigation page

Bumped `@tahti-player/tahti-web` to `0.0.58`.

**Status:** executed (hub link + KeyCombo article + Storybook + binding
coverage test). Settings remapping panel still deferred.

**Goal:** Keep global keyboard shortcuts working; surface **Keyboard
navigation** from the Help hub frontpage using Storybook `KeyCombo`.

### Executed

- Help hub `QUICK_STARTS` → `/help/keyboard-shortcuts`
- `HelpKeyboardShortcuts` + `content/keyboardNavigation.ts` (`KeyCombo` rows)
- Storybook `Tahti/Reference/Help center` → `KeyboardNavigation`
- `ConnectedStatusBar` wired in `AppShell` (completes Status Bar plan)
- Smoke coverage: shortcut list matches AppShell bindings

### Still open

- Optional Settings → “Keyboard shortcuts” deep link
- Remapping store for web (player-only today)

## 2026-09-04 — TrackContextMenu on all track listings

Bumped `@tahti-player/tahti-web` to `0.0.58`.

**Status:** first pass executed.

**Goal:** Storybook `TrackContextMenu` + **With Submenu** for playlists;
**Audio tools** submenu when available.

### Executed

- `PlayableTrackContextMenu`: Header, playlist Submenu (filter + add + New
  playlist… → panel), Audio tools (Pro Editor / mastering when enabled)
- `StudioSoundRowMenu`: replaces Studio Sounds expand-more strip (pin,
  Audio tools, delete)
- Storybook docs on ui + tahti-web PlayableTrackContextMenu stories

### Still open

- Queue / History / Favorites / Feed / Discover custom menus if any appear
- Studio Sound detail Quick edits Popover could share Audio tools submenu

## 2026-09-04 — SaveButton + StatChip sweep

Bumped `@tahti-player/tahti-web` to `0.0.57`.

Persist-edit controls now use Storybook `SaveButton` (Idle/Saving/Disabled/custom label): overlay, ledger entry, disco widget edits, radio schedule, show info, newsletter draft, admin radio edits, governance resolution, multicast destination edits, SoundCloud profile URL, multicast dest dialog, and station save. Create actions stay `Button` (Register widget / Add station / Add destination). Studio Sound toolbar stays icon-only (`SaveIcon`) — no room for a labeled control.

Artist/channel follower rows, Studio home summary, stats overview, channel/schedule day cards, track insights, fan-sub summary, admin dashboard/content KPIs, stream manager cells, admin user followers, and storage used/free/total use Storybook `StatChip`. Chart-header totals and grant money stay `StatNumber`. Channel Designer reuses ChannelView’s stats block.

## 2026-09-04 — Listen / Discover CardGrid vs Storybook

Bumped `@tahti-player/tahti-web` to `0.0.58`.

**Status:** executed.

**Goal:** Card-shaped media grids on Listen and Discover match Storybook
`Layout/CardGrid` + `Card`.

### Executed

1. Shared `DirectoryArtistCardGrid` (play / queue confirm / favorite / Live)
2. Listen Discover-artists section uses it
3. Discover → Artists uses it (`DiscoverArtistsGrid`, Live badge)
4. WidgetCard + ListenerWidgets stories document non-CardGrid boundaries
5. CardGrid + CardsRow Storybook docs list production consumers

### Still open / intentional non-Card

- Venues directory, featured Tahti Radio strip, embed iframes, Discover
  `WidgetCard` columns (dense track panels)

## 2026-09-04 — News widget (RSS slider)

Bumped `@tahti-player/tahti-web` to `0.0.56`.

Listen Add-ons now includes **News**: configure a title, RSS/Atom URL, thumbnail, and whether it shows on Listen, Discover, or both. The Storybook `NewsWidget` slider renders the feed (header mark + article cards). Sibling `GET /api/me/rss-feed?url=` proxies the XML with SSRF guards; mock Vite uses fixture articles.

## 2026-09-04 — Player bar → Storybook PlayerBar (planned)

**Goal:** Rework the compact (and where it makes sense, full-screen) player
chrome so elements use the official Storybook / `@tahti-player/ui` `PlayerBar`
compound components wherever they already fit — do not hand-roll a second
seek bar, volume, now-playing, or transport cluster.

**Storybook reference:** `Layout/PlayerBar` (`packages/storybook/src/PlayerBar.stories.tsx`)
— `PlayerBar` root + `PlayerBar.NowPlaying` / `.Controls` / `.Volume` /
`.SeekBar`.

**Current state (`ConnectedPlayerBar.tsx`):** already wires `PlayerBar`,
`NowPlaying`, `Controls`, and `Volume`. Still custom:

- Seek via `ConnectedSeekBar` / `PlayerSeekBar` instead of composing
  `PlayerBar.SeekBar` (or a thin store-connected wrapper around it)
- Right-cluster full-screen + queue toggle as plain `Button`s (queue badge
  included) — keep Tahti-only behavior, but align visuals/slots with the
  Storybook bar pattern where a matching slot exists
- HearThis embed strip + live badge + bottom queue strip stay host-owned
  (no Storybook equivalent)

**Also scan:** `FullScreenPlayer.tsx` and any other transport chrome that
duplicates PlayerBar pieces.

**Constraint:** Keep live/archive/HearThis/queue-strip behavior and
persistent chrome rules; swap primitives, do not drop features to match a
simpler demo.

## 2026-09-04 — MediaArtwork thumbnails vs Storybook update

Bumped `@tahti-player/tahti-web` to `0.0.56`.

**Storybook / `@tahti-player/ui` MediaArtwork contract (current):**

- Size presets: `sm` | `thumb` | `md` | `lg` | `fill`.
- **`thumb`** is the standard inline track-row thumbnail (step up from `sm`).
- Queue / favorite / extra `actions` overlays only render on **`lg` and `fill`**
  (crowding rule). On `sm` / `thumb` / `md`, pass play (+ optional artwork
  click) only; put queue/favorite in the row chrome.
- `ImageReveal` runs for every size except `sm`.
- Track tables already use `size="thumb"` (`ThumbnailCell`).

### Usages scanned — inconsistencies

| Location                                                                        | Issue                                              | Change                                                                                                                              |
| ------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `PluginStorePanel` HearThis tracks                                              | `size="sm"` + dead `onQueue`                       | → `thumb`; queue as row button                                                                                                      |
| `PluginStorePanel` personal radio                                               | `size="sm"` + dead `onQueue`/`onFavorite`          | → `thumb`; queue/fav as row buttons                                                                                                 |
| `PluginStorePanel` HearThis collections                                         | `size="sm"` (static)                               | → `thumb`                                                                                                                           |
| `HistoryRow`                                                                    | `size="sm"` + dead `onQueue` (Plus already in row) | → `thumb`; drop artwork queue                                                                                                       |
| `FeedView` track/release cards                                                  | `size="fill"` + queue (OK)                         | leave                                                                                                                               |
| `Card` / `ThumbnailCell` / TopArtists                                           | already correct                                    | leave                                                                                                                               |
| `WidgetTrackRow`                                                                | hand-rolled `ImageReveal` + play overlay           | → `MediaArtwork` `thumb`                                                                                                            |
| `CollectionTrackList`                                                           | hand-rolled cover + play                           | → `MediaArtwork` `md`                                                                                                               |
| `MyDiscographyView` / Studio lists / GlobalSearch / Smart links / Library media | `ImageReveal` or bare `<img>` thumbs, no play      | worklog follow-up: prefer `MediaArtwork` `thumb`/`sm` when playable; keep `ImageReveal` for non-interactive list art only if needed |
| `RadioView` / `ReleasesPanel`                                                   | `MediaIconActions` beside plain thumbs             | follow-up: artwork → `MediaArtwork` where play exists                                                                               |

### Executed this pass

- `PluginStorePanel` HearThis collections → `thumb`
- `PluginStorePanel` HearThis tracks → `thumb` + row `ListPlus` queue
- `PluginStorePanel` personal radio → `thumb` + row queue/`FavoriteButton`
- `HistoryRow` → `thumb`; dropped dead artwork `onQueue`
- `WidgetTrackRow` → `MediaArtwork` `thumb` (replaced hand-rolled reveal + play)
- `CollectionTrackList` → `MediaArtwork` `md` (replaced hand-rolled cover + play)
- Storybook docs note on secondary overlays (`lg`/`fill` only)

### Follow-up (still open)

Non-playable list art (`MyDiscographyView`, Studio collections, GlobalSearch,
Smart links, Library media) and `RadioView`/`ReleasesPanel` beside
`MediaIconActions` — migrate when those rows gain play, or to `thumb`/`sm`
without overlays for visual consistency.

## 2026-09-04 — Sticky notification toasts

Bumped `@tahti-player/tahti-web` to `0.0.55`.

Must-acknowledge notices use Storybook `Toaster` via `showNotificationToast({ sticky: true })` (infinite duration, Acknowledge action). Closing the toast only hides it; the inbox keeps the item until Acknowledge (`PATCH /:id/read`). Opening the bell marks non-sticky unread via `read-all`. Sibling API `POST /api/me/notifications/read-all` now skips sticky rows.

Removed `StickyNotificationBanner`. `NotificationToasts` stays mounted next to `Toaster` in `AppShell`.

## 2026-09-04 — PluginStoreItem / ThemeStoreItem consistency (audit + fix)

Bumped `@tahti-player/tahti-web` to `0.0.54`.

**Rule:** Add-ons listings and their configure headers use Storybook
`PluginStoreItem`. Theme listings use Storybook `ThemeStoreItem`. Do not
hand-roll store rows or use `PluginItem` (installed-runtime chrome) inside
the Add-ons browser.

### Inconsistencies found

1. **Themes (Add-ons)** — already `ThemeStoreItem` (OK).
2. **Themes (Settings → Themes browse)** — hand-rolled palette buttons /
   cards instead of `ThemeStoreItem` (built-in + imported).
3. **Visualizers** — hand-rolled `Box` rows with icon/Use/Configure instead
   of `PluginStoreItem`.
4. **Personal radio stream** — hand-rolled `Box` header inside
   `ConfigurableCard` instead of `PluginStoreItem`.
5. **Multicast destinations** — `PluginItem` instead of `PluginStoreItem`.
6. **Audio plugins / Radio Browser toggle rows** — `PluginItem` + `Toggle`
   instead of `PluginStoreItem` (+ accessory toggle).
7. **Curated radio stations** — `PluginItem` with enable/play accessories
   instead of `PluginStoreItem`.
8. **Disco-widget installs** — `PluginItem` instead of `PluginStoreItem`
   (browse store already correct).
9. **Service / HearThis / Spotify / export cards** — already
   `PluginStoreItem` in `ConfigurableCard` headers (OK).
10. **Listen add-ons / Discord** — already `PluginStoreItem` (OK).
11. **`PluginStoreItem` API gap** — no accessory slot for enable/configure/
    play controls that sit beside the install CTA (needed for radio,
    multicast, audio toggles, visualizer configure).

### Fix executed

- Added optional `accessory` to `PluginStoreItem` and `ThemeStoreItem`.
- Converted visualizers, personal radio header, multicast, audio toggles,
  curated radio, disco installs, and Settings → Themes browse to the
  matching store components. Configure dialogs / `ConfigurableCard` gear
  kept; listing chrome only.

## 2026-09-04 — Add-on store header info + ThemeStoreItem

Bumped `@tahti-player/tahti-web` to `0.0.53`.

Verified every Add-ons category (and the top-level Add-ons header) has an info
control that reveals the former always-visible description. Removed those
always-visible subtexts. Themes listings use Storybook `ThemeStoreItem`
(apply/active; remove only for custom). UX sweep: `EmptyState` / `Box` /
`PluginItem`+`Toggle` / Nuclear `Input` on empty gates, visualizer cards,
audio plugin rows, Installed/Available empties, and Disco-widget manager.

## 2026-09-04 — Radio Helsinki logo upload + catalog asset

Bumped `@tahti-player/tahti-web` to `0.0.52`.

**Bug:** Station cover edit used Nuclear `Button` `icon-sm` (`size-8`) over a
`size-full` overlay; Tailwind kept the 32px control, so most of the logo
was not clickable. Uploads also forced `image/png` when MIME was empty or
`image/jpg`, which broke prepare/complete for real JPEG/WebP files.
Catalog logos hotlinked `streamurl.link` (HTTP 403). Persist treated a
failed admin `iconUrl` PATCH as success when a local catalog override was
written. Relative `/radio-logos/…` paths also fail Zod `.url()` on PATCH.

**Fix:** Full-bleed native overlay on `RadioStationCover`; compact corner
control still used on Listen cards. Shared `resolveImageUploadContentType`
(+ clear SVG/GIF/HEIC errors). Absolute-ize same-origin logo paths before
preset PATCH; surface API error bodies. Self-hosted official RH playmark at
`public/radio-logos/radio-helsinki.png`; Admin “Use catalog logo”.

**Worklog (planned):** `docs/todo/image-upload-hover-lightbox.md` — hover X
delete-with-confirm + large preview modal (slideshow strip) on every set
image upload widget.

## 2026-09-03 — Storybook-first leftovers (ten slices)

Bumped `@tahti-player/tahti-web` to `0.0.51`.

Added standing instructions: prefer Storybook components; keep live data and features; add missing components to Storybook with states flagged; mark unused stories as orphans.

**Slice 1 — Channel editor mock actions:** Play / Favorite preview pills use `Badge`.

**Slice 2 — Collection cover:** Slideshow image count overlay uses `Badge`.

**Slice 3 — Player bar:** Queue length overlay uses `Badge`.

**Slice 4 — Image lightbox:** Gallery photo uses `ImageReveal`.

**Slice 5 — Library media:** Thumbs use `ImageReveal`; Image/Video overlay uses `Badge`.

**Slice 6 — Sounds list:** Cover thumbs use `ImageReveal`.

**Slice 7 — Smart links:** Artwork uses `ImageReveal`; empty list uses `EmptyState`.

**Slice 8 — Collections list:** Covers use `ImageReveal`; empty and no-match use `EmptyState`.

**Slice 9 — Global search:** Result thumbs use `ImageReveal`; searching uses `Loader`; no results use `EmptyState`.

**Slice 10 — Storybook flags:** CardsRow documented as unused in tahti-web (overlay slot missing). Combobox missing disabled/empty/error states. ImageLightbox empty gallery flagged.

**Validation:** tahti-web type-check and eslint on the touched files. Browser-checked Library media, Sounds, search, and the player-bar queue count.

## 2026-09-03 — Persistent-chrome and leftover tabs + badges (ten slices)

Bumped `@tahti-player/tahti-web` to `0.0.50`.

**Slice 1 — Listen:** Listen / Feed / Favorites / History use `Tabs`.

**Slice 2 — Library:** Sounds / Collections / Recordings / Media / Stash / Embeds / Smart links use `Tabs`.

**Slice 3 — AdminNav:** Overview / Community / Content / Manage section tabs use `Tabs` (`data-admin-section-tabs` stays on the layout wrapper).

**Slice 4 — SectionTabs:** Admin submenu Links use `Tabs` + `navigate`.

**Slice 5 — Stash:** All stash / Move to stash use `Tabs`.

**Slice 6 — Show detail:** Overview / Episodes / Recordings use `Tabs`.

**Slice 7 — 24/7 programme:** Programme / Active rotation use `Tabs`.

**Slice 8 — Right rail:** Chat / Notifications use `Tabs` when expanded; collapsed icon buttons stay buttons.

**Slice 9 — AppTopNav:** Unread notification and message counts use `Badge`.

**Slice 10 — Membership, rail counts, Discover Live:** Active-member pill, rail unread counts, and Discover Live use `Badge`.

No remaining hand-built `role="tablist"` strips in tahti-web. StudioNav stays wrap `Link`s, not a tablist.

**Validation:** tahti-web type-check and eslint on the touched files. Browser-checked Listen, Library, Admin, and Stash; Listen and Studio chrome stayed selected.

## 2026-09-03 — In-page tab strips to Nuclear Tabs (ten slices)

Bumped `@tahti-player/tahti-web` to `0.0.49`.

**Slice 1 — Branding:** Branding / Gallery / Press kit / Channel Designer use `Tabs`.

**Slice 2 — Public channel:** Overview / Manage uses `Tabs`.

**Slice 3 — Studio Channel sections:** Setup / Green room / Selects use `Tabs`.

**Slice 4 — Studio Radio settings:** Stream / 24/7 / Announcements / Pinned / Tahti Radio / Multicast use `Tabs`.

**Slice 5 — Pro Editor stems:** Two-stem / four-stem split type uses `Tabs`.

**Slice 6 — Artist profile:** Music / Releases / Collections / Gallery / Design use `Tabs`.

**Slice 7 — Discover:** Discover / Artists / Venues use `Tabs` (route search still drives the selected tab).

**Slice 8 — Radio schedule:** Tahti Radio / My channel uses `Tabs`.

**Slice 9 — Studio Stats:** Overview / Plays & listeners / Top lists use `Tabs`.

**Slice 10 — Studio Governance:** Motions / Topics use `Tabs` (query-string routes still highlight).

Still open from the reuse audit: persistent-chrome tablists (Listen, Library, AdminNav, `SectionTabs`) plus in-page strips on Stash, show detail, and 24/7 programme.

**Validation:** tahti-web type-check and eslint on the touched files. Browser-checked Branding, Channel, Discover, Stats, and Governance tabs.

## 2026-09-03 — Hide chrome scrollbars on tight widths

Bumped `@tahti-player/tahti-web` to `0.0.48`.

On slightly narrower desktop widths the main pane painted a classic vertical scrollbar, then a 1–5px horizontal twin once that bar stole width from `min-width: 100%` layout children. Chrome still scrolls; native bars are hidden on the main shell, tab strips, sidebar, and right rail. Studio/Admin layouts no longer force `min-width: 100%`. Wheel/trackpad scrolling still works. Listen, Library, and Studio chrome stayed mounted at ~926px.

**Validation:** browser check at compact desktop width on Listen, Library sounds, and Studio. Deployed to beta after push.

## 2026-09-03 — Remaining switches, tabs, chips, and panels (eight slices)

Bumped `@tahti-player/tahti-web` to `0.0.47`.

**Slice 1 — Go Live recording:** Record broadcast uses Nuclear `Toggle` instead of a hand-built switch.

**Slice 2 — Add-ons audio plugins:** Plugin Store audio-plugin enable/disable uses `Toggle`.

**Slice 3 — Plugin Store catalogs:** Installed/Available filters for add-on categories and internet radio use `Tabs`.

**Slice 4 — Listen add-ons picker:** The Listen widget picker Installed/Available filter uses `Tabs`.

**Slice 5 — Stream manager:** Active rotation / Stream stats / Overlay uses `Tabs`.

**Slice 6 — Pro Editor filter type:** Mode selection uses `FilterChips`, with a curve preview for the active mode.

**Slice 7 — Admin artwork presets:** Raw `<h1>` header replaced with `StudioPageHeader`.

**Slice 8 — Transparency:** YTD, grants, and ledger sections use `SectionShell`; stat tiles use `Box`.

No remaining hand-built `role="switch"` rows in tahti-web. Still open from the reuse audit: in-page `role="tablist"` strips on Branding, Channel, Pro Editor stems, and a few public pages.

**Validation:** tahti-web type-check and eslint on the touched files. Deployed to beta after push.

## 2026-09-03 — Help center Nuclear primitives + Storybook surface

Bumped `@tahti-player/tahti-web` to `0.0.46`.

Reworked `/help` onto shared Storybook/Nuclear components: `Box`, `Badge`, `Button`, `Input`, `Tabs`, `SectionShell`, and `EmptyState`, plus `StudioPanel` for the documents library. Guide cards and article sections no longer use hand-rolled bordered panels. Getting-around / playlists copy now matches current Listen / Favorites / Library / Studio chrome. Added `Tahti/Reference/Help center` stories and a shared `withPageSurface` decorator so fullscreen Storybook pages get the live app background and padding (applied to Latest view surfaces too) instead of looking flush/transparent against the canvas.

## 2026-09-03 — Remaining confirm prompts (five slices)

Bumped `@tahti-player/tahti-web` to `0.0.45`.

**Slice 1 — Studio branding, releases, share links:** Replacing a gallery, removing a release track, and revoking a sound share link use `ConfirmDialog`.

**Slice 2 — Go Live and editor:** Removing an RTMP destination and deleting a multitrack editor project use `ConfirmDialog`.

**Slice 3 — Venues and moderation:** Cancelling a venue booking and removing a moderator use `ConfirmDialog`.

**Slice 4 — Admin storage, news, streams:** Permanent file delete, news-post delete, and live-stream restart/offline use `ConfirmDialog`.

**Slice 5 — Library media and pinned announcements:** Removing a media file or unpinning an announcement use `ConfirmDialog`.

Also shipped in this bump: Listen sidebar stays selected on Feed and other Listen child routes (`navigationActive` + shared `SidebarNavItems`); persistent chrome visibility instructions; Governance shows published meetings, documents, quarterly reports, the member directory, and whether you voted with the advisory majority or minority.

No remaining `window.confirm` call sites in tahti-web. Still open from the reuse audit: Go Live and Plugin Store `role="switch"` rows that should be Nuclear `Toggle`.

**Validation:** tahti-web type-check and eslint on the touched files. Deployed to beta after push.

## 2026-09-03 — Confirm dialogs, Pro Editor controls, and Tabs (five slices)

Bumped `@tahti-player/tahti-web` to `0.0.44`.

**Slice 1 — Image lightbox:** `ImageLightbox` uses Nuclear `Dialog.Root` for focus trap and Escape, keeping arrow-key gallery navigation.

**Slice 2 — Confirm prompts:** Added shared `ConfirmDialog` and wired gallery, announcements, stash delete, API token revoke, disco-widget delete, and Studio posts delete (no more `window.confirm` on those paths).

**Slice 3 — Pro Editor enable:** Plugin enable/disable uses `Toggle`.

**Slice 4 — Pro Editor params:** Master gain, EQ, compressor, limiter, and filter frequency use `Slider`.

**Slice 5 — Folder/scope tabs:** Studio Sounds and Posts use `Tabs`; Admin Disco Widgets scope filter uses `FilterChips`.

**Validation:** tahti-web type-check. Deployed to beta after push.

## 2026-09-03 — Storybook reuse-audit leftovers (five slices)

Bumped `@tahti-player/tahti-web` to `0.0.43`.

**Slice 1 — Library sounds chrome:** `MyDiscographyView` uses `FilterChips`, `Input`, and `Select`. Collection track rows use `FavoriteButton`.

**Slice 2 — Copy actions:** AGM agenda builder and MusicBrainz metadata copy use `CopyButton` (with cleanup) instead of hand-rolled clipboard + timeout.

**Slice 3 — Empty states:** `StashFilesPanel`, `ChannelChatPanel`, and `AddToPlaylistPanel` use `EmptyState` (Add-to-playlist wires New in the action slot).

**Slice 4 — Genre pickers:** `GenrePicker` chips are `FilterChips`; `SubgenreTagInput` uses `CreatableCombobox` instead of a native datalist.

**Slice 5 — Theme editor hue:** `ThemeEditor` hue control uses Nuclear `Slider`.

Still open from the Sept 2 reuse audit: Pro Editor `type="range"` / role=switch rows, many `window.confirm` call sites, ImageLightbox focus trap, and assorted hand-rolled tablists.

**Validation:** tahti-web type-check and eslint on the touched files. Deployed to beta after push.

## 2026-09-03 — Listen nav active state + screenshot recapture

Bumped `@tahti-player/tahti-web` to `0.0.42`.

Desktop Listen now stays selected on Feed, History, channel, chat, and track routes. Desktop and the mobile drawer share one nav tree so a tab group cannot go fully dark. Favorites remains a sibling (not a second Listen highlight). Studio/Admin subtabs that previously had no selected item now map onto an existing destination or, for unknown admin URLs, stay unlit instead of pretending Overview is current.

**Validation:** `navigationActive` + StudioNav unit tests; Playwright listen chrome check; recaptured Nuclear map shots for Listen/Radio/Discover and related tab surfaces.

## 2026-09-03 — Loader + remaining selection Toggles (five slices)

Bumped `@tahti-player/tahti-web` to `0.0.41`.

**Slice 1 — Discover widget play:** `WidgetTrackRow` shows Nuclear `Loader` while resolving a track for play.

**Slice 2 — Channel stream play:** `ChannelView` stream play/pause control uses `Loader` while the stream is loading.

**Slice 3 — Admin live streams refresh:** `AdminStreamManagerPanel` refresh button swaps to `Loader` while reloading.

**Slice 4 — API tokens:** “Allow write access” on new-token create is a `Toggle`.

**Slice 5 — Import and radio row select:** `StudioRadioSubmissionPanel` track picks and `PluginStorePanel` Spotify/HearThis import multi-select use `Toggle` instead of native checkboxes.

**Validation:** tahti-web type-check and eslint on the touched files. Deployed to beta after push.

## 2026-09-03 — Setting checkboxes to Nuclear Toggle (five slices)

Bumped `@tahti-player/tahti-web` to `0.0.40`.

**Slice 1 — Channel designer:** visualizer audio-reactive, separate player gradient, and slideshow autoplay use `Toggle`.

**Slice 2 — Add-ons:** visualizer preview/configure audio-reactivity and multicast destination enabled use `Toggle`. Import row multi-select stays checkboxes.

**Slice 3 — Disco widgets:** Listen enable and configure “show on Listen” use `Toggle`.

**Slice 4 — Posts newsletter:** “Fans / subscribers only” uses `Toggle`.

**Slice 5 — Admin user:** “Association member” uses `Toggle`.

**Validation:** tahti-web type-check and eslint on the touched files.

## 2026-09-03 — Audio file revisions + studio Stripe/e2e alignment

Bumped `@tahti-player/tahti-web` to `0.0.39`.

Studio track details (and the track edit dialog) list every audio revision: upload a replacement file as a new version (`POST /api/me/archive/:id/versions/prepare` + `complete`, not activated until you choose it), preview any READY version in the player, and compare two with Play A / Play B / Switch A/B (keeps the playhead). Editor quick-fixes and Pro Editor “save as new revision” land in the same list.

Also aligned Studio sitemap/Storybook with Stripe (gated) and Import instead of `/sources`, converted Audience/Stripe/Upload chrome to Nuclear `Tabs`/`Badge`/`PageLoading`/`Loader`, and tightened the fan-sub e2e so subscribe stays on the mocked Checkout path.

**Validation:** `AudioRevisionList` unit test, tahti-web type-check and eslint on the touched files. Browser-checked mock Studio track details: upload, preview, compare, activate.

## 2026-09-03 — Admin forms, stash, and remaining Toggles

Five slices after the docs-sync + mock original-file batch. Bumped `@tahti-player/tahti-web` to `0.0.38`.

**Slice 1 — Languages CSV:** `AdminI18nView` opens a `FilePicker` dialog to import a translation CSV instead of a hidden file input.

**Slice 2 — Announcements:** Clip enable and system on/off are `Toggle`; schedule is `Select`; every-Nth count is `Input`.

**Slice 3 — AGM:** Meeting type, meeting state, and document type use `Select`; “Publish immediately” is `Toggle`.

**Slice 4 — Stash files:** Upload uses `FilePicker`; share-with is `Input`. Permission and expiry were already `Select`.

**Slice 5 — Remaining Toggles:** Show auto-archive and episode normalize; playlist public/collaborative (create, edit, add-to-playlist); branding press-kit include switches. Avatar and gallery still use click-on-preview file inputs (media-upload convention), not a dropzone.

**Validation:** tahti-web type-check and vitest. Deployed to beta after push.

## 2026-09-03 — Docs sync + mock original-file downloads

Caught up FEATURES / GAP / sitemap / MOCKS / README / map copy after the Broadcast rename and native-control sweep. Mock uploads now register in `mock-uploads.ts` so `/t/:id` and public download can return the original file (not `DEMO_MP3`) once the track is public. Live download tries `?format=source` then the default gate; the track page sets `download` on the save link. Top bar vs Studio Upload accessible names no longer collide. Playwright helper `e2e/helpers/mockStripe.ts` can inject session fan-sub/track payout and audit rows for the journey spec.

Still open on that spec: à la carte Buy, product-level subscribe→order/audit (helper is test-only), and board-gated logs without the helper.

**Validation:** tahti-web type-check and vitest. Bumped `@tahti-player/tahti-web` to `0.0.36`.

## 2026-09-03 — Native-control sweep (five slices)

**Slice 1 — Go Live preflight fields:** `BroadcastPreflightPanel` show name, episode, and tagline use shared `Input`.

**Slice 2 — Top-nav search:** `GlobalSearch` uses shared `Input` (`type="search"`) and `Button` for clear, keeping combobox keyboard behavior.

**Slice 3 — Broadcast dialog toggles:** `/studio/schedule` auto-archive and episode-numbering checkboxes are `Toggle`; venue and location use `Input`.

**Slice 4 — Fan-tier access:** `AudienceVisibilitySection` stash-tier picks are `Toggle` rows instead of native checkboxes.

**Slice 5 — Collection + track settings:** “Others can add tracks” on collection create, and allow-downloads / allow-comments on the archive track page, use `Toggle`.

**Validation:** tahti-web type-check and vitest. Bumped `@tahti-player/tahti-web` to `0.0.35`.

## 2026-09-03 — Fan-sub vs track-purchase e2e + worklist

Playwright `e2e/fan-sub-and-track-purchase.spec.ts` drives: artist uploads `riff.wav`, a fan subscribes, another fan tries to buy the track separately, both downloads must match the original WAV, artist Audience must show both orders, board audit log must record them. Run against mock Vite (`PLAYWRIGHT_BASE_URL=http://127.0.0.1:5180`). Gaps are listed under WORKPLAN; mock original download, public `/t/:id` for uploads, and upload button names closed in the docs-sync batch above. The spec still fails on à la carte Buy and product-level orders/audit.

## 2026-09-03 — Broadcast schedule + stream playlist batch (five slices)

**Slice 1 — Stream manager status pill:** `StreamManagerPanel` uses `Badge` (animated green dot + pill) for Live/Playing/Paused/Stopped instead of a hand-rolled span.

**Slice 2 — Rotation highlight + preview in Go Live:** `ChannelRotationEditor` on the stream manager receives `currentItemId`, `isPlaying`, and `onPlay` so the active rotation track is highlighted and archive tracks can be previewed in the bottom player.

**Slice 3 — Rotation highlight in channel playlist:** `ChannelRadioPlaylistPanel` passes preview playback state from `playerStore` into the same editor.

**Slice 4 — Schedule → Broadcast + programme on page:** Studio nav label is now “Broadcast” (`studio.schedule` i18n). `/studio/schedule` page title matches; `ChannelRadioPlaylistPanel` is embedded below analytics so 24/7 rotation is manageable from the broadcast page.

**Slice 5 — Admin governance form controls:** Board resolution create form uses `Input`, `Select`, and `Textarea` from `@tahti-player/ui`.

**Validation:** tahti-web type-check and vitest. Bumped `@tahti-player/tahti-web` to `0.0.34`.

## 2026-09-03 — Cross-repo doc audit + doc-hygiene batch (five slices)

Audited `../tahti` vs this package after the Node 24 CI push. Full findings are summarized here; canonical pointers live in [docs/CROSS-REPO-SYNC.md](docs/CROSS-REPO-SYNC.md).

**Conflicts to remember:** governance has three beta contexts (member `/governance`, artist `/studio/governance`, board `/admin/governance`) while `../tahti` site-map still documents only `/governance` + `/dashboard/governance`; €4.45 fan-sub net is in `engagement-and-fansubs.md` but `../tahti/docs/flows/payouts.md` warns it may not match live Stripe `balance_transaction` yet; `CONVERSION-QUEUE.md` previously said admin pages were `missing` while `FEATURES.md` lists 22 shipped; sibling ops docs still say checkout path `tahti-player` instead of `tahti-nuclear`.

**Slice 1 — CROSS-REPO-SYNC.md:** One-page map of sibling paths, prod↔beta routes, money-flow sources, branch/pnpm differences, and which local files are authoritative for status.

**Slice 2 — API + earnings caveat:** `docs/API-REFERENCE.md` now lists fan-sub payout and Revelator royalty routes; earnings help cites the sibling payout runbook instead of treating €4.45 as a guaranteed bank figure.

**Slice 3 — CONVERSION-QUEUE archived:** Banner points readers at `FEATURES.md` / `WORKPLAN.md`; historical rows updated (stats detail, press kit, listener dashboard, admin shipped).

**Slice 4 — Sidebar footer:** Help center and Settings sit in a separated footer group (`mt-auto`, top border) on desktop and mobile drawer via `SidebarNavItems`.

**Slice 5 — Discover widget play state:** `WidgetTrackRow` rings/highlight current tracks, shows Pause while playing, and toggles play/pause without restarting.

**Validation:** tahti-web type-check and vitest. Bumped `@tahti-player/tahti-web` to `0.0.33`.

## 2026-09-03 — Studio Stripe dashboard (gated)

**Completed:** Studio → Stripe (`/studio/stripe`) is the payout-account dashboard: Connect status, onboarding, Express dashboard login, and fan-sub charges for this account. The Stripe nav item and home tile appear **only** when `GET /api/me/fan-subs/connect` reports `stripeConfigured`. Direct visits while Stripe is off explain that the dashboard is not added. Audience keeps orders/grants and links through when Stripe is on. Connect return (`fanConnect`) lands on `/studio/stripe`. Bumped `@tahti-player/tahti-web` to `0.0.32`.

## 2026-09-03 — Artist order management slices 2–6

Fifth revenue batch (five slices after slice 1). Deployed `@tahti-player/tahti-web` **0.0.31** to beta after push.

**Slice 2 — Distribution royalties in payout history:** `mergeRevenueOrders()` (`lib/revenueOrders.ts`) mixes `GET /api/me/fan-sub-payouts` recent rows with `GET /api/me/revelator/royalties`, sorts newest first, caps at twelve — same contract as production `/dashboard/revenue`. Studio → Audience and Settings → Money → Fan subs both use the merged list.

**Slice 3 — Empty state when no fan tiers:** Overview tab shows a setup card (not a blank table) when `GET /api/me/fan-tiers` returns none, with links to Settings → Fan tiers and the in-page Tiers tab.

**Slice 4 — Stripe Connect warning:** When tiers exist but Connect is not payments-ready, a red notice points artists to finish onboarding or open Settings → Fan subs — matching production’s “Stripe isn’t connected yet” banner.

**Slice 5 — Payout history table parity:** Renamed “Latest orders” to “Payout history”; columns are Date, Description, Gross, Net, State. Fan-sub and royalty rows share one list; pending fan-sub nets show `—` like production. Footnote links subscriber CSV export to Settings → Fan subs.

**Slice 6 — Settings Money panel stays in sync:** `MoneyPanel` fetches royalties too so the Fan subs settings tab shows the same merged payout history as Studio → Audience.

**Validation:** tahti-web type-check and vitest pass. Bumped `@tahti-player/tahti-web` to `0.0.31`.

## 2026-09-03 — Artist order management help layer

**Completed (slice 1):** Studio → Audience (`/studio/revenue`) is the player order-management surface against sibling `GET /api/me/fan-sub-payouts` and the money-flow in `../tahti/docs/engagement-and-fansubs.md`. Latest orders, KPI stats, and the documented €5 split (Stripe ~€0.45, Tahti 2% ops, artist €4.45) sit on one page. Help icon / `H` walks stats → orders → flow → earnings link → Connect. Help center article `earnings` (Artist tools) and a header link open the same guide. Bumped `@tahti-player/tahti-web` to `0.0.30`.

**Left for later:** None — slices 2–6 shipped in the batch below.

## 2026-09-03 — CI tests and mock inventory

**Completed:** GitHub CI `pnpm test` failed on `@tahti-player/tahti-web` because `LanguageSwitcher.test.tsx` imported testing-library packages the package does not declare, `locale.test.ts` ran in node without `localStorage`/`document`, and Discover asserted that `min-h-[280px]` was gone even though widget cards still use that height. Rewrote the language-switcher test to the same jsdom/`createRoot` pattern as Discover, marked locale tests jsdom, and asserted the add-widget control lives in the header. Refreshed the Mock / stub / unwired inventory so Favorites/History point at Listen (still localStorage) and Help lists the artist gallery article.

## 2026-09-03 — Library as a Studio tab

**Completed:** Library is no longer a sibling of Studio/Perform. `SUBMENUS['/library']` folded into Studio (Library, Sounds, Collections, Releases, Upload, Editor). `/library*` routes stay; Studio stays selected. Mobile bottom nav still has Library. Favorites stay on Listen (`/listen/favorites`); the Library-only `FavoritesPanel` is gone and `/library/favorites` still redirects. Governance Playwright covers Settings → Account member governance, Studio Governance Motions/Topics, and Admin Governance/AGM Community. Bumped `@tahti-player/tahti-web` to `0.0.29`.

**Left for later:** Expandable player row with full transport controls on Go Live (compact row already ships); dedicated replay affordance beyond rotation preview play.

## 2026-09-03 — Artist-page Channel Designer element menu

**Completed:** Artist Design no longer wraps Channel Designer in `ChannelControlsWidget`. The element menu is releases, tracks, latest, feed, news, player, and backdrop. Old look-only menus (player-design / visual-style / links / text-overlay) fold into that menu — overlay under player, header + page colors under backdrop. Channel page edit mode opens the same element editor instead of the accordion. Live `PATCH /api/me/channel/visual` now sends only `ChannelVisualPatchSchema` fields; designer-only extras (links, overlays, player/background palettes) persist locally. Artist page hides those blocks when the eye toggle is off; feed uses `GET /api/channels/:slug/posts` and news uses pinned announcements. Bumped `@tahti-player/tahti-web` to `0.0.28`.

## 2026-09-03 — Settings / Branding / Radio IA

**Completed (first slice):** Gallery left Settings → Artist. Studio → Branding now owns Branding, Gallery, Press kit, and Channel Designer. Channel outlook is gone. Settings → Channel & design → Appearance is a wayfinder to that single designer. `/studio/channel?tab=design` (and the stale `profile` tab) redirect there. Perform no longer has a Multicast sibling — multicast is a Radio subtab (`/studio/channel?tab=multicast`). Channel keeps Setup / Green room / Selects so those are not orphans. Channel Designer dropped the extra inner heading and the right-side sticky design menu; preview and controls stack in one grid. Bumped `@tahti-player/tahti-web` to `0.0.27`.

**Left for later slices:** Artist-page Channel Designer is still the old look-only editor; its element list should become releases, tracks, latest, feed, news, player, backdrop. Library as a Studio tab and the stream playlist manager stay later leftovers, not this item.

## 2026-09-03 — Source capability contracts (OAuth / search / tool)

**Completed:** Import sources are three adapter families instead of one fake start/status/import shape. Settings → Add-ons (the host that replaced Sources) and Studio Upload call `oauth` / `search` / `tool` adapters; Bandcamp album import, SoundCloud track import, Spotify search, and hearthis search/import keep their existing provider-specific flows. Sibling `GET /api/me/import-plugins` now lists the same catalog. `ExportProvider` remains metadata/deep-link only — Tahti still has no submit/status/webhook export routes.

## 2026-09-03 — Branding gallery: drop count copy, icon-only upload, help in Help

**Completed:** Studio → Branding → Gallery no longer shows “N images in gallery” or the labeled Add images button. Upload is the existing plus icon (`aria-label="Upload more gallery images"`), public/private is a compact toggle in the panel header, and the reorder/select/remove how-to now lives in Help → Artist guide → Artist gallery (`help.ts`). `ArtistGalleryPanel` keeps an icon-only upload on the public artist page and hides its own upload when Branding already provides the dialog. Updated `e2e/cutover-vital.spec.ts` to assert eleven `gallery-photo` tiles instead of the removed count copy. Bumped `@tahti-player/tahti-web` to `0.0.26`.

## 2026-09-03 — Admin hover-edit for internet radio covers

**Completed:** Board admins can replace an internet radio station cover by hovering the artwork (pencil) on Settings → Add-ons → Radio, Listen widgets, the Listen Radio feed, and Admin → Radio. Upload writes a persistable image URL (data URL in mock, user-media in live) to both the catalog `stationOverrides` and the matching admin preset `iconUrl`. The old “cover updated” toast came from `RoundImageUploadButton` after a blob URL write that died on navigation; the mock preset store also reset on every full page load, so Admin Radio / Listen Radio kept the old Radio Helsinki logo. Mock presets now persist in `localStorage`. Non-admins do not see the edit control. Sibling `PATCH /api/admin/internet-radio-presets/:id` already accepts `iconUrl`; catalog-only stations without a matching preset stay local. Bumped `@tahti-player/tahti-web` to `0.0.25`.

## 2026-09-03 — Listen add-ons actually appear after install/configure

**Completed:** The shared `ListenAddonsPanel` opened a nested Headless UI Dialog for Configure, which closed the Listen add-widget picker (and could also fight the Settings modal). Configure is now an inline fold-out, install jumps to Installed and opens that fold-out, URLs are validated before save, SoundCloud accepts a profile (saved to the account) or a track/set/playlist URL, Favorites on Listen renders embedded instead of a second page header, and uninstall removes embeds from the page. Discovery configure stays on the install row in the picker so it does not nest a dialog. Shipped with `@tahti-player/tahti-web` `0.0.24`.

## 2026-09-03 — Listen add-widget picker includes the Listen store catalog

**Completed:** `ListenWidgetStoreDialog` only listed disco-widgets. The Settings → Add-ons → Listen catalog (Favorites plus SoundCloud, Spotify, YouTube, hearthis.at, and Bandcamp) now lives in `ListenAddonsPanel` and is reused by both the store tab and the Listen header picker, which opens on Available. Discovery widgets stay in the same dialog below. Bumped `@tahti-player/tahti-web` to `0.0.24`.

## 2026-09-02 — Audio-reactive labels on visualizer plugins

**Completed:** Scanned every channel visualizer plugin’s `update(elapsed, level)` hook. All fifteen WebGL presets (`WATER_RIPPLE` through `COLOR_INSTANCES`) scale motion, size, or opacity from the audio envelope; `MINIMAL` does not (it is CSS-only). Recorded that as `audioReactive` on `VISUALIZER_METADATA` and show an **Audio reactive** pill on Settings → Add-ons → Visualizers and the Channel Designer picker. The audio-reactivity toggle now appears only for presets that actually use the envelope. Bumped `@tahti-player/tahti-web` to `0.0.23`.

## 2026-09-02 — Component-reuse audit: 39 unswept spots across 33 files

**Found, not yet fixed.** A cross-reference pass over `src/views/**` and `src/components/**`
against `@tahti-player/ui`, prompted by the "Design system compliance" section above being
followed inconsistently. Full findings (file, line, what's there, the library component that
replaces it, and why) were compiled into a table; the categories and counts, so a future sweep
knows where to start:

- **Actions (3):** `AdminAgmView.tsx`, `MusicBrainzSubmissionAssistant.tsx` hand-roll a
  copy-with-2s-feedback button instead of `CopyButton` (no cleanup-on-unmount, unlike the real
  one — this is the same unswept violation `WORKPLAN.md` already flagged for
  `StudioReleasesView`/`StudioGoLiveView`, now confirmed in two more files). `CollectionTrackList.tsx`
  reimplements `FavoriteButton` byte-for-byte instead of using it.
- **Form controls (11):** native `<select>` instead of `Select` in `MyDiscographyView.tsx`,
  `AdminAgmView.tsx` (×3), `AdminAnnouncementsView.tsx`, `AdminGovernanceView.tsx`; bare
  `<input type="range">` instead of `Slider` in `StudioProEditorView.tsx` (6 instances) and
  `ThemeEditor.tsx`; `aria-pressed` chip toggles instead of `FilterChips` in `GenrePicker.tsx`;
  native `<input list>`/`<datalist>` instead of `CreatableCombobox` in `SubgenreTagInput.tsx`
  (its sibling field, `GenrePicker.tsx`, already uses `CreatableCombobox` for the same
  pick-or-type interaction); hand-built `role="switch"` instead of `Toggle` in
  `PluginStorePanel.tsx` and `StudioProEditorView.tsx` (different dimensions from each other);
  native checkboxes instead of `Toggle` in `StudioSoundView.tsx`.
- **Status & badges (7):** hand-typed pill `<span>`s duplicating `Badge`'s compound variants
  (often at a different opacity than `Badge` itself uses) in `DiscoverView.tsx`,
  `StreamManagerPanel.tsx`, `MembershipStatusPanel.tsx`, `ChannelView.tsx`,
  `StudioCollectionEditView.tsx`, `AppTopNav.tsx` (×2, notifications + messages),
  `RightRailPanel.tsx` (×2) — the same red unread-count pill copy-pasted four times total across
  the last two files.
- **Overlays & dialogs (9):** `ImageLightbox.tsx` hand-rolls a focus trap instead of `Dialog.Root`
  (Headless UI's real trap keeps Tab inside the panel; this one doesn't). Five `window.confirm()`
  call sites instead of the app's own `QueueConfirmDialog` pattern:
  `StashFilesPanel.tsx`, `ApiTokensPanel.tsx`, `StudioVenuesView.tsx`,
  `AdminDiscoWidgetsView.tsx`, `ChannelAnnouncementsPanel.tsx`. `AppTopNav.tsx` (3 menus sharing
  one ref) and `GlobalSearch.tsx` each hand-write the same outside-click/Escape-to-close
  `useEffect` instead of `Popover`. `MobileChrome.tsx`'s slide-in drawer also hand-writes a real
  focus trap — flagged with no exact library match (not a `Dialog` fit, it's a side panel, not
  centered) as the first candidate if a `Drawer` primitive is ever added.
- **Navigation (4):** hand-rolled `role="tablist"` strips with no arrow-key roving focus instead
  of `Tabs` in `FavoritesPanel.tsx`, `AdminNav.tsx`, `StudioSoundsView.tsx`, `RightRailPanel.tsx`
  (a second one, in the same file as one of the badge duplicates above).
- **Feedback (5):** `LoaderCircleIcon` + `animate-spin` instead of `Loader` (a different icon than
  `Loader` wraps) in `ChannelView.tsx` and `discover/WidgetTrackRow.tsx`; bare `<p>` empty states
  instead of `EmptyState` in `StashFilesPanel.tsx`, `ChannelChatPanel.tsx`,
  `AddToPlaylistPanel.tsx` (the last one is a textbook `EmptyState` `action`-slot case — the
  panel already has its own "New" trigger to wire up).

**Not fixed this pass** — this was an audit, not a sweep; the findings above are the backlog.
Also worth noting: `Combobox` (the plain export, as opposed to `CreatableCombobox` which tahti-web
does use), `ImageReveal`, `Mosaic`, `PulsingText`, and `StatChip` have no Storybook coverage and
also aren't consumed anywhere in tahti-web today — lower priority than the above until something
actually needs them.

## 2026-09-02 — Channel/player designer: Links + Text overlay segments, shared backdrop card, grid-snap

**Completed:** Ported the links and overlay editing UX from `../tahti`'s
channel editor (that repo has no drag/toolbar/segment system to port
verbatim — what's portable is the interaction pattern: label+url rows with
platform-icon detection, and an effect/text/alignment picker) into
`ChannelLayersMenu`'s side toolbar, which already had `links`/`textOverlay`
as segment types but no real content behind them — `links` was a static
"render here once loaded" placeholder and `textOverlay` was hardcoded to
the display name.

- **New segments**: `ChannelLinksEditor.tsx` (add/edit/remove label+url
  rows, reusing the existing `SocialLinkIcon` platform-detection component
  rather than porting a second, visually-different icon set) and
  `ChannelTextOverlayEditor.tsx`/`ChannelTextOverlayView.tsx` (5 text
  effects: none/gradient-shimmer/cosmic-neon/shimmer-lines/ghost-echo,
  driven by new `channelTextOverlay.css` keyframes keyed off the channel's
  own accent/highlight colors). Both are true live-preview — typing in the
  side panel updates the canvas block instantly via local draft state in
  `ChannelView`, with an explicit Save persisting through
  `patchChannelVisual`. Added a `stats` segment (follower count, fetched
  from the artist profile alongside the channel).
- **Shared backdrop card**: extracted `ChannelBackdropCard.tsx`, now used
  by both `ChannelDesigner`'s preview and `ChannelView`'s real page —
  previously the designer's preview was a hand-built mock (fake avatar
  circle, fake nav pills, no real playback chrome) sitting beside the real
  page's plain-text `PageHeader` + separate `hero` block, so they
  structurally could not match. The merged card puts identity
  (avatar/name/bio/nav) as an overlay on the same stage background the
  hero block already renders (video/image/gradient/solid/visualizer),
  matching how the artist-menu designer's card always looked. Along the
  way, found and fixed a real drift bug: `mockChannel()` hardcoded
  `headerStyle`/`colorScheme`/`videoBackgroundUrl` per station instead of
  reading them back from `channel-design.ts`'s mock state the way
  `nowPlayingOverlayStyle` already did — saving a header-style change in
  the designer never showed up on the real page under `VITE_FORCE_MOCK`.
  Fixed the same way as that existing field, scoped to non-curated
  stations only (`isCuratedStation`) so editing your own channel doesn't
  repaint every other demo artist's fixed look.
- **Selection → side-panel wiring**: clicking hero/backdrop/links/overlay
  on the canvas now fades in only that element's own settings
  (`FadeSwitch`, both in `ChannelLayersMenu` and `ChannelDesigner`'s
  `lookOnly` single-section render) instead of a generic layers list or
  the whole accordion. Added an "Overlay" tab to Player design (alongside
  Gradient/Video-image/Visualizer) for a headline inside the player stage
  itself, distinct from the channel page's Text overlay block.
- **Grid-snap**: the existing free-pixel `translate()` drag offset now
  snaps to a 16px grid (`snapToGrid` in `ChannelView.tsx`) instead of
  landing on arbitrary values.
- **Double borders / black-box placeholders**: the per-block edit-mode
  dashed frame and each block's own border were both drawing at once;
  block borders are now conditional on `!editing`. Replaced the
  dashed-text-only `actions`/`subscribe`(editing)/`chat` placeholders with
  representative mock UI (real-looking Play/Favorite pill buttons, a
  Subscribe preview card), and `links`/`textOverlay` now render their real
  content instead of placeholder text once configured.
- **Backdrop quick-add**: clicking the backdrop's nav row shows "+ Links /
  - Bio / + Stats" chips for whichever of those blocks aren't yet visible
    on the page, calling the existing `addItemType`/layout-visibility path.
- **Bonus fix, found while verifying the above**: `ChannelControlsWidget`'s
  controlled-accordion mode was silently broken — clicking a closed
  section closed whichever section was previously open but never actually
  opened the clicked one, because letting the browser's native `<details>`
  toggle fire (in addition to the React state update) caused the
  side-effect-closed section's own `onToggle` to fire too, resetting
  `openId` back to `null`. Fixed by calling `event.preventDefault()` on
  the `<summary>` click and owning open/close purely through
  `onOpenChange`; verified by reproducing it first against an untouched
  section ("Now playing overlay") before fixing.

**Not yet persisted against the live API:** `channelLinks`,
`textOverlayMode/Text/Align`, and `playerOverlayMode/Text/Align` are new
`ChannelVisual`/`PublicChannel` fields with no matching column in `../tahti`
yet — same "client-only for now, round-trips fully under `VITE_FORCE_MOCK`"
caveat already carried by `nowPlayingOverlayStyle` and the player-gradient
fields, not a new pattern. `PublicChannel.followerCount` is wired to a real
second fetch (`fetchProfile`) rather than a fabricated number, but the
public channel API itself still has no stats field of its own.

**Validation:** `tsc --noEmit`, `eslint`, and `vitest run` (53 files, 303
tests) on `tahti-web` pass clean. Added
`e2e/channel-designer-parity.spec.ts` (2 specs: designer/live-page identity
match, and a saved header-style edit showing up on the real page) and ran
the full existing Playwright suite against a local `VITE_FORCE_MOCK=1` dev
server (`PLAYWRIGHT_CHROMIUM_PATH` pointed at the locally installed
Chromium, since the checked-in config assumes `/usr/bin/chromium`) — all
green. Screenshot-verified the live-preview flow end to end in the browser:
typing a link/label or picking a text effect updates the canvas
immediately, and the fixed accordion now opens the section that was
actually clicked.

## 2026-09-02 — Chrome depth/colour parity, Discover filters, Feed carousel

**Completed:** A batch of smaller fixes plus one real feature slice, driven
by side-by-side comparison against the user's own `nuclear.png` reference
and live screenshots of the desktop app, not guesswork.

- **Neobrutalist depth restored in dark mode** — the generic
  `[data-theme='dark']` block in `packages/tailwind-config/global.css` was
  zeroing `--shadow-x/y` and thinning `--border-width` to 1px for every
  theme (not just `tahti-dark`, which has its own fixed-dark block and was
  never affected). Removed the override so dark mode inherits the same 2px
  offset-shadow/border treatment as light mode. `packages/tailwind-config`.
- **Main content background parity** — `PlayerWorkspace.Main`
  (`@nuclearplayer/ui`) painted `bg-background-secondary`; the old Nuclear
  `ViewShell` (still in the repo, unused since `main.tsx` moved to
  tahti-web) paints `bg-background` on top of that same parent, which is
  why the reference read darker. Changed `PlayerWorkspaceMain` to
  `bg-background`; verified pixel-identical (`rgb(12,25,21)`) against the
  reference via direct pixel sampling, not eyeballing.
- **Top bar/sidebar/right-rail colour parity** — `AppTopNav`'s `<header>`
  used `bg-background` while both sidebars already shared
  `bg-background-secondary` (via the one `PlayerWorkspaceSidebar`
  component). Switched the top bar to match, so all three chrome regions
  now share one tone against the darker content canvas.
- **New round logo mark** — `TahtiMark` in `TahtiLogo.tsx`: a circular
  badge (`bg-primary`, standard border + offset-shadow depth) with a star
  glyph, embedded before the wordmark and nav chevrons, matching the
  reference's logo-badge position. Original mark (star, for "Tahti"), not
  a copy of Nuclear's icon.
- **Settings nested-dialog stacking bug** — closing the outer Settings
  modal while the nested "Configure theme" dialog (opened via a theme
  card's gear icon) was still open left the two independently-animating
  `Dialog.Root` instances visibly overlapping mid-transition, sometimes
  leaving the inner dialog stuck open over the page underneath. Root
  cause: the inner dialog's `isOpen` was local state with no link to the
  outer modal's own open/close. Fix: `ThemesPanel` now watches
  `useSettingsModalStore`'s `isOpen` and force-closes the nested dialog in
  the same render pass the outer modal starts closing, so both exit
  animations run together instead of the inner one lagging indefinitely.
  Reproduced before and after with scripted open/close sequences via
  Playwright, not just read the diff.
- **Discover/Listen filter chips** — `FilterChips` (`@nuclearplayer/ui`,
  shared by `DiscoverView` and `ListenView`)'s selected state used a
  one-off inverted `bg-foreground`/`text-background` scheme instead of the
  app's standard `bg-primary`/`text-primary-foreground` treatment used
  everywhere else (nav items, tabs, buttons). Fixed at the component
  level.
- **Listen page layout** — "Your widgets" renamed to "Radio channels"
  (`ListenerWidgetsSection.tsx`) and moved into the same row as "Continue
  listening" (flex row, side-by-side ≥`sm`, stacks on mobile; a lone
  section still fills the row rather than leaving a gap, since flex
  doesn't reserve a second column the way grid would).
- **Feed carousel** (`FeedView.tsx`) — track cards already showed full
  square artwork with a bottom gradient scrim and title overlay; release
  cards only had a small thumbnail. Release cards now use the same full-
  artwork treatment as tracks. Added a background glow behind every card
  (blurred `bg-primary` at low opacity, same visual language as the
  existing `GlowMediaTile` hover glow, but always-on here rather than
  hover-triggered, since the ask was for a steady "glow" look). Replaced
  the bare `overflow-x-auto` scroll with `snap-x snap-mandatory` +
  percentage-based card widths (`calc((100% - 2rem) / 3)`) so exactly 3
  cards are visible at any viewport width, plus prev/next arrow buttons
  that `scrollBy` one `clientWidth` (i.e. exactly one 3-card page) per
  click — no manual index/state tracking needed, the snap points do the
  alignment.

**Validation:** `tsc --noEmit`, `eslint`, and the full `tahti-web`/`ui`
vitest suites (303 + 252 tests) all pass; 4 snapshot tests intentionally
updated (`FilterChips`, `LogViewer`, `PlayerWorkspace`, `PlayerShell` — all
composing `PlayerWorkspace`/`FilterChips`, no unrelated diffs). Chrome
colour/logo/depth changes live-verified via the dev server (pixel-sampled
computed styles, not just visual inspection) and via the desktop Tauri
build, rebuilt and relaunched after each round. Deployed twice to
`beta.tahti.live` (`pnpm deploy:tahti-beta`), both with passing smoke
checks (`spa:200`, `api-proxy:200`).

**Not done, flagged separately:** production CORS is missing the desktop
app's origin (`tauri://localhost` / `http://tauri.localhost`), which is
the likely root cause of "cannot log in" on the desktop app specifically —
fix drafted for `tahti/apps/api/src/plugins/cors.ts` but not applied
(blocked by the auto-mode permission classifier as a security-sensitive
change in a different repo; needs explicit sign-off). Studio/admin grid
refactor still needs concrete scoping from the user before starting.

## 2026-09-01 — Tahti Jam view, and widget removal on the Listen dashboard

**Completed:** Two independent pieces.

**Tahti Jam** — a "Start a Jam" button on playlist/collection pages creates
a synced group-listening session against the new `tahti` API
(`/api/v1/jam`, see that repo's own worklog) and hands the host off to
`/jam/$code`; guests open the same link to join. `src/hooks/useJam.ts`'s
`useJamState` drives the view from the session's SSE stream and
`useJamHostSync` mirrors the host's own player into the session every few
seconds and on every play/pause/track change — the host's browser stays the
actual player, the server only relays state. The view
(`src/views/JamView.tsx`) reuses `@tahti-player/ui`'s `TahtiJam.*`
building blocks (NowPlaying, Connecting, Error) rather than its
Nuclear-branded Header, wrapped in glass-panel content cards over an
ambient `ChannelVisualizer` background tinted from the current track's
cover art.

**Widget removal** — both radio stations and embed widgets on the Listen
dashboard's "Your widgets" section can now be removed via a hover-revealed
X icon in the card's corner, confirmed with a dialog first
(`RemoveWidgetDialog`) instead of removing immediately. Radio station cards
previously had no remove control at all. Removing only takes the widget off
the dashboard — a station's overrides and an embed instance's saved
input/label stay in the store keyed by id, so re-adding restores prior
settings.

**Validation:** `tsc --noEmit`, `eslint`, and `vitest run` (53 files, 301
tests) on `tahti-web` pass clean. The widget-removal hover/confirm/remove
flow was screenshot-verified end to end in the browser (mock mode); a
positioning bug where the X anchored to the whole grid row instead of the
hovered card (CSS Grid's default item-stretch on the wrapper div) was
caught and fixed the same way (`w-fit` on the wrapper) before landing.

## 2026-09-01 — Anonymous discovery navigation

**Completed:** Anonymous visitors can now reach Radio, Discover, Favorites,
and Help center from both desktop and mobile navigation. The shared route
boundary allows only those public destinations while Studio, Admin, and other
private Library surfaces remain sign-in gated.

**Validation:** tahti-web type-check, focused navigation lint, and diff
validation pass.

## 2026-09-01 — Favorites page duplicate panel

**Completed:** The dedicated Favorites route no longer renders the compact
left-side quick-jump panel alongside the full Favorites content, removing the
duplicate sections while keeping the panel available throughout the rest of
Library.

**Validation:** tahti-web type-check, focused lint, and diff validation pass.

## 2026-09-01 — Listen widget store and configuration

**Completed:** Added an icon-only Listen header action that opens the real
listener disco-widget add-on store in a compact multi-row layout. Installed
widgets now expose a configuration gear for visibility and ordering, with the
existing account-backed install state remaining the source of truth.

**Validation:** Focused tahti-web lint, type-check, and diff validation pass.

## 2026-09-01 — Expandable stream playlist manager

**Completed:** Kept Go Live’s stream playlist manager compact by default while
retaining an explicit accessible expand control for rotation details, stats,
overlay settings, and playlist management.

**Validation:** Stream manager lint, tahti-web type-check, and diff validation
pass.

## 2026-09-01 — Compact stream playlist manager

**Completed:** Go Live now keeps the stream playlist manager on one compact
row with the current state and track visible beside centered playback
controls. Playlist selection is a `+ Playlist` action that opens a preview
modal, where an artist can add a playlist to the rotation or replace the
current rotation with it.

**Validation:** Stream manager lint, tahti-web type-check, and diff validation
pass.

## 2026-09-01 — Help center coverage audit

**Completed:** Reorganized Help into task-based groups and added guides for
getting around, the player, favorites and playlists, timeline comments,
channel design, uploads and processing, sharing and embeds, notifications,
governance, and admin operations. Existing add-on, artist, listener,
broadcast, release, account, and support guides remain linked from the hub.

**Validation:** Help content lint, tahti-web type-check, and the existing
add-on/help catalog tests pass.

## 2026-09-01 — Default white theme reference alignment

**Completed:** Matched the default light palette to the supplied reference:
white surfaces, blush-pink utility bands and controls, coral primary actions,
dark navy text, black outlines, and compact rounded corners. Named alternate
themes remain unchanged, and the existing Tahti logo remains in the top-left
brand slot.

## 2026-09-01 — Mobile usability audit; Channel Designer preview fix

Phone-width audit of listener/artist surfaces — see
[MOBILE-USABILITY-AUDIT.md](MOBILE-USABILITY-AUDIT.md) for the full method
and findings table. No real horizontal-overflow bugs found at 400px across
Listen, Radio, Discover, a channel page, Library, or Studio home; the
earlier-flagged `WORKPLAN.md` item about unstyled native controls in
`StudioDistributionView`/`StudioReleasesView`/Go Live/Schedule looks stale
and can be dropped — those already use the shared Nuclear form components.

**Fixed:** Channel Designer's live preview scrolled out of view while
editing its long controls form on anything narrower than 1280px (every
phone/tablet/most laptops, plus the Settings → Channel & design compact
instance) — the preview is now sticky and stays pinned during scroll. The
"Open my channel →" link, previously only in the top action row that
scrolls away, is now also shown in the preview panel's own header so it
stays reachable while editing.

**Flagged, not yet fixed:** `/library/favorites` renders two separate
"Favorites" sections at once (the new sidebar panel plus the older full-page
view) — a header subtitle now explains the relationship, but full
consolidation is still open. Five unstyled native `<input type="checkbox">`
elements remain in `ChannelDesigner.tsx` (lines 650, 718, 881, 1938, and the
"separate gradient for the player" toggle).

**Validation:** `tsc --noEmit`, `eslint`, and `vitest run` (53 files, 301
tests) on `tahti-web` pass clean for the two files touched
(`ChannelDesigner.tsx`, `FavoritesView.tsx`).

## 2026-09-01 — Anonymous navigation boundary and artwork defaults

**Completed:** Anonymous visitors can stay on Listen and Settings (including
authentication and essential legal/help routes), while authenticated areas
redirect to Settings → Account and are removed from anonymous navigation. The
bottom player bar now stays hidden until a playable item exists. Added sixteen
generated abstract artwork presets, deterministic artwork fallbacks, and an
admin preset management page with replacement uploads.

**Validation:** tahti-web type-check, focused lint, and artwork fallback tests
pass.

## 2026-09-01 — Round validation cleanup; bump to 0.0.18

**Completed:** Closed out this round's validation: fixed two leftover
Prettier violations (`TimelineReactionBar.tsx`'s JSX attribute wrapping and
`ChannelView.tsx`'s import order) that were failing `eslint` even though
`tsc --noEmit` and the unit suite were already clean. No behavior changes.

**Validation:** `tsc --noEmit`, `eslint` (0 errors), `vitest run` (53 files,
301 tests), and the Storybook package's `type-check` on `tahti-web` all pass
clean. Bumped `packages/tahti-web/package.json` to `0.0.18`.

## 2026-09-01 — Favourites panel and navigation sitemap

**Completed:** Added a left-side Favourites panel to Library with Tracks,
Playlists, Channels, and Artists tabs. Saved items retain their favourite time,
dates are humanized, and new playlist/artist entries stay marked until opened.
The route tree was also audited against desktop and mobile navigation in
`NAVIGATION-SITEMAP.md`; diagnostic Tahti map links were removed from product
navigation and utility-page breadcrumbs.

**Issue found:** playlists did not previously have a favourite action in the
client, so the new playlist tab is ready for stored/public playlist entries but
will remain empty until that action is exposed by the playlist surfaces. The
existing API does not yet provide a playlist-favourite timestamp feed.

**Validation:** tahti-web type-check and focused lint pass.

## 2026-09-01 — Real beta promotion-kit browser audit

**Completed:** Playwright now defaults to the deployed beta environment instead
of starting the local mock server. The promotion-kit journey uses separate
artist and listener sessions, captures artist/public screenshots, and checks
the real downloadable ZIP contains the same four uploaded filenames.

**Issue found:** the mock browser server kept upload state inside one page's
JavaScript module, so a second browser context could not represent a real
listener. The test now requires real beta credentials through
`TAHTI_E2E_PASSWORD`, with optional listener-specific credentials, and keeps
the mock fixtures available only for offline component/unit work.

**Verification note:** beta screenshot/download execution is pending because
this workspace has no `TAHTI_E2E_PASSWORD` or listener credentials, and the
sandbox Chromium process exits with `SIGTRAP` before opening beta. The test is
intentionally left pointed at beta so it cannot silently pass against mock data.

## 2026-09-01 — Minimal mobile player chrome

**Completed:** Mobile now keeps an idle player as a compact ready bar with a
queue-play action and expand control, then removes the persistent player while
audio is playing so navigation and content have more room. Enabled ambient
visualizations remain visible in the idle bar.

**Validation:** tahti-web type-check and diff checks pass.

## 2026-09-01 — Like notifications in the top bar

**Completed:** Artists now see unread notifications when listeners love their
tracks, with the notification opening the relevant channel content.

**Validation:** tahti-web type-check and lint pass.

## 2026-09-01 — Timed timeline reactions

**Completed:** Full-track listeners can now react with emoticons or open a
comment composer directly below the waveform. Every reaction and comment is
anchored to the visible `mm:ss` playback position.

**Validation:** tahti-web type-check and lint pass.

## 2026-09-01 — Collaborative public playlists

**Completed:** Artists can make playlists public and collaborative from Studio.
Listeners can subscribe to public playlists, open their embeddable player, and
discover public playlists in a configurable Discover widget filtered by artist
genre.

**Validation:** tahti-web type-check and focused tests pass.

## 2026-09-01 — Go Live signal check widget

**Completed:** Replaced the compact Go Live signal row with Tahti's richer
audio-readiness widget. Artists now see a clear waiting, connected, or
listening state, can check their own audio from the same card, and get live
stereo level meters before going on air. The mock flow keeps its connection
test action.

**Validation:** tahti-web type-check and focused lint pass.

## 2026-09-01 — Playlist detail layout

**Completed:** Updated public playlist and collection pages to match the
reference layout: a wide artwork-led hero with translucent cover ambience,
compact Play/queue/embed actions, and a dense filterable track table with
thumbnail, artist, title, favorite, and overflow actions. Artist-profile
catalogs now use the same standard tracklisting treatment.

**Validation:** tahti-web type-check, focused lint, and diff checks pass.
The shared TrackTable tests also pass; compact overflow-only actions are
scoped to artist-profile and playlist tracklists, while other track tables
retain their existing inline controls.

## 2026-09-01 — Discover, artist actions, and live broadcast feedback

**Completed:** Reworked Discover into a stable two-tab surface. The main tab
keeps all enabled top-list widgets together, places the remaining discovery
widgets in the carousel below them, and moves the full artist directory into
an Artists tab. Artist cards now use translucent artwork ambience with a
cyan-violet Tahti glow, a stronger dark text scrim, and readable metadata.
Board admins get a hover-only configure icon on each Discover widget; it opens
the widget's settings in a modal while regular listeners see no admin control.

Artist profiles now keep newsletter Subscribe, paid fan-tier Subscribe, and
Embed actions together as compact icon controls in the top-right header. The
channel backdrop supports autoplaying video and mutes it whenever there is no
active player playback. The persistent app shell remains stable during route
changes: only routed content transitions, and persisted open sidebars do not
animate during reload.

The broadcast notification now flashes green for a healthy live stream,
yellow for a preview warning, and red when a channel marked LIVE has lost its
ingest connection. Its live panel includes direct links to the broadcast
studio and the artist's Green Room chat.

**Validation:** tahti-web type-check, focused lint, full test suite (52 files,
299 tests), production build, and deployment smoke checks pass. Deployed to
`https://beta.tahti.live`; the related changes were pushed to `master`.

## 2026-09-01 — Governance navigation and route-map consolidation

**Completed:** Audited the Tahti Player route tree against the persistent
Listen, Studio, and Admin navigation. Governance remains available in its
three intentional contexts: member voting at `/governance` via Settings →
Account, artist workflow at `/studio/governance`, and board operations at
`/admin/governance` plus `/admin/agm`. Corrected the `/more` feature matrix to
map the existing public feature-request and AGM routes, removed the redundant
governance vote/comment matrix row, and documented the navigation decision in
`NAVIGATION-GAPS.md`. Functional governance views, permissions, API calls, and
route compatibility aliases were retained.

**Validation:** tahti-web type-check, lint, and 299 unit tests pass; beta build
and SPA/API-proxy smoke checks pass after deployment.

## 2026-08-31 — Import plugins use the runtime-backed registry

**Completed:** The Settings → Add-ons → Import tab is now the single import-plugin surface. It uses the runtime-backed Tahti import-source registry, and the separate local-only Nuclear plugin catalog, category, and Storybook entry have been removed so inactive duplicate items cannot be mistaken for working integrations.

## 2026-08-31 — Release visualizer defaults

**Completed:** Added Artist settings → Releases controls for the default new-release background: Particle Field by default, a specific visualizer, random selection, or off. New releases save that choice through the existing release visual API, and public smart-link pages now render the saved visualizer as a soft ambient background.

## 2026-08-31 — Release overview compact playback layout

**Completed:** Release overview now keeps the title and artist at the top of the artwork, uses one embed action in the hero corner, adds a hover play control that starts the first track, and highlights the currently playing track. The condensed hero reduces vertical scrolling while retaining artwork editing.

## 2026-08-31 — Go Live show-info confirmation

**Completed:** Go Live now places a compact, professional “Confirm show info” card directly above the encoder controls. It saves the complete show form with a success toast, shows a green confirmation state, includes the existing avatar upload flow, shortens the type/visibility controls, and removes the redundant Info tab while preserving the old `/studio/info` URL as a redirect.

## 2026-08-31 — Continued worklog: radio logos and reference surfaces

**In progress:** Radio station logo sourcing is now queued as a production-data
task. The current beta catalog still points at third-party station-directory
image URLs, so replacing those logos requires confirming each station's
official brand asset and its redistribution/cache permissions before changing
production data.

**Completed in the preceding pass:** Governance is lazy-loaded from Settings,
the right rail avoids repeated notification requests, radio cover uploads have
reliable success/error cleanup, same-file upload retries work, Storybook covers
the retry state and Studio Governance, and the beta sitemap identifies its
capture script.

**Validation:** tahti-web and Storybook type-check, production build, focused
lint, and focused FilePicker tests pass. The full UI suite retains unrelated
pre-existing snapshot failures.

## 2026-08-31 — Performance and upload reliability pass

**Completed:** Governance opened from Settings now loads on demand instead of
being included in the initial application path. The right rail no longer
refetches notifications on every collapse, expand, or tab switch. Radio station
cover uploads now show success and failure feedback, always release their busy
state, and the image-mode toggle no longer submits the edit form accidentally.
The shared file picker clears its native selection after each change so a user
can retry the same file after an upload error.

**References:** Added Storybook coverage for retryable image uploads and the
Studio Governance surface. Updated the beta sitemap metadata to identify its
capture script.

**Validation:** tahti-web and Storybook type-check, tahti-web production build,
focused lint, and focused FilePicker tests pass. The full UI suite still has
pre-existing snapshot failures in unrelated components.

## 2026-08-31 — Next three shared-select slices

**Slice 1 — Release track filtering:** The Add tracks from library dialog now uses the shared Select for content type filtering.

**Slice 2 — Studio recordings sorting:** Recording order selection now uses the shared Select while preserving newest, oldest, and title sorting.

**Slice 3 — Admin ledger entry:** Financial ledger category selection now uses the shared Select, keeping the compact entry form consistent with the rest of Admin.

**Validation:** tahti-web type-check and Prettier pass clean.

## 2026-08-31 — Next three product slices

**Slice 1 — Track detail backdrops:** Track detail pages now use the backdrop image chosen in Studio when one exists, while tracks without one retain the cover-art ambience and visualizer treatment.

**Slice 2 — Collection waveform rows:** Collection tracks now have individual artwork, transport controls, waveform seeking, playlist actions, favorites, and readable duration instead of a dense table-only presentation.

**Slice 3 — Registry hand-offs:** YouTube playlist and SoundCloud dashboard entries now point people to the real Listen widgets that are available today, while unsupported import and dashboard capabilities remain clearly marked as partial instead of appearing falsely active.

**Validation:** tahti-web type-check and formatting pass clean.

## 2026-08-31 — Backlog round 6: five slices closed

Session also shared this working tree with concurrent activity mid-rewriting
`PluginStorePanel.tsx` and `router.tsx` (both left with real, pre-existing
type errors from that in-progress work) — left both untouched rather than
risk clobbering it; verified every slice below via `tsc` with just those two
files' errors filtered out, confirming this round introduces nothing new.

**Slice 1 — Stream playlist manager: current-track duration, combined listener count, non-broken bitrate:** `StreamManagerPanel.tsx`'s "Current track" box now shows elapsed/total (`"3:12 / 5:41"`) instead of remaining-only. The "Time left" vs "Listeners" slot-swap is gone — "Time left" is always its own stat (shows `—` outside rotation), and the former separate "Peak listeners" cell is now "Listeners" showing `current / peak` combined, visible regardless of rotation state. "Bitrate" no longer shows a permanently-stuck "Detecting…" during rotation playback (there's no encoder signal to ever measure) — it now reads "N/A — rotation" instead, matching the existing "Signal: Rotation" precedent.

**Slice 2 — Track detail: removed the redundant "Expand player" button:** `TrackDetailView.tsx` had its own full-screen-expand icon button; the persistent player bar (`ConnectedPlayerBar.tsx`) already has one. Removed the button and its now-unused `setFullScreenPlayerOpen`/`useLayoutStore` wiring.

**Slice 3 — Feed: release items are playable too:** Previously only track-kind feed items got the artwork/play/queue treatment; release items were plain thumbnails since `FeedItem`'s release payload carries no track data. Feed now resolves each release item's real tracklist via `fetchProfile(username)` (matching `ArtistView.tsx`'s existing `releasePlayables` pattern), deduped per artist, and gives release cards the same `MediaArtwork` play/queue overlay — play starts the first track and enqueues the rest, queue enqueues the whole release in order.

**Slice 4 — Go Live Info panel: Episode number only shows for a series:** `BroadcastPreflightPanel.tsx`'s Episode number field appeared for every broadcast, one-off or not. It's now conditional on `preflight.plannedLiveShow?.seriesId`, with "Show name" and "Show type" reflowed into their own rows so hiding it doesn't squeeze "Show type" into a narrow leftover grid column.

**Slice 5 — Waveform comment markers are now a real icon:** `WaveformSeekbar.tsx`'s comment markers were plain 6px yellow dots; swapped for a small filled `MessageCircleIcon`, matching the icon already used for comments elsewhere in `TrackDetailView.tsx`.

**Not done this round (need a live render or a real backend field, flagged rather than guessed):** "Live for" using a real server-tracked start time instead of a client-side timer (needs a `goneLiveAt`-equivalent for rotation-mode channels — no such field exists yet); the Tahti theme hover/dropdown contrast bugs and the Channel Designer visualizer "fill the whole banner" report both need visual confirmation of the actual affected component before touching anything, per their own backlog notes; Listen page "Add widget" button was skipped this round specifically because it requires editing `PluginStorePanel.tsx`, which is mid-rewrite by concurrent activity right now.

**Validation:** tahti-web type-check (scoped to exclude the two concurrently-broken files, confirmed pre-existing via `git diff --stat`), lint, and the full vitest suite (296/296) pass.

## 2026-08-31 — Fixed missing `/api/me/media` backend contract, audited for more

**Fixed:** `uploadUserMediaFile` (`api/user-media.ts`, the shared upload helper behind
`ImageUploadField` — used by radio widget cover art, channel backdrops, and the
stream overlay editor) called `POST /api/me/media/prepare` / `/complete`, neither of
which existed anywhere in the sibling `../tahti` backend — every image upload through
this shared component 404'd. Added both routes (`../tahti/apps/api/src/routes/me/media.ts`,
registered in `server.ts`), reusing the existing generic `ImageUploadPrepareSchema`
(`@tahti/shared`, already shared by the archive-banner and collection-cover routes) plus
two new schemas (`UserMediaCompleteSchema`, `UserMediaFileSchema`) since this endpoint has
no owning DB record to read metadata back from — the client resends filename/contentType/
sizeBytes on complete and the server just echoes them back with a resolved URL. No new
Prisma model: nothing actually calls `fetchUserMedia`/`deleteUserMedia` today (checked
every `ImageUploadField` call site), so only prepare/complete needed a real backend.
Also fixed a real client/server field-name mismatch found along the way: the frontend
sent/expected `objectKey`, every other prepare/complete pair in this codebase uses
`uploadKey` — renamed the frontend to match. **Validation:** new `media.test.ts` (4
tests) plus the existing `avatar.test.ts` (11) pass against a real disposable Postgres;
shared/api/web type-check and lint clean.

**Audit — same class of bug found in several more places (frontend calls a route with
zero backend implementation), not fixed this round, logged for the next session:**

- `POST /api/me/channel/video-background/prepare` + `/complete` (`api/channel-design.ts`) — same missing-pair pattern as the media bug just fixed, same likely fix shape.
- `POST /api/v1/imports/bandcamp/add` (`api/sources.ts`) — genuinely missing; a **prior worklog entry (2026-08-30, "Backlog round 2") claimed this was verified as a real wired route, but that check only looked at this frontend repo's own client code, not the actual backend** — there is no `routes/imports/bandcamp.ts` at all, unlike the sibling `imports/hearthis.ts`/`imports/spotify.ts`/`imports/mixcloud-embed.ts`, each of which has a complete `search`/`me-tracks`/`by-username`/`add` route family. `GET /api/me/bandcamp/albums` does exist, but is explicitly commented as "stub until Bandcamp API v1" in `routes/me/bandcamp.ts:119`.
- `GET/POST /api/admin/radio-station-suggestions*` (`api/admin.ts:1370-1393`) — the entire `AdminRadioStationSuggestionsView` review pipeline (round "Listener widgets" entry, 2026-08-30-ish) has no backend at all; zero matches for `StationSuggestion` anywhere in `../tahti`.
- `GET/PATCH /api/me/connections` (`api/artist-settings.ts:488,529`), `GET/PATCH /api/me/discovery` (`api/artist-settings.ts:289,317`), `GET /api/admin/governance/overview` (`api/admin.ts:3212`), `GET/POST/import /api/admin/i18n/languages*` (`api/admin.ts:3885-3966`), `GET /api/admin/stats/content` (`api/admin.ts:276`), `PATCH /api/admin/announcements/system-enabled` (`api/admin.ts:2442`) — all missing.
- Method: extracted every static `'/api/...'` literal from `tahti-web/src/api/*.ts` (148 found) and diffed against every route string registered under `../tahti/apps/api/src/routes/**` (787 candidate literals, superset including comments). 15 flagged; 6 were false positives (real routes registered with a `:param`/prefix the crude string match missed — `/api/channels/:slug`, `/api/me/press-kit/*`, `/api/me/green-room/*`, etc.) or benign truncated matches. This only catches _fully static_ frontend paths — anything built from a template literal with interpolation wasn't checked, so this is a floor on the real count, not a ceiling.

## 2026-08-31 — Live bug-bash: admin stream manager, green room placement, follower toggles, player live indicator, hero player fixes

**Completed, found via live testing this session:**

- **Fixed the real bug behind "admin can't see the playlist editor or overlay settings":** `ArtistView.tsx` rendered `StreamManagerPanel` for `isOwner || isAdministrator` but only passed `readOnly={!isOwner}`, ignoring `isAdministrator` — so a board admin viewing a channel they don't personally own (e.g. Tahti Selects, which has no artist owner) was silently treated as read-only. The Overlay tab still highlighted as selected but rendered nothing (gated on `canControl`), and rotation-editing controls were hidden. Now `readOnly={!isOwner && !isAdministrator}`.
- **Green room button moved from the profile header into the Upcoming shows list, per-show:** Removed the header's single `channel.state === 'PREVIEW' || 'LIVE'`-gated button (made no sense as a general profile action). `ShowEpisodeList` now takes a `username` prop and shows a Green room icon button on whichever upcoming episode is currently in its `isGreenRoomWindow` (imminent/live/just-wrapped), matching the same time-based pattern `RadioScheduleView.tsx` already uses.
- **Follower/Following counts now actually respect the existing Settings toggles:** The `showFollowers`/`showFollowing` toggles (`SettingsPanels.tsx:2027-2034`) and their backend enforcement (sibling repo's `profile/public.ts:269-270`, which already nulls the count server-side) existed and worked — but `ArtistView.tsx` did `artist.followerCount ?? 0`, coalescing a hidden (`null`) count to a literal `0` and always rendering the tile anyway. Now the Followers/Following tiles are omitted entirely when the count is `null`.
- **"View channel" text link** added top-right of the profile header, always visible when the artist has a channel (previously the only channel link was an icon-only button gated on having live visual/HLS data).
- **Live indicator instead of a blank gap:** `ConnectedPlayerBar.tsx` and `FullScreenPlayer.tsx` already hid the seek bar entirely for live streams (`isLive`), but rendered nothing in its place — just empty space. Both now show a small blinking-red-dot "Live" badge there instead.
- **Seek bar made taller so the elapsed/remaining numbers stop looking cramped:** `packages/ui`'s `PlayerBarSeekBar.tsx` container went from `h-5` to `h-6`, with the track re-centered (`top-2` → `top-2.5`). Shared component — updated its snapshot test.
- **Fixed the featured-track play button visibly jumping on hover** on the artist "Music" tab hero box: it was centered via `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2` directly on the shared `Button`, but `Button`'s own hover state applies `hover:translate-x-shadow-x hover:translate-y-shadow-y` (the neubrutalist press effect) — both use the same `translate-x`/`translate-y` transform, so hovering replaced the centering offset with the shadow-shift offset and the button snapped position. Moved the centering onto a wrapping `<div>` so the two no longer fight over the same transform.
- **Added `ChannelVisualizer` to that same hero box** behind the cover art, active while the featured track is actually playing (matching the pattern `FullScreenPlayer.tsx` already uses) — previously it only ever showed a static, dimmed cover-art image.
- **Removed the channel's inline `StreamManagerPanel` embed** in favor of a "Manage" button (playlist icon + text) in the top-right corner of the same hero box, visible only to the owner or a board admin, opening the panel in a Dialog overlay. `StreamManagerPanel` gained a `defaultExpanded` prop so this entry point opens already expanded instead of collapsed.
- Fixed a pre-existing broken test (`pageTour.test.ts`) left over from an earlier session's Studio nav restructure (Channel moved from a top-level tab into a Perform submenu item) — the test still asserted the old `nav-item-/studio/channel` top-level tour step; updated to assert `nav-item-/library` instead, matching the current three-item `PRIMARY` nav (Studio / Library / Perform).

**Validation:** tahti-web type-check, targeted lint, Prettier, and the full vitest suite (296/296, plus the pre-existing unrelated Playwright/vitest config collision on the `e2e/*.spec.ts` files) pass. `packages/ui`'s `PlayerBar` tests pass with the updated snapshot. Not click-verified end-to-end in a live browser this session (no browser automation available) — the user found several of these by testing the running local dev server directly and reporting screenshots/symptoms.

## 2026-08-31 — Preserve collection content types in the editor

**Completed:** Collection editing now reads the API content type when the
style field is absent, and mock EP collections retain their EP type instead
of falling back to Album.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Refined collection artwork and visibility header

**Completed:** Public collection headers now use the saved backdrop, fall
back to a subtle cover-art ambience, and receive deterministic placeholder
cover art when no cover has been assigned. Collection editor visibility is
now a single header badge instead of being repeated in the Details content.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Fixed Library Recordings browsing

**Completed:** Recordings now keeps Collections active in the main navigation,
uses the parent Recordings heading without a duplicate content header, and
has the same searchable, sortable browser treatment as Sounds.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Focused Broadcast multistream settings

**Completed:** Broadcast → Multistream now lists multicast provider add-ons
only. Provider setup, connection testing, enable/disable, and removal remain
inside the configuration dialog, so no setup form renders behind the dialog.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Moved Sources into Broadcast settings

**Completed:** Settings → Broadcast → Multistream now contains the complete
Sources experience, including source status, configuration, enable/disable
controls, imports, and add-on discovery. Removed Sources from the Library
submenu while preserving its direct routes for existing links.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Added HearThis downloads and unified collection listings

**Completed:** HearThis embed tracks now expose a download action in the
track editor only when downloads are enabled. The collection editor now uses
the same bordered, zebra-striped listing treatment as Library → Sounds while
retaining collection-specific playback, reorder, waveform, and remove actions.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Unified Sounds and Recordings listings

**Completed:** Removed the redundant All sounds heading and Upload action from
the Sounds content area. Recordings now uses the same bordered, zebra-striped
listing treatment with a left-side state accent, keeping the Library sections
visually consistent.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Grouped track editor actions

**Completed:** Added a Quick edits dropdown containing Normalize audio, Trim
silence, and Master with unique icons. Moved Add to rotation and Move to
private stash into the Playlists tab so the editor header stays focused on
playback and core track actions.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Clarified track-row action states

**Completed:** Track rows now use filled backgrounds only for active playback
and pinned actions. Inactive Play and Pin controls, Edit, and Audio editor
use the same lightweight icon treatment as the other row actions.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Refined admin moderation controls

**Completed:** Added more spacing between moderation tabs and rebuilt the
Support filter/search toolbar so the search field stays usable beside the
filters on wide screens and stacks cleanly on smaller screens. Added a search
icon and a subtle toolbar container for clearer grouping.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Moved Vendors and Tahti map out of Admin Overview

**Completed:** Admin Overview now stays focused on operational summary data.
Vendors has its own Admin menu item, and Tahti map now has a dedicated Admin
route immediately after it. The map surface includes the proper Admin gate and
navigation, while the general `/more` map remains available separately.

**Validation:** tahti-web type-check and focused Admin/router lint pass.

## 2026-08-31 — Fixed channel look saving and live backdrop updates

**Completed:** Visual look changes now apply and refresh the live channel as
soon as the visual save succeeds. A failing slideshow request no longer masks
that successful save. Public channels now honor the selected gradient, solid,
video/image, slideshow, and visualizer backdrop data.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Simplified the full-screen Look panel

**Completed:** Look now contains Channel Designer directly. The redundant
Channel appearance wrapper was removed, so Backdrop design and Player design
are the immediate controls in the panel.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Added Player design tabs

**Completed:** Player design now offers Gradient, Video / image, and
Visualizer tabs with the existing controls synchronized to the channel look.
Removed section subtexts and the redundant Brand accent label, and renamed
Artist backdrop banner to Backdrop design.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Improved full-screen Channel Editor Look panel

**Completed:** Widened the right-side editor menu and made Look controls
collapsed by default. Selecting the channel header opens Artist backdrop
banner, while selecting Live stage opens Player design. The visualizer picker,
toggle, and animated previews are available in that Player design section.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Added visualizer preset picker

**Completed:** Clicking the visualizer artwork in Channel Designer now opens a
dedicated picker with every available visualizer, animated preview, preset
descriptions, and an explicit Use visualizer action.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Aligned Channel Designer actions with its heading

**Completed:** Save layout and Open my channel now share the same row as the
Channel Designer heading, so the actions no longer create a separate vertical
block above the preview.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Removed dialog mount-time flicker

**Completed:** Shared dialogs now render their overlay and panel at full
opacity/scale on mount, while retaining the close animation. This prevents
the intermediate transparent/light-looking paint that appeared when Settings
and other modals opened, including the duplicate lifecycle pass in development
mode.

**Validation:** Shared Dialog tests pass (7/7), UI type-check and focused lint
pass. Full UI snapshots include unrelated concurrent changes and were not
rewritten.

## 2026-08-31 — Moved Channel Designer save action to the top

**Completed:** Channel Designer now places the icon-and-text Save layout
button above Open my channel, making the primary persistence action visible
before the editing panels.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Put Artist backdrop controls first

**Completed:** Channel Designer now places Artist backdrop banner above Player
design, so the page appearance controls are encountered before visualizer
selection.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Simplified Artist backdrop banner controls

**Completed:** Removed the Color scheme and Header tab navigation from Channel
Designer. The Header options and their related Gradient, Solid, Video / Image,
and Slideshow controls now appear directly in the Artist backdrop banner
section.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Added Slideshow as a Header mode

**Completed:** Channel Designer now offers Slideshow as the fourth Header
option after Gradient, Solid, and Video / Image. Selecting it activates the
slideshow backdrop and places its image, style, transition, timing, and
autoplay settings directly below the Header choices.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Simplified the Gradient Header workspace

**Completed:** Gradient now makes Header the sole backdrop tab. Gradient
colors and Slideshow remain directly inside Header, while the empty standalone
Color scheme tab is removed from that state.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Reduced visualizer card clutter

**Completed:** Visualizer entries no longer repeat the generic Visualizer
label above their descriptions, leaving the preset name, useful description,
and controls clear and unobstructed.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Clarified disabled visualizer state

**Completed:** Channel Designer now grays out the visualizer preset card and
disables preset navigation and configuration when visualization is off. The
Enable button remains active so the visualizer can be restored immediately.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Grouped Slideshow configuration under Header

**Completed:** Slideshow is now configured as its own section inside Header,
alongside Gradient colors. The standalone Slideshow tab has been removed so
backdrop, color, and slideshow settings have one clear home.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Grouped Gradient color controls under Header

**Completed:** When Gradient is selected in Channel Designer, its brand and
color controls now appear directly under Header. The standalone Color scheme
tab remains available for non-gradient styles, while the gradient view points
clearly to its new location.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Fixed dark-theme flashes when opening modals

**Completed:** Opening Settings mounted the hidden theme editor, whose cleanup
reapplied the entire base theme during the modal lifecycle. That caused the
dark Tahti interface to briefly repaint as the light theme, especially under
React Strict Mode. Cleanup now removes only the temporary custom-theme preview
overlay, so Settings and other modal transitions keep the active dark palette.

**Validation:** Focused lint passes. Browser inspection confirms the
`nuclear:tahti-dark` theme attribute remains stable while opening Settings.
The full suite currently has one unrelated failure from a concurrent Studio
navigation change (`pageTour.test.ts`), with 295/296 tests passing.

## 2026-08-31 — Made visualizer controls optional and easier to reach

**Completed:** Channel Designer now has an enabled visualizer toggle that
switches to a minimal stage when turned off and restores the selected preset
when turned back on. The appearance controls, including Visualization, now sit
in a wider right-side panel beside the page preview.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Reworked Channel Designer preview

**Completed:** Channel Designer now puts appearance controls in collapsible
side panels instead of inside the preview surface. The center shows a realistic
artist channel structure with profile navigation, live stage, tracks, and About
content, and the designer includes a direct Open my channel link.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Consolidated governance topics and upload sources

**Completed:** Studio → Governance now presents Motions and Topics as the
complete in-page tab set, with the legacy feature-requests query continuing to
open Topics. Library → Sources no longer lists Local upload; unfinished rows
make Configure the active action, while ready rows expose Enable or Disable.
Upload now shows the source widgets directly and opens one dialog for each
source's connection and enablement controls.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Simplified Multicast source setup

**Completed:** Perform → Multicast now shows only configured destinations and
uses a single plus action to add a source. The modal starts with the same
provider thumbnail treatment, then continues into configuration, connection
testing, enablement, and saving without opening a second page or dialog.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Clarified Multicast destination states

**Completed:** Perform → Multicast now visually prioritizes enabled
destinations. Disabled and unconfigured providers are muted and use an
outline treatment, while configuration and enable controls remain available.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Clarified source enablement states

**Completed:** Library → Sources now separates “Enabled and configured” from
“Disabled or needs setup.” Disabled and incomplete integrations are visibly
muted, while each source has an explicit Enable or Disable button alongside
its configure and connect actions.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Separated Tahti Radio and Tahti Selects administration

**Completed:** Admin Tahti Radio now loads its own dedicated Radio rotation
feed instead of reading Tahti Selects content. It keeps the same rotation
component styling as Selects, in read-only form because the available Radio
API exposes the editorial feed for review while submission approval remains
the supported editing workflow. The obsolete Manage main menu was removed,
and Missed shows was removed from Community because it already lives under
Moderation.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Removed duplicate Tahti Selects navigation

**Completed:** Removed the remaining Studio/Perform Tahti Selects link. The
single navigation destination is now Admin → Content → Tahti Selects, placed
alongside Radio with the matching title.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Channel and Radio moved under Perform

**Completed:** Channel, Radio, Tahti Selects, and Multicast are now grouped
with Go Live, Schedule, Events, and Shows under the Perform page tabs. The
route resolver was updated so Channel and Radio correctly activate Perform.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Reworked Studio Governance tabs

**Completed:** Studio Governance now presents Motions and Feature requests as
page-level tabs within the same Studio section. The feature-request tab keeps
its existing voting and discussion behavior, and the unrelated Tahti map
breadcrumb was removed from Governance.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Moderation moved into Channel & design settings

**Completed:** Removed Moderation from the Manage Studio navigation and added
it as a dedicated tab in Settings → Channel & design. The existing moderator
and chat-ban controls are reused there, while the old Studio moderation URL
redirects to the channel settings section for compatibility.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Simplified Library and Sources navigation

**Completed:** Moved Sources under the Upload section and replaced the source
tile links with a compact list offering configure, connect, and explicit
enable/disable controls. Source enablement is stored per user and starts
disabled until selected; the list also links to Settings → Add-ons for more
source integrations. Stash was removed from the Sources catalog. Media and
Stash were removed from the Library rail and added as tabs under Collections.
Recordings now opens the Collections view with the Recordings tab active.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Refined the Library sound editor header

**Completed:** Reworked Library → Sounds → Edit so the artwork becomes a full
banner with the waveform overlaid as a scrubbable seekbar. Playback is now a
large circular stateful control in the upper-left of the banner, while
rotation, stash, pin, save, normalize, trim, editor, and mastering actions
sit below as compact icon buttons with accessible labels.

**Validation:** tahti-web type-check, focused lint, Prettier, and
`git diff --check` pass.

## 2026-08-31 — Tahti Selects moved to Admin Content

**Completed:** Moved Tahti Selects into Admin → Content as its own “Tahti
Selects” tab alongside Radio. The rotation list now has a plus action in its
header that opens a two-pane picker with content categories, searchable
striped results, previews, and single- or multi-select adding. The current API
only exposes eligible public archive tracks, so unsupported categories remain
visible but unavailable rather than suggesting content that cannot be added.
Green Room was removed from Manage because it is already present in Settings.

**Validation:** tahti-web type-check, focused lint, and `git diff --check`
pass.

## 2026-08-31 — Tahti map moved under Admin overview

**Completed:** Removed Tahti map from the global main rail and added it as a
tab alongside Overview and Vendors on the Admin dashboard. The map remains
available only in diagnostic/admin builds through its existing route guard.

**Validation:** tahti-web type-check, focused lint, and `git diff --check`
follow.

## 2026-08-31 — Fixed navigation search-parameter crash

**Completed:** Studio navigation now reads the router's serialized search
string instead of coercing its structured search object to text. Opening
Multicast and other query-driven Studio tabs no longer crashes the app with a
primitive-conversion error.

**Validation:** tahti-web type-check, focused lint, and `git diff --check`
pass.

## 2026-08-31 — Multicast moved under Perform

**Completed:** Multicast is now listed alongside Go Live, Schedule, Events,
and Shows in the Perform menu. The route resolver treats the existing
`/studio/channel?tab=multicast` destination as Perform-owned, and its page
header now reads “Multicast” with a matching description.

**Validation:** tahti-web type-check, focused lint, and `git diff --check`
pass.

## 2026-08-31 — Removed the legacy Studio side-column grid

**Completed:** Deleted the old Studio page two-column CSS that explicitly put
section links into an 11rem side column. Studio pages now use one full-width
content flow, with the shell-owned section menu above the content and no
reserved gap beside it.

**Validation:** tahti-web type-check, focused lint, and `git diff --check`
follow.

## 2026-08-31 — Studio submenu moved into the shell content header

**Completed:** The section page menu is now mounted once by the application
shell directly above routed content. Page-level Studio navigation instances
are disabled, removing the narrow side column that was still appearing on
Go Live, Schedule, Events, and the other Studio pages. The main rail keeps the
four peer destinations — Studio, Library, Perform, and Manage.

**Validation:** tahti-web type-check, focused navigation lint, and
`git diff --check` follow.

## 2026-08-31 — Studio main-menu active state

**Completed:** The Studio link no longer uses fuzzy route matching in the main
rail. It now follows the resolved Studio/Library/Perform/Manage section, so
only the current peer menu is highlighted.

**Validation:** tahti-web type-check, focused navigation lint, and
`git diff --check` pass.

## 2026-08-31 — Flattened Studio main navigation hierarchy

**Completed:** Studio, Library, Perform, and Manage are now peer entries in
the main navigation rather than Library, Perform, and Manage appearing as
indented children of Studio. Each keeps its own route highlight, while the
current section's page links remain in the horizontal menu above the content.

**Validation:** tahti-web type-check, focused navigation lint, and
`git diff --check` pass. The updated local Vite server is running on port 5195.

## 2026-08-31 — Studio navigation moved into the main shell

**Completed:** The left main navigation now keeps one Studio entry and shows
Library, Perform, and Manage beneath it while the user is in the Studio area.
The former four-item Studio section switcher has been removed from each page.
Its page destinations now render as a compact horizontal menu above the main
content, giving the content back the width previously occupied by the nested
side navigation.

**Validation:** tahti-web type-check, focused lint on `AppShell.tsx` and
`StudioNav.tsx`, and `git diff --check` pass. Live browser verification was
not available; the main rail and a few narrow content routes should receive
the next visual pass.

## 2026-08-31 — Go Live missing-info guidance

**Completed:** When an artist has a rotation signal ready but has not entered
a show name yet, Go Live now points them directly to the Info tab before they
publish. The prompt stays inside the readiness panel and does not interrupt
the broadcast flow for artists who already have show details.

**Validation:** tahti-web type-check and changed-file lint follow the existing
worklog validation pass; full tests remain the next check.

## 2026-08-31 — Radio schedule moved into the Perform flow

**Completed:** The schedule page is now a focused, narrower workspace instead
of a full-width calendar. Artists with a channel see their own upcoming two
weeks first, can click a show to edit it, and the station tabs are reflected
in the URL so the full Tahti Radio calendar remains directly linkable. The
global top bar no longer duplicates schedule and booking dialogs; the full
schedule is the single place for those actions.

**Validation:** tahti-web type-check and the changed-file lint pass. Full
tahti-web tests are the next verification step; live browser verification was
not available in this session.

## 2026-08-31 — Tahti-dark navigation and dropdown contrast

**Completed:** Shared dropdown menus now use the dark secondary surface with
foreground text and a restrained focus state, instead of inheriting Tahti's
amber primary surface. Active Studio and Admin section tabs explicitly retain
their amber background and black text while hovered, so the selected state
doesn't lose its contrast or visual identity.

**Validation:** The dedicated shared Select test passes (6/6), tahti-web
type-check passes, and `git diff --check` is clean. Package-wide lint remains
blocked by two Prettier errors in the concurrently edited `router.tsx`; the
changed navigation and Select files lint clean when checked directly. Live
browser verification remains useful for checking the exact theme rendering.

## 2026-08-30 — Backlog round 1: five slices closed (plus a real backend fix)

Working through the queued backlog below in batches of 5, per explicit request. This round, in order:

**Slice 1-3 — Admin → Storage → Files (detail modal, sortable list, linked user editor):** Extracted the Admin → Users detail/edit column (identity, role/membership form, suspend/restore, DM) into a new standalone `AdminUserEditPanel.tsx` — `AdminUsersView.tsx` now renders it inline exactly as before (682 → 178 lines), and `AdminStorageView.tsx`'s file rows open the _same_ component in a `Dialog` when you click the artist name, rather than a second, drifting implementation. The files list is now sortable by name/type/size/length, shows size and content type inline in the row, and a new "View details" action opens a modal with filename, size, length, uploader, upload date, genre, visibility, and revision count (`ArchiveItemVersion` count — real, wired end to end, see below) — storage location (local vs. R2) stays honestly labeled "Not tracked yet" since `ArchiveItem` has no per-item R2-mirror field in the schema, unlike `ReleaseTrack`/`ReleaseTrackVersion` which do.

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

**Slice 5 — Study: mikseri.net import**, written up at `docs/studies/mikseri-import-study.md`. Summary: no public API, no OAuth, no developer docs exist. mikseri.net's `robots.txt` explicitly reserves rights against automated access under the EU DSM directive's TDM opt-out (blocks every major AI/scraping bot by name, sets `ai-train=no`), which rules out a scraped files-import source as a good-faith option — there's also no OAuth handshake to verify "this is actually your own upload" the way the four real oauth sources here have. There _is_ an artist-initiated embeddable per-track player (`about.php`: "make a player from your tracks that you can embed elsewhere") that matches this repo's existing `EmbedProvider` shape (`lib/embedSrc.ts`) exactly — recommended as the one legitimate integration path, once a real embed snippet is captured from a live track page (not done in this pass). Recommendation: build the embed provider later; don't build a scraped import source.

**Investigated, not fixed — Settings/modal flicker:** Traced through `DialogRoot`/`SettingsPanel`/`ConnectedSettingsModal`/`AccountPanel` and ruled out several theories with code evidence: no double-mounting of the modal, no unstable component identities causing remounts, `SettingsPanelContent` has a fixed, scrolling-internally height so async data arriving late can't resize the dialog mid-animation, and the settings-store/auth-store wiring doesn't show an obvious double state-flip. React `StrictMode` is enabled (`main.tsx`) and would double-invoke mount effects in `pnpm dev`, which is a classic source of this exact symptom — but that's dev-only and wouldn't reproduce against the deployed beta build the user is presumably testing, so it's a weak lead, not a confirmed cause. Didn't find a conclusive root cause through static reading alone; this needs live browser reproduction (devtools Performance/Rendering paint-flashing, or screen recording) to pin down, which wasn't available this session. Left open below with these ruled-out leads recorded so the next pass doesn't repeat them.

**Validation:** tahti-web type-check, lint, and the full vitest suite (292/292) pass. Not click-verified in a live browser this session (no browser automation available in this environment) — the Channel Designer and Settings preview changes in particular are worth a manual look before relying on them.

## 2026-08-30 — Backlog round 3: five slices closed (plus real backend logging)

Third batch of 5, same "5 slices, push, deploy, repeat" instruction. In order:

**Slice 1 — Settings → Artist: compact circular profile image upload:** `ArtistImagePurposePicker.tsx` no longer shows a permanently-visible dashed-border drop zone. It now renders a compact circular avatar (matching how avatars render elsewhere in the app) with an upload button that only appears on hover; clicking it opens the existing drag-and-drop uploader — the purpose-selection flow (profile/gallery/press-kit) underneath is unchanged, just moved behind a smaller trigger. `SettingsPanels.tsx`'s `ArtistPanel` now passes `avatarUrl`/`displayName` through.

**Slice 2 — Channel Designer: a real backdrop image option:** The backend's `Channel.videoBackgroundUrl` column was already documented as "YouTube/Vimeo _or image URL_ for channel backdrop" — the gap was purely client-side: the VIDEO_LOOP header style only accepted `.mp4`/`.webm` uploads and always rendered a `<video>` tag. Added `isHeaderImageUrl`/`isValidHeaderBackdropUrl` (`api/channel-design.ts`) and extended the upload/URL validation and preview rendering in `ChannelDesigner.tsx` (both the tab-content preview and the hero preview card) and the two real public-page render sites in `ChannelView.tsx` to accept JPEG/PNG/WebP/GIF and render an `<img>` when the stored URL is an image. No backend change needed — this reuses the existing field and the existing (already-working) `uploadUserMediaFile` upload path, not the separate `uploadChannelHeaderVideo`/`/api/me/channel/video-background/*` functions, which turned out to be dead code with no matching backend route at all (confirmed: zero matches for `video-background` anywhere in `../tahti/apps/api`) — noted here, not fixed, since nothing in this app actually calls them.

**Slice 3 — Studio/Admin navigation active-state sweep (code fixes only, no screenshots):** Compared every `<StudioNav current=…>`/`<AdminNav current=…>` value actually passed by each view against `StudioNav.tsx`'s `SECTION_PREFIXES` and `AdminNav.tsx`'s `PRIMARY`, rather than guessing from route paths. Found and fixed real gaps: `/studio/branding` and `/studio/venues` were in neither `SECTION_PREFIXES['/studio/channel']` list (now added); `/studio/playlists` was missing from `SECTION_PREFIXES['/library']` (now added); `AdminRadioStationSuggestionsView.tsx` passed a `current` value (`/admin/radio-station-suggestions`) that doesn't exist in `AdminNav`'s `PRIMARY` at all, so nothing highlighted — changed it to alias `/admin/moderation` (the tabbed queue its own description already claims to cover "radio submissions" under), matching the existing alias pattern `AdminGrantCycleView.tsx` already uses for `/admin/grants`. Separately found `/admin/venues` (`AdminVenuesView.tsx`, a real, live route) was referenced in `AdminNav.tsx`'s own `ADMIN_SECTIONS.operations` filter list but had no matching `PRIMARY` entry at all — silently dropped by the filter, so the page had no nav entry and no highlighting. Added the missing `PRIMARY` entry. Also dropped a similarly-dead `/admin/files` reference from that same filter list (that route is redirect-only, into `/admin/storage`, so it doesn't need its own nav entry). **Not done this round:** regenerating the Tahti Map's screenshots and Mermaid diagrams — that needs browser automation, unavailable in this session; left open below.

**Slice 4 — Admin → Logs: real R2 and encoding entries (`../tahti`, explicitly authorized):** This was backend-only, in `apps/worker`. `apps/worker/src/lib/r2.ts`'s `uploadFileToR2`/`deleteFromR2` (the actual R2 client, called from `release-r2-sync.ts`'s long-term-mirror write-through) now emit a structured `console.log(JSON.stringify(...))` line per operation (bucket, key, and elapsed ms on upload) — matching the existing `logLine(fields, msg)` convention already used by `finalize-broadcast-recording.ts`, not a new logging pattern. All four transcode job files (`transcode.ts`, `transcode-version.ts`, `transcode-release-track.ts`, `transcode-release-track-version.ts`) got the same treatment: a start line when the job begins, a done line with target format and elapsed seconds on success, and a failure line with the error and elapsed time in the catch block. `/api/admin/logs` (`apps/api`) needed no changes — it already just proxies whatever these containers print to Loki verbatim, exactly as the original backlog note expected. **Validation:** ran against a real disposable Postgres (`docker run postgres:16-alpine` + `prisma db push`, then removed) — 25/25 worker test files, 91/91 tests pass, including the `transcode-release-track.e2e.test.ts` R2 write-through test, whose output now visibly shows the new structured log lines firing correctly. Worker type-check and lint clean.

**Slice 5 — Go Live: Info moved in as a tab (Preview-controls restructure not done):** `/studio/info` (`StudioBroadcastInfoView.tsx`, previously its own page and its own `StudioNav` submenu tile) is gone — `StudioGoLiveView.tsx` now has a two-tab switcher ("Go live" / "Info") right under its header, with the old page's `BroadcastPreflightPanel` content rendered under the Info tab. `/studio/info` now redirects to `/studio/go-live?tab=info` (same pattern as the `/admin/vendors` redirect from round 2), so old links/bookmarks still land somewhere sensible. `StudioNav.tsx`'s `SUBMENUS['/studio/go-live']` no longer lists Info as a sibling tile. **Not done this round:** the second half of the backlog item — moving play controls inside the "current track" display, adding a separated "play stream" button, and titling that area "Preview" — all live inside `StreamManagerPanel.tsx` (990 lines, shared with `AdminStreamManagerPanel`), and are real layout-judgment calls that need to be checked against the actual rendered page, not just source. Left open below, now scoped down to just that remaining half.

**Validation:** tahti-web type-check, lint, and the full vitest suite (292/292) pass. `../tahti/apps/worker` type-check, lint, and the full test suite (91/91) pass against a real disposable Postgres. Not click-verified in a live browser this session (no browser automation available) — the Channel Designer backdrop-image rendering and the Go Live tab switch are both worth a manual look before relying on them.

## 2026-08-31 — Backlog round 4: five slices closed

Fourth batch of 5. Also cleaned up a chunk of stale, half-finished WIP found
uncommitted at the start of this round — several files (`router.tsx`,
`StudioGoLiveView.tsx`, `changelog.json`, this worklog, and a few others) had
edits that either broke type-check outright or silently deleted already-
committed, already-validated round 3 work with no new content added.
Reverted those to the last known-good commit before starting fresh here
rather than build on top of them; nothing from round 3 was lost. In order:

**Slice 1 — Confirm before queueing multiple tracks at once:** New shared `QueueConfirmDialog.tsx` ("Queue N tracks?" / count / confirm-cancel). `ArtistView.tsx`'s `queueAlbum` (direct `onQueue` call site, not the already-confirmed `albumPrompt` "queue instead of play" path) and `ListenView.tsx`'s `queueArtist` now route through it whenever the batch is more than one track; a single track still enqueues immediately with no interruption.

**Slice 2 — "Your feed": standard thumbnail-with-overlay-controls treatment:** `FeedView.tsx`'s track items now use the shared `MediaArtwork` component (`size="thumb"`) instead of a hand-rolled square + separate `MediaIconActions` row — play sits centered on the artwork, queue in the corner, matching the same overlay treatment `Card`/`ListenView.tsx` already use. Release items were left as plain thumbnails (unchanged): the feed API's release payload (`FeedItem`, `kind: 'release'`) carries no track/playable data at all, so there's nothing to wire play/queue to without a new fetch path — a real gap, but a different, bigger piece of work than the visual-treatment ask this slice covers.

**Slice 3 — Front page: "now playing" state on On-air cards:** `ListenView.tsx`'s "On air" `CardGrid` now derives `channelIsCurrent`/`channelIsPlaying` per card from the player store's `currentId`/`status` (matching the pattern the featured Tahti Radio card already used), swaps the subtitle to "Playing now", and clicking play toggles pause/resume instead of always restarting playback when it's already the current channel. Needed a small, backward-compatible addition to the shared `Card` component (`packages/ui`): `isPlaying`/`pauseLabel` props, forwarded to the `MediaArtwork` it already wraps — `MediaArtwork` had this since before, `Card` just never exposed it.

**Slice 4 — Radio widgets: correct action icon, moved into the widget:** `PluginStorePanel.tsx`'s `RadioCategory` no longer wires a station's preview/play action through `PluginItem`'s shared `onViewDetails` slot (which always renders a settings-gear icon in a separate action column outside the widget body). It now has its own dedicated Play/Pause icon button inside `rightAccessory`, next to Enable/Configure — same toggle-if-already-playing behavior as the On-air cards above. `onViewDetails` (gear icon) is now only used for the genuinely-unconfigured case, opening the configure form, which is what that icon actually means. **Not done this round:** the cover-art upload half of the original request (station logo is still a plain URL text field) — left open below, unchanged.

**Slice 5 — Front page: continue-listening thumbnail:** `ListenView.tsx` now reads `useLibraryStore((s) => s.history[0])` (the most recently played track, already tracked client-side for the History tab) and shows it as a `Card` in a new "Continue listening" section between the featured radio card and On-air, with a play button that resumes it directly. Renders nothing when history is empty (new/anonymous listeners).

**Validation:** tahti-web and `packages/ui` type-check, lint, and vitest all pass (tahti-web 292/292; `packages/ui`'s pre-existing `CardsRow` snapshot failure was confirmed unrelated — it fails identically on a clean `git stash` of this round's changes, so left alone rather than "fixed" as a side effect). Not click-verified in a live browser this session (no browser automation available) — the On-air/radio-widget "now playing" toggle behavior and the Feed thumbnail overlay are both worth a manual look before relying on them.

## 2026-08-31 — Backlog round 5: six slices closed

Fifth batch. This session shares its working tree with other concurrent
sessions on this repo (confirmed via peer-session listing) — several of
these slices landed from that concurrent activity rather than this
session's own edits; each was reviewed and validated here before being
counted and shipped, same bar as anything written directly in this turn.

**Slice 1 — Radio schedule calendar: edit dialog + confirm-gated cancel (`../tahti` + tahti-web):** Clicking your own booking now opens a dialog instead of deleting the slot on the spot. Added `PATCH /api/me/radio-slot-bookings/:id` (`../tahti/apps/api`, note/showType only — times aren't editable here, cancel and rebook for a different slot) plus its `UpdateRadioSlotBookingSchema` in `@tahti/shared` and 2 new route tests (15/15 passing against a real disposable Postgres). `RadioScheduleView.tsx`'s dialog shows the booking's show type (Live set/Talk toggle) and note as editable fields with a "Save changes" button (new `updateShowBooking` client function, `api/shows.ts`), and a separate "Cancel booking" action that itself opens a second confirm step ("Cancel this booking? This can't be undone.") before actually deleting — no single click can delete a booking anymore.

**Slice 2 — Fixed the flashing-orange stripe on Studio navigation:** `AppShell.tsx`'s global route-loading indicator (`RouteContent`, shown on every navigation) used `animate-pulse`, which combined with the Tahti theme's loud amber `--primary` read as a flashing orange stripe across the top of the page on every menu click. Dropped the pulse animation for a steady `opacity-70` bar — still a visible loading indicator, no more flashing, in any theme.

**Slice 3 — Settings → Themes: per-theme configure icon + modal:** Themes with visualizer configuration (checked via `isThemeVisualizationEnabled`) now show a small gear icon on their tile; clicking it opens a modal containing a live `ChannelVisualizer` preview plus the existing `ThemeVisualizationSettings` controls, instead of that form sitting inline on the main Themes page for everyone regardless of which theme is active.

**Slice 4 — Studio → Releases: artwork upload moved behind hover:** `StudioReleaseDetailView.tsx`'s Artwork panel no longer shows a permanently-visible `FilePicker` next to the cover — the cover now gets a hover-reveal upload button (matching the artist profile-image circle pattern) that opens the same upload flow in a modal.

**Slice 5 — hearthis.at embed-only tracks: fixed silent non-playback in generic listings:** `api/mock.ts`'s `archiveItemToPlayable` (the general `ArchiveItem → TahtiPlayable` conversion used by broad listing surfaces like `PlayableTrackTable.tsx`) returned `null` for _every_ item lacking `audioUrl` — including hearthis.at `EMBED_ONLY` imports, which legitimately have no `audioUrl` but _are_ playable through the shared player bar's hearthis widget. `ArchiveItem` (`api/types.ts`) also hadn't declared the `embedProvider`/`embedUri` fields the API already returns. Now builds a proper `.embed`-carrying playable for `embedProvider === 'HEARTHIS'` items so they play through the existing (already-correct) `ConnectedPlayerBar`/`HearthisEmbedSurface` widget path instead of the play action silently doing nothing. Mixcloud/Spotify/Bandcamp embed-only items still return `null` from this generic conversion (deliberate — those only ever play through a page's own inline widget, which a generic channel-listing table doesn't have) — new `mock.test.ts` covers both the fixed case and this intentional boundary (4/4 passing).

**Slice 6 — Radio widgets: cover-art upload:** The station "Configure" form's cover-image field is now the standard upload pattern (`FilePicker`/`uploadUserMediaFile`) with a small link icon that toggles a plain URL text field as the alternate input — matching `ChannelDesigner.tsx`'s existing `videoUrlOpen` toggle pattern — instead of only ever accepting a raw URL.

**Validation:** tahti-web type-check, lint, and the full vitest suite (296/296) pass. `../tahti/apps/api` type-check, lint, and its full suite (217 files / 1008 tests) pass against a real disposable Postgres. Not click-verified in a live browser this session (no browser automation available) — the Radio schedule edit dialog and Themes configure modal are both worth a manual look before relying on them.

## 2026-08-30 — Planned: queued requests, not yet implemented

Logged for a future session. Several items from the previous version of this
list were completed this round — see "Round 5: six slices closed" above;
this entry now reflects what's actually still open.

**Stream playlist manager: current-track duration, listener count format, stuck bitrate.** All in `StreamManagerPanel.tsx`'s "Stream stats" tab, found while diagnosing the read-only-for-admins bug above:

- The "Current track" box (`528-556`) shows title, artist, and remaining time (`remainingSec`, from `durationSec - elapsedSinceObserved`) but never the track's total duration (`durationSec`, already computed at `267`) — add it alongside remaining time, e.g. "3:12 / 5:41" or similar, rather than remaining-only.
- "Peak listeners" (`655-659`, `stats?.listenerPeak`) has no current-listener count next to it — "Listeners" is a separate `StatCell` (`638-654`) that only shows when _not_ `rotationPlaying` (its slot switches to "Time left" while a rotation track is playing, `646`). Requested format is combined, e.g. "0 / 4" (current / peak), visible regardless of rotation state — needs reconciling with the existing Time-left/Listeners slot-swap rather than just appending a second number.
- "Bitrate" (`627-637`) shows "Detecting…" whenever `bitrate` is null and `liveActive` is true, and never resolves for a rotation-only stream (Tahti Selects) because there's no connected encoder `signal`/`stats.audioBitrateKbps` to ever populate it — it's stuck permanently, not actually detecting anything. Needs either a real bitrate source for rotation playback (the fixed output bitrate the rotation encodes at, if known) or a distinct non-"Detecting…" state for the rotation case, the same way "Signal" already has a dedicated `'Rotation'` value (`622-624`) instead of pretending to wait on encoder signal.

**Stream playlist manager: "Live for" resets instead of showing the real broadcast uptime.** `StreamManagerPanel.tsx`'s `liveDurationSec` (`239-243`) prefers `stats?.liveDurationSec` from the server but falls back to a purely local `liveStartedAt` (`132`, `231-237`) that's set to `Date.now()` the moment the component mounts and sees `liveActive`. For Tahti Selects (an always-on rotation channel, not a single per-session broadcast), every time this panel is mounted/reopened the "Live for" stat restarts from zero instead of reflecting how long the station has actually been online — it needs a real server-tracked start timestamp (e.g. `goneLiveAt` already used elsewhere, `AdminStreamManagerPanel.tsx:375-380`) for rotation-mode channels rather than relying on this client-side fallback at all.

**Tahti theme: hover/dropdown contrast bugs, plus a general usability audit.** `packages/themes/src/basic/tahti-dark.css` sets `--accent-orange` to the exact same value as `--primary` (both `oklch(0.8131 0.165 75.04)`, the theme's single bold amber accent, `18-19` / `37`) — any shared component that uses an "accent orange" token for a normally-subtle highlight (e.g. a hover or dropdown-option state) ends up fully saturated in the theme's loudest brand color instead, which is the likely root cause of both reports below. Needs the actual component(s) identified against a live render before fixing, not just this token-collision theory:

- Hovering an already-active tab turns its text black and the active-state indicator disappears — sounds like a `:hover` rule is overriding the active-tab's own text/background color rather than composing with it.
- Dropdowns render fully orange with unreadable text — likely the same `--accent-orange` collision above; find which shared dropdown/select component this is (native `<select>` browser chrome can't be restyled this way, so it's probably a custom listbox/menu component) before changing anything, since a fix here could affect every other theme too.
- Beyond these two: do a general pass over `tahti-dark.css` and how its tokens get consumed for other places a similar loud-orange or lost-contrast issue could show up (any other component leaning on `--accent-orange` as a "mild highlight" the way this theme's identity doesn't allow).
- **Fixed this round:** the global route-transition indicator was the concrete, confirmed source of the flashing-orange-stripe report. `AppShell.tsx`'s `RouteContent` (`108-125`) renders a `bg-primary` strip across the top of the page whenever `router.status === 'pending'` (`109-111`), i.e. on every navigation — it had `animate-pulse` (an opacity oscillation), which combined with this theme's loud amber `--primary` read as a flashing orange stripe on every Studio menu click. Dropped `animate-pulse` in favor of a steady `opacity-70` bar — still a visible loading indicator in any theme, no more flashing. The dropdown/hover contrast bugs above are the same root pattern (a component leaning on this theme's loudest token for something meant to be quiet) but need a live render to locate before fixing, unlike this one which was a single, easily-verified class.

**Radio schedule page: narrower layout, "my channel" default, next-2-weeks sidebar, retire the top-bar modal:**

- Make `RadioScheduleView.tsx` (`PageFrame maxWidth="full"`, `184`) noticeably narrower than full-width.
- Default the station filter to `'mine'` instead of `'radio'` (`station` state, `56`, `StationFilter = 'radio' | 'mine'` in `lib/radioSchedule.ts:18`) — i.e. show the artist's own channel's slots by default — while still allowing a direct link to the full Tahti Radio calendar (`?station=radio` or similar; the filter is plain component state today, not URL-driven, so this needs wiring through the route's search params to be linkable).
- Once the calendar itself is narrower, add a left-hand summary panel listing the next 2 weeks of the user's own upcoming shows (channel included) — clicking one opens a modal with that show's info. No such summary exists today; the closest precedent is the green-room bookings list already at the top of this view (`190-`) and `RadioBookingCalendar.tsx`'s existing `Dialog.Root` show-detail modal (`451-528`) as a template for the click-to-modal part.
- Remove the "Schedule" button/modal from the top bar entirely — `AppTopNav.tsx`'s `scheduleOpen` state (`51`) and `ScheduleDialog` (`475-479`, imported `26`) — and fold that content into the Perform section ("broadcast") instead, without action buttons (a read-only summary there, not a second place to book/cancel slots). Check what's actually different between `ScheduleDialog`'s content and `RadioScheduleView`'s before deciding whether this becomes a compact embed of the same view or its own summary.
- A later message asked for the opposite direction on this same dialog — add "Your channel" / "Tahti Radio" tabs to `ScheduleDialog.tsx` (currently a single 14-day upcoming-bookings list, `DAYS_VISIBLE`/`fetchShowBookings`, `15-40`, under a `"Book a slot"` dialog title at `154`) and change its text to reflect which one is selected — before implementing either, reconcile with the user whether the modal is being removed (per the bullet above) or kept-and-improved with tabs, since the two requests point different ways.

**Go Live: missing-info nudge, show duration, and start-time countdown:**

- On the "Ready to take over the rotation" panel (`StudioGoLiveView.tsx:387-402`), if the broadcast's show info hasn't been filled in yet (no `title`/other required `BroadcastPreflight` fields — check `fetchBroadcastPreflight`'s actual required-vs-optional shape in `api/shows.ts` before deciding what counts as "not entered"), show a note there and a link to the Info tab (`?tab=info`, per round 3's tab switcher) to fill it in.
- Add a duration field (hours + minutes, with 1-hour/2-hour presets but also free-entry in minutes) to `BroadcastPreflightPanel.tsx` — no duration field exists on `BroadcastPreflight`/`PlannedLiveShow`/`PlannedRadioShow` today (`api/shows.ts`), so this is a new field, likely needing a real backend column in `../tahti` (check the actual DB model there before adding a client-only field that can't persist). Apply the same duration control to the show editor (`StudioShowDetailView.tsx`) too, not just the Go Live Info tab.
- Add a start-time field, defaulting to the current time, alongside duration — same two places (Info tab, show editor).
- When a show already has a preconfigured start time in the future, replace (or supplement) the static info with a live countdown banner instead, on whichever page is showing that upcoming show.

**Regenerate the Tahti Map's screenshots and Mermaid navigation diagrams.** Round 3 above already fixed the actual active-state highlighting bugs the original request was about (`SECTION_PREFIXES` gaps for Branding/Playlists/Venues, `AdminNav` gaps for the radio-station-suggestions alias and the missing Venues entry). What's left is purely the documentation refresh: regenerate screenshots (`capture-map-screens.mjs` / the Tahti Map entries earlier in this file) and the Mermaid navigation diagrams so the documented sitemap matches the now-corrected navigation — needs browser automation, unavailable this session.

**mikseri.net embed provider.** Per the completed study (`docs/studies/mikseri-import-study.md`, round 2 above), add a `MIKSERI` `EmbedProvider` (`lib/embedSrc.ts`) once a real embed snippet is captured from a live mikseri.net track page — the URL shape/query params weren't captured in the study pass. Do not build a files-import `SourceDef`; the study found no API and an explicit `robots.txt` objection to automated access.

**Settings → Artist: port the press kit editor from `../tahti`, consolidate branding tabs.** Port the press-kit download/editing forms from the sibling `../tahti` repo into this app, placing them under Settings → Artist → Branding (this app already has _press-kit preview_ per "2026-08-28 — Press kit preview parity" — this is the editing/download side, which is apparently still missing or divergent). The source to port from: `../tahti/apps/web/src/app/dashboard/channel/edit/page.tsx` — its "promotional media" section already calls `/api/me/press-kit/images` and `/api/me/press-kit/gallery-settings` (`PressKitImageItem` from `@tahti/shared`) for exactly this editor. Move "Channel & Design" to live under the Artist settings tab (as its own "Channel & Design" icon tab there) rather than wherever it currently sits. Once moved, remove the now-duplicate channel/branding editor that currently exists separately from it — check `ChannelDesigner.tsx` and Settings → Artist → Branding for which one becomes the single source of truth before deleting the other. Also add a toggle controlling whether a "Download press kit" button shows among the profile's icon buttons (e.g. alongside share/favorite on `ArtistView.tsx` — check for the nearest existing precedent for a per-artist visibility toggle, like `useChannelShareStore`'s share-button toggle, before inventing a new settings-storage pattern).

**Settings/modal flicker on open.** Opening Settings (and reportedly other modals too) visibly flickers a couple of times. Round 2 above traced through the obvious static candidates (double-mount, unstable component identities, dialog resizing mid-animation, store double-flips) and ruled all of them out from code alone — see that round's "Investigated, not fixed" note for exactly what was checked and why each was ruled out, so a future pass doesn't repeat the same dead ends. What's left: live browser reproduction (devtools Rendering → paint flashing, or a screen recording of the actual open) to see what's _actually_ repainting, since static reading alone couldn't pin it down. This file's "2026-08-28 — Settings theme flicker" entry fixed a related but narrower preview-lifecycle flicker; still unconfirmed whether this is the same root cause resurfacing.

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

**Go Live: restructure the Preview controls.** Info is already a tab within Go Live as of round 3 above (`StudioGoLiveView.tsx`'s tab switcher) — what's left is the play-controls restructure: on the main Go Live tab, move the play controls inside the "current track" display (inside `StreamManagerPanel.tsx`, 990 lines, shared with `AdminStreamManagerPanel.tsx` — check both call sites before changing its layout), add a distinct "play stream" button in a separate, clearly separated spot from those track controls (not merged into the same control cluster), and title that current-track playback area "Preview". This is a real layout judgment call — verify against the actual rendered page, not just source, before implementing.

**Feed: wire play/queue to release items too.** Round 4 above gave Feed's track items the standard `MediaArtwork` overlay treatment; release items were deliberately left as plain thumbnails since `FeedItem`'s release payload (`api/types.ts`, `kind: 'release'`) carries no track/playable data — there's no `audioUrl`/track list the way the track-kind item has (`feedPlayables` map, `FeedView.tsx:~72-95`). Giving releases the same play/queue overlay needs a new fetch path (e.g. resolving the release's own track list on demand, similar to how `ArtistView.tsx`'s `releasePlayables` works for a release the page already has loaded) before the visual treatment can carry real actions.

**Collection view: hover cover/backdrop upload, matching gradient, tabbed visibility:**

- `CollectionView.tsx` (the public, read-only collection page) has no inline cover-upload affordance — uploading a cover only works from the separate `/studio/collections/$slug` edit page (`StudioCollectionEditView.tsx:530-553`, `uploadCollectionCover`). Add a hover-reveal upload button directly on the cover art in `CollectionView.tsx` (`161-188`) for the owner, opening the same upload flow in a modal — same pattern as the circular profile-image hover-upload already shipped in `ArtistImagePurposePicker.tsx`.
- `CollectionView.tsx` renders no backdrop at all today, even though `backdropUrl` already exists as a real, working field (`StudioCollectionEditView.tsx:327,360,469,554-560`, its own `ImageUploadField` upload widget). Render it as the page backdrop when set; when not set, show a default gradient derived from the cover image's own colors (check whether a color-extraction helper already exists in this app — `ChannelDesigner.tsx`'s `colorScheme`/`fillColorScheme` handles a related "derive a scheme" concept, worth checking before writing a new one) rather than a flat placeholder.
- Same hover-upload treatment for the backdrop as the cover, except backdrop should accept multiple images (a gallery/slideshow), not just one — check whether `ChannelDesigner.tsx`'s existing gallery upload (`selectGalleryFiles`, `galleryImages`, `galleryMode`) is close enough in shape to reuse rather than building a second one-to-many image uploader from scratch.
- `StudioCollectionEditView.tsx`'s Visibility section (`646-674`, a `StudioPanel` with the Public/Unlisted/Private select) currently always renders inline alongside every other section — move it under its own tab in the edit page's menu, and only show that tab while actively editing (the page already has a viewing vs. editing state distinction for the description field, `~624-643` — check how that toggle works before adding a second one).

**Go Live restructure: move Radio into Perform, pull the stream manager out into a modal, add top-bar broadcast controls, collapse the encoder block:**

- Move the "Radio" submenu tile from Manage to Perform: `StudioNav.tsx`'s `SUBMENUS['/studio/channel']` (`130-134`, `to: '/studio/channel?tab=radio'`) should move into `SUBMENUS['/studio/go-live']` (`105-118`) instead.
- `StudioGoLiveView.tsx` renders the full `StreamManagerPanel` (the playlist/rotation manager) inline on the page (`374-382`) — remove it from the page body. Instead, add a button on the "take over the rotation" panel (`387-402`, `title="Ready to take over the rotation"` state) that opens the same `StreamManagerPanel` in a modal, so the manager is reachable on demand rather than always taking up page space.
- Add live stream controls (playback controls, current track, and a button that opens the same modal stream manager for full control) to the top-bar broadcast menu — the existing "Broadcast status" flyout in `AppTopNav.tsx` (`broadcastOpen` state, `~174-211`, already shows `broadcast.label`/live-vs-rotation state) is the natural place for this, rather than building a second broadcast-status surface.
- Collapse the "Connect broadcasting software" block (`StudioGoLiveView.tsx:463`, `title="Connect broadcasting software"`) — it should default to collapsed/compact so the encoder-setup detail doesn't dominate the page.
- Overall goal stated by the request: make the Go Live page as simple a view as possible for someone who just wants to start streaming — treat the above as means to that end, not independent tweaks; re-check the resulting page as a whole once these land, not just piece by piece.

**Go Live → Info panel: episode number visibility, show avatar, compact show-name/tagline row:** All in `BroadcastPreflightPanel.tsx` (the Info tab content per round 3 above):

- The "Episode number" input (`108-130`) always shows, regardless of whether the broadcast is actually part of a series — only show it when a series is selected (`preflight.plannedLiveShow?.seriesId` / the `series` select at `188-211`), not for one-off broadcasts.
- Make the toggle-style controls much smaller — likely the "Show type" and "Visibility" segmented radiogroups (`131-186`), each rendered as full-width `flex-1` padded buttons; confirm against the actual rendered page which control the report means before shrinking.
- Add a round avatar image for the show, clickable to open an upload modal (same hover-to-upload pattern as the artist profile-image circle, `ArtistImagePurposePicker.tsx`) — when the broadcast is part of an existing series, default to that series' own image instead of prompting a fresh upload. No show-image field exists in this panel today; check whether `fetchShowSeries`/the series API already carries an image URL before adding a new one.
- Move "Tagline" (`213-224`, currently its own full-width row below everything else) to sit next to "Show name" (`98-107`, currently paired with Episode number in a `grid-cols-[minmax(0,1fr)_8rem]` row) — and make both fields shorter/more compact than their current full-height text inputs.

**Full navigation/layout consistency audit — header stability, single title, persistent active state, less scrolling, correct click targets:** A broader, later pass than the round 3 nav active-state sweep above (which only fixed specific `SECTION_PREFIXES`/`AdminNav` gaps) — this is asking for a full walk of every main-menu page and submenu:

- The page header shouldn't shift position/size between routes within the same section — audit for layout jumps as you move between submenus.
- Only one title should be visible on screen at a time. Confirmed concrete duplicate: `LibraryView.tsx:75` renders `title="Sounds"` while `MyDiscographyView.tsx:202` separately renders `title="All sounds"` — check whether these two ever compose on the same screen (or are just confusingly similar on adjacent screens) and reconcile the naming either way. `StudioArchiveView.tsx:275` also uses `title="Sounds"` as its own `StudioPageHeader` — three separate "sounds" section titles across the app is itself worth consolidating.
- The active top-level section should never disappear. Concrete case: `LibraryView.tsx` renders `<StudioNav current={...} />` (`58`), and `StudioNav.tsx`'s section logic (`~227`) treats `/library` and `/studio` as two distinct top-level sections rather than Library being a Studio subsection — so if the mental model is "Library lives under Studio," landing on `/library` correctly makes "Studio" stop being the highlighted top-level tab today, which may be the actual bug (wrong IA) rather than a highlighting glitch. Confirm which information architecture is intended before "fixing" the highlighting either way.
- Reduce vertical/horizontal scrolling across pages generally — no specific page named, needs a page-by-page audit.
- Clicking a track/song title should open the full track player (`/track/$id` → `TrackDetailView.tsx`), not the Studio editor (`/studio/archive/$id` → `StudioArchiveItemView.tsx`) — a distinct, explicit "Edit" action should be the only way to reach the editor. Confirmed concrete violation: `LibraryView.tsx`'s "Top sounds" list (`222-228`) links track titles straight to `/studio/archive/$id`. Apply this play-vs-edit distinction as a standing principle everywhere a track row exists, not just this one list — needs the same kind of sweep as the tracklisting-component item below, since this repo has many independent track-row implementations.

**Sweep: replace standing cover/backdrop upload widgets with hover-to-upload everywhere.** Generalizes the Collection view item above into a standing rule: cover/backdrop art should never have its own permanently-visible upload form sitting in the page — show the current image (or a sensible default/placeholder) and reveal an upload affordance only on hover, opening a modal to actually upload, matching the pattern already shipped for the artist profile-image circle (`ArtistImagePurposePicker.tsx`) and planned for Collection view above. Known standing-widget instances to convert, found via a `FilePicker` sweep across `src/views`: `StudioReleaseDetailView.tsx`'s Artwork panel (`180-211`, `uploadReleaseArtwork`); `StudioShowDetailView.tsx`; `StudioBrandingView.tsx`. Audit each before converting — some of these panels may have a reason to stay explicit (e.g. a first-time empty state with no existing image to hover over), so this isn't a blind find-and-replace.

**Channel Designer visualizer: fill the whole banner area.** Visualizer presets don't use the full available space in a widescreen banner — check whether the presets (`plugins/visualizers` or wherever the actual canvas-drawing code lives, rendered via `ChannelVisualizer.tsx`) can be configured/scaled to fill the whole backdrop banner container rather than rendering into a smaller fixed area within it.

**Track detail page: compact the layout, restructure stats/controls, fix the missing pieces.** `TrackDetailView.tsx` (804 lines) needs several related passes — check the actual rendered page against these before implementing, several are layout judgment calls that are hard to fully verify from source alone:

- The page scrolls both vertically and horizontally today — audit for what's causing the horizontal overflow specifically (likely something not respecting `min-w-0` in the flex layout around the hero section, `340-458`) and tighten the vertical rhythm generally so less scrolling is needed to see the whole page.
- The stats row (comment/download/favorite counts, `503-520`) is currently three plain non-interactive `<span>`s sitting above the action-button row and the waveform is above that (`435-445`) — move the stats row to directly below the waveform, and make each stat a real action button: the favorite count should toggle the same `toggleFavoriteTrack(playable)` already wired to the separate heart button at `587`, and the download count should trigger `downloadTrack()` (`320`), each updating its own displayed number and active/filled icon state on click, rather than being decorative next to functioning icon-only buttons elsewhere in the row.
- Remove the "Expand player" button (`528-542`, `Maximize2Icon`) — full-screen expand already lives in the persistent player bar (`ConnectedPlayerBar.tsx`, per this file's 2026-08-30 round-1 queue/full-screen button entry), so this is a redundant second control.
- The outer wrapper already bleeds the hero section full-width via negative margins (`340-341`: `-mx-6 -mt-6 md:-mx-8 md:-mt-8`) — reported as still leaving "a weird gap around the container" in normal (non-fullscreen) mode; re-check whether that negative-margin treatment actually reaches every section of the page or only the hero, since the complaint implies it doesn't extend consistently.
- Add a "More from this artist" section, rendered as a horizontal row/rail below the main player box — nothing like this exists in the file today (checked for `relatedCollections`/similar — the closest is the `Collections` aside at `716-720`, which is a different, already-existing section).
- The artist identity chip (avatar + `detail.channel.displayName`, `598-618`) does exist in source, contradicting "artist name is missing" at face value — likely either not visible in the reporter's actual viewport (it sits in a `flex-wrap justify-between` row that could wrap below the fold on narrow widths) or `detail` was null when they looked (the whole block is gated on `detail ?`). Needs visual confirmation against a real render, not just source reading, before concluding what's actually wrong.
- Comments (`672-710`) render as a flat `<li>` list with no background/bubble container around each comment's text — add one. Comment dates render via `new Date(comment.createdAt).toLocaleDateString()` (`703`) — a fixed calendar-date string, not a relative/humanized one ("2 hours ago", "3 days ago"); no relative-time helper exists anywhere in this repo yet (`FeedView.tsx`'s `formatFeedDate` is a fixed short-date formatter too, not relative) — one needs to be written.
- `WaveformSeekbar.tsx`'s comment markers (`133-141`) render as plain small yellow dots, not icons — swap for an actual comment-icon glyph (e.g. `MessageCircleIcon`, already imported and used elsewhere in `TrackDetailView.tsx`) positioned at each marker's timestamp fraction.

**Listen page: "Add widget" button linking into the addon store.** No such button/link exists on `ListenView.tsx` today. `PluginStorePanel.tsx` (`160-183`) has no prop to open pre-scoped to a category or sub-tab — `useSettingsModalStore().open(tab)` only selects the Settings _section_ (`plugin-store`), not a tab within it. Two things need building: a way to deep-link the plugin store to a specific category tab (the "listening" ones being `radio`/`embed`/`discovery`/`channel` per `pluginStoreCategories.ts`), and the actual "Add widget" button/link on `ListenView.tsx` that uses it.

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

| #   | Page                         | Route                                        | Status       | Shot                                                                              |
| --- | ---------------------------- | -------------------------------------------- | ------------ | --------------------------------------------------------------------------------- |
| 1   | Studio home                  | `/studio`                                    | **approved** | `docs/redesign-shots/studio-home-v1.png`                                          |
| 2   | Go Live wizard               | `/studio/go-live`                            | **approved** | `docs/redesign-shots/studio-go-live-v1.png`                                       |
| 3   | Music / Archive (Library)    | `/studio/archive`                            | **approved** | `docs/redesign-shots/studio-archive-v1.png`                                       |
| 4   | Archive item                 | `/studio/archive/$id`                        | **approved** | `docs/redesign-shots/studio-archive-item-v1.png`                                  |
| 5   | Upload                       | `/studio/upload`                             | **approved** | `docs/redesign-shots/studio-upload-v1.png`                                        |
| 6   | Releases                     | `/studio/releases`                           | **approved** | `docs/redesign-shots/studio-releases-v1.png`                                      |
| 7   | Release detail               | `/studio/releases/$id`                       | **approved** | (panels + Save CTA)                                                               |
| 8   | Collections / album designer | `/studio/collections`                        | **approved** | `docs/redesign-shots/studio-collections-v1.png`                                   |
| 9   | Collection editor            | `/studio/collections/$slug`                  | **approved** |                                                                                   |
| 10  | Audio editor list            | `/studio/editor`                             | **approved** | (panels + icon row actions)                                                       |
| 11  | Editor project               | `/studio/editor/$id`                         | **approved** |                                                                                   |
| 12  | Schedule                     | `/studio/schedule`                           | **approved** | `docs/redesign-shots/studio-schedule-v1.png`                                      |
| 13  | Stats                        | `/studio/stats`                              | **approved** | `docs/redesign-shots/studio-stats-v1.png`                                         |
| 14  | Stats detail                 | `/studio/stats/detail`                       | **approved** | (panels + range chips)                                                            |
| 15  | Channel designer             | `/studio/channel`                            | **approved** | `docs/redesign-shots/studio-channel-v1.png`                                       |
| 16  | Shows                        | `/studio/shows`                              | **approved** | `docs/redesign-shots/studio-shows-v1.png`                                         |
| 17  | Show detail / episode review | `/studio/shows/$id`, `…/episodes/$episodeId` | **approved** |                                                                                   |
| 18  | Playlists                    | `/studio/playlists`, `…/$slug`               | **approved** | `docs/redesign-shots/studio-playlists-v1.png`                                     |
| 19  | Updates / newsletter         | `/studio/updates`                            | **approved** | `docs/redesign-shots/studio-updates-v1.png`                                       |
| 20  | Revenue / Connect            | `/studio/revenue`                            | **approved** | `docs/redesign-shots/studio-revenue-v1.png`                                       |
| 21  | Stash                        | `/studio/stash`                              | **approved** | `docs/redesign-shots/studio-stash-v1.png`                                         |
| 22  | Sources hub                  | `/sources`                                   | **approved** | `docs/redesign-shots/sources-v1.png`, `docs/redesign-shots/sources-detail-v1.png` |
| 23  | Settings — account           | `/settings/account`                          | **approved** | already Nuclear shell (no redesign needed)                                        |
| 24  | Settings — artist            | `/settings/artist` (etc.)                    | **approved** | `docs/redesign-shots/settings-artist-v1.png`                                      |
| 25  | Settings — money / fan tiers | `/settings/money`                            | **approved** | already Nuclear shell (no redesign needed)                                        |
| 26  | Settings — connections       | `/settings/connections`                      | **approved** | already Nuclear shell (no redesign needed)                                        |

## Admin (prod `/admin/*`)

Porting into a Nuclear admin shell, gated on `user.isBoard`. Page-by-page loop, same as artist studio above. Inventory from prod `admin-nav`:

| #   | Page                        | Prod route                                   | Status       | Shot                                                              |
| --- | --------------------------- | -------------------------------------------- | ------------ | ----------------------------------------------------------------- |
| A1  | Dashboard                   | `/admin/dashboard` → `/admin`                | **approved** | `docs/redesign-shots/admin-dashboard-v1.png`, `…-expanded-v1.png` |
| A2  | Beta applications           | `/admin/beta`                                | **approved** | `docs/redesign-shots/admin-beta-v1.png`                           |
| A3  | Users                       | `/admin/users`                               | **approved** | `docs/redesign-shots/admin-users-v1.png`                          |
| A4  | Radio                       | `/admin/radio`                               | **approved** | `docs/redesign-shots/admin-radio-v1.png`                          |
| A5  | Radio submissions           | `/admin/radio-submissions`                   | **approved** | `docs/redesign-shots/admin-radio-submissions-v1.png`              |
| A6  | News                        | `/admin/news`                                | **approved** | `docs/redesign-shots/admin-news-v1.png`                           |
| A7  | Tahti Selects               | `/admin/tahti-selects`                       | **approved** | `docs/redesign-shots/admin-selects-v1.png`                        |
| A8  | Streams                     | `/admin/streams`                             | **approved** | `docs/redesign-shots/admin-streams-v1.png`                        |
| A9  | Support                     | `/admin/support`                             | **approved** | `docs/redesign-shots/admin-support-v1.png`                        |
| A10 | Top lists                   | `/admin/top-lists`                           | **approved** | `docs/redesign-shots/admin-top-lists-v1.png`                      |
| A11 | Announcements               | `/admin/announcements`                       | **approved** | `docs/redesign-shots/admin-announcements-v1.png`                  |
| A12 | Storage                     | `/admin/storage`                             | **approved** | `docs/redesign-shots/admin-storage-v1.png`                        |
| A13 | Files                       | `/admin/files`                               | **approved** | `docs/redesign-shots/admin-files-v1.png`                          |
| A14 | Content reports             | `/admin/content-reports`                     | **approved** | `docs/redesign-shots/admin-content-reports-v1.png`                |
| A15 | Financial                   | `/admin/financial`                           | **approved** | `docs/redesign-shots/admin-financial-v1.png`                      |
| A16 | Governance hub              | `/admin/governance`                          | **approved** | `docs/redesign-shots/admin-governance-v1.png`                     |
| A17 | Feature requests            | `/admin/feature-requests`                    | **approved** | `docs/redesign-shots/admin-feature-requests-v1.png`               |
| A18 | Grants                      | `/admin/grants`                              | **approved** | `docs/redesign-shots/admin-grants-v1.png`                         |
| A19 | AGM                         | `/admin/agm`                                 | **approved** | `docs/redesign-shots/admin-agm-v1.png`                            |
| A20 | Vendors                     | `/admin/settings/vendors` → `/admin/vendors` | **approved** | `docs/redesign-shots/admin-vendors-v1.png`                        |
| A21 | Status                      | `/admin/status`                              | **approved** | `docs/redesign-shots/admin-status-v1.png`                         |
| A22 | i18n languages + CSV import | (new — see Phase 0)                          | **approved** | `docs/redesign-shots/admin-i18n-v1.png`                           |

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

**hearthis.at embeds "not working in the player":** Root cause wasn't the embed widget itself — `lib/embedSrc.ts`'s `hearthisEmbedSrc` was verified byte-for-byte against the canonical `packages/shared/src/hearthis-embed.ts` in the main tahti repo and confirmed live via `curl` (200, real embed HTML, no blocking CSP/X-Frame-Options). The actual bug: `StudioArchiveItem` (the "My Library" list type) never carried `embedProvider`/`embedUri` at all, so an artist's own hearthis.at-imported tracks were indistinguishable from real uploads in Studio → Music. Clicking Play called `fetchEditorSource` — an endpoint that expects a real Tahti-hosted file — against a track Tahti never hosts, so it silently failed. Every _other_ embed surface (`CollectionView`, `StudioCollectionEditView`) already filtered/branched on these fields correctly; only Studio Archive was missing them. Added the fields to the type, a mock hearthis.at row for testability, and swapped the Play button to open the same `EmbedTrackRow`-style inline iframe used elsewhere when a row is embed-only (also hides the now-meaningless "Audio editor" action for those rows). Live-verified: the real hearthis.at widget mounts and plays.

**Dynamic appearance mode:** `themeStore.ts` gained a `colorMode: 'light' | 'dark' | 'dynamic'` alongside the existing `dark` boolean — `dynamic` re-resolves against the local clock (dark 19:00–06:59) on a 5-minute interval so it keeps tracking day/night while the tab stays open, without needing a page reload. A brand-new user with no persisted preference now defaults to `matchMedia('(prefers-color-scheme: dark)')` instead of the old hardcoded dark default — same fallback duplicated in `index.html`'s pre-React boot script so there's no flash of the wrong theme. Onboarding gained an "Appearance" tab (Light / Dark / Dynamic) that applies live as it's picked and pre-selects whichever option matches the OS, exactly as asked; `ThemesView.tsx` and Settings → Themes both got the same 3-way control so `dynamic` remains a live, undoable choice rather than a onboarding-only dead end. New `isDynamicDark` unit tests (7 cases, hour boundaries).

**Chat reconnect flicker:** `ChannelChatPanel`'s viewer-connect `useEffect` depended on `[slug, mode]` — but its own WebSocket's `onclose` handler demoted `mode` from `'live'` back to `'rest'` on any drop, which re-triggered that same effect and opened a _second_ connection as an accidental, undocumented reconnect path with no backoff and no visible-state debounce, so a flaky connection flickered the "Live" badge on every drop/reconnect cycle. Replaced it with an explicit, owned reconnect: `connectWs`'s `onclose` now schedules a retry (linear backoff, capped at 5 attempts, skipped on intentional close from unmount/slug-change) instead of relying on the mode-change side effect, and the effect itself now depends only on `[slug]`. Separately, the "Live" badge is now driven by a debounced `liveDisplay` state that only flips to false after 8 continuous seconds of disconnection (`DISCONNECT_GRACE_MS`) — a quick drop-and-recover never touches the UI. The real send-message gate still checks the live `wsStatus`, not the debounced display, so nothing sends over a socket that only _looks_ connected.

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

**Per-screenshot navigation atlas:** the Screen atlas's single ~90-node "every user option on one canvas" mermaid diagram was unreadable and, per the user, "mixed up." Replaced it with one small diagram _and_ an accessible text list per screenshot (`actions`/`goesTo` fields added to `MapCase` in `content/mapScreens.ts`, a `caseFlowchart()` generator that turns that same data into a mermaid chart so the two representations can't drift apart — the text list is the actual accessible source of truth, the diagram is a supplementary visual). Every `goesTo` edge for all 46 cases is grep-verified against real source, not guessed; the persistent chrome (`AppShell`'s sidebar, `StudioNav`) is deliberately excluded from each screen's edge list since it reaches nearly everywhere and would make all 46 diagrams identical noise — that's also why the Music-in-sidebar gap above mattered, it's a hole in the one nav surface that _isn't_ per-screen. The old monolithic diagram (pack `current`, i.e. apps/web) was replaced with a short redirect note pointing at the new atlas rather than mechanically split, since re-verifying a different repo's routes wasn't in scope this session.

**Bundle budget:** mermaid and Three.js were already correctly code-split (confirmed via a real production build, not assumed) — the actual problem was that all 22 admin pages were statically imported at the top of `router.tsx`, bundling board-only pages into the JS every anonymous listener downloads. Converted them to `lazyRouteComponent`, each into its own small chunk (~1-15 KB apiece) — a real if modest win (~95 KB off the main chunk); the true bulk of the ~2.6 MB main chunk is elsewhere and wasn't chased further this session.

**Admin → Activity:** a new page reusing the Nuclear desktop player's `LogViewer` UI (`@tahti-player/ui`, already shared — no porting needed, just composed via its `Root`/`SearchInput`/`LevelFilter`/`ScopeFilter`/`EntryCount`/`VirtualizedList` subcomponents rather than its default `Toolbar`, since "Clear"/"Open log folder" don't make sense for a real audit trail), fed by real system events — logins, uploads, releases, likes, follows, new fan subscriptions — not mocked. The backend half (separate repo, `tahti`) extended the existing board-gated `AuditLog` (already paginated/filterable/CSV-exportable) with three new action types rather than building a parallel system, instrumented at each real create path, verified against a live DB that repeat likes/follows/subscription-renewals each write exactly one row, not one per call. "Listened track" is deliberately absent — `ListenEvent` rows are anonymous by design (no `userId` column, for listener privacy), so there's no real per-user event to show; the page notes this and points at Stats for aggregate counts instead of fabricating attribution the data doesn't have.

**Admin → Logs, and a real architecture correction caught before it shipped wrong:** built to reuse the same `LogViewer` pattern for real container logs. First attempt added a whole new Loki + Grafana-datasource setup to `tahti/infra/docker-stack.yml` — which turned out to be a dormant, never-deployed aspirational Swarm migration file; the actual production stack on `vimage` runs via plain `docker compose` against `docker-compose.stack.yml`, and Loki + Grafana + a Loki datasource _already exist_, running on `vimage6` (confirmed by SSH, not assumed from repo docs). Corrected before merging: removed the redundant Loki service and datasource-provisioning from the unused file, pointed both files' logging config at the real `192.168.2.105:3100`, and added the actual `GET /api/admin/logs` route (queries Loki's `query_range` API server-to-server, board-gated, degrades to `lokiReachable:false` instead of throwing if Loki's down) — verified against the live vimage6 Loki, not mocked. Installed the missing Loki Docker logging-driver plugin on `vimage` and ran the real production deploy (`scripts/deploy_prod.sh`, coordinated with the concurrent `tahti-06` session to avoid racing a second deploy on the shared checkout): confirmed post-deploy that all 14 services now have real log streams flowing into Loki with exactly the labels the frontend's scope-parser expects, and that the new endpoint is live and correctly board-gated (401 with no session).

**In progress at session end — vimage7 GPU stem-separator:** asked to make the `worker` on `vimage7.local` use its NVIDIA GPU for "encoding." Checked before touching anything: every ffmpeg job in `apps/worker` is audio-only (`libopus`/`libmp3lame`/`flac`/`aac`) — NVENC only accelerates video codecs, so GPU passthrough for the transcode worker's actual workload would do nothing. The real GPU-shaped workload already in the fleet is `services/stem-separator` (ML source-separation inference, explicitly `[cpu]`-only today per its own Dockerfile comment, written when the only known hosts were colo/Hetzner with no GPU) — confirmed the GPU is real and working on vimage7 (`nvidia-smi`, GTX 950, driver 580.173.02) but the NVIDIA Container Toolkit wasn't installed. Since `separate-stems` is already in the `transcode` lane already running on vimage7, moved stem-separator into the same `docker-compose.worker-remote.yml` project (GPU device reservation, `audio-separator[gpu]` swap, no code change needed — `main.py` never hardcoded a device, the library auto-detects CUDA) rather than adding a new host. Deliberately no `depends_on` between the two services — stem-separator failing to start (e.g. toolkit not yet installed) must not block `worker-transcode`, matching the pre-existing "not required to boot" resilience design. Removed it from the main stack on vimage, repointed `STEM_SEPARATOR_URL` there at vimage7 instead. Blocked on: `sudo` on vimage7 needs an interactive password this session doesn't have, so the toolkit install itself needs a human; deploy of the new colocated services was kicked off and left running in the background (large image — torch + two baked-in model checkpoints + CUDA wheels) at the point this entry was written, not yet confirmed complete.

**Status:** the accessibility, studio UX, navigation atlas, bundle-budget, and Activity-page work above are implemented, tested (existing PlayerBar/Tooltip snapshot tests updated and passing, new archive-likes/artist-follows/fansubs/admin-logs tests added in the `tahti` repo and passing against a real Postgres, full `tahti-nuclear` suite — 69/69 — and `tahti` suites all clean), and pushed + deployed to production. The stem-separator GPU move is code-complete and pushed but not yet confirmed live — see above.

### 2026-08-25 (continued) — Stem separation UI, listener widgets, Plugin Store, History page port, MediaSession

**Goal:** vimage7 deploy confirmed live (worker-transcode up; stem-separator built but blocked on the toolkit install, as expected). From there: wire the stem-separation feature's frontend (backend already existed, built independently by the concurrent `tahti-06` session), then a long run of feature requests and `CUTOVER.md` slices.

**Stem separation:** found the backend (DB model, worker job with 7-day retention + sweep, API routes, DTOs) already fully built server-side with no consumer UI, and a real bug blocking it — the frontend requested `stemSet: '2STEMS'`, the API's zod schema only accepted `TWO_STEM`/`FOUR_STEM`, so every real request would 400. Fixed the mismatch and built a synced multitrack `StemPlayer` (one transport plays every stem together, per-stem mute keeps it silently in sync rather than pausing, per-stem download) into the Pro Editor's Stems panel, replacing bare download links.

**Listener widgets (SoundCloud/YouTube embeds + internet radio):** new `Settings → Widgets` — install a widget type, paste a URL, get the real platform embed (`w.soundcloud.com/player`, YouTube's `-nocookie` embed), not a proxy. Internet radio is a curated catalog (7 Finnish stations sourced from `streamurl.link/country/fi/`, fetched live rather than invented) with big-artwork cards reusing the same `Card`/`CardGrid` the channel directory uses; stream URLs are honestly `null` until verified — streamurl.link's actual stream links are behind client-side JS a static fetch can't reach, so rather than guess a URL, unverified stations show "Stream pending" and a real link to their own page. Built a listener station-suggestion → admin-review pipeline (`AdminRadioStationSuggestionsView`, distinct from the pre-existing track-submission review) so the catalog can grow past the seed 7 without guessing more URLs. Enabled widgets render on the Listen page itself, not just in Settings.

**UX consistency sweep:** forked a survey across every admin/studio view for crowding and styling drift, then fixed the top 5 findings — `StudioDistributionView` (rewired onto `StudioPanel`/`Tabs`, six unlabeled toolbar buttons got icons), `StudioVenuesView` and `StudioChannelView` (same `StudioPanel`/icon-button treatment), `AdminNewsView`'s three bare row-action buttons, and a literal `×` glyph in `StudioGoLiveView` replaced with a `Trash2Icon`. One low-priority finding (`StudioCollectionEditView`'s track-list density) was left as-is per the survey's own recommendation.

**Map page mermaid diagrams:** the per-screenshot diagrams added in the previous entry started overlapping once a screen had more than ~5 actions/links — `flowchart LR` was fanning every single action/nav item off the screen node as its own edge, and dagre couldn't lay that out cleanly at scale. Redesigned `caseFlowchart()` to group actions and nav targets into two `subgraph` clusters instead (at most two edges out of the screen node regardless of case size; dagre stacks cluster members cleanly on its own) — a structural fix, not a sizing tweak. Also added a second, distinct `MapCommentForm` (`kind="flow"`) next to each diagram specifically for navigation-flow feedback, separate from the existing per-case comment box, and filled in one real missing case (`/studio/archive/$id`'s detail view had two inbound links from other cases but no card of its own).

**Rotation controls collapse:** `StreamManagerPanel`'s "rotation is playing" state showed the full live-stream stats grid, playlist-add form, and multistream target list even when nothing was actually live — collapsed by default to just the transport buttons and artist/title/time-left line, with a chevron (matching the existing collapse-icon convention from the Pro Editor's mastering panel) to expand the rest. Scoped only to the rotation-fallback state; the real "you're live" view is unchanged.

**History page, ported from Nuclear desktop exactly:** the referenced screenshot turned out to be a real Nuclear production screenshot, confirming the existing `@tahti-player/ui` History components (`HistoryDayGroup`, `HistoryRow`, `CalendarHeatmap`, `ListeningClock`, `DayOfWeekChart`, `TopList`) were already ported into this fork's design system with zero consumers — built the actual page around them (`HistoryView` → `HistoryStatsSection`/`HistoryListSection`, same two-tab Stats/Listening-history layout). Nuclear tracks real per-play listening duration from a local SQLite log; this app only logs a play-event timestamp deduped to one row per track, so listening time is _approximated_ from each track's own duration (documented inline, not left implicit) and "Top albums" — plays aren't grouped by album here — became "Top channels" instead of a fabricated list. Matched the reference screenshot's exact copy ("Time of day", "Listening calendar", the date-range header text). Added a sidebar "History" entry (was only reachable as a nested Library tab). This dragged `react-activity-calendar` into the main bundle (+367 KB) via `LibraryView`'s eager import — caught by a before/after build comparison, fixed by lazy-loading `LibraryView` the same way the admin pages already were.

**`CUTOVER.md` slices, several rounds:** closed §1.4's "document localStorage keys" (new `LOCALSTORAGE-KEYS.md` — confirmed `libraryStore`'s favorites/history are already scoped per-user/anon via a key suffix, so no migration step is needed at cutover) and its "no IndexedDB/service-worker, no Next server-actions" pair (both genuinely clean by construction — grepped, not assumed). Audited the "chat captcha + access gating (already hardened)" claim in the `tahti` repo rather than taking it on faith: server-side hCaptcha verification fails closed, `ChatBan` is checked at both token-issue and message-send, message length is schema-capped, and the Centrifugo publish-proxy webhook is locked to internal-network-only callers (a previously-fixed real vulnerability, SEC-007) — it genuinely is hardened, now with evidence recorded instead of an unverified checkbox. Removed two dead "open on tahti.live" escape-hatch links in `GovernanceView`/`FeatureRequestsView` (same membership check, same result, just extra friction) in favor of an in-app settings shortcut. Traced a real functional gap while auditing Next-only route handlers for hidden capability: the old Next app streamed live SSE render-progress via a route handler with no SPA equivalent at all, so `StudioProEditorView`'s render fired-and-forgot with a one-time toast and no way to know when it actually finished — added the same PENDING/PROCESSING-polling pattern the stems flow already used.

**Plugin Store, built from scratch then substantially reworked:** first pass was a read-mostly directory across the app's 7 plugin-shaped subsystems (themes/visualizers/export/import/multicast/fingerprinting/audio-plugins), each reading its real existing data source, with a companion `PLUGIN-STORE-PLAN.md` mapping what actually extracting each into a standalone package would take (ranked by cost — themes and audio-plugins are already closest to a real registry shape; Export/Fingerprinting have no per-implementation behavior to extract yet, since "Export" today is one Revelator call regardless of which DSP box is checked). Second pass added real inline configuration: a shared gear-toggle fold-out (`ConfigurableCard`) instead of every card being launcher-only, per-preset visualizer speed/intensity sliders backed by the real `patchChannelVisual` API, and a `MusicBrainz` fingerprinting plugin wiring a complete OAuth connect/disconnect flow that existed server-side (`apps/api/src/routes/me/musicbrainz.ts`) with no SPA UI at all before this. Third pass unified Import/Export/Fingerprinting into one tagged registry (`SERVICE_PLUGINS`, each entry carrying a `tags: PluginCategoryId[]`) instead of one array per category, so hearthis.at — genuinely both an import source and an export target — is a single entry with two tags rather than a duplicated card; its username config moved from a generic "Social links" profile field onto its own plugin card (same underlying storage, no longer only reachable by first navigating elsewhere).

**Nuclear plugin registry gap list:** `/home/jani/workspace/nuclear` (the reference checkout used earlier for the History port) had disappeared from disk mid-session; re-cloned fresh from the `upstream` git remote already configured in this repo (`nukeop/nuclear`) rather than working from memory, then found the _actual_ live registry Nuclear's marketplace reads from (`NuclearPlayer/plugin-registry` on GitHub, served via jsDelivr) instead of guessing at what's "official." Of its 17 real plugins, one — MediaSession — was ported outright this session (see below); several others (Bandcamp/SoundCloud/Spotify/MusicBrainz) are partially covered from a different angle (import/embed/connect rather than Nuclear's browse-and-play or search-metadata framing); the rest (Discogs, Deezer/ListenBrainz/Bandcamp/SoundCloud dashboards, Last.fm scrobbling, YouTube streaming/playlists, KHInsider, OmniSource, NetEase) aren't ported, several of which may not even be the right fit for a co-op radio platform rather than a general-purpose player — flagged as a product decision, not assumed.

**MediaSession:** the one clean 1:1 port from that gap list — `navigator.mediaSession` had zero usage anywhere, so lock-screen/notification/headset media-key controls (play/pause/prev/next) didn't work at all. Wired into `AudioEngine` (the component that already owns the `<audio>` element and playback lifecycle): action handlers route through the exact same `setStatus`/`next`/`previous` store actions the player bar's own buttons use, metadata and `playbackState` stay in sync with the current track.

**Status:** all of the above is implemented, typechecked, linted, and built clean at each step; pushed to `master` across several commits (auto-deploys to beta.tahti.live via the existing CI workflow). Not click-verified in a live browser this session — no Chrome extension connection and no local Playwright install were available, so verification was static (tsc/eslint/production build/targeted code tracing) rather than an actual rendered page. A large batch of unrelated work from other concurrent sessions (admin moderation consolidation, disco-widgets, a shared `SaveButton` component, catalog/track-listing consistency, live-show recurrence in the `tahti` repo) landed via merges during this stretch — merged cleanly except one real conflict in `deploy/nginx.conf` (a regex-quoting fix from the other session was kept over this session's older version of the same lines).

### 2026-08-26 — tahti-web Storybook, and a design-system compliance sweep (admin/artist/listener)

**Goal:** Two related pieces of work. First, extend the existing `@tahti-player/storybook` package (previously only `packages/ui`'s Nuclear player components) to also catalogue every unique UI element in `tahti-web` itself — panels, dialogs, admin/studio chrome, listener-facing widgets — so there's one browsable, authoritative reference for what compliant tahti-web UI looks like, linked from the board-only `/more` page (the closest thing this app has to an "admin menu more page" — it's gated on `user.isBoard && diagnosticsEnabled`, same gate as the rest of this map/diagnostics hub). Second, once that reference existed, run a real compliance sweep — admin, artist/studio, and listener surfaces — checking the actual app against it, and log what doesn't comply rather than silently drifting further.

**Storybook extension:** `packages/storybook/.storybook/main.ts` gained a `@tahti-web` Vite alias to `packages/tahti-web/src`, a `staticDirs` entry pointing at `tahti-web/public` (mock fixture assets like avatar SVGs live there), and `define`s for `VITE_FORCE_MOCK=1` plus the `__APP_VERSION__`/`__COMMIT_HASH__`/`__BUILD_TIME__` globals tahti-web's own `vite.config.ts` normally bakes in (`SidebarBuildInfo.tsx` reads them and crashed without a definition). `VITE_FORCE_MOCK=1` means every one of tahti-web's `api/*.ts` fetchers short-circuits to its own realistic fixture data with zero network calls — see `api/mode.ts` — so self-fetching admin/studio views render real-looking content for free, no per-story mocking needed. New shared decorators in `packages/storybook/src/tahti-web/_lib/decorators.tsx`: `withTahtiRouter(path)` (a throwaway single-route TanStack Router context for anything using `<Link>`/router hooks) and `withMockAuth(user)` (seeds `useAuthStore` with one of three ready-made `MOCK_USERS` — board/artist/listener — for gated components like `AdminGate`/`StudioGate`).

**Coverage:** 93 component/view titles, 278 total story entries (216 non-docs stories), across every file in `tahti-web/src/components/` and `tahti-web/src/views/admin/` — including the hard cases (Three.js `ChannelVisualizer`, canvas `WaveformCanvas`/`WaveformMinimap`, the `AudioEngine` side-effect component, `AppShell`'s full router-driven shell). Verified two ways: a full `pnpm build` (clean), and a headless Playwright sweep loading all 216 non-docs stories and checking for console/page errors — 214 clean, 2 with benign expected warnings (`AudioEngine`'s idle story genuinely tries a live HLS URL and hits CORS offline; `ListenerWidgetsSection`'s embed story 404s on an external thumbnail offline). Both noted in-story, not bugs.

**Linked from `/more`:** new "Design system" `StudioPanel` section (`MoreView.tsx`, anchored `#design-system`, added to the page's own top nav) with an `Open Storybook →` button to `http://localhost:6006` (`pnpm storybook`) — not deployed anywhere, so the link only resolves when someone has it running locally alongside the app, same as every other dev-only surface on this page.

**Compliance sweep — three parallel audits, admin/artist-studio/listener, findings not yet fixed:**

**Admin** (`views/admin/**`) — 6 findings, mostly clean. `AdminFinancialView.tsx:88,180` and `AdminLogsView.tsx:64` use raw `text-red-400`/`text-green-400`/`bg-red-500` Tailwind palette colors instead of the semantic `text-accent-red`/`text-accent-green` tokens (breaks theming across light/dark/tahti-dark — compliant sibling: `AdminStorageView.tsx:317`). `AdminUsersView.tsx:363,368` hand-rolls role/suspended pills as raw `<span>` instead of `Badge variant="pill"` (doesn't even import `Badge`). `AdminRadioStationSuggestionsView.tsx:95-97` and `moderation/tabs/RadioSubmissionsTab.tsx:215-217` render the same `PENDING/APPROVED/REJECTED` status as plain text instead of a `Badge` — notable because the sibling `BetaTab.tsx` already has a `statusBadge()` helper for the identical enum one file over. `AdminLogsView.tsx:58,68` leaks the literal internal hostname "vimage6" into board-facing copy — the exact class of implementation detail past sweeps have stripped elsewhere.

**Artist/studio** (`views/studio/**`, `views/settings/**`) — 6 findings (one systemic, ~15 files). `StudioArchiveItemView.tsx:491-524` and `TrackEditDialog.tsx:252-280` hand-roll a `role="tablist"` tab widget instead of `@tahti-player/ui`'s `Tabs` (already used correctly for the same pattern in `StudioModerationView`/`StudioEventsView`). `api/revenue.ts:234-235,264,270` returns literal strings like `"Mock Connect onboard complete — payments ready."` that get displayed verbatim to the artist in `StudioRevenueView.tsx`/`SettingsPanels.tsx` — this file was missed by the earlier mock-jargon cleanup pass. `StudioGoLiveView.tsx:308-313` hand-rolls channel-state coloring instead of `Badge` (sibling `StudioDistributionView.tsx:13` does it right). `StudioTrackInsightsView.tsx:56-58` hand-copies `StudioPageHeader`'s exact markup instead of using the component. `ChannelLayersMenu.tsx:176-194`'s Hide/Remove row actions are raw styled `<button>` instead of `Button size="icon" variant="text"`. Systemic: essentially every view under `views/studio/` renders a bare `<p>Loading…</p>` instead of `PageStates.tsx`'s `PageLoading` — the fan-facing surface and even in-scope `ReleasesPanel.tsx` already use it correctly, but zero studio views were ever migrated onto it.

**Listener** (top-level `views/*.tsx`, excluding admin/studio/settings/legal) — 9 finding categories, ~40 instances, across 13 files; the largest of the three. One real bug, not just a style gap: `ChatView.tsx:6,15` unconditionally calls `mockDirectory()` for its channel-suggestion links instead of the real `fetchDirectory()` API already used correctly elsewhere — every real user sees fabricated channel slugs, not gated behind `VITE_FORCE_MOCK` like `SourcesView.tsx`'s legitimate fallback. Ten-plus views (`ChannelView`, `ArtistView`, `GovernanceView`, `FeatureRequestsView`, `TransparencyView`, `TransparencyMethodologyView`, `HelpView`, `SubscribeView`, `SmartLinkView`, `OnboardingView`) render a raw `<h1>` with no `PageHeader` import at all. Several (`MyCollectionsView`, `GovernanceView`, `FeatureRequestsView`, `VenuesView`, `FeedView`, `RadioView`) use ad-hoc bordered `<li>` rows instead of the `divide-y` pattern (`ArtistView.tsx` is inconsistent with itself — `CardGrid` in one place, bordered `<li>` in another). `ArtistGalleryPanel.tsx` has 4-5 icon-only gallery actions as raw unstyled `<button>` instead of `Button size="icon-sm"`. `FanSubscriptionStats.tsx`, `SupportContactForm.tsx`, and `ArtistGalleryPanel.tsx` mix in `text-red-400`/hand-rolled pills instead of the semantic token/`Badge`. A dozen views show ad-hoc `<p>Loading X…</p>`/bare "not found" text instead of `PageLoading`/`EmptyState` (`VenueDetailView.tsx:63-73` is the compliant sibling already in the same folder).

**Not flagged (checked and found legitimate):** raw hex in `ChannelDesigner`/`ChannelVisualizer`/`TrackExportPanel` is real channel-branding/brand-color data, not app chrome; raw `<button>` in tab/chip nav widgets (`InPageNav`, `StudioNav`, `AdminNav`) is the established correct pattern, not a deviation; the fixes already shipped in the 2026-08-25 "UX consistency sweep" (`StudioDistributionView`, `StudioVenuesView`, `StudioChannelView`, `AdminNewsView`, `StudioGoLiveView`'s `×` glyph) hold, no regressions found.

**Total: ~21 finding categories / ~55+ individual instances across admin/artist/listener, none fixed in this pass** — logged here as the punch list for the next page-by-page slice, same convention as every other row in this file. `packages/tahti-web/AGENTS.md` gained a standing instruction (below) to check new/changed UI against the Storybook catalogue going forward, so this kind of drift gets caught before merge instead of accumulating for another sweep.

**Status:** Storybook extension implemented and verified (build + full headless render sweep, both clean); `/more` link implemented, typechecked, and linted clean. The compliance findings above are documented only — not fixed — per the scope of this pass. Not click-verified in a live browser (no Chrome extension connection this session); verification was the build/lint/typecheck/headless-Playwright chain described above.

### 2026-08-27 — Track-row icon fixes, Recently played → Library, Add-ons reorg, theme editor, and 9 worklog slices closed

**Goal:** Several independent pieces landed in one session. First, three UI requests: fix the queue-button/play-button overlap on track-row thumbnails, move "Recently played" from the Listen page to the Library dashboard, and fold the separate Settings → Widgets section into Settings → Add-ons (renamed from Plugin store) as four new categories. Then, per explicit request, close out 9 of the findings logged in the 2026-08-26 compliance-sweep entry above, in three batches of three, using the real cataloged components rather than one-off fixes. Also added a theme editor (previously JSON-paste-only) and updated `AGENTS.md` with the now-established "widgets configure from Add-ons" convention.

**Track-row icons (`@tahti-player/ui`, affects every `TrackTable` with a thumbnail — Listen, Library, Studio, anywhere):** the queue button used to render as a top-right overlay on the 48px thumbnail, stacked on top of the centered play button — `ThumbnailCell.tsx` no longer passes `onQueue` to `MediaArtwork`; `ActionsCell.tsx`'s queue button (previously suppressed whenever a thumbnail was shown) now always renders in the actions column, immediately next to the favorite heart. The thumbnail's play button switched from a solid `variant="default"` circle to `variant="text"` (transparent, white icon, no shadow) at `size="thumb"` specifically — `md`/`lg`/`fill` contexts (channel/artist hero art) keep the solid button.

**Recently played → Library dashboard:** removed from `ListenView.tsx` (was signed-in-only, at the top of Listen); added to `MyDiscographyView.tsx` (the `/library` landing tab) for every signed-in user, ahead of "All sounds." Previously, a signed-in listener with no channel landed on `/library` to a bare "No sounds yet — Open Studio" empty state and nothing else; that gate now only covers "All sounds" (the artist's own archive), not the whole page.

**Settings → Widgets folded into Settings → Add-ons:** `content/pluginStoreCategories.ts` gained four categories — `radio` (internet radio stations + suggest-a-station form), `embed` (SoundCloud/YouTube embeds), `discovery` (Listen-page disco-widgets), `channel` (channel/artist-page disco-widgets) — ported into `PluginStorePanel.tsx` verbatim from the old `WidgetsPanel` (no behavior change), which is then deleted from `SettingsPanels.tsx` along with its nav entry in `settingsNav.ts`. `plugin-store` replaces `widgets` in `PUBLIC_SETTINGS_SECTION_IDS` so anonymous access is preserved. `DiscoWidgetManagerPanel`'s `description` prop became optional (the category body already shows one above it — no more duplicate text). `AGENTS.md` gained a new section: per-page widgets configure from Add-ons as one category per concern, not a separate settings section; split a category into its own sub-tabs if it has enough to configure.

**Theme editor:** new `components/ThemeEditor.tsx` — a curated set of CSS-variable fields (core colors + the 7 accents), live-previewed via `@tahti-player/themes`' `applyAdvancedTheme` on every keystroke (restores the actually-active theme on unmount), saved via the existing `importCustomTheme` store action. Blank fields are left out of the saved theme entirely (partial overrides, inheriting the base palette), rather than baking in every field. `ThemesPanel` in `SettingsPanels.tsx` restructured from one long scroll into three `Tabs`: **Browse** (mode toggle + built-in/custom theme grids, unchanged), **Editor** (new), **Import JSON** (the existing paste-a-theme textarea, moved as-is). Saving from the editor lands the theme in the same `customThemes` store state the Browse tab's "Your imported themes" grid already reads from, and that grid's existing per-theme "Remove" button already covers deleting an editor-created theme — both requested explicitly, both already true of the existing store wiring, no extra code needed.

**9 compliance-sweep slices closed (batches of 3, admin → artist/studio → listener), all against the 2026-08-26 audit findings:**

- **Admin (3):** `AdminFinancialView.tsx`/`AdminLogsView.tsx`'s raw `text-red-400`/`text-green-400`/`bg-red-500` → `text-accent-red`/`text-accent-green` tokens, plus `AdminLogsView`'s "vimage6" hostname leak stripped from board-facing copy. `AdminUsersView.tsx`'s hand-rolled role/suspended `<span>` pills → `Badge variant="pill"`. `AdminRadioStationSuggestionsView.tsx` and `moderation/tabs/RadioSubmissionsTab.tsx` gained a `statusBadge()` helper (mirroring `BetaTab.tsx`'s existing one for the identical `PENDING/APPROVED/REJECTED` enum) and now render a `Badge` instead of plain uppercase text.
- **Artist/studio (3):** `StudioArchiveItemView.tsx` and `TrackEditDialog.tsx`'s hand-rolled `role="tablist"` bars replaced with `@tahti-player/ui`'s `Tabs` (items-array mode) — `TrackEditDialog`'s `TABS` metadata array simplified to a plain `TAB_ORDER` id list once its label/icon fields became redundant with the new inline tab labels. `api/revenue.ts`'s "Mock Connect onboard complete", "Mock Connect onboard updated", "Complete mock onboarding first", and "Mock Stripe portal for X — no redirect offline" strings reworded to plain artist-facing copy (the last one keeps the real "nothing will happen, this is a demo" caveat, just without naming Stripe/mock internals). The systemic "bare `<p>Loading…</p>`" pattern across every `views/studio/*` file (24 files total, 5 more than the original audit found — `StudioProEditorView`, `StudioEventsView`, `StudioStatsDetailView`, `StudioModerationView` ×2, `StudioEditorProjectView`) replaced with `PageStates.tsx`'s `PageLoading`.
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

## 2026-08-31 — Channel Designer widget audit

**Completed:** Audited all eight `ChannelPageItemType` blocks (`hero`, `actions`, `archive`, `chat`, `about`, `links`, `textOverlay`, `subscribe`) end to end: addable/toggleable/reorderable in `ChannelLayersMenu`, and rendered on the public channel page. `ChannelView`'s `renderBlock` switch was missing a `case 'subscribe'`, so the Subscribe CTA block (`CHANNEL_PAGE_ITEM_META.subscribe`, "Fan membership pitch") fell through to `default: return null` — it could be added and made visible in the designer but rendered nothing on the live page. Added the missing case: a Support/Subscribe card linking to `/subscribe/$username`, hidden for the channel owner and shown as an editing-mode placeholder otherwise, matching the pattern already used for the `actions` and `links` blocks.

**Validation:** `tsc --noEmit` and `eslint` on `tahti-web` pass clean with no new errors.

## 2026-08-31 — App-wide widget sweep and Storybook coverage

**Completed:** Swept the app for everything called a "widget" and found five unrelated systems sharing that name: Disco-widgets (admin-registered sandboxed iframe add-ons — `disco-widgets/*`), Listener widgets (SoundCloud/YouTube/hearthis.at/Spotify embed players — `listenerWidgets.ts`), the Channel Designer blocks (`channelPageLayout.ts`), Discover's curated content cards (`discoverStore.ts`'s `DiscoverWidgetId` — `WidgetCard`/`WidgetTrackRow`), and `ChannelControlsWidget` (a generic collapsible-section shell, not a widget family at all). Disco-widgets and Discover widgets are easy to confuse by name alone despite having no relationship.

Added missing Storybook coverage: `DiscoWidgetsSection`, `DiscoWidgetManagerPanel`, `AdminDiscoWidgetsView` (all previously undocumented despite being referenced in `ElementLocations`), `WidgetCard`/`WidgetTrackRow` (Discover, had no coverage at all), and `ChannelView` (first story for the actual public channel page, exercising all eight Designer blocks in both Visitor and Owner/editable states). Updated `ElementLocations.stories.tsx` with the new entries and called out the Disco-widgets/Discover-widgets naming collision directly in its table.

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` on `tahti-web`/`storybook` pass with no new failures beyond the pre-existing tracked baseline (`FavoriteButton`/`Pagination`/`QueueItem`/`QueuePanel` legacy story typing, `ImportMeta.env` globals).

## 2026-08-31 — Nuclear plugin add-ons: re-port, background-navigation fix, import-list cleanup

**Investigated:** Bandcamp and SoundCloud import were reported as inconsistent — Bandcamp's "configure" was expected to ask for a username then let you pick items to import, while SoundCloud instead "takes you to some different page." Traced this through every add-ons surface (`/sources/bandcamp` and `/sources/soundcloud` directly, the Import tab's `IMPORT_SERVICE_PLUGINS` deep-links, and the Nuclear plugins tab's `NuclearPluginAddonsCategory` config dialogs) on both the local mock app and the live beta.tahti.live build. Bandcamp and SoundCloud turned out to behave identically everywhere — no asymmetry between the two. What's real: the Settings/Add-ons overlay is a persistent layer, not a route, so any `<Link>` inside it (the Import tab's deep-links to `/sources/$id`, plus the hearthis.at card) changed the underlying page _behind_ the still-open overlay instead of visibly navigating there — the "different page" the user was seeing.

**Fixed:** Every `<Link>` in `PluginStorePanel.tsx` now calls `useSettingsModalStore.getState().close()` on click, matching the pattern already used elsewhere in `SettingsPanels.tsx` (e.g. the Governance and Go Live links) — navigating from inside Add-ons now visibly closes the overlay and lands on the destination page instead of swapping it silently in the background.

**Re-ported:** `nuclearPluginAddons.ts`'s 17-entry catalogue was re-derived from the live upstream registry (`cdn.jsdelivr.net/gh/NuclearPlayer/plugin-registry@master/plugins.json`) — refreshed names/descriptions, corrected every entry's `category` to the registry's own taxonomy (`metadata | streaming | scrobbling | dashboard | playlists | discovery | other`, replacing invented ones like "Artist tools"/"Playback"), and added the two entries the port had drifted out of sync with (`Bandcamp Dashboard`, `SoundCloud Dashboard`). Removed `multicast-destinations`, a Tahti-only addition that was never a Nuclear plugin and duplicated (as an inert, local-only stub) the real, working `MulticastDestinationForm` already reachable from Settings → Broadcast → Multistream. `NuclearPluginAddonsCategory`'s category tabs are derived from whatever categories are actually present in the data, so the unused ones (`Discovery`, `Lyrics`) are correctly absent with no separate purge step needed.

**Cleaned up:** Removed "URL / DSP paste" and "Internet radio" from the Import add-ons list — both have `capabilities.import: false` (one seeds a smart-link target, the other plays a stream; neither pulls anything into the archive), so they didn't belong in a list titled "Services you can pull tracks and albums in from." Both remain fully reachable from the Sources page for their actual purposes.

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` on `tahti-web` pass clean; verified the fixed behavior end to end in the browser (mock app and live beta).

## 2026-08-31 — Retired the Sources page; every import source configures inline

**Completed:** Every OAuth-kind import source (Bandcamp, SoundCloud, Google Drive, Mixcloud) now flows through `OAuthServiceCard` instead of a deep-link, by giving `IMPORT_SERVICE_PLUGINS` a real `{kind: 'oauth', ...}` action instead of always defaulting to `{kind: 'deep-link'}`. That was the one-line reason bandcamp/soundcloud's old "Open discography importer" / "Import SoundCloud tracks" buttons went to a separate page instead of configuring in place: `IMPORT_SERVICE_PLUGINS` never produced `action.kind === 'oauth'` for them, so `OAuthServiceCard` — which already had a working Configure gear via `ConfigurableCard` — was unreachable dead code for those two ids.

Ported the real picker UIs inline, replacing the dead Link-out buttons: Bandcamp's album list + import, SoundCloud's track list + import/import-all, and hearthis.at's full library browser (tracks/sets/collections tabs, search, multi-select, destination-playlist creation) — the last one large enough that `ConfigurableCard` gained an optional `dialogClassName` so its Dialog can size up from the default `max-w-lg` to `max-w-3xl` instead of cramming a library browser into a small popup. Google Drive and Mixcloud get Connect/Disconnect only, matching their actual capability — neither ever had a real picker, on the old page or the new one.

Added two small tools the old Sources page hosted with no equivalent anywhere else: `PersonalRadioStreamCard` (paste a stream URL / search the public Radio Browser directory — distinct from the curated-station directory already in the Radio tab) and `DspUrlPasteCard` (paste a DSP URL, jump to the releases editor). Removed the `multicast-destinations`-style duplication risk here too: neither of these re-implements anything that already lives elsewhere.

Renamed the "Embed" Add-ons tab to **Listen** (`pluginStoreCategories.ts`'s `'embed'` → `'listen'`, `EmbedCategory` → `ListenCategory`) — it was already exactly the Listen-page listener-widget catalogue (SoundCloud/Spotify/YouTube/hearthis.at playback widgets, which were already all present via `LISTENER_WIDGET_TYPES`), just mislabeled with a `CodeIcon` and a description that had drifted out of sync (missing Spotify).

Deleted `SourcesView.tsx` and its two routes are now thin redirects (`/sources`, `/sources/$id` → `beforeLoad` throws `redirect` to `/settings/plugin-store?category=import`, preserving `?status=`) rather than gone entirely — a real Mixcloud OAuth provider callback, and prod's `/dashboard/upload/import/:provider` alias, both still land on `/sources/$id?status=…` and need somewhere to go. `SettingsView` (the existing `/settings/$section` → modal-open shim) now also surfaces that `?status=` as a toast and reads an optional `?category=` to open a specific Add-ons sub-tab — `useSettingsModalStore` gained a `pluginCategory` field for this, deliberately a plain synced field rather than a "consume once and clear" read: a destructive read there raced under React 18 StrictMode's dev-mode double-invocation and silently landed on the wrong tab every time. `AddToMusicActions`'s "Sources" button (Listen/Library/track-list rows) is now "Import" and opens the same Add-ons/Import tab in place instead of navigating.

Updated the handful of remaining `/sources` references that were either live navigation targets (`portInventory.ts`'s clickable POC-route links, `mapScreens.ts`'s screenshot-capture `route:` fields, `AddToMusicActions`) or would have 404'd the map-screenshot capture script; left the large cosmetic `flowDiagrams.ts` mermaid diagrams (architecture documentation text, not live links) for a follow-up pass.

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` (296 tests) on `tahti-web` all pass clean. Verified end to end in the browser: `/sources/bandcamp?status=connected` and bare `/sources` both redirect to Add-ons → Import with a "Connected." toast; hearthis.at's Configure dialog connects and renders its Tracks/DJ sets/Collections tabs with live counts.

## 2026-08-31 — Backlog round 7: five slices closed

**Slice 1 — Artist action buttons audited against Nuclear `Button`:** `ArtistGalleryPanel`'s photo-lightbox trigger and `ArtistView`'s avatar viewer, like, and repost controls were raw `<button>` elements with hand-rolled hover/transition classes; all four now render through the shared `Button` (`variant="text"`, sized `flexible`/`xs`) so they pick up consistent focus, disabled, and hover states. This is a partial pass on the WORKPLAN "audit custom actions against Nuclear `Button`" item — channel layer actions, collection actions, and Radio actions are still open.

**Slice 2 — Support form uses shared `Select`/`Textarea`:** `SupportContactForm`'s category picker and message field were a hand-styled native `<select>`/`<textarea>`; both now use `@tahti-player/ui`'s `Select` and `Textarea`, matching the rest of the medium-priority native-control-replacement backlog item.

**Slice 3 — Collection backdrop no longer fakes a photo from the cover:** `CollectionView` was falling back to the collection's square cover art as the wide backdrop image whenever no real backdrop was set, producing a stretched, blurred cover behind every collection that never uploaded one. It now renders the plain card background in that case instead of a fabricated backdrop.

**Slice 4 — Join dialog widened for its longer form:** `AuthDialog`'s join mode was cramped into the same narrow single-column dialog as login, forcing email/username/role/password/confirm and any error text into a scrolling single column. Join mode now opens at `max-w-2xl` with a two-column field grid (role picker and status text spanning both columns); login mode is unaffected.

**Slice 5 — Theme accent semantics: amber signals action, not default surface:** `tahti-dark`'s `--primary` was the same bold amber as `--accent-orange`, so every default-styled interactive surface (filled buttons, cards, active tabs) rendered amber regardless of whether it meant anything. `--primary` is now a calm neutral surface color; amber (`--accent-orange`) is reserved for surfaces that should draw the eye — `SaveButton` now forces `bg-accent-orange`/`text-accent-foreground` regardless of the underlying `Button` variant, and `ChannelRadioPlaylistPanel`'s active tab follows the same rule. This is scoped to those two call sites deliberately; the ~30 other `bg-primary`-as-active-indicator usages across the app (Studio nav, admin tabs, radio schedule, etc.) keep their old amber-primary look for now and are a follow-up sweep, not a regression.

**Also fixed:** `capture-map-screens.mjs`'s new per-tab capture pass (`captureAllTabs`) called an `ensureChatClosed()` helper that was never defined, so any shot with visible tabs would throw at runtime; added the missing helper (re-collapses the right rail via the same `tahti-web-layout` localStorage write used elsewhere in the script) rather than removing the feature.

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` (296 tests) on `tahti-web` pass clean; `tsc --noEmit` and `eslint` on `@tahti-player/ui` pass clean.

## 2026-08-31 — Performance and transition-animation sweep

**Route transitions were fully off for Studio/Admin/Library:** `RouteTransition` (`packages/ui`) already existed and was wired into `AppShell` for every route, but `disableAnimation={stableNavigationRoute}` turned it off entirely for `/studio`, `/admin`, and `/library` -- the three most-navigated sections -- because its `AnimatePresence mode="wait"` sequential slide+scale would add up to ~320ms of click-to-content delay on every in-section click. Replaced the on/off switch with a `fast` mode: an opacity-only fade (`fadeVariants`, 100ms, `mode="popLayout"` so enter/exit overlap instead of waiting) for those high-frequency routes, keeping the original slide+scale for top-level section changes. Every route change is animated now, cheaply where it needs to be. `RouteTransition` is also now `memo`-wrapped so a parent re-render for unrelated state (see next item) can't re-run its router subscription when `fast` hasn't changed.

**Tab switches had zero transition anywhere:** `Tabs.TabsPanel` (`packages/ui`, used by `SettingsPanels`, Studio archive/release detail, Add-ons, moderation, radio show, etc.) wrapped Headless UI's `TabPanel` with no motion at all -- content just snapped in. Added a short fade+rise on mount (`initial={{opacity:0,y:4}}`, 140ms), respecting `useReducedMotion()`. Verified live in the browser: switching Go Live's Go Live/Info tabs now fades the new panel in with no console errors.

**`AppShell` re-rendered on every sidebar-drag mousemove:** it called unselected `useLayoutStore()`, so any store field changing -- including `leftWidth`/`rightWidth` during a resize drag, or chat context changes from unrelated components -- re-ran the whole shell's render, including the routed content tree. Split into individual scoped selectors.

**The whole player bar re-rendered ~4x/sec during playback:** `ConnectedPlayerBar` and `FullScreenPlayer` both subscribed to `currentTime`/`duration` at the top level for their seek bars, so every `timeupdate` tick re-rendered NowPlaying, the add-to-playlist button, volume, and the queue button along with it -- none of which depend on playback position. Extracted a shared `ConnectedSeekBar` (`components/PlayerSeekBar.tsx`) that subscribes to time/duration/seek itself; both surfaces now mount it instead of holding that state. Verified live: simulated a `timeupdate` tick via the mock audio element and confirmed both the compact bar's and full-screen overlay's seek bars update correctly (0:42 elapsed / -2:18 remaining) while the rest of the bar stayed put.

**Seven low-traffic Studio routes weren't lazy-loaded:** `StudioEventCreateView`, `StudioGovernanceView`, `StudioRecordingsView`, `StudioRevenueView`, `StudioStashView`, `StudioTrackInsightsView`, and `StudioUpdatesView` were static imports in `router.tsx`, shipped in the entry bundle for every visitor regardless of whether they're an artist or ever open Studio. Converted to `lazyRouteComponent`, matching the pattern already used for the Admin routes and five Studio views from the 2026-08-28 performance audit. Left the remaining, more frequently visited Studio views (Home, Go Live, Archive, Releases, Editor, etc.) statically imported -- lazy-loading those wouldn't help most sessions since artists load them anyway, and the conversion risk isn't worth it for routes visited on nearly every artist session.

**Already good, left untouched:** `usePlayerStore` call sites elsewhere already use scoped selectors; the sidebar's collapse/expand width transition (`PlayerWorkspaceSidebar`) was already `motion`-animated; Dialog/Popover open/close were already `motion`-animated; `PluginStorePanel`'s admin API import was already dynamic; Mermaid was already lazy. `motion` (`^12.23.12`) was already a dependency in both `tahti-web` and `ui` -- no new library added.

**Deliberately left open:** the bottom queue strip's open/close still hand-rolls its mount/fade timing with `setTimeout`/`requestAnimationFrame` instead of `AnimatePresence` -- works correctly, just inconsistent with the pattern used elsewhere, not worth the risk of touching the live player bar's most-used control without a stronger reason. ~30 other `bg-primary`-as-active-indicator usages and 40+ `<img>` tags without explicit lazy-loading/width-height hints across listener/Studio views are follow-up sweeps, not regressions from this pass.

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` (296 tests) on `tahti-web` pass clean; `tsc --noEmit`, `eslint`, and `vitest` on `@tahti-player/ui` pass clean (`Tabs` snapshot updated for the new wrapper; the `TrackTable`/`Input` snapshot failures are pre-existing and unrelated -- confirmed by running the suite before this session's changes too). Verified end to end in the browser against the mock app: route fade on Studio/Settings navigation, tab-switch fade on Go Live, playback (queue play, seek-bar ticking, full-screen overlay) all work with no console errors.

## 2026-08-31 — Backlog round 8: five slices closed

**Slice 1 — native `<textarea>` replaced with shared `Textarea`, listener/public forms:** `FeatureRequestsView`, `VenueRegisterView`, and Studio Updates' two composer fields (`StudioUpdatesView`, post body + newsletter body) were hand-styled `<textarea>` elements identical to the pattern closed for `SupportContactForm` in round 7. Continues the WORKPLAN "replace hand-styled native controls" item.

**Slice 2 — native `<textarea>` replaced with shared `Textarea`, admin moderation:** `AdminRadioStationSuggestionsView` and `RadioSubmissionsTab` both hand-rolled the identical "Rejection note (optional)" field independently. Same fix in both call sites.

**Slice 3 — Channel layer actions audited against Nuclear `Button`:** continuing round 7's Artist-actions audit into "channel layer actions" per the WORKPLAN item, `ChannelLayersMenu`'s layout-preset cards (a clickable card with icon/title/description/"Applied" state, not a tab/drag-handle/row-selector) now render through `Button` (`variant="text" size="flexible"`). The panel tab-switcher, drag-handle, and item-select buttons in the same file are legitimate custom exceptions per that WORKPLAN item's own wording and were left alone -- except:

**Slice 4 — closed the last open finding from the 2026-08-26 design-system compliance audit:** that audit's note listed four "not touched, deliberately" gaps. Checked all four against current code: `StudioTrackInsightsView`'s header duplication, `StudioGoLiveView`'s hand-rolled channel-state color, and `FanSubscriptionStats`'s hand-rolled pill were already fixed in the interim (now using `StudioPageHeader` and `Badge` respectively -- no change needed). Only `ChannelLayersMenu`'s raw drag-handle icon button was still open; converted to `Button size="icon-sm" variant="text"`, matching the Eye/Trash icon buttons already sitting right next to it in the same row. Verified live in Storybook's `ChannelLayersMenu` "Interactive" story (driven via direct DOM access, since the mock app's owner-gated `?edit=1` channel-designer route didn't resolve `isOwner` for the signed-in mock user in this session): preset cards render as real `<Button>`s with the original layout intact, clicking one still calls `onApplyPreset` and switches to the Layers panel, and all eight drag-handles render as proper `size-8` icon buttons with correct `aria-label`s -- drag itself is unaffected since it's wired to the parent `<li draggable>`, not the handle button.

**Slice 5 — Radio actions audited against Nuclear `Button`:** `RadioScheduleView`'s show-type toggle pills (booking form and the edit dialog -- two independent copies of the same `LIVE_SET`/`TALK` segmented control) and `RadioView`'s now-playing title link and rotation-history row link (both open the track info dialog) were raw `<button>`s; all four now render through `Button` (`variant="text" size="flexible"`), preserving their exact existing styling via `className`.

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` (296 tests) on `tahti-web` pass clean.

## 2026-08-31 — Backlog round 9: five slices closed

**Slice 1 — `AudienceVisibilitySection`'s Audience field → shared `Select`:** the visibility dropdown (Public/Unlisted/Private/Stash) shared by the track editor and upload flow was a hand-styled native `<select>`; now the shared `Select`.

**Slice 2 — `OnboardingView`'s Country field → shared `Select`:** the country picker (with per-option flag emoji, plus an empty-string "Prefer not to say" default) now renders through `Select`; verified the empty-string option value is a case `Select`'s Headless UI `Listbox` handles correctly as a controlled value.

**Slice 3 — `StashFilesPanel`'s share-link form → shared `Select`:** the Permission (Read-only/Download) and Expires (day-count, including a numeric `expiryDays` state converted to/from string at the boundary) fields were native `<select>`s; both now use `Select`.

**Slice 4 — `TrackEditDialog`'s Content type and License fields → shared `Select`:** both were native `<select>`s inside a `grid sm:grid-cols-2` layout, with License spanning both columns via `sm:col-span-2` on the wrapping `<label>`. `Select`'s public API only forwards `className` to its inner trigger button, not an outer wrapper, so the column-span now lives on a plain wrapping `<div>` instead. Verified live in the browser (mock app, Library → Sounds → Edit → Basics tab): the grid renders with License correctly spanning both columns, the dropdown opens with all `CONTENT_TYPES` options and the current value checked, and selecting a new option (Podcast) updates the trigger's displayed label -- confirming `onValueChange` wiring survived the conversion.

**Slice 5 — one more bespoke bordered success panel → shared `Box`:** `SetupPasswordView` had the same hand-rolled `border-border bg-background-secondary ... rounded-xl border p-4` success panel closed for `VerifyView` and `ResetPasswordView` in round 8; same fix.

**Also:** added an explicit versioning rule to `AGENTS.md` (§ Agent workflow, step 6) -- `packages/tahti-web/package.json`'s `version` had been sitting at `0.0.1` through eight rounds of shipped work, making it useless as a build signal. Bumped to `0.0.2` for this round; future commits that ship a user-visible change here should bump it too (one bump per commit, not per slice).

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` (296 tests) on `tahti-web` pass clean.

## 2026-08-31 — Backlog round 10: five slices closed; bump to 0.0.3

Continuing the native-`<textarea>`-to-shared-`Textarea` sweep (WORKPLAN "replace hand-styled native controls") across five more description/summary/bio fields, all the same pattern closed in rounds 7-9:

**Slice 1:** `OnboardingView`'s profile Bio field.

**Slice 2:** `FanTiersEditor`'s fan-tier Description field.

**Slice 3:** `AdminNewsView`'s Summary field, both copies (compose dialog and inline edit).

**Slice 4:** `StudioShowsView`'s show Description field.

**Slice 5:** `StudioShowDetailView`'s three independent Description fields (episode edit, show edit dialog, and the public-facing episode description form).

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` (296 tests) on `tahti-web` pass clean. Bumped `packages/tahti-web/package.json` to `0.0.3` per the round-9 versioning rule.

## 2026-08-31 — Responsive design audit of all navigation menus; bump to 0.0.4

Ran `e2e/layout-stability.spec.ts` (the existing Playwright suite covering Studio/Admin shell geometry and mobile overflow) plus a throwaway route×viewport sweep (16 top-level/Studio/Admin routes at 390/768/1440px, checking horizontal overflow) and a set of interaction checks (mobile drawer open/close, Studio pill-nav bounding box at tablet width, Settings Add-ons on mobile).

**Fixed — two real bugs, not test artifacts:**

1. **`/studio/recordings` was a navigation dead-end.** `StudioNav.tsx`'s `SECTION_PREFIXES['/library']` list (which decides which of the three top-level sections -- Studio/Library/Perform -- a route belongs to, and therefore whether the section submenu renders at all) had `/library/recordings` but not `/studio/recordings`, even though `/studio/recordings` is a real route actively linked from `StudioGoLiveView` (2 places) and `StudioHomeView` (2 places). Landing on that page via either of those links left the user with zero Studio/Library navigation chrome -- no submenu, no way back except browser-back or the top-level sidebar. Added `/studio/recordings` to the prefix list.

2. **Stale test fixtures were hiding real coverage:** `layout-stability.spec.ts` asserted on `[data-studio-section-tabs]`, an attribute that doesn't exist anywhere in the current source -- `StudioNav` collapsed to a single-tier `[data-studio-section-menu]` when Studio moved to its four-top-sections redesign, and the test was never updated. It also still included `/sources` in its Studio route list, which has redirected to the Settings/Add-ons modal since round 6's "Retire the Sources page" -- not a Studio page at all, so it correctly can never satisfy Studio-shell assertions. Also: the real Studio nav renders once, globally, in `AppShell` (as a sibling of each page's own `.studio-page-layout`, not a descendant of it, per the nav-centralization refactor) -- added a `data-studio-shell` wrapper attribute in `AppShell.tsx` (both mobile and desktop branches) so the geometry check can actually reach it. The suite still has pre-existing, previously-documented flakiness unrelated to these fixes (an intermittent auth/navigation-precondition issue, see the 2026-08-28 "Responsive UX follow-up" entry above) -- not chased further here.

**Found, not fixed -- top of the fixlist:** the desktop three-pane shell (left sidebar + main + right rail) has no intermediate/tablet behavior between the `isMobile` cutoff (`max-width: 767px`, which correctly switches to a single-column mobile layout) and roughly **1100-1200px**. With both sidebars at their default widths (`leftWidth: 220`, `rightWidth: 340`, `rightCollapsed: false`), a fresh session's main content column is crushed to as little as **144px** at exactly 768px (a very common tablet-portrait width), recovering only gradually: 768px→144px, 820px→196px, 900px→276px, 1024px→400px, 1100px→476px main-content width (measured via `page.setViewportSize` + fresh page load per width, not a resize of an already-loaded page -- resizing after mount gives misleadingly better numbers because React doesn't recompute the persisted-collapse defaults). Visually this wraps track titles to one word per line, clips buttons and search fields, and makes Studio/Library pages close to unusable. The existing `isMobile` effect already auto-collapses the right rail below 768px; the fix is the same idea extended upward -- auto-collapse the right rail (and/or shrink the left sidebar) somewhere in the ~768-1200px band instead of leaving both fixed-width panes fighting for a viewport too narrow for them. Left for a follow-up since it's a core-shell layout change, not a single-component fix, and touches every page rather than one surface.

**Other findings, lower priority:**

- `e2e/layout-stability.spec.ts` only ever tested 390px (phone) and 1440px (desktop) -- there was no coverage at all in the 768-1200px tablet band, which is exactly where the shell-crush bug above lives. Worth a dedicated tablet-width test once the shell fix lands, so it doesn't regress silently again.
- ~30 Studio view files (`StudioRecordingsView`, `StudioUpdatesView`, `StudioHomeView`, etc.) each still call `<StudioNav current="..." />` without the `global` prop -- since `StudioNav` only renders when `global` is true and the real nav is centralized in `AppShell`, every one of these per-page calls is a no-op. Harmless (the real nav renders correctly from `AppShell` regardless), but dead code that reads as if it does something -- worth a cleanup pass to delete the calls (or the now-redundant `current` prop threading) rather than leave a misleading pattern for future edits.
- No overflow, missing-menu, or broken-interaction issues found in: top nav search/icons, left sidebar (desktop, all widths tested), mobile hamburger drawer (opens/closes correctly, closes on Escape, contains expected links), Admin nav, Settings → Add-ons category tabs on mobile, or the Studio pill-nav's own wrapping behavior once it actually has room (768px+ crush aside, the `flex-wrap` pill layout itself degrades gracefully).

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` (296 tests) on `tahti-web` pass clean. Bumped `packages/tahti-web/package.json` to `0.0.4`.

## 2026-08-31 — Fixed the tablet shell-crush finding; bump to 0.0.5

Implemented the top item from the responsive audit above: the desktop three-pane shell now auto-collapses both sidebars in the ~768-1099px band, the same one-directional pattern already used to collapse the right rail below the mobile cutoff (force collapsed on entry, never force an expand back, so a manual toggle at a wider viewport is still respected). New `useIsCompactDesktop()` hook (`hooks/useIsMobile.ts`, `(min-width: 768px) and (max-width: 1099px)`) drives a second `AppShell` effect alongside the existing mobile one.

**Verified with the same fresh-load-per-width methodology used to find the bug** (`page.setViewportSize` + fresh page load, not a resize of an already-mounted page): main content width at `/studio/archive` went from 144px/196px/276px/400px to **596px/648px/728px/852px** at 768/820/900/1024px respectively -- no more horizontal overflow at any width in the sweep. Screenshot-verified: both sidebars render as their collapsed icon rails, content (search, buttons, track rows) is fully legible and usable, nothing clips.

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` (296 tests) on `tahti-web` pass clean. Bumped `packages/tahti-web/package.json` to `0.0.5`.

## 2026-08-31 — Backlog round 11: five slices closed; bump to 0.0.6

Continuing the native-control-to-shared-component sweep, prioritizing clean labeled block-level fields over compact inline ones (a `Select` forces a `w-full flex-col` wrapper with no `aria-label` pass-through, which doesn't fit an inline `flex flex-wrap` row next to a search box without restructuring the layout -- several remaining `<select>`s, e.g. `StudioReleaseDetailView`'s inline content-type filter, `StudioRecordingsView`'s inline sort dropdown, were left alone for this reason, matching the judgment call already made in round 9).

**Slice 1:** `AdminUserEditPanel`'s account Role select and Suspension reason textarea.

**Slice 2:** `ThemeEditor`'s theme-JSON import textarea (kept its monospace styling and `aria-label`).

**Slice 3:** `StudioCollectionEditView`'s Description textarea, plus its Visibility select -- this one also removed a redundant `<h3>Visibility</h3>` heading that duplicated what `Select`'s own `label` prop now renders, moving the "Choose who can find this collection" text into `Select`'s `description` prop (renders below the field instead of above, matching this app's other `Select`-with-description usage). Screenshot-verified in the browser: label, dropdown, and description text all render correctly with no layout regression.

**Slice 4:** `StudioReleaseDetailView`'s release Description textarea (its Content-type filter select was left as the inline exception noted above).

**Slice 5:** `StudioBrandingView`'s press-kit Short bio textarea.

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` (296 tests) on `tahti-web` pass clean. Bumped `packages/tahti-web/package.json` to `0.0.6`.

## 2026-08-31 — Backlog round 12: five slices closed; bump to 0.0.7

Continuing the native-control sweep, same block-level-vs-inline judgment call as round 11 (skipped `StudioScheduleView`'s inline Minutes-duration select next to a Button, same reasoning as before).

**Slice 1:** `BroadcastDetailsFields`'s Show description textarea.

**Slice 2:** `BroadcastPreflightPanel`'s Series episode select -- had no `@tahti-player/ui` import in the file at all yet; also moved its helper text into `Select`'s own `description` prop instead of a separate `<span>`.

**Slice 3:** `StudioArchiveItemView`'s Content type select and Description textarea (its Basics-tab grid form, same shape as `TrackEditDialog` from round 9). Screenshot-verified in the browser: both fields render correctly in the two-column grid alongside Title/Release date/Genre.

**Slice 4:** `StudioScheduleView`'s show Visibility select (Public/Fans only).

**Slice 5:** `StudioPlaylistsView`'s "Add from Library" and "Add release" selects -- both had a redundant standalone `<label>` element sitting above the native `<select>` that's now redundant with `Select`'s own `label` prop; removed both.

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` (296 tests) on `tahti-web` pass clean. Bumped `packages/tahti-web/package.json` to `0.0.7`.

## 2026-08-31 — Backlog round 13: five slices closed; bump to 0.0.8

**Slice 1:** `ChannelDesigner`'s Gallery style and Transition selects -- the component has two structurally identical copies of this gallery/slideshow config block (same `GALLERY_MODES`/`SLIDESHOW_PRESETS` options, different nesting depth), so this closes 4 native `<select>` instances across both copies.

**Slice 2:** `AdminDiscoWidgetsView`'s Add-on type select.

**Slice 3:** `StudioCollectionsView`'s collection Visibility select.

**Slice 4:** `SettingsPanels`'s profile Country select (same empty-string-default-plus-flag-emoji shape as `OnboardingView`'s Country field from round 9).

**Slice 5:** `SettingsPanels`'s theme-JSON import textarea (Themes → Import JSON tab), same shape as `ThemeEditor`'s JSON textarea from round 12.

Skipped, same inline-compact reasoning as rounds 9/11/12: `AdminFinancialView`'s ledger-category select and `AdminStorageView`'s sort-by select (both inline in a `flex flex-wrap` toolbar row with no visible label) and `StudioArchiveView`'s Source/Sort filter selects (`min-w-40` inline filter row).

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` (296 tests) on `tahti-web` pass clean. Bumped `packages/tahti-web/package.json` to `0.0.8`.

## 2026-08-31 — Backlog round 14: five slices closed; bump to 0.0.9

Switched WORKPLAN items -- the native-control sweep is now exhausted (every remaining `<select>`/`<textarea>` is a compact inline dropdown that doesn't fit `Select`'s block layout, matching rounds 9/11/12/13's judgment calls). Moved to "replace repeated bespoke bordered panels with `Box`."

**Slice 1:** `AccountView`'s membership/security summary panel -- note this view is currently unreachable from the router (no route imports `AccountView`), so this is source-hygiene only, not a live UI change; left as-is rather than wiring up routing, which is out of scope for a component-consistency slice.

**Slice 2:** `ListenerWidgetEmbed`'s per-instance wrapper panel.

**Slice 3:** `MusicBrainzSubmissionAssistant`'s prepared-metadata preview box inside its dialog.

**Slice 4:** `ChannelRotationEditor`'s "Add from library" group tiles (a `.map()`-rendered grid of cards -- kept `Box`'s default `w-full` since it needs to fill its CSS Grid cell, unlike the other four slices which override to `w-auto` for their normal block-flow sizing).

**Slice 5:** `FlowGallery`'s Mermaid diagram wrapper panel.

Left several similar bordered `<section>`/`<div>` wrappers alone: `PortInventoryPanel`, `StreamManagerPanel`, and `ChannelAnnouncementsPanel` all use `<section>` as their whole panel's root container (not an inner content box) -- swapping to `Box` (a `<div>`) would lose that sectioning semantics for no visual gain. `MulticastSection`'s provider tile is a horizontal-scroll-snap carousel item with its own layout needs, not a standard panel.

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` (296 tests) on `tahti-web` pass clean. Bumped `packages/tahti-web/package.json` to `0.0.9`.

## 2026-08-31 — Backlog round 15: five slices closed; bump to 0.0.10

Back to the Nuclear `Button` audit (WORKPLAN "collection actions" and "Radio actions").

**Slice 1:** `StudioCollectionsView`'s `StyleChip` toggle button.

**Slice 2:** `StudioCollectionEditView`'s cover/backdrop upload tiles (large image-hover-overlay buttons, `group`/`group-hover` CSS preserved) and its own `STYLE_OPTIONS` toggle chips -- same `StyleChip` shape as slice 1, duplicated locally in this file rather than shared. Screenshot-verified in the browser: hover overlay shows the upload icon and label correctly, chip toggles render with the right active/inactive borders.

**Slice 3:** `RadioScheduleView`'s "Set up a channel" inline text-link action (opens the channel setup dialog).

**Slice 4:** `StudioReleaseDetailView`'s artwork upload hover-overlay button (same shape as slice 2's cover/backdrop tiles).

**Slice 5:** `StudioReleasesView`'s `TypeChip` toggle button -- a third independent copy of the same chip pattern as slices 1 and 2's `StyleChip` (three near-identical implementations of the same toggle-chip component now exist across `StudioCollectionsView`, `StudioCollectionEditView`, and `StudioReleasesView` -- worth extracting to one shared component in a future slice rather than a fourth copy-paste).

Left `StudioReleaseDetailView`'s library-track-picker row buttons alone (row-selection in a scrollable list, the same legitimate exception category as `ChannelLayersMenu`'s drag-handle/row-select buttons from earlier rounds).

**Validation:** `tsc --noEmit`, `eslint`, and `vitest` (296 tests) on `tahti-web` pass clean. Bumped `packages/tahti-web/package.json` to `0.0.10`.

## 2026-08-31 — Backlog round 16: Listen page "Add widget" entry point

Closes the one item explicitly deferred in round 6 ("Listen page: 'Add widget' button linking into the addon store" — skipped back then because a concurrent session was mid-rewriting `PluginStorePanel.tsx`/`router.tsx`; re-confirmed via grep that it was still genuinely unimplemented, and that the concurrent rewrite has since landed and compiles clean).

**Slice:** `ListenView.tsx` — added a signed-in-only "Add widget" `Button` (`PlusIcon`) above `ListenerWidgetsSection`, calling `useSettingsModalStore`'s `open('plugin-store', 'listen')`. This reuses the deep-link mechanism (`pluginCategory`) a concurrent session had already built into `settingsModalStore.ts`/`PluginStorePanel.tsx` — no new plumbing needed there. Necessary because `ListenerWidgetsSection` intentionally renders `null` until the listener has at least one widget/station/favorites enabled, so there was previously no discovery path into the addon store from the Listen page for a new user with nothing enabled yet; the existing "Manage widgets" link inside that section only appears after something is already on.

**Validation:** `tsc --noEmit`, `eslint --fix` + `--max-warnings=0`, and `vitest run` (52 files, 299 tests) on `tahti-web` pass clean.

## 2026-08-31 — Add-ons: real-feature hand-off for YouTube + Radio installed/available; bump to 0.0.11

Closes the last item of the addon-consistency pass: every `apiCounterpart.status === 'partial'` Nuclear registry entry now points its Configure dialog at the real Tahti feature it duplicates, and every plugin-list category that has a meaningful installed/not-installed distinction now splits into Installed/Available tabs.

**Slice 1:** `nuclearPluginAddons.ts`'s `youtube` entry gained a `realFeature` handing off to the real YouTube listener widget in Listen, matching the `discogs`/`spotify`/`musicbrainz` pattern from the previous round.

**Slice 2:** `PluginStorePanel.tsx`'s `RadioCategory` (curated stations) gained the same Installed/Available tab split already applied to `ServiceCategory`, `NuclearPluginAddonsCategory`, and `ListenCategory`.

**Slice 3:** `youtube-playlists` graduated from `planned`/`missing` to `partial`, with a `realFeature` hand-off to Listen — the YouTube widget's `toEmbedUrl` already resolves `youtube.com/playlist?list=…` and `watch?v=…&list=…` URLs into a real playlist embed; the registry entry was simply stale.

**Slice 4:** `soundcloud-dashboard` graduated from `planned`/`missing` to `partial`, with a `realFeature` hand-off to Listen — the SoundCloud widget's profile-URL support (added earlier this round for artist profile embeds) is a real, honest stand-in for a personal dashboard (rolling feed of public tracks). Its note is explicit that charts/editorial-picks/personalized-recommendations remain unavailable, since SoundCloud doesn't expose those for public embedding — this is not a claim of full dashboard parity.

**Slice 5:** Corrected `bandcamp-dashboard`'s note to explain, now that `soundcloud-dashboard` has a real embed path, why Bandcamp doesn't get the same treatment: it has no public profile/feed widget, only the per-track/per-album `EmbeddedPlayer` already exposed in Listen. Also updated `WORKPLAN.md`'s "Nuclear registry runtime parity" line to record which planned entries are still genuinely backend-blocked (`bandcamp-dashboard`, `deezer-dashboard`, `listenbrainz-dashboard`, `omnisource`, `youtube-liked-songs-sync`) versus the two that were resolved by an existing client-side embed.

**Validation:** `tsc --noEmit`, `eslint --fix`, and `vitest run src --run` (52 files, 299 tests) on `tahti-web` pass clean; live-verified the Radio tab's Installed(0)/Available(8) split and Discogs's real-feature hand-off in the browser. Bumped `packages/tahti-web/package.json` to `0.0.11`.

## 2026-09-02 — Orphan-page audit + Help Center restructure; bump to 0.0.20

Two-part pass: close the navigation gap the diagnostics atlas had been flagging (see `NAVIGATION-GAPS.md`/`NAVIGATION-SITEMAP.md`), and fix the Help Center hub, which had grown into an always-scrolling stack of sections.

**Slice 1 — orphan audit.** Cross-referenced every route under `/studio/*`, `/admin/*`, and `/library/*` in `router.tsx` against `AdminNav.tsx`'s `PRIMARY`/`ADMIN_SECTIONS`, `StudioNav.tsx`'s `PRIMARY`/`SUBMENUS`, and every `<Link to>`/`navigate({ to })` call in `src/`. Found exactly one true orphan — `/admin/radio-station-suggestions` (`AdminRadioStationSuggestionsView`), a real content page with no nav entry and no in-app link anywhere, only referenced from `admin.ts`'s HTTP call strings. Everything else that looked suspicious turned out to be an already-documented intentional compat redirect (`/admin/activity`, `/admin/beta`, `/studio/info`, etc.) or a genuinely-linked contextual page. Also flagged, but left untouched since there's no content to gather, two dead non-content leftovers for future cleanup: `/studio/setup-channel` (an unreferenced redirect component) and `StudioVenuesView.tsx` (a component with no route left pointing at it).

**Slice 2 — gather it.** Built `/admin/orphan-pages` (`src/views/admin/orphanPages/AdminOrphanPagesView.tsx` + `orphanPagesNav.ts` + `tabs/RadioStationSuggestionsTab.tsx`) as a tabbed page — one tab per orphan — following the same pattern this codebase already used to retire six other standalone admin routes into `AdminModerationView`. `/admin/radio-station-suggestions` now redirects into its tab. Added an "Orphan pages" entry to `AdminNav`'s Manage section so the gathering page isn't itself an orphan, and linked it from the Help Center's Admin guide article.

**Slice 3 — Help Center restructure.** `HelpHubView` was stacking a decorative banner, a 3-card quick-start row, and 9 full category sections all in one always-visible column — guaranteed scroll on any screen — with `disco-widgets` duplicated across two categories, and `DOCUMENT_GROUPS` links using raw `<a href>` (full page reload) instead of the router's `Link`. Replaced the stacked sections with the existing `Tabs` component (one category visible at a time, icon + label per tab; search bypasses tabs with a flat filtered grid), removed the duplicate and the now-orphaned anchor-jump sidebar nav, switched `DOCUMENT_GROUPS` to `Link`, and replaced the article page's array-order Previous/Next with a `getRelatedArticles(slug)`-driven "Related guides" grid sourced from the article's real topic group.

**Validation:** `pnpm type-check` and a scoped `eslint` on every touched file pass clean; `vitest run` on the content dir (12 tests) passes. No dev server was available to screenshot-verify the no-scroll claim at real viewport sizes — worth a manual look at `/help` and `/admin/orphan-pages` before the next release. Bumped `packages/tahti-web/package.json` to `0.0.20`.

## 2026-09-02 — Content grid restructure, Archive → Sounds rename, save/delete UX pass, private-share links; bump to 0.0.22

Large multi-slice session: nav/content-taxonomy robustness, a full internal rename, and a new capability with an explicit not-yet-implemented backend contract.

**Slice 1 — content taxonomy and collection-style centralization.** `content/contentTypes.ts` and `content/collectionStyles.ts` are now the single source of truth for content-type/collection-style label, icon, and selectability (with legacy-alias normalization: `RADIO_SHOW`→`SHOW`, `MIX_SERIES`→`DJ_SET_SERIES`), replacing duplicated arrays across 9+ files — the exact failure mode that let a phantom `AUDIOCLIPS` value ship undetected in an earlier commit.

**Slice 2 — nav-config drift fixes.** An unregistered `/studio/branding` tab, a dead `/admin/missed-shows` view with no route, and a channel-page block `renderBlock` switch with no exhaustiveness check (a new block type could compile clean and silently render nothing) — all fixed, with `StudioNav.test.ts`/`AdminNav.test.ts`/`channelPageLayout.test.ts` added as regression guards.

**Slice 3 — Distribution, Favorites/History, duplicate routes.** Moved Distribution out of Studio's top-level tabs (now reachable only via Releases, nested not sibling). Moved Favorites/History out of the creator Library — they were listener features wrapped in Studio chrome — to `/listen/favorites`/`/listen/history` as real Listen tabs, with old paths redirecting. Found and closed `/library/releases`/`/library/recordings` as dead-end duplicates of `/studio/releases`/`/studio/recordings` (identical component, linked from nowhere in the app); checked `/library/collections` vs `/studio/collections` for the same pattern and confirmed it's an intentional browse/manage two-tier design instead, left alone.

**Slice 4 — Recordings reconstruction.** `StudioRecordingsView` now reuses the Sounds-tab (`MyDiscographyView`) row styling instead of a bespoke list, groups recordings by their real show (joined via `api/shows.ts`'s new `fetchShowRefByArchiveItemId`, matching `StudioEpisode.archiveItemId` — not the title-text matching a recording's own `title` field would otherwise force), pins unpublished drafts above the groups, and adds inline editing + a Browse Shows link.

**Slice 5 — Archive → Sounds rename.** `StudioArchiveItem`→`StudioSound`, `StudioArchiveView`→`StudioSoundsView`, `StudioArchiveItemView`→`StudioSoundView`, `fetchStudioArchive*`→`fetchStudioSounds*`, `archiveItemId`/`archiveItem`→`soundId`/`sound` wherever it refers to this feature (~60+ files, including nested relation fields like `CollectionItem.archiveItem`), routes `/studio/archive*`→`/studio/sounds*` with redirects for old links, matching Storybook stories. Backend endpoint path strings (`/api/me/archive`) deliberately left unchanged — renaming those without a matching backend change would break live calls; see `docs/API-REFERENCE.md`. Deliberately **not** renamed: the player's `'archive'` track-kind/`archive:` id-prefix system (`stores/playerStore.ts`) — that's the live-vs-recorded-channel-playback concept, a different, older meaning of "archive" than the Studio management feature being renamed here — and the `autoArchive` broadcast setting.

**Slice 6 — save/delete UX consistency audit.** Added confirmation before six destructive actions that had none (stash file delete, RTMP destination removal — which also silently ignored failures before this — moderator removal, release-track removal, venue booking cancellation, gallery photo removal) and toast/message feedback for actions that previously succeeded or failed silently. Fixed `playQueueFavoriteActions` (`MediaIconActions.tsx`) and its callers (`RadioView`, `ReleasesPanel`, `ReleaseTracklistDialog`, `FavoritesView`) to reflect live playing/paused state and toggle pause instead of always restarting — including favorite-channel cards, using the fact that a channel's live playable id is always `live:<slug>` (`api/client.ts`'s `fetchChannel`), so it's knowable without an async fetch.

**Slice 7 — private-share links for PRIVATE/STASH sounds.** New `SoundShareLinksSection.tsx` (wired into `TrackEditDialog`'s Sharing tab whenever visibility is PRIVATE/STASH) generates/revokes a keyed link (`/t/:id?key=...`) that opens the standard track page/player for someone who isn't otherwise allowed to see it — modeled exactly on the existing, real `StashShare` contract (`api/sources.ts`). `TrackDetailView` shows a "Private — viewing via share link" badge and threads the key through `fetchTrackDetail`/`fetchTrackComments`/`postTrackComment`. **The backend route this depends on does not exist yet** — verified against the real `../tahti` source (`GET /api/tracks/:id` hard-codes `isPublic: true`, no bypass) — see `docs/API-REFERENCE.md`'s new "Proposed contract" section for the exact spec, including the audit-log-not-public-event requirement for interactions made through a share key, which is a server-side guarantee the client can send the key for but cannot itself enforce.

**Slice 8 — two new system rules, tracked for a sweep.** (1) URL-field copy convention: any field displaying a URL pairs it with `@tahti-player/ui`'s `CopyButton` inline, never a bare copy icon with no visible URL or a hand-rolled copy handler — applied to Slice 7's share links; known unswept violators noted in `WORKPLAN.md` (`StudioReleasesView`'s smartlink copy button has no visible field, `StudioGoLiveView`'s local `copyText` hand-rolls what `CopyButton` already does). (2) Media upload convention: placeholder-first, hover-to-open-widget when >1 image vs. direct dialog for exactly 1, never accept a pasted link instead of a file, toast + immediate preview refresh on upload, a processing progress bar for video, R2-under-user-namespace by default — reference implementations are `RoundImageUploadButton.tsx`/`BackdropUploadButton.tsx`/`ImageUploadField.tsx`; sweep not yet executed. Also fixed `StudioStashView`'s visibility filter, which never matched `UNLISTED` sounds despite the page's own "private locker, share a link" framing.

**Validation:** `tsc --noEmit` and `eslint` clean throughout; `vitest run` (56 files, 342 tests) passes after every slice. New Playwright coverage: `e2e/stash-and-subscriber-access.spec.ts` (upload → visibility → cross-session access/download; upload → subscriber-gated → listing-exclusion check) — typechecks and lists cleanly via `playwright test --list`, not run live against `beta.tahti.live` this session. Two things found with no real feature behind them yet, documented rather than faked: collections have no subscriber-gated visibility option (only track-level), and subscribing has no test-mode path (real Stripe Checkout) for an end-to-end "subscriber sees gated content" test. Bumped `packages/tahti-web/package.json` to `0.0.22`.
