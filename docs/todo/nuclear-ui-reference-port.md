# Nuclear UI reference port (tahti-web)

**Status:** blocked

2026-09-25: the reference screenshots are not on the Mac checkout (`~/Pictures/Screenshots/` is missing). The user chose to skip the port for now; it needs the images copied over before any work starts.

Logged 2026-09-23 from a user request. Visual-parity port of original Nuclear player screens into `packages/tahti-web`, driven by reference screenshots. Goal: layouts that look like the reference images — dense, full of content, matching structure — while keeping tahti-web's live data, features and persistent chrome.

## Reference screenshots

`~/Pictures/Screenshots/` (user home, outside the repo — do not commit):

| File          | Target                                                                  |
| ------------- | ----------------------------------------------------------------------- |
| `listen.png`  | Dashboard/home layout, including the queue panel                        |
| `history.png` | History view                                                            |
| `logs.png`    | Logs view                                                               |
| `playback.png`| Playback controls section for tahti-web settings                        |
| `artist.png`  | Artist page                                                             |
| `integrations.png` | Settings → Integrations section                                     |
| `nuclear.png` | General original-player layout reference                                |

Open the image while implementing each item; the notes below are codebase orientation, not a substitute for the screenshot.

## Cross-cutting layout goal

- [ ] Port the overall layout so screens read like the original Nuclear player: match panel/column structure, ordering and proportions from the screenshots.
- [ ] Study how the reference keeps the viewport full of content (neat design-system density — sections stacked edge to edge, minimal dead space) and apply that rhythm to every ported surface; no large empty regions.
- [ ] Keep persistent chrome per `packages/tahti-web/AGENTS.md`: sidebar/drawer, bottom player bar and in-page tabs stay mounted on ordinary surfaces.

## A. Dashboard layout + queue panel (`listen.png`)

Current state: de facto home is `ListenView` at `/` (`packages/tahti-web/src/views/ListenView.tsx`, tabs listen/feed/history); `/dashboard` is only a redirect alias (`DashboardAliasView.tsx`). tahti-web already has queue UI: `src/components/SidebarQueuePanel.tsx` wrapping `QueuePanel` from `@tahti-player/ui`, mounted in `RightRailPanel` and `AppShell`; desktop mounts it in the right sidebar (`packages/player/src/routes/__root.tsx` → `PlayerWorkspace.RightSidebar` → `ConnectedQueuePanel`).

- [ ] Rebuild the home/dashboard layout to match `listen.png` exactly (structure, section order, proportions).
- [ ] Show the Nuclear-style queue panel on the dashboard as in the reference — reuse `QueuePanel` / `SidebarQueuePanel`, placed like the desktop right-sidebar queue, not buried in a rail tab.
- [ ] Fill the screen with content per the reference density (widgets/sections stacked like `packages/player/src/views/Dashboard/Dashboard.tsx` + `dashboardWidgets.ts` where applicable).

## B. History (`history.png`)

Current state: `packages/tahti-web/src/views/HistoryView.tsx` — partial port (header comment says so): Recently played / Stats / Listening history tabs, `PlayableTrackTable` preview, `HistoryStatsSection`, `HistoryListSection`; data via `useLibraryStore` history + `src/lib/historyStats.ts`. Desktop source: `packages/player/src/views/History/` (HistoryBody, HistoryList, HistoryStats, HistoryTopLists, pagination) + `packages/ui` `HistoryRow`/`HistoryDayGroup`.

- [ ] Port the history view structure/visuals to match `history.png` exactly (tabs, layout, density, row treatment).
- [ ] Keep existing tahti-web data wiring (localStorage history/stats); this is a layout/visual port, not a data rewire, unless the screenshot implies missing sections.

## C. Logs view (`logs.png`)

Current state: tahti-web only has admin logs — `src/views/admin/AdminLogsView.tsx` at `/admin/logs` (tabs: audit events / container logs / recent audit, using `LogViewer` from `@tahti-player/ui`). Nuclear shows Logs as a settings-modal tab: `packages/player/src/views/Logs/Logs.tsx`, tab in `ConnectedSettingsModal.tsx`, primitives in `packages/ui` `LogViewer`/`LogEntry`/`LogToolbar`.

