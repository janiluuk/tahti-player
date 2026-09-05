# Feature port checklist — prod Tahti → `@tahti-player/tahti-web`

Track what has been ported from `apps/web` into the Nuclear listen/studio POC.

> **Open work:** unfinished items live in [`WORKPLAN.md`](WORKPLAN.md) and [`docs/todo/INDEX.md`](../../docs/todo/INDEX.md). Shipped rows stay here as the product matrix — do not copy them into WORKPLAN.


**Status**

| Tag | Meaning |
|-----|---------|
| `live-api` | Real API path; production build does **not** silent-mock on failure |
| `mock-ok` | Works offline under `VITE_FORCE_MOCK=1` |
| `partial` | UI or API incomplete vs prod |
| `missing` | Not in POC |
| `link-out` | Deep-links to production `tahti.live` |
| `out-of-scope` | Explicitly not rebuilding (marketing `website/`, desktop-only MCP, etc.) |

**Demock wave** — next items to harden against live `api.tahti.live` / beta:

- [x] Wave 0: mock session (auth/follow/subscribe/sources) for offline demo — [MOCKS.md](MOCKS.md)
- [x] Wave 1: stop silent mock fallback in **production** builds (`api/mode.ts`); chat WS defaults to `wss://chat.tahti.live`
- [x] Wave 2: Go Live / broadcast — prod builds no silent mock for stream-settings / signal / RTMP (`broadcast.ts`)
- [x] Wave 3: Upload + archive — prod builds no silent mock archive seed; upload still prepare→PUT→complete on live API (`studio.ts`)
- [x] Wave 4: Fan subscribe Stripe checkout + Connect portal/onboard (`client.ts` subscribe, `revenue.ts`)
- [x] Wave 5: DMs + governance — prod builds no silent mock inbox; vote/comments already live (`messages.ts`, governance in `client.ts`)
- [x] Wave 6: Channel WebGL visualizer parity (POC canvas/WebGL on ChannelView; full Three.js presets still optional)

**Product priority** (shipped):

1. [x] Album-based designer — `/studio/collections` create + cover/style/tracklist designer
2. [x] Add-to-playlist — player bar + archive + track tables → `/api/me/collections`
3. [x] Visualizations — ChannelView WebGL/canvas visualizer + shared analyser
4. [x] Broadcasting wizard — Connect → Live → Multistream step chrome
5. [x] Email verify route — `/verify` (+ join deep-link)
6. [x] Fan-sub tier editor — Settings → Money → Fan tiers (`/api/me/fan-tiers`)

## Checklist — shipped vs remaining

**Shipped (beta)**

- [x] Listen directory, channel HLS, archive, radio, profile, collections, smart links
- [x] Auth login / TOTP / register / logout
- [x] Email verify page (`/verify`)
- [x] Follows, favorites/history (local), fan subscribe checkout, DMs, governance
- [x] Add to playlist
- [x] Studio: Go Live dashboard, upload, releases, collections/album designer; all music lives first in My Library
- [x] Studio: Broadcast (`/studio/schedule`, nav label Broadcast) with 24/7 programme on the page, stats summary, channel design, updates, revenue/Connect
- [x] Channel visualizer POC + analyser
- [x] Fan tier create / activate-deactivate
- [x] Settings shell (Nuclear sections), Sources hub (partial OAuth UX)
- [x] Embeds
- [x] Artist Branding workspace: profile picture, channel outlook, gallery visibility, fullscreen slideshow, and 10-image press kit selection

**Remaining / partial** — short copy: [`FEATURES-REMAINING.md`](FEATURES-REMAINING.md) (open only; shipped rows in HISTORY)

- [ ] Multitrack timeline editing — confirmed greenfield (no track array/timeline model anywhere), a multi-day build needing a rendering-architecture decision first, not a slice. Press-kit gallery is done (see above); member invites checked and mostly already covered — adding a moderator by existing username is live-API at `/studio/moderation`. A true email-invite-for-non-account-holders flow is a separate, larger feature with no backing API; deferred, not clearly needed.
- [ ] Production cutover for `apps/web`
- [ ] À la carte track purchase (public track page is Download, not Buy) — live Stripe path exists; Buy UX on public track still incomplete

## 1. Anonymous listen

