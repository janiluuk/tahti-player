# Design audit: Studio and Admin

**Status:** partial

## Request

Do a design audit of the Studio and Admin parts. Find crowded views and views with too much mixed context, for example chat-related parts spread over several places instead of in one. Split views that are too long into tabs.

## Scope

- Studio: `packages/tahti-web/src/views/studio/` (Home, Channel, Profile, Fans, Go live / Green room, Broadcast, Releases, Collections, Events, Listening parties, Groups, Distribution, Stats, Mastering, Editor).
- Admin: `packages/tahti-web/src/views/admin/` (Dashboard, Users, Radio, Streams, Moderation, News, Announcements, Financial, Governance, Storage, Monitoring...).
- Nav sources: `StudioNav.tsx` (`SUBMENUS`, `*_SUBNAV_ITEMS`), `AdminNav.tsx` (`ADMIN_SECTIONS`), `docs/NAVIGATION-SITEMAP.md`.

## To do

- [ ] Walk every Studio and Admin view (Storybook + local app), note per view: crowded / mixed context / too long / fine.
- [ ] Chat: list every place chat lives (start with `StudioFansView`, `StudioChannelView`, `StudioProfileView`, `go-live/GreenRoomSessionPanel`, admin `CommunityStatsPanel`) and propose one home, linking to it from the others.
- [ ] Long views: propose a tab split (`Tabs` from `@tahti-player/ui`, tab in the URL search like `radioTabs`), one slice per view.
- [ ] Write findings here as a table (view, problem, proposed fix), then split the fixes into slice todos.

## Related

- [navigation-simplification.md](navigation-simplification.md), [simplify-studio-library-settings-admin.md](simplify-studio-library-settings-admin.md), [ui-nav-audit.md](ui-nav-audit.md) - check them first so the audit does not repeat their findings.

## Findings (2026-11-22)

The walk is done from code; the per-view table, the chat inventory and the proposed slices follow. Stats tabs (slice 7) are in progress under [studio-stats-tabs.md](studio-stats-tabs.md) after user OK. Confirm the remaining proposals, then build them as slices.

Read from code on branch `feat/next-50-slices-3` (no app walk-through). Builds on
[`navigation-simplification.md`](navigation-simplification.md),
[`simplify-studio-library-settings-admin.md`](simplify-studio-library-settings-admin.md) and
[`ui-nav-audit.md`](ui-nav-audit.md); anything those already track is marked **known** and
not re-planned here.

### How the counts were made

Per view: the view file plus its own folder (e.g. `StudioGoLiveView.tsx` + `go-live/`),
tests and stories excluded. Counts are JSX tags found by grep, so they include dialogs and
conditional states: read them as "how much lives on this surface", not as what one screen
shows at once. Components imported from `src/components/` are not counted.

- Tabs: `Tabs`, `SectionTabs`, `InPageNav`, `TabsList`, `SegmentedControl`
- Filters: `FilterChips`, `FilterBar`, `Select`, `Combobox`
- Buttons: `Button`, `ButtonLink`, `ButtonAnchor`, `IconButton`, `SaveButton`
- Panels: `StudioPanel`, `SettingsPanel`, `Panel`, `section`, `HubCards`, `Card`, `details`
- Inputs: `Input`, `Textarea`, `Toggle`, `Switch`, `Checkbox`, number/date/time inputs

### Studio views

