# Tahti Player navigation sitemap

Updated 2026-10-03 from `src/router/routes-*.tsx`, `AppShell.tsx`,
`StudioNav.tsx`, `AdminNav.tsx`, `MobileChrome.tsx`, `LibraryView.tsx`,
`views/settings/settingsNav.ts` and `lib/prodPathRedirects.ts`. This is the
navigation audit source of truth for the Nuclear client. Persistent chrome
is listed separately from routes that exist but are only reached
contextually, so an orphan is not mistaken for a missing feature. The
`/more` atlas mirrors this file in `src/content/flowDiagrams.ts` (Nuclear
pack) and `src/content/mapScreens.ts`.

**2026-10-03 changes:** Studio's submenu is now Overview · Stats ·
Governance · Posts · Audience · Releases · Editor · Broadcast. "Perform" is
gone: its pages sit under the **Broadcast** item (label `studio.goLive`)
with a nested `BroadcastSubNav` (Go Live · Schedule · Events · Shows ·
Channel · Radio). Admin Governance absorbed Annual reports, Grants and AGM
as tabs, and Disco widgets became Add-ons. `/venues` redirects to the
Discover Venues tab. The right rail is the queue only; chat and
notifications are top-bar controls and channel chat opens at
`/chat/$slug` (`docs/DECISIONS.md`, 2026-09-28). New public routes since
the last pass: `/search?tag=` (tracks by tag), `/v/$slug` "Recorded here",
`/studio/events/$eventId/edit`.

On ordinary app surfaces the chrome in this table must stay on screen at
every moment (including route transitions). It may disappear only on
surfaces that take over the window: full-screen player, public
release/share canvases, and maximized workspaces such as the audio
editor. See root `AGENTS.md` → Persistent chrome visibility.

## Persistent chrome (what a user can click)

| Audience | Chrome entry | Where | Lands on |
| --- | --- | --- | --- |
| Everyone | Listen | Desktop sidebar, mobile bottom | `/` |
| Everyone | Radio | Desktop sidebar, mobile bottom | `/radio` |
| Everyone | Discover | Desktop sidebar, mobile bottom | `/discover` |
| Everyone | Favorites | Desktop sidebar, mobile More drawer | `/favorites` |
| Everyone | Library | Desktop sidebar, mobile More drawer | `/library` |
| Everyone | Studio | Desktop sidebar; mobile bottom for artist / board accounts, More drawer otherwise | `/studio` (StudioGate sign-in prompt when signed out) |
| Everyone | Help center | Desktop sidebar footer, mobile More drawer | `/help` |
| Everyone | Settings | Desktop sidebar footer, mobile More drawer (opens modal) | `ConnectedSettingsModal`; bookmarkable `/settings/$section` |
| Signed in | Notifications, Messages | Top bar popovers | Notification links go through `/dashboard/*` redirects; messages open `/messages/$id` |
| Board | Admin | Desktop sidebar (when diagnostics enabled) | `/admin` |

Studio submenu (`StudioNav` `SUBMENUS['/studio']`): Overview, Stats,
Governance, Posts, Audience, Releases, Editor, Broadcast.

- Broadcast tabs (`BROADCAST_SUBNAV_ITEMS`): Go Live, Schedule, Events,
  Shows, Channel, Radio (`/studio/channel?tab=radio`). Multicast, 24/7,
  Announcements, Pinned and Tahti Radio are tabs inside Channel → Radio.
- Audience tabs (`AUDIENCE_SUBNAV_ITEMS`): Overview, Tiers, Stripe (only when
  Stripe is configured).

Library tabs (`LibraryView`): Overview, Tracks, Collections, Recordings,
Media, Stash, Embeds, Smart links, Local files. Upload is `/library/upload`.

Settings modal sections (`SETTINGS_NAV`): Account, Artist, Channel &
design, Broadcast, Playback, Integrations (group "Settings"); Themes,
Add-ons, Logs, What's new (group "App"). Signed out, only Playback, Themes,
Add-ons, Logs and What's new show. An unknown `$section` opens Account.

- Account tabs: Session, Security, Membership, Governance, Storage,
  Notifications & visibility (grant report name toggle, show liked tracks,
  comments default), Mentions, Your subs.
- Artist tabs: Identity, Story, People, Connections (social links, news
  feed, X and Instagram auto-post), Branding (profile picture incl. GIF,
  avatar colour, backdrop, logo - same panel as `/studio/branding`),
  Gallery, Press kit, Releases.
- Channel & design tabs: Channel Designer, Discovery, Username & domain,
  Moderation.

Admin sections (`ADMIN_SECTIONS`):

- Overview: Dashboard, Financial, Storage, Artwork presets, Logs, Status,
  Vendors