| Feature | Prod | POC | Status | Notes |
|---------|------|-----|--------|-------|
| Listen directory | `/listen` | `/` | `live-api` | `GET /api/v1/channels/directory` |
| Channel live + HLS | `/c/:slug` | `/channel/$slug` | `live-api` | visualizer stage on Live tab |
| Channel archive | `/c/:slug` | `/channel/$slug` | `live-api` | listen-events after ~15s |
| Channel chat | `/c/:slug` | rail + `/chat/$slug` | `live-api` | REST + Centrifugo WS; hCaptcha on anonymous join; reactions; subscriber-only gating |
| Tahti Radio | `/radio` | `/radio` | `live-api` | |
| Artist profile | `/u/:username` | `/u/$username` | `live-api` | Music tab: pinned tracks (max 4) above catalog; Stage pins via `PATCH /api/me/archive/:id` `{ pinned }` |
| Collection | `/u/:user/c/:slug` | `/u/$username/c/$slug` | `live-api` | |
| Smart link | `/r/:slug` | `/r/$slug` | `live-api` | |
| Venues list | `/venues` | `/venues` | `partial` | list only |
| Venue register | `/venues/register` | `/venues/register` | `live-api` | `POST /api/v1/venues`; board verifies |
| Transparency | `/transparency` | `/transparency` | `live-api` | |
| Help | `/help/*` | `/help` | `live-api` | static articles including disco-widgets; support form posts to API |
| Disco-widgets | discovery settings + listen/profile | Settings → Add-ons + Listen/channel | `live-api` | sandboxed iframe; admin catalog stays Next |
| Legal / about | `/about`… | same | `partial` | POC + prod links |
| Platform status | `/status` | `/status` | `live-api` | |
| Marketing home / apply | `/`, `/apply` | — | `missing` | listen hub is home |
| VOD seek | player | PlayerBar | `live-api` | |

## 2. Auth / account

| Feature | Prod | POC | Status | Notes |
|---------|------|-----|--------|-------|
| Login + session | `/login` | `/login` | `live-api` | cookies via `/tahti-api` |
| TOTP | `/login` | `/login` | `live-api` | |
| Register | `/join` | `/join` | `live-api` | |
| Email verify | `/verify` | `/verify` (+ join) | `live-api` | auto-verify from `?token=` |
| Membership purchase | `/signup/payment` | `/signup/payment` | `live-api` | Stripe checkout; mock instant-activate under FORCE_MOCK |
| Logout / `/me` | session | store | `live-api` | |
| Password setup (invite link) | `/setup-password?token=` | `/setup-password` | `live-api` | one-time token sets initial password (no logged-in "change password" exists in prod — TOTP is the only account security setting) |

## 3. Logged-in listener

| Feature | Prod | POC | Status | Notes |
|---------|------|-----|--------|-------|
| Follow / following | profile | `/favorites` | `live-api` | |
| Local favorites / history | — | `/favorites`, `/listen/history` | `partial` | localStorage + follows |
| Add to playlist | mini-player / archive | player bar + Music + tables | `live-api` | create playlist + add archive item |
| Fan subscribe | `/u/:user/subscribe` | `/subscribe/$username` | `live-api` | demock wave 4; mock activates only under FORCE_MOCK |
| My subscriptions | account | `/settings/money` | `live-api` | |
| Membership status | account | `/settings/account` | `live-api` | |
| Governance list/vote | `/governance` | `/governance` | `live-api` | demock wave 5; 401/403 → forbidden empty |
| DMs | `/dashboard/messages` | `/messages` | `live-api` | demock wave 5 |
| Listener-only dashboard | `/dashboard` | `/dashboard` → `/library` | `live-api` | non-artists no longer hit the Studio "create a channel" wall |

## 4. Artist studio

| Feature | Prod | POC | Status | Notes |
|---------|------|-----|--------|-------|
| Studio home | `/dashboard` | `/studio` | `live-api` | |
| Channel setup and design | `/dashboard/setup-channel` | `/studio/channel?tab=setup` | `live-api` | `POST /api/me/channel/provision`; setup continues into the shared channel workspace |
| Go Live | `/dashboard/broadcast` | `/studio/go-live` | `live-api` | broadcast wizard steps; simulator only under FORCE_MOCK |
| Multistream RTMP | broadcast | go-live tab | `live-api` | |
| Archive / Music | `/dashboard/archive` | `/studio/archive` | `live-api` | |
| Upload | `/dashboard/upload` | `/studio/upload` | `live-api` | prepare→PUT→complete; demock wave 3 |
| Pro editor | `/dashboard/editor` | `/studio/editor` | `partial` | |
| Releases / collections | `/dashboard/releases`… | `/studio/releases`… | `live-api` | album designer on collections |
| Schedule / programme | schedule + channel playlist | `/studio/schedule` (UI: Broadcast), `/studio/channel` | `live-api` | Page title and Studio nav say Broadcast. 24/7 playlist source, playback settings, and active rotation sit on the Broadcast page and on Channel → Radio. |
| Stats | `/dashboard/stats` | `/studio/stats` | `live-api` | summary + `/studio/stats/detail` range-chip detail page |
| Channel design | channel/edit | `/channel/$slug?edit=1` + `/studio/channel` | `partial` | Inline Edit design: presets, layers drag/hide/add; layout localStorage; look via API |
| Updates / newsletter | posts | `/studio/updates` | `live-api` | |
| Revenue / Connect | revenue | `/studio/revenue` | `live-api` | demock wave 4; onboard/portal redirect to Stripe |
| Stash | `/dashboard/stash` | `/studio/stash` | `live-api` | upload/delete + mock |
| Sound share links | none (no prod equivalent) | `TrackEditDialog` → Sharing tab (PRIVATE/STASH only) | `partial` | Client + mock complete (`SoundShareLinksSection.tsx`, `api/studio.ts`); backend route and the audit-log-only interaction guarantee don't exist yet — see `docs/API-REFERENCE.md`'s Proposed contract section |
| Distribution | `/dashboard/distribution` | `/studio/distribution` | `live-api` | catalog, Revelator pay+submit, Spotify profile, royalties |
| Radio slots / Shows | `/dashboard/tahti-radio-slots` | `/studio/shows` | `live-api` | bookings, series, and episodes all live-API |
| Channel moderators | `/dashboard/moderate/:slug` | `/studio/moderation` | `live-api` | |

