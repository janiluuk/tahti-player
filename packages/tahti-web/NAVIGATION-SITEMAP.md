# Tahti Player navigation sitemap

Updated 2026-11-17 from `src/router/routes-*.tsx`, `AppShell.tsx`,
`StudioNav.tsx`, `AdminNav.tsx`, `MobileChrome.tsx`, `LibraryView.tsx`,
`views/settings/settingsNav.ts` and `lib/prodPathRedirects.ts`. This is the
navigation audit source of truth for the Nuclear client. Persistent chrome
is listed separately from routes that exist but are only reached
contextually, so an orphan is not mistaken for a missing feature. The
`/more` atlas mirrors this file in `src/content/flowDiagrams.ts` (Nuclear
pack) and `src/content/mapScreens.ts`.

**2026-11-17 changes:** Admin Overview is one page (Status and Monitoring
redirect into `/admin`); Inbox chips show pending counts; Settings folds
Integrations under Playback & language (`/settings/integrations` still
opens that tab). Library Files chips and Studio Profile forms stay as
shipped 2026-11-16.

**2026-11-16 changes:** Library is Favorites · History · Following · Files;
Files puts Media, Stash and (desktop) Local behind chips. Studio → Profile
forms are `/studio/profile/$section`. Settings is account-only (no Artist /
Channel / Broadcast for a channel owner).

**2026-11-13 changes:** The artist catalog is Studio → Music: chips Releases ·
Tracks (`/studio/sounds`) · Collections · Distribution · Editor · Groups;
Upload and Smart links under Music; Recordings a Broadcast hub card. Old
`/library/…` catalog links redirect.

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
| Everyone | Library | Desktop sidebar, mobile More drawer | `/library` (Favorites) |
| Artists / board | Studio | Desktop sidebar; mobile bottom bar | `/studio` |
| Members / board | Co-op | Desktop sidebar | `/governance` |
| Board | Admin | Desktop sidebar | `/admin` |
| Everyone | Help center | Desktop sidebar footer, mobile More drawer | `/help` |
| Everyone | Settings | Desktop sidebar footer, mobile More drawer (opens modal) | `ConnectedSettingsModal`; bookmarkable `/settings/$section` |
| Signed in | Notifications, Messages | Top bar popovers | Notification links go through `/dashboard/*` redirects; messages open `/messages/$id` |

Studio row (`StudioNav` `SUBMENUS['/studio']`): **Home · Music · Broadcast ·
Fans · Stats · Profile**.

- Music chips (`CatalogSubNav`): Releases · Tracks · Collections ·
  Distribution · Editor · Groups. Upload keeps Tracks lit; Smart links opens
  from the Releases header.
- Broadcast hub (`/studio/broadcast`): on/off-air banner, Coming up agenda
  with chips All · Shows · Events · Parties, cards for Go live, Schedule,
  24/7, Recordings, Tahti Radio. Go live as a full-screen flow is still open
  work.
- Fans hub: Posts · Newsletter · Memberships · Store · Earnings (back links).
- Profile hub: cards → `/studio/profile/$section` (Identity, Story, People,
  Links, Branding, Gallery, Press kit, Release visuals, Channel design,
  Discovery, Address and domain). Chat and Moderators live under Fans.

Library tabs (`LibraryView`): **Favorites · History · Following · Files**.
Files (`/library/files?kind=`) shows Media, Stash and Local files as chips.
**Local files** is a chip only when the desktop app provides the on-disk
library. Playlists as a Library tab is still open product work.

Settings modal sections (`settingsNav`) are account-only: Account, Security,
Notifications, Profile (only for an account without a channel), Playback &
language (tabs Playback · Language · Integrations); Themes, Add-ons, What's
new (group "App"). Signed
out, only Playback, Themes, Add-ons and What's new show. An artist's
profile, channel and broadcast forms are Studio pages;
`/settings/artist?tab=…` (for a channel owner), `/settings/channel?tab=…`
and `/settings/broadcast?tab=…` redirect there.
`/settings/integrations` and `/settings/language` open Playback & language
on the matching tab. An unknown `$section` opens Account.

Admin sections (`ADMIN_SECTIONS`): **Overview · Inbox · People · Content ·
Co-op · Platform**.

- Overview: one page at `/admin` (health, queues, community stats, Grafana).
  `/admin/status` and `/admin/monitoring` redirect there with hash anchors.
- Inbox: `/admin/moderation` with queue chips (support, beta, radio, reports,
  features, missed shows, themes); Support opens tickets in a side panel.
- People: Users.
- Content hub (`/admin/hubs/content`): News, Announcements, Selects, Top
  lists, Radio, Venues, Artwork presets, Catalog.
- Co-op hub (`/admin/hubs/coop`): Governance, Financial, Grants.
- Platform hub (`/admin/hubs/platform`): Add-ons, Languages, Vendors, Storage,
  Streams, Logs, Orphan pages, Map.

Admin tabbed pages: Governance (`/admin/governance/$tab`) and Moderation
queue chips on `/admin/moderation`.

