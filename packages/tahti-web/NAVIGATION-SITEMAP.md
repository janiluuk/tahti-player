# Tahti Player navigation sitemap

Updated 2026-09-07 from `src/router.tsx`, `AppShell.tsx`, `StudioNav.tsx`,
`AdminNav.tsx`, and `MobileChrome.tsx`. Atlas PNGs recaptured the same day.
This is the navigation audit source of truth for the Nuclear client.
Persistent chrome is listed separately from routes that exist but are
only reached contextually, so an orphan is not mistaken for a missing
feature.

**2026-09-07 changes:** Library is now fully decoupled from Studio's
primary nav (`StudioNav`'s `SECTION_PREFIXES['/studio']` no longer
claims any `/library*` path — Library highlights independently, Studio
does not light up on Library routes). Library's tab strip now covers
Smart links directly, so `/library/smartlinks` is no longer an orphan.
Corrected two stale claims that predated this audit date: Perform's nav
label is **Perform**, not "Broadcast" (that rename is queued, not
shipped — see `docs/todo/studio-nav-perform-to-broadcast.md`), and
Studio's submenu never had Library/Sounds/Collections/Upload items or a
separate Multicast item.

On ordinary app surfaces the chrome in this table must stay on screen at
every moment (including route transitions). It may disappear only on
surfaces that take over the window: full-screen player, public
release/share canvases, and maximized workspaces such as the audio
editor. See root `AGENTS.md` → Persistent chrome visibility.

## Persistent chrome (what a user can click)

| Audience | Chrome entry | Where | Lands on |
| --- | --- | --- | --- |
| Everyone | Listen | Desktop sidebar, mobile drawer, mobile bottom | `/` |
| Everyone | Radio | Desktop sidebar, mobile drawer, mobile bottom | `/radio` |
| Everyone | Discover | Desktop sidebar, mobile drawer, mobile bottom | `/discover` |
| Everyone | Favorites | Desktop sidebar, mobile drawer | `/favorites` |
| Everyone | Help center | Desktop sidebar (with Settings), mobile drawer | `/help` |
| Everyone | Settings | Desktop sidebar / mobile drawer (opens modal) | `ConnectedSettingsModal`; bookmarkable `/settings/$section` |
| Signed in | Library | Studio horizontal tab + mobile bottom | `/library` |
| Signed in | Studio | Desktop sidebar, mobile drawer, mobile bottom | `/studio` |
| Signed in | Perform | Studio primary (`StudioMainNavItems`) | `/studio/go-live` |
| Board | Admin | Desktop sidebar, mobile drawer (when diagnostics enabled) | `/admin` |

Studio section menus (`StudioNav` submenu):

- Studio: Overview, Branding, Stats, Governance, Posts, Audience, Stripe (when configured), Releases, Editor
- Perform: Go live, Schedule, Events, Shows, Channel, Radio (Multicast is a Radio tab within Channel, not its own submenu item)

Admin section menus (`AdminNav`): Dashboard, Logs, Moderation, Users,
Content, Radio, News, Streams, Venues, Top lists, Announcements, Storage,
Artwork presets, Financial, Governance, Annual reports, Grants, AGM, Disco
widgets, Status, Vendors, i18n, Tahti Selects, Orphan pages.

Mobile bottom nav is Listen / Radio / Discover / Library / Studio only.
Help and Settings are drawer-only on phones. Favorites is not on the
bottom bar.

Signed-in desktop right rail tabs: Chat, Notifications, Queue, Library
(local session files). Library is hidden on the mobile rail drawer.

## Routes those chrome entries cover