## 5. Settings / sources

| Feature | Prod | POC | Status | Notes |
|---------|------|-----|--------|-------|
| Settings shell | `/dashboard/settings/*` | `/settings` | `partial` | Nuclear sections |
| Artist / discovery / domain | settings | sections | `live-api` | |
| Notifications / social | settings | sections | `live-api` | |
| Themes | — | `/settings/themes` | `mock-ok` | Nuclear presets |
| Fan-sub tier editor | fan-subs settings | Settings → Money → Fan tiers | `live-api` | create + activate/deactivate |
| Sources hub | import | `/sources` | `partial` | |
| OAuth connect | OAuth start | Sources | `partial` | live href; mock in-app connect |
| SoundCloud / Spotify import | import | Sources | `live-api` | |

## 6. Embeds / misc

| Feature | Prod | POC | Status | Notes |
|---------|------|-----|--------|-------|
| Embeds c/r/col | `/embed/*` | `/embed/*` | `live-api` | |
| Feature map | — | `/more` | `mock-ok` | checklist + flow diagrams |
| Screen atlas | e2e screenshots | `/more` (Screen atlas) | `mock-ok` | curated prod PNGs under `public/map/` + Nuclear routes |
| Board admin | `/admin/*` (~35 pages Next) | `/admin/*` (22 pages) | `partial` | Gated on `user.isBoard`; wired to real admin API endpoints (`api/admin.ts`). Deliberately scope-trimmed: no Users/Support/Announcement-clip detail pages, no bulk file ops (Files), no per-subscriber payout retry / legacy-member migration (Financial), no grant run/preview flow (Grants) — see UI-REDESIGN-WORKLOG.md admin entries A3/A9/A11–A13/A15/A18 |
| WebGL visualizer | channel page | ChannelView Live | `live-api` | full ten-preset Three.js catalog; analyser-reactive and lazy-loaded |

## 7. Desktop Nuclear integrations (not web SPA)

| Feature | Upstream Nuclear | This fork | Status | Notes |
|---------|------------------|-----------|--------|-------|
| MCP server (Streamable HTTP) | Tauri `packages/player` MCP | same paths | **complete / as-is** | Byte-identical to sibling `nuclear` checkout; Settings → Integrations in **desktop player**; see [`docs/MCP.md`](docs/MCP.md) |
| MCP tool meta | `@tahti-player/plugin-sdk/mcp` | same | **complete / as-is** | |
| MPD / Nuclear Jam HTTP | Tauri player | present in player | desktop-only | Not ported to beta SPA (same as upstream) |

Web cutover (`beta.tahti.live`) does **not** host Nuclear MCP — localhost player control plane. Do not strip `packages/player/src-tauri/src/mcp/` when packaging desktop.

---

## How to verify live (not mock)

```bash
# Dev against local or proxied API (no FORCE_MOCK)
unset VITE_FORCE_MOCK
pnpm --filter @tahti-player/tahti-web dev

# Optional: refuse mock fallback even in dev
VITE_ALLOW_MOCK_FALLBACK=0 pnpm --filter @tahti-player/tahti-web dev

# Beta build (prod mode → no silent mock fallback)
pnpm deploy:tahti-beta
# then https://beta.tahti.live — login with a real Tahti account
```

Update this file when a row moves from `partial` → `live-api` or a demock wave completes.

## 2026-08-23 route and capability sweep