- [ ] Port the logs view to match `logs.png` (structure, toolbar/filters, entry rendering, density).
- [ ] Confirm the target surface from the screenshot: settings-tab logs (Nuclear style) vs restyle of `/admin/logs` — likely a Logs section reachable the Nuclear way; decide before building.

## D. Playback controls in settings (`playback.png`)

Current state: tahti-web settings (`src/views/settings/`) has no playback section — nav is account/artist/channel/broadcast/themes/plugin-store/whats-new (`settingsNav.ts`). Transport lives only in `ConnectedPlayerBar` / `PlayerSeekBar` / `FullScreenPlayer`. Nuclear source: `packages/player/src/services/coreSettings.ts` category `playback` (volume, muted, shuffle, repeat, skipSeconds, crossfadeMs, stream settings — some `hidden`), rendered by `views/Settings/Settings.tsx` + `useSettingsGroups.ts`.

- [ ] Add a Playback section to tahti-web settings laid out like `playback.png`.
- [ ] Wire each control to existing web state (`playerStore`, `ConnectedPlayerBar` actions) — only web-meaningful prefs; flag unsupported ones (e.g. crossfade if the web player lacks it) instead of faking them.
- [ ] User-facing strings through the existing i18n convention (`en_US.json` only in this repo).

## E. Artist page (`artist.png`)

Current state: `/u/$username` → `packages/tahti-web/src/views/ArtistView.tsx` (787 lines): `EntitySocialHeader` → bio → live shows → tagged-in → feed → news → tabs (music/releases/collections/gallery/design) → embeds, with components under `src/components/artist-view/`. Nuclear desktop reference: `packages/player/src/views/Artist/` — widget host (`Artist.tsx` + `artistWidgets.ts`): bio header, social stats, then a row of top tracks (2/3) + similar artists (1/3), albums grid, playlists grid.

- [ ] Remake the artist page to look like `artist.png` — adopt the reference's section order, two-column tracks+related row, grid density.
- [ ] Keep all tahti-web capabilities (channel look/widgets, feed, news, live shows, tabs, designer embed) — reorganize around the reference, don't drop features (priority: Storybook component → local shared → build, keep live data).
- [ ] Design-tab/channel-designer full editing may stay delegated to `/channel/$slug?edit=1`.

## F. Settings → Integrations (`integrations.png`)

Current state: no Integrations section in tahti-web settings. Nuclear desktop has it as a category in General: `coreSettings.ts` `category: 'integrations'` — Tahti Jam (enabled + remoteUrl + apiUrl), MCP server (enabled + serverUrl), MPD server (enabled + serverUrl), Discord Rich Presence (enabled); section title `preferences.integrations.title` in `en_US.json`. tahti-web today: scrobble services in Settings → Add-ons via `src/api/integrations.ts` (`/api/me/integrations`); admin vendor status panel exists separately. `packages/tahti-web/FEATURES.md` §7 and `CUTOVER.md` currently mark MCP/MPD/Jam as desktop-only.

- [ ] Port the Integrations section into tahti-web settings, laid out like `integrations.png`.
- [ ] Scoping first (before building): decide which Nuclear rows belong on web (Discord/scrobble-adjacent likely; MCP/MPD/Jam need an API story or stay desktop-only) — contracts come from sibling `../tahti-org`; no invented DTOs; note any API additions needed instead of inventing them.
- [ ] Do not duplicate scrobble cards already in Add-ons — either move them under Integrations or link across, per the reference.

## Definition of done

- [ ] Side-by-side check of each surface against its screenshot.
- [ ] Storybook-first for new/changed shared components (default/empty/loading/error/disabled; flag `Missing states:`).
- [ ] Update `docs/VIEW-CATALOG.md` if routes, views, stories or nav change.
- [ ] `pnpm lint && pnpm type-check && pnpm test` pass.
- [ ] After user-visible ship: bump `packages/tahti-web` patch + changelog/worklog entry; rebase before push; never commit unless asked.