| Audience | Navigation entry | Routes covered | Notes |
| --- | --- | --- | --- |
| Everyone | Listen | `/`, `/listen`, `/channel/$slug`, `/u/$username`, `/u/$username/c/$slug`, `/r/$slug`, `/t/$id` | Public playback destinations. `/feed` and `/listen/feed` / `/listen/history` are contextual from Listen, not chrome items. |
| Everyone | Radio | `/radio`, `/radio/show/$channelSlug` | `/schedule` is **not** a Radio chrome item (see orphans). |
| Everyone | Discover | `/discover`, `/discover?tab=artists`, `/discover?tab=venues` | Artists and venues are Discover subtabs. |
| Everyone | Favorites | `/favorites` | `/listen/favorites` and `/library/favorites` redirect here. |
| Everyone | Help | `/help`, `/help/$slug` | Sidebar / drawer. Articles also reach `/status`, `/news`, `/whats-new`, legal pages, and `/transparency`. |
| Signed in | Library | `/library`, `/library/sounds`, `/library/collections` (+ `?tab=` recordings/media/stash/embeds), `/library/smartlinks`, `/library/local`, `/library/upload` | Library's own tab strip (`LIBRARY_SECTION_TABS`): Overview, Sounds, Collections, Recordings, Media, Stash, Embeds, Smart links, Local files. Independent of Studio's primary nav since 2026-09-07 (`StudioNav`'s `SECTION_PREFIXES['/studio']` no longer claims `/library*`) — Library highlights on its own, Studio does not light up on Library routes. Mobile bottom nav still has Library. |
| Artist | Studio | `/studio`, `/studio/branding`, `/studio/stats`, `/studio/governance`, `/studio/updates`, `/studio/revenue`, `/studio/stripe`, `/studio/releases`, `/studio/editor` | Stripe submenu only when `stripeConfigured`. Does **not** cover `/library*` (see Library row above). |
| Artist | Perform | `/studio/go-live`, `/studio/schedule`, `/studio/events`, `/studio/shows`, `/studio/shows/$id`, `/studio/channel` | Nav label is **Perform**, not Broadcast — no chrome item currently reads "Broadcast" (a Studio→Broadcast rename is queued, see `docs/todo/studio-nav-perform-to-broadcast.md`). Multicast is a Channel→Radio tab, not a separate submenu item. 24/7 programme is on `/studio/schedule`. |
| Signed in | Settings | `/settings`, `/settings/$section`, `/account`, `/onboarding` | Modal + bookmarkable sections. `/themes` redirects here. `/sources` and `/sources/$id` redirect to Add-ons → Import. |
| Board | Admin | `/admin`, `/admin/logs`, `/admin/moderation` (+ `$tab`), `/admin/users`, `/admin/content`, `/admin/radio`, `/admin/news`, `/admin/streams`, `/admin/venues`, `/admin/top-lists`, `/admin/announcements`, `/admin/storage`, `/admin/artwork-presets`, `/admin/financial`, `/admin/governance`, `/admin/reports`, `/admin/grants`, `/admin/agm`, `/admin/disco-widgets`, `/admin/status`, `/admin/vendors`, `/admin/i18n`, `/admin/tahti-selects`, `/admin/orphan-pages` | Queue/detail routes stay contextual. |

## Intentional deep links and aliases

These routes are real but should not become extra top-level navigation items:

- `/chat`, `/chat/$slug`, `/feed`, `/listen/feed`, and `/listen/history` are
  contextual listening/community destinations.
- `/subscribe/$username`, `/u/$username/subscribe`, `/u/$username/green-room`,
  and `/venues/register` are action pages reached from their parent surface.
- `/embed/*` routes are embeddable documents, not app navigation.
- `/login`, `/join`, `/apply`, `/signup`, `/signup/payment`, `/verify`,
  `/forgot-password`, `/reset-password`, and `/setup-password` are
  authentication flows.
- `/dashboard/*`, `/c/$slug`, `/favorites`, `/history`, `/themes`,
  `/sources/*`, and `/more` are compatibility or redirect routes.
- Admin aliases that redirect into an existing menu page: `/admin/activity` →
  logs; `/admin/beta`, `/admin/radio-submissions`, `/admin/support`,
  `/admin/content-reports`, `/admin/feature-requests`, `/admin/missed-shows`
  → moderation tabs; `/admin/files` → storage `?tab=files`;
  `/admin/radio-station-suggestions` → orphan-pages tab.
- `/studio/archive*` and `/studio/upload` redirect into sounds / library
  upload. `/studio/venues` redirects to `/admin/venues`. `/studio/moderation`
  redirects to Settings → Channel. `/studio/playlists*` aliases collections.

## Orphan pages (production, content-bearing, no chrome item)

Audited 2026-09-03 against `AppShell` / `StudioNav` / `AdminNav` /
`MobileChrome` and every `<Link>` / `navigate({ to })` in `src/` excluding
`mapScreens.ts` / `flowDiagrams.ts` / `MoreView` diagnostics.

| Route | Inbound from production UI? | Notes |
| --- | --- | --- |
| `/venues` | Only venue detail, venue register, and the diagnostics atlas | Sitemap previously listed it under Listen chrome. It is **not** in the sidebar, drawer, or mobile bottom nav. |
| `/schedule` | Booking calendar + schedule dialog only | Public programme page. Radio chrome does not link it. Distinct from `/studio/schedule` (Studio Perform). Listed as a compatibility route historically; the page is real. |
| `/studio/distribution` | Studio Releases row + export add-on deep links | Not a StudioNav submenu item. `SECTION_PREFIXES` still highlights Studio (not Library — the two are fully decoupled since 2026-09-07). |
| `/studio/stash` | Library collections tab `?tab=stash` (embedded) | Dedicated `/studio/stash` has no submenu entry. Direct visits highlight Studio via `SECTION_PREFIXES`, not Library. |
| `/jam/$code` | None in app chrome | Join-by-code surface; atlas-only besides the route itself. |

Still gathered under **`/admin/orphan-pages`** (Admin → Manage): radio
station suggestions. `/admin/map` remains diagnostics-only (board QA), same
as `/more`.

Dead / not a content orphan:

- `/studio/setup-channel` — redirect helper, nothing links the exact path.
- `StudioVenuesView.tsx` — unmounted; `/studio/venues` redirects to admin.

## Navigation gaps found

See [NAVIGATION-GAPS.md](NAVIGATION-GAPS.md) for the chrome-vs-inbound
mapping (2026-09-03) and the earlier atlas-diagram findings.

- No production navigation points to the diagnostics-only Tahti map (`/more`,
  `/admin/map`).
- Studio detail pages and Admin queue/detail pages are intentionally
  contextual.
- Favorites live at `/favorites` (sidebar). `/listen/favorites` and
  `/library/favorites` redirect there. Library no longer has a left-side
  favorites panel. Artists browse under Discover → Artists.
- Public utility pages (`/status`, `/transparency*`, legal, `/whats-new`,
  `/news`) are reached from Help or parent pages, not from Listen chrome.
- Member governance is Settings → Account → Governance (`/governance`), not
  a listener sidebar item. Artists use Studio → Governance; board uses Admin
  → Governance / AGM.

The sitemap deliberately excludes `src/content/mapScreens.ts` internal
anchors: those links navigate within the diagnostics atlas and are not
application navigation.