Compared the current `apps/web/src/app/**/page.tsx` tree in the Tahti repository with the Nuclear SPA router and the implemented views. Existing capabilities with broken legacy navigation were fixed in `prodPathRedirects.ts`: Distribution, Events, Embeds, Recordings, artist Venues, Posts, broadcast recordings, archive editor deep links, track Insights, collection creation, and the matching Artist/Broadcast/Connections/Moderation settings destinations now resolve to their in-app surfaces.

### Missing user-facing surfaces

- [x] Public venue detail (`/v/:slug`) — `VenueDetailView` built from the existing venue directory list; `VenuesView` links each card to it in-app instead of out to `tahti.live`.
- [x] Transparency methodology (`/transparency/methodology`) — `TransparencyMethodologyView` ports prod's static methodology copy (categories, grant formula, data pipeline, public API); linked from the dashboard header.
- [x] Public/member feature requests (`/governance/feature-requests`) — `FeatureRequestsView` against the real member-gated `GET/POST /api/v1/governance/feature-requests` (+ vote/comment sub-routes); propose, upvote, discuss, same member gate as `/governance` motions. Distinct from the pre-existing admin-only `/admin/feature-requests` review queue.
- [ ] Upload job detail (`/dashboard/upload/:uploadId`) — upload works, but processing state has no durable detail route after navigation or refresh.
- [ ] Signup profile and broadcaster-intake step parity (`/signup/profile`, `/signup/broadcast`) — join and membership checkout exist, but these guided steps are consolidated rather than preserved as addressable routes.

### Partial functionality

- [x] Support (`/help/support`) — `SupportContactForm` posts to the real `POST /api/support/contact` (auth-optional, category enum, prod's own rate-limited endpoint); category/subject/message match prod's form exactly.
- [x] ~~Public venue governance (`/governance/venues`)~~ — not actually a gap. Checked prod (`apps/web/src/app/governance/venues/page.tsx`): it's board-only ("Venue verification"), same as this POC's `/studio/venues`/admin tooling. Prod has no member-facing venue governance route to port.
- [x] Direct-message thread URLs — new `/messages/$id` route; opening a conversation now navigates there so refresh/share preserves it.
- [ ] Admin detail operations remain intentionally reduced: user/support/announcement detail, bulk file operations, per-subscriber payout retry, legacy-member migration, grant preview/run, and governance report/resolution/audit tools.
- [ ] Pro editor remains shallower than Tahti's full ffmpeg/multitrack workflow; a true multitrack timeline still needs a rendering and persistence design.
- [x] Dynamic SEO/OG parity for artist, channel, and release pages — client-side sync on real data resolve (`src/lib/seo.ts`) plus a bot-facing `/api/og/*` proxy (see SEO-OG-NOTES.md). Collection and venue pages now sync client-side metadata after fetch; they still have no dedicated bot OG routes.

## 2026-08-25 tahti-org sweep

Compared `tahti-org` (apps/web + recent API) with this SPA. Ported in this pass:

- [x] Disco-widgets (listener + artist store, sandboxed iframe, Listen/channel/profile render). Admin catalog stays on Next `/admin/disco-widgets`.
- [x] Sticky must-dismiss notifications (theme review lifecycle).
- [x] Listen artist directory: `isActive` badges, Active-now filter, active-first sort.
- [x] Join form: Solo / Collective toggle and “Collective name” label (kind is applied at onboarding).
- [x] Collection and venue client-side SEO sync.

Still not ported (do not block cutover unless noted):

- [x] Integrations marketplace credentials (`/api/me/integrations`) — ListenBrainz + Last.fm **SCROBBLE** are live (Add-ons → Scrobbling). Sources OAuth and fingerprint plugins remain separate. Chart dashboards / OmniSource still planned.
- [ ] Theme editor public-submit / GitHub PR pipeline — local Nuclear themes only.
- [ ] Internet Radio personal library (`/api/me/internet-radio`) — this client has a local catalog + Radio Browser search, not the server-side station library.
- [ ] Hearthis export push — import is live; export is still a manual cross-post note.
- [ ] Help spotlight tours covering disco-widgets specifically (generic `?` tours exist).
- [ ] Admin Disco-widgets / Internet Radio / Themes board tools (Next admin remains canonical).
- [ ] Collection/venue bot OG endpoints (no `/api/og/collection` or `/api/og/venue` in tahti-org yet).

### Intentionally consolidated, not missing

- Posts and newsletter compose live together in `/studio/updates`.
- Channel edit, gallery, text, and rotation settings live together in `/studio/channel`.
- Fan tiers, subscriber payout statistics, Stripe state, grants, and subscriptions live under Settings → Money (Fan tiers / Fan subs tabs) and Studio → Audience (`/studio/revenue`).
- Radio slots, series, and episodes are handled by `/studio/shows`; production dashboard aliases resolve there.
- Production settings sub-pages map into the smaller Account, Artist, Channel, Broadcast, Money, and Connections sections.