- Community: Moderation, Users, Governance
- Content: Content, Radio, Tahti Selects, News, Top lists, Announcements
- Manage: Streams, Venues, Add-ons, Languages, Orphan pages, Map

Admin tabbed pages: Governance (`/admin/governance/$tab`: Overview, Annual
reports, Grants, AGM) and Moderation (`/admin/moderation/$tab`: Support,
Beta applications, Radio submissions, Content reports, Feature requests,
Missed shows).

Mobile bottom nav is Listen / Discover / Radio, plus Studio for artist and
board accounts, plus a More button that opens the drawer. Library,
Favorites, Help and Settings are in the drawer.

Desktop right rail: Queue only.

## Routes those chrome entries cover

| Audience | Navigation entry | Routes covered | Notes |
| --- | --- | --- | --- |
| Everyone | Listen | `/`, `/channel/$slug`, `/u/$username`, `/u/$username/c/$slug`, `/r/$slug`, `/t/$id`, `/search?tag=`, `/v/$slug` | Public playback destinations. `/feed`, `/listen/feed` and `/listen/history` are contextual from Listen, not chrome items. Tag search is reached from tag chips on a track page; venue pages from "Recorded at" on a track page and the Discover Venues tab. |
| Everyone | Radio | `/radio`, `/radio/show/$channelSlug`, `/radio/station/$stationId` | Radio show pages list past episodes with name, artwork and recording. `/schedule` is linked from the channel page programme block and the booking calendar, not from Radio. |
| Everyone | Discover | `/discover`, `/discover?tab=artists`, `/discover?tab=venues` | `/venues` redirects to the Venues tab. |
| Everyone | Favorites | `/favorites` | `/listen/favorites` and `/library/favorites` redirect here. |
| Everyone | Help | `/help`, `/help/$slug` | Signed-in users also see their support requests and replies. Articles reach `/status`, `/news`, `/whats-new`, legal pages and `/transparency`. `/help/governance` redirects to `/studio/governance?tab=guide`. |
| Everyone | Library | `/library`, `/library/sounds`, `/library/collections` (+ `/$slug`), `/library/recordings`, `/library/media`, `/library/stash`, `/library/embeds`, `/library/smartlinks`, `/library/local`, `/library/upload` | Independent of Studio's highlight. |
| Artist | Studio | `/studio`, `/studio/stats` (+ `/detail`), `/studio/insights` (+ `/$kind/$id`), `/studio/governance`, `/studio/updates`, `/studio/audience` (+ `?tab=tiers`), `/studio/stripe`, `/studio/releases` (+ `/$id`), `/studio/distribution`, `/studio/editor` (+ `/$id`), `/studio/mastering/$id`, `/studio/sounds` (+ `/$id`, `/$id/editor`), `/studio/collections` (+ `/$slug`), `/studio/playlists/$slug`, `/studio/branding` | Sounds, collections and branding have no submenu item; they are reached from Studio home, Library and in-page links, and Studio stays highlighted. |
| Artist | Broadcast | `/studio/go-live`, `/studio/schedule`, `/studio/events` (+ `/new`, `/$eventId/edit`), `/studio/shows` (+ `/$id`, `/episodes/$episodeId`), `/studio/channel` | Show detail carries visibility (Public / Fans only) and automatic episode numbering. 24/7 programme is on `/studio/schedule`. |
| Signed in | Settings | `/settings`, `/settings/$section`, `/account`, `/onboarding` | Modal + bookmarkable sections. `/themes` redirects here. `/sources` and `/sources/$id` redirect to Add-ons → Import. `/settings/audience`, `money`, `fan-subs`, `fan-tiers` redirect to `/studio/audience`. |
| Signed in | Messages (top bar) | `/messages`, `/messages/$id` | Artist and Moderator badges in the inbox and the popover. |
| Board | Admin | `/admin`, `/admin/logs`, `/admin/moderation` (+ `$tab`), `/admin/users`, `/admin/content`, `/admin/radio`, `/admin/news`, `/admin/streams`, `/admin/venues`, `/admin/top-lists`, `/admin/announcements`, `/admin/storage` (+ `/$userId`), `/admin/artwork-presets`, `/admin/financial`, `/admin/governance` (+ `$tab`), `/admin/grants/$year`, `/admin/addons`, `/admin/status`, `/admin/vendors`, `/admin/i18n`, `/admin/tahti-selects`, `/admin/orphan-pages` (+ `$tab`), `/admin/map` | Queue/detail routes stay contextual. |

## Intentional deep links and aliases

These routes are real but should not become extra top-level navigation items:

- `/chat`, `/chat/$slug`, `/feed`, `/listen/feed`, and `/listen/history` are
  contextual listening/community destinations. Channel pages open live chat
  at `/chat/$slug`.