Mobile bottom nav is Listen / Discover / Radio, plus Studio (a real tab for
artist and board accounts, grayed when signed out), plus a More button that
opens the drawer. Library, Help, Co-op and Settings are in the drawer.
Favorites is a Library tab, not a drawer item.

Desktop right rail: Queue only.

## Routes those chrome entries cover

| Audience | Navigation entry | Routes covered | Notes |
| --- | --- | --- | --- |
| Everyone | Listen | `/`, `/channel/$slug`, `/u/$username`, `/u/$username/c/$slug`, `/r/$slug`, `/t/$id`, `/search?tag=`, `/v/$slug` | Public playback destinations. `/feed`, `/listen/feed` and `/listen/history` are contextual from Listen, not chrome items. |
| Everyone | Radio | `/radio`, `/radio/show/$channelSlug`, `/radio/station/$stationId` | `/schedule` is linked from the channel page programme block and the booking calendar, not from Radio. |
| Everyone | Discover | `/discover` (+ `?tab=artists`, `venues`, `parties`, `feed`) | `/venues` redirects to the Venues tab. |
| Everyone | Library | `/library` (→ Favorites), `/library/favorites`, `/library/history`, `/library/following`, `/library/files`; `/library/media`, `/library/stash`, `/library/local` redirect to Files | Opening Library or Favorites does not ask for sign-in. Other tabs stay visible and grayed until there is an account. |
| Everyone | Help | `/help`, `/help/$slug` | Articles reach `/status`, `/news`, `/whats-new`, legal pages and `/transparency`. |
| Artist | Studio | `/studio`, Music catalog under `/studio/sounds|collections|releases|…`, Broadcast hub and children, Fans hub and children, `/studio/stats`, `/studio/profile` (+ `/$section`) | Detail pages swap the section row for a back link. |
| Members | Co-op | `/governance` (+ motion/meeting detail) | Was Studio → Governance. |
| Signed in | Settings | `/settings`, `/settings/$section`, `/account`, `/onboarding` | Modal + bookmarkable sections. `/themes` redirects here. `/settings/plugin-store?category=themes` opens Themes. |
| Board | Admin | `/admin`, hubs, `/admin/moderation`, `/admin/users`, content/platform tools, `/admin/governance` (+ `$tab`), `/admin/grants/$year` | Queue/detail routes stay contextual. |

## Intentional deep links and aliases

These routes are real but should not become extra top-level navigation items:

- `/chat`, `/chat/$slug`, `/feed`, `/listen/feed`, and `/listen/history` are
  contextual listening/community destinations.
- `/subscribe/$username`, `/u/$username/subscribe`, `/u/$username/green-room`,
  `/venues/register` and `/jam/$code` are action pages reached from their
  parent surface.
- `/embed/*` routes are embeddable documents, not app navigation.
- Auth flows: `/login`, `/join`, `/verify`, `/forgot-password`,
  `/reset-password`, `/setup-password` (`/apply` and `/signup` redirect to
  `/join`).
- Compatibility or redirect routes: `/dashboard/*`, `/c/$slug`, `/listen`,
  `/history`, `/themes`, `/venues`, `/sources/*`, `/account`. `/more` is
  diagnostics-only.
- Admin aliases: `/admin/status`, `/admin/monitoring` → `/admin#…`;
  `/admin/activity` → logs; moderation and governance tab aliases as before;
  `/admin/disco-widgets` → `/admin/addons`.
- Studio aliases: `/studio/info` → go-live; `/studio/archive*` → sounds;
  `/studio/stash` → `/library/files?kind=stash`; `/studio/channel?tab=selects`
  → `/admin/tahti-selects`; branding/profile tabs → `/studio/profile/$section`.
- Library catalog aliases: `/library/sounds|collections|upload|smartlinks|…`
  → Studio Music / Broadcast as before.

## Orphan pages (production, content-bearing, no chrome item)

| Route | Inbound from production UI? | Notes |
| --- | --- | --- |
| `/schedule` | Channel page programme block + booking calendar | Public programme page. Distinct from `/studio/schedule`. |
| `/studio/distribution` | Studio Releases row + export add-on deep links | Not a Music chip; Releases stays highlighted. |
| `/search?tag=` | Tag chips on the track page only | Intentional drill-down. |

Still gathered under **`/admin/orphan-pages`**: radio station suggestions.
`/admin/map` remains diagnostics-only (board QA), same as `/more`.

## Navigation gaps found

See [NAVIGATION-GAPS.md](NAVIGATION-GAPS.md) for the chrome-vs-inbound
mapping and redirect-target findings.

- No production navigation points to the diagnostics-only Tahti map (`/more`,
  `/admin/map`).
- Studio detail pages and Admin queue/detail pages are intentionally
  contextual.
- Public utility pages (`/status`, `/transparency*`, legal, `/whats-new`,
  `/news`) are reached from Help or parent pages, not from Listen chrome.
- Member governance is the Co-op sidebar item (`/governance`); board uses
  Admin → Co-op.

The sitemap deliberately excludes `src/content/mapScreens.ts` internal
anchors: those links navigate within the diagnostics atlas and are not
application navigation.