| View | Lines (files) | Tabs | Filters | Buttons | Panels | Inputs | Verdict | Problem | Proposed fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home (`StudioHomeView` + `home/`) | 991 (8) | 0 | 0 | 7 | ~20 titled blocks | 0 | crowded, mixed context | 12-tile grid (Broadcast, Keys/signal, Next show, Music, Episodes, Add audio, Delivery/royalties, Audience, Updates/newsletter, Plays, Orders/grants, Payout, Design/domain) plus Governance and Recent activity panels. Governance is Co-op work since slice 6 | Remove the Governance panel (sidebar Co-op owns it; at most a one-line "N votes waiting" link). Cut the grid to one tile per Studio tab (Music, Broadcast, Fans, Stats, Profile) |
| Music → Releases | 485 (1) | 0 | 2 | 8 | 1 | 2 | fine | - | - |
| Music → Tracks (`StudioSoundsView` + `sounds/`) | 2557 (11) | 1 | 20 | 25 | 2 | 9 | crowded (**known**) | 15 dialogs on one surface | Covered by simplify phase 5 (`FilterBar`, overflow menu) |
| Music → Collections | 652 (1) | 4 | 3 | 6 | 1 | 4 | check | 4 tab/segmented controls in one file under the Music chips | Verify whether two tab rows can show at once; if so, the inner one becomes a chip filter in the `FilterBar` |
| Music → Editor list | 442 (1) | 3 | 2 | 8 | 2 | 1 | tabs inside chips (**known**) | In-page tabs under the Music chips | Already listed in simplify inventory; chips in the toolbar instead of tabs |
| Music → Distribution | 1397 (7) | 1 | 1 | 10 | 4 | 7 | long | One long page of settings and status | Tabs `Status · Settings · Royalty reports` with `?tab=` |
| Collection edit | 1688 (11) | 2 | 4 | 16 | 9 | 11 | too long | Detail page with 13 dialogs and 11 inputs | Detail tabs (max 4): `Tracks · Details · Artwork · Sharing` with `?tab=` |
| Release detail | 3028 (12) | 2 | 3 | 35 | 16 | 9 | crowded (**known**) | Busiest Studio page | Already 4 tabs + overflow menu (slice 5); no new action |
| Upload | 967 (3) | 1 | 1 | 11 | 2 | 3 | fine | Wizard | - |
| Smart links | 272 (1) | 0 | 1 | 4 | 1 | 0 | fine | - | - |
| Groups / Group detail | 544 (2) / 527 (1) | 0 | 2 | 8 / 9 | 3 / 4 | 3 / 4 | fine | - | - |
| Pro editor | 3815 (12) | 4 | 4 | 25 | 9 | 6 | out of scope | Tool surface, own chrome | - |
| Broadcast hub | 342 (1) | 0 | 1 | 3 | 3 | 0 | fine | - | - |
| Go live (`go-live/`) | 2216 (12) | 0 (6-step stepper) | 3 | 28 | 6 | 5 | crowded (**known**) | Show info · Credentials · Encoder · Recording · Destinations · Green room | Stepper polish is simplify phase 3 (design call) |
| Channel (`StudioChannelView`) | 355 (1) | 1 (Stream · Pinned · Multicast) | 0 | 5 | 6 | 0 | mixed context | Overall statistics, Stream manager, Programme on schedule, Multistream destinations, Radio tabs, Green room (with "Open green room chat"), Channel setup. Statistics belongs to Stats, multistream and green room to Go live, programme to Schedule | Channel becomes "24/7 radio" only (Stream · Pinned · Multicast); the other blocks become one-line links to their homes |
| Schedule (`StudioScheduleView` + `schedule/`) | 938 (4) | 1 | 4 | 13 | 4 | 9 | too long, mixed context | Slot list and analytics, then the whole Channel programme form (announcements, fallback, auto-enroll, rotation source, radio playlist, clips) | Two tabs in the URL: `?tab=slots` (default) and `?tab=programme` |
| Show detail (+ `show-detail/`) | 1387 (8) | 5 controls, 3-tab header | 2 | 18 | 9 | 14 | fine | Within the 3-tab detail budget | - |
| Recordings | 331 (3) | 0 | 1 | 3 | 2 | 0 | fine | - | - |
| Fans hub (`StudioFansView`) | 141 (1) | 4 (Tools · Chat, then chat's Access · Messages · Moderators · Bans) | 0 | 0 | 1 | 0 | mixed context, tabs inside tabs | Chat settings and moderation sit in a second tab of the Fans hub, with their own tab row under it (rule 5 break) | Move chat out (see Chat below); Fans goes back to hub cards only |
| Fans → Posts (`StudioUpdatesView`) | 1113 (5) | 0 | 1 | 10 | 4 | 8 | fine (**known**) | 19 dialogs, but one header and one primary | - |
| Fans → Earnings (`StudioRevenueView`) | 365 (1) | 0 | 0 | 4 | 11 | 0 | crowded, mixed context | Fan subscription tiers, Channel store, Track sales, Payments, Fan subscriptions, Order management, Order flow, Stripe, Past grants and a "this page has moved" notice on one page. Tiers and store have their own Fans cards | Earnings = payouts, sales ledger (incl. grant disbursements to the artist), Stripe. Tiers link to Memberships, store and orders to Store. Drop the moved notice once the old URL redirects |
| Fans → Stripe | 213 (1) | 0 | 0 | 3 | 3 | 0 | fine | - | - |
| Stats (`StudioStatsView` + `stats/`) | 1437 (11) | 2 | 3 | 2 | 18 | 3 | too long | One page with anchor links: overview, plays over time, listener map, countries, cities, audience breakdown, referrers, engagement, top lists, download gates | Tabs `Overview · Plays · Audience · Top lists` with `?tab=`, range picker shared above the tabs (changes slice 4's "one page" decision, so confirm with the user) |
| Stats detail / Track insights | 194 / 50 | 0 | 1 / 0 | 0 | 4 / 0 | 0 | fine | - | - |
| Profile hub (`StudioProfileView`) | 170 (1) | 0 | 0 | 0 | 4 (13 cards) | 0 | mixed context | Chat and Moderators cards open Studio → Fans | Drop both cards once chat has its own home |
| Profile section pages | 51 (1) + panels | 0 | 0 | 0 | 0 | 0 | fine | - | - |
| Branding panel (`StudioBrandingView` + `branding/`, rendered inside Profile pages and the Channel designer) | 1115 (8) | 4 | 1 | 11 | 9 | 5 | crowded | 4 tab controls and 6 dialogs inside a page that already sits under Studio → Profile | Check the tab rows on the Profile page; split into Profile sections (Logo & colours · Release visuals · Press kit) instead of tabs |
| Mastering, Event view/create, Listening party form, Stash | 218 / 218 / 76 / 277 / 243 | 0-4 | 0-1 | 1-4 | 1-3 | 0-2 | fine | - | - |

### Admin views

| View | Lines (files) | Tabs | Filters | Buttons | Panels | Inputs | Verdict | Problem | Proposed fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Overview (`AdminDashboardView` + `dashboard/`) | 903 (4) | 0 | 0 | 15 | 16 | 0 | too long, mixed context | Grafana dashboards, Services, Vital services, Status checks, System health, Needs action, Queue health, Cron jobs, Finance YTD, Recent audit events, Community stats "Chat and mail" all on one page | Tabs `?tab=health` (status, services, queues, cron, Grafana) and `?tab=activity` (needs action, audit events); Finance YTD moves to Co-op → Financial; chat and mail stats to a Community card (see Chat) |
| `AdminStatusView` (799, 5 files), `AdminMonitoringView` (216, 3 files) | - | - | - | - | - | - | orphan | Only `router-lazy-views.ts` exports and `content/mapScreens.ts` reference them; no route renders them since slice 9 | Delete the two view files, their lazy exports and mapScreens rows (keep `status/` and `monitoring/` panels used by Overview); flag the stories as `Orphan:` or remove |
| Inbox (`moderation/`) | 3048 (10) | 4 | 4 | 44 | 14 | 7 | crowded (**known**) | 7 queue chips, side panel | Shipped as slice 7; no new action |
| People → Users | 236 (1) | 0 | 3 | 2 | 2 | 0 | fine | User edit panel also shows the user's DMs (`AdminUserEditPanel`) | See Chat: keep, but label it as a moderation read |
| Content hub | 219 (1) | 0 | 0 | 1 | 5 | 0 | fine | - | - |
| Content → News | 469 (1) | 0 | 0 | 8 | 1 | 8 | fine | - | - |
| Content → Announcements | 732 (4) | 0 | 1 | 8 | 2 | 5 | fine | - | - |
| Content → Radio | 545 (1) | 1 (Feature · Playlist · Stations · Opt-outs + History) | 0 | 5 | 10 | 0 | fine (**known**) | Tabs in the URL already | - |
| Content → Top lists, Venues, Artwork presets, Selects | 211 / 205 / 259 / 41 | 0 | 0-4 | 0-3 | 0-4 | 0-1 | fine | - | - |
| Co-op → Governance (+ `governance/`) | 5833 (33) | 1 | 10 | 97 | 21 | 55 | largest surface (**known**) | 7 areas (Overview, Annual reports, Grants, AGM, Board, Discussions, Records) as hub cards since phase 7 | Per-area pages are the next split; Discussions overlaps Co-op discussions for members (check one home) |
| Co-op → Financial (+ `financial/`) | 790 (5) | 0 | 3 | 4 | 5 | 5 | fine | Would receive Finance YTD from Overview | - |
| Co-op → Grant cycle | 358 (1) | 0 | 0 | 3 | 6 | 0 | fine | - | - |
| Platform → Storage (+ `storage/`) | 1498 (5) | 1 (Storage · Files) | 8 | 17 | 8 | 1 | crowded | 8 filter controls, 11 dialogs | One `FilterBar` per tab; per-user storage stays its own page |
| Platform → Add-ons (+ `addons/`) | 1253 (8) | 0 | 5 | 17 | 0 | 12 | crowded | 25 dialogs, 12 inputs | Review vs catalogue: tabs `?tab=review` / `?tab=catalogue` |
| Platform → Streams (+ `streams/`) | 844 (4) | 0 | 2 | 10 | 3 | 13 | long | 13 inputs on one page | Tabs `Live now · Ingest settings` with `?tab=` |
| Platform → Vendors | 455 (1) | 0 | 0 | 0 | 7 | 0 | fine | Read-only | - |
| Platform → Languages (`AdminI18nView`) | 299 (1) | 0 | 0 | 3 | 1 | 2 | fine | - | - |
| Platform → Diagnostics, Logs, Activity, Orphan pages, Map | 74 / 270 / 382 / - / 36 | 0-1 | 0-1 | 0-2 | 1 | 0 | fine | Logs embeds Activity | - |
| Missed shows | 197 (1) | 0 | 0 | 3 | 2 | 0 | fine | Rendered inside Inbox | - |

### Chat: every place it lives today

| # | Surface | Route / file | Audience | What it does |
| --- | --- | --- | --- | --- |
| 1 | Channel page chat tab | `/channel/$slug`, `channel-view/ChannelPageTabs.tsx` (`chat` tab) | listeners | Live chat room on the page |
| 2 | Right-rail chat | `components/ChannelChatPanel.tsx` (+ `FanChatRoom` supporters room, `ChatReactionBar`, `ChatListeningNow`, `ChatDailyListeners`) | listeners | Chat beside any channel; links owners/moderators to `/moderate/$slug` |
| 3 | Channel layout "chat" block | `lib/channelPageLayout.ts` (`chat`: "Right-rail chat (no in-page panel)") | owner, designer | A layout item that only toggles the rail; off in every preset |
| 4 | Chat directory | `/chat`, `/chat/$slug` (`views/ChatView.tsx`) | listeners | Channels by chat activity in the last 24 h |
| 5 | Listening party chat | `/party/$id` (`listening-party/ListeningPartyChat.tsx`) | listeners | Party room chat |
| 6 | Green room chat | `/u/$username/green-room` (`GreenRoomView`); opened from Go live green-room step and Studio → Channel green room block | artist + guests | Backstage chat |
| 7 | Chat settings and moderation (owner) | `/studio/fans?tab=chat&section=access|messages|moderators|bans` (`moderation/ChannelChatSettings.tsx`) | channel owner | On/off, daily-listener count, access, messages, moderators, bans |
| 8 | Chat cards on Studio → Profile | `StudioProfileView.tsx` (Chat, Moderators cards) | channel owner | Links into #7 |
| 9 | Moderator console | `/moderate/$slug` (`ModerateChannelView.tsx`, reuses `ChatMessagesPanel`, `ChatBansPanel`) | owner or moderator | Messages and bans for a channel you moderate; step down |
| 10 | Fan tier perks | `lib/fanTierPerks.ts`, Fans → Memberships | channel owner | Supporters-only chat room perk |
| 11 | Direct messages | `/messages` (`/library/messages` redirects), top-bar Messages | everyone | DMs |
| 12 | Mentions | Settings → Notifications → Mentions (`MentionsPanel.tsx`) | everyone | Where you were mentioned in chat |
| 13 | Blocked accounts | Settings → Account (`BlockedAccounts.tsx`) | everyone | Blocks that also hide chat and DMs |
| 14 | Admin community stats | Admin → Overview, `dashboard/CommunityStatsPanel.tsx` ("Chat and mail") | board | Chat volume over 24 h |
| 15 | Admin user DMs | People → Users → user panel (`AdminUserEditPanel.tsx`) | board | Reads a user's DMs |

### Proposed one home

- **Artist side, one home: Studio → Fans → Chat card → `/studio/chat`** (hub card + back link, no tab under the Fans row). The page is one sectioned form, with a side list instead of the current second tab row: Chat on/off and counts · Who can chat · Messages · Moderators · Bans · Green room (link that opens #6). `/studio/fans?tab=chat&section=…` redirects there; Studio → Profile drops its Chat and Moderators cards (#8); the Studio → Channel green room block and Go live green-room step link to it instead of each carrying their own "Open green room chat" button.
- **Moderators** keep `/moderate/$slug` (#9) because they have no Studio. The owner's Messages and Bans sections in `/studio/chat` and `/moderate/$slug` already share `ChatMessagesPanel` / `ChatBansPanel`; keep it that way, and link the owner from `/moderate/$slug` to `/studio/chat`.
- **Channel page**: one chat entry, the page tab (#1); the rail (#2) is the same room. Drop the layout "chat" block (#3), which only duplicates the chat on/off switch and is off in every preset.
- **Listener side** stays where it is: DMs, mentions, blocks are account things (#11-13); party and green room chats belong to their events.
- **Admin**: move "Chat and mail" (#14) off Overview into a People → Community card with the other community numbers; keep #15 but title it "Messages (moderation read)" so it does not read as a chat.

### Proposed slices

| # | Slice | Files | Size |
| --- | --- | --- | --- |
| 1 | Chat home: `/studio/chat` sectioned page from `ChannelChatSettings` (side list, no tab row), Fans hub card, redirects from `/studio/fans?tab=chat…`, drop Profile Chat/Moderators cards, green room links point there | Shipped → HISTORY (0.0.445) | done |
| 2 | Drop the channel layout "chat" block (migration keeps saved layouts valid) | Shipped → HISTORY (0.0.444) | done |
| 3 | Studio Channel = 24/7 radio only; statistics, multistream, green room, programme become links | Shipped → HISTORY (0.0.445) | done |
| 4 | Schedule tabs `?tab=slots|programme` | Shipped → HISTORY (0.0.445) | done |
| 5 | Earnings trimmed to payouts, sales ledger (with grant disbursements), Stripe; links to Memberships and Store | Shipped → HISTORY (0.0.445) | done |
| 6 | Studio Home: no Governance panel; one tile per Studio tab | Shipped → HISTORY (0.0.445) | done |
| 7 | Stats tabs `Overview · Plays · Audience · Top lists` | Shipped in `studio-stats-tabs.md` → HISTORY (0.0.438) | done |
| 8 | Admin Overview tabs `health / activity`; Finance YTD to Financial; Chat and mail to a People → Community card | Shipped → HISTORY (0.0.439) | M |
| 9 | Delete orphan `AdminStatusView` and `AdminMonitoringView` (keep their panels), lazy exports, mapScreens rows, stories | Shipped → HISTORY (0.0.443) | done |
| 10 | Admin Streams tabs `Live now · Ingest settings`; Add-ons tabs `Review · Catalogue`; Storage one `FilterBar` per tab | Shipped → HISTORY (0.0.445) | done |
| 11 | Collection edit detail tabs (max 4) and Distribution tabs | `StudioCollectionEditView.tsx` + `collection-edit/`, `StudioDistributionView.tsx` + `distribution/` | M |
| 12 | Check-only: Music → Collections and the Branding panel for two visible tab rows; fix with chips / Profile sections if confirmed | Shipped → HISTORY (0.0.445) — no dual rows | done |

### Not verified

- No live walk in the app or Storybook for this pass; "check" rows need one at 390 and 1280 px.
- Tab counts per file can include a tab set that renders only in one state (e.g. a dialog), so "4 tabs" does not always mean 4 rows.