- `/subscribe/$username`, `/u/$username/subscribe`, `/u/$username/green-room`,
  `/venues/register` and `/jam/$code` are action pages reached from their
  parent surface (a Jam starts from a collection's "Start a Jam").
- `/embed/*` routes are embeddable documents, not app navigation.
- `/login`, `/join`, `/apply`, `/signup`, `/signup/payment`, `/verify`,
  `/forgot-password`, `/reset-password`, and `/setup-password` are
  authentication flows (`/apply` and `/signup` redirect to `/join`).
- `/newsletter/confirmed`, `/newsletter/unsubscribed` and
  `/newsletter/unsubscribe/$token` are email landing pages.
- Compatibility or redirect routes: `/dashboard/*`, `/c/$slug`, `/listen`,
  `/history`, `/themes`, `/venues`, `/sources/*`, `/account`.
  `/more` is diagnostics-only.
- `/dashboard/*` resolves through `DASHBOARD_REDIRECTS` in
  `lib/prodPathRedirects.ts` - the path notification links, emails and old
  bookmarks use. `/dashboard` with no path goes to `/studio` for artists and
  `/feed` for listeners; return parameters (`?mixcloud=`, `?fanConnect=`,
  `?fansubs=`, `?membership=`, `?distribution=`, `?social=`) go through
  `lib/cutoverReturns.ts`. Unknown paths fall back to `/studio`.
- Admin aliases that redirect into an existing menu page: `/admin/activity` →
  logs; `/admin/beta`, `/admin/radio-submissions`, `/admin/support`,
  `/admin/content-reports`, `/admin/feature-requests`, `/admin/missed-shows`
  → moderation tabs; `/admin/reports`, `/admin/grants`, `/admin/agm` →
  governance tabs; `/admin/files` → storage `?tab=files`;
  `/admin/disco-widgets` → `/admin/addons`;
  `/admin/radio-station-suggestions` → orphan-pages tab.
- Studio aliases: `/studio/info` → go-live; `/studio/archive*` → sounds;
  `/studio/upload` → `/library/upload`; `/studio/stash` → `/library/stash`;
  `/studio/recordings` → `/library/recordings`; `/studio/playlists` →
  collections; `/studio/revenue` → audience; `/studio/venues` →
  `/admin/venues`; `/studio/moderation` → Settings → Channel;
  `/studio/channel?tab=design|profile` → Settings → Artist.
- `/library/releases` → `/studio/releases`; `/library/messages` →
  `/messages`; `/library/history` → `/listen/history`.

## Orphan pages (production, content-bearing, no chrome item)

Re-audited 2026-10-03 against `AppShell` / `StudioNav` / `AdminNav` /
`MobileChrome` and every `<Link>` / `navigate({ to })` in `src/` excluding
`mapScreens.ts` / `flowDiagrams.ts` / `MoreView` diagnostics.

| Route | Inbound from production UI? | Notes |
| --- | --- | --- |
| `/schedule` | Channel page programme block + booking calendar | Public programme page. Radio chrome does not link it. Distinct from `/studio/schedule` (Studio → Broadcast). |
| `/studio/distribution` | Studio Releases row + export add-on deep links | Not a submenu item; Releases stays highlighted on it. |
| `/studio/sounds` (+ `/$id`) | Studio home, Upload, Library Tracks | No StudioNav item; `SECTION_PREFIXES` keeps Studio highlighted. |
| `/studio/collections` (+ `/$slug`) | Studio home, Upload, Library Collections | Same pattern as Sounds. |
| `/studio/branding` | Settings → Artist → Branding shares the panel; old `/dashboard/channel/edit` | No StudioNav item. |
| `/search?tag=` | Tag chips on the track page only | Intentional: tag search is a drill-down, not a browse surface. |

Still gathered under **`/admin/orphan-pages`** (Admin → Manage): radio
station suggestions. `/admin/map` remains diagnostics-only (board QA), same
as `/more`.

Dead / not a content orphan:

- `/studio/setup-channel` - redirect helper, nothing links the exact path.
- `/studio/venues` redirects to admin (dead `StudioVenuesView` component removed 2026-09-11).

## Navigation gaps found

See [NAVIGATION-GAPS.md](NAVIGATION-GAPS.md) for the chrome-vs-inbound
mapping and redirect-target findings.

- No production navigation points to the diagnostics-only Tahti map (`/more`,
  `/admin/map`).
- Studio detail pages and Admin queue/detail pages are intentionally
  contextual.
- Public utility pages (`/status`, `/transparency*`, legal, `/whats-new`,
  `/news`) are reached from Help or parent pages, not from Listen chrome.
- Member governance is Settings → Account → Governance (`/governance`), not
  a listener sidebar item. Artists use Studio → Governance; board uses Admin
  → Governance.

The sitemap deliberately excludes `src/content/mapScreens.ts` internal
anchors: those links navigate within the diagnostics atlas and are not
application navigation.
