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

Demock waves 0-6 and the first product priorities (album designer, add to playlist, visualizers, broadcast wizard, email verify, fan tiers) are done; production builds never fall back to mock data silently (`api/mode.ts`, [`MOCKS.md`](MOCKS.md)).

## Remaining

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
| Artist profile | `/u/:username` | `/u/$username` | `live-api` | Music tab: pinned tracks (max 4) above catalog; Stage pins via `PATCH /api/me/sound/:id` `{ pinned }` |
| Collection | `/u/:user/c/:slug` | `/u/$username/c/$slug` | `live-api` | |
| Smart link | `/r/:slug` | `/r/$slug` | `live-api` | |
| Venues list | `/venues` | `/venues` | `partial` | list only |
| Venue register | `/venues/register` | `/venues/register` | `live-api` | `POST /api/v1/venues`; board verifies; Admin → Venues names and links the submitter (#770, needs tahti-org#834) |
| Transparency | `/transparency` | `/transparency` | `live-api` | |
| Help | `/help/*` | `/help` | `live-api` | static articles including disco-widgets; support form posts to API |
| Disco-widgets | discovery settings + listen/profile | Settings → Add-ons + Listen/channel | `live-api` | sandboxed iframe; admin catalog stays Next |
| Legal / about | `/about`… | same | `partial` | POC + prod links |
| Platform status | `/status` | `/status` | `live-api` | |
| Marketing home / apply | `/`, `/apply` | — | `missing` | listen hub is home |
| VOD seek | player | PlayerBar | `live-api` | |
| Internet radio stations | — | Listen cards + `/radio/station/$stationId` | `live-api` | curated catalog; programme and track from `GET /api/v1/internet-radio/now-playing` on Listen, the station page and the player bar (Radio Helsinki, NRJ, Radio Nova so far) |
| Report content | report dialogs | track, channel, release, collection, comment | `live-api` | `POST /api/v1/reports`; no account needed |
| Newsletter confirm / unsubscribe | email links | `/newsletter/*` | `live-api` | consent on subscribe, one-click unsubscribe |
| Leave-page warning | — | whole app | `mock-ok` | the browser asks before a reload or close while audio is playing |

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
| My subscriptions | account | `/settings/account` (Your subs) | `live-api` | |
| Membership status | account | `/settings/account` | `live-api` | |
| Governance | `/governance` | `/governance`, `/governance/meetings/$id`, `/governance/members`, `/governance/history`, `/governance/feature-requests` | `live-api` | motions, votes and comments, meetings, member register, decision history, feature requests; members only (401/403 → forbidden empty state). Board side: `/admin/governance`, `/admin/agm` |
| Motion drafts | `/governance` | `/governance/motions/$id` | `live-api` | members second or withdraw a second (`secondCount`, "Seconded by" list); the proposer edits (a text change clears seconds) or withdraws their own draft; members remove their own comments while a motion is open, the board any comment; "Taken up at <meeting>" links the meeting (#714-#721) |
| DMs | `/dashboard/messages` | `/messages` | `live-api` | demock wave 5 |
| Listener-only dashboard | `/dashboard` | `/dashboard` → `/library` | `live-api` | non-artists no longer hit the Studio "create a channel" wall; channel and broadcast settings are hidden without a channel |
| Block an account | — | artist page, DM thread, Settings → Account → Privacy & data | `live-api` | `/api/me/blocks`; blocks DMs, comments, follows, mentions and search results both ways |
| Support requests | `/help/support` | `/help/support` | `live-api` | your tickets, the board's replies, and a reply of your own |
| API tokens | account | Settings → Account → API tokens | `live-api` | optional expiry date, shown per token; token management needs a signed-in session |
| Data export | account | Settings → Account → Privacy & data | `live-api` | lists what the export contains before you request it |

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
| Revenue / Connect | revenue | `/studio/audience` | `live-api` | demock wave 4; onboard/portal redirect to Stripe |
| Stash | `/dashboard/stash` | `/studio/stash` | `live-api` | upload/delete + mock |
| Sound share links | none (no prod equivalent) | `TrackEditDialog` → Sharing tab (PRIVATE/STASH only) | `partial` | Client + mock complete (`SoundShareLinksSection.tsx`, `api/studio.ts`); backend routes in review (tahti-org#568 manage links, #569 `?key=` on track + comments); key access creates no listen events, but there is no per-share audit log yet |
| Distribution | `/dashboard/distribution` | `/studio/distribution` | `live-api` | catalog, Revelator pay+submit, Spotify profile, royalties |
| Radio slots / Shows | `/dashboard/tahti-radio-slots` | `/studio/shows` | `live-api` | bookings, series, and episodes all live-API |
| Channel moderators | `/dashboard/moderate/:slug` | `/studio/moderation`, Settings → Channel & chat → Moderators | `live-api` | a new moderator gets a notification |
| Green room | broadcast | Channel and Go live | `live-api` | open the room, invite guests, see who joined |

## 5. Settings / sources

| Feature | Prod | POC | Status | Notes |
|---------|------|-----|--------|-------|
| Settings shell | `/dashboard/settings/*` | `/settings` | `partial` | Nuclear sections |
| Artist / discovery / domain | settings | sections | `live-api` | Artist tabs in three groups, Account tabs in four; Channel & chat holds Channel Designer, Discovery (share-button switch), Username & domain (rename asks first), Chat and Moderators |
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
| Content reports queue | `/admin/moderation` | `/admin/moderation` → Content reports | `live-api` | link and excerpt of what was reported, filter by status and by target type, delete a reported comment |
| Support queue | `/admin/support` | `/admin/moderation` → Support | `live-api` | reply threads, waiting-on-board count and filter |
| Board admin | `/admin/*` (~35 pages Next) | `/admin/*` (40 routes) | `live-api` | Gated on `user.isBoard`. Users, moderation (content reports, support, themes), financial (fan-sub payouts with retry), grants and grant cycles, governance and AGM, storage per user, radio, Selects, top lists, venues, disco-widgets, add-ons, logs and status. Still reduced vs Next: announcement detail, bulk file operations, legacy-member migration (see the open list below) |
| WebGL visualizer | channel page | ChannelView Live | `live-api` | full ten-preset Three.js catalog; analyser-reactive and lazy-loaded |

## 7. Desktop Nuclear integrations (not web SPA)

| Feature | Upstream Nuclear | This fork | Status | Notes |
|---------|------------------|-----------|--------|-------|
| MCP server (Streamable HTTP) | Tauri `packages/player` MCP | same paths | **rebuilt** | Tools over tahti-web's player, desktop library, radio and Tahti search (`src/lib/mcp/`); switch in Settings → Integrations in the desktop app; see [`docs/MCP.md`](docs/MCP.md) |
| MCP tool meta | `@tahti-player/plugin-sdk/mcp` | same | unused | Only read by Nuclear's bridge dispatcher, which no longer runs |
| MPD server | Tauri player | same Rust server | **rebuilt** | Answered from tahti-web's player (`src/lib/mpd/`); switch in Settings → Integrations in the desktop app |
| Discord Rich Presence | Tauri player | same Rust commands | **rebuilt** | Set from tahti-web's player (`src/lib/discord/`); switch in Settings → Integrations in the desktop app |
| Tahti Jam (phone remote + HTTP API) | Tauri player | same Rust server, pairing code added | **rebuilt** | Remote page `src/remote/` served at `/remote`; answered from tahti-web's player (`src/lib/jam/`); switch with pairing QR in Settings → Integrations in the desktop app |
| App updates | Tauri player `updaterStore` | same Tauri updater, release feed `latest.json` | **rebuilt** | Checked 10 s after start and every 6 h from tahti-web (`src/lib/updates/`), offered in a toast; Check now / Install / Restart and an off switch in Settings → Integrations in the desktop app |

Web cutover (`beta.tahti.live`) does **not** host Nuclear MCP — localhost player control plane. Do not strip `packages/player/src-tauri/src/mcp/` when packaging desktop.

---

## 8. Accessibility and layout (all surfaces)

Conventions behind these rows are in [`docs/agent/CODE-STYLE.md`](../../docs/agent/CODE-STYLE.md) (Accessibility, Layout).

| Feature | Where | Status | Notes |
|---------|-------|--------|-------|
| Keyboard focus | every library `Button`, `ButtonLink`, tab panel, selectable row | `mock-ok` | `focus-visible` ring in `--primary` (#746, #754, #759) |
| Skip to content | first Tab stop on every page | `mock-ok` | focuses `#main-content` on desktop and phone (#763) |
| Landmarks | app shell | `mock-ok` | top bar `header`, sidebar `nav` "Main", queue rail `aside` "Queue", `main` on phones too (#757, #760, #762) |
| Names and roles | dialogs, popovers, meters, ratings, tables | `mock-ok` | Settings dialog and lightbox named; popover state on the trigger button; track and catalog tables name icon columns; card grids carry no fake `grid` role (#747-#753, #765, #769) |
| Headings | every page | `mock-ok` | one `h1`; `EmptyState` titles are `h2` (#758) |
| Wide tables on phones | stats, revenue, transparency, schedule, help | `mock-ok` | `HorizontalScroll`: a named, focusable region only when it overflows (#756) |
| Text contrast | default theme | `mock-ok` | Nuclear Green meets WCAG AA (teal `#3a9a83`, dark text on primary); links in text are underlined (#755, #761, #771). Other built-in themes not re-measured |
| Phone and tablet layouts | every route | `mock-ok` | swept at 320, 360, 390, 768, 1024 and 1280 px (batches 52-59); narrow track tables fold Add to queue into the track menu (#768) |
| Touch targets | Radio lists | `mock-ok` | 24 px minimum (#764) |

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

## Open from the 2026-08 route sweeps

The 2026-08-23 and 2026-08-25 comparisons against `tahti-org` `apps/web` are done except:

- [ ] Upload job detail (`/dashboard/upload/:uploadId`): processing state has no durable route after navigation or refresh.
- [ ] Signup profile and broadcaster-intake steps (`/signup/profile`, `/signup/broadcast`) are consolidated into join and checkout rather than kept as guided steps.
- [ ] Admin: announcement detail, bulk file operations and legacy-member migration.
- [ ] Multitrack + viz (theDAW port) runs beside trim mode; server-side multitrack render is still open.
- [ ] Theme submit → `tahti-registry` pull request: the API worker's GitHub token is not provisioned, so approved themes don't open a PR yet.
- [ ] Help spotlight tour for disco-widgets (generic `?` tours exist).
- [ ] Bot OG endpoints for collections and venues (no `/api/og/collection` or `/api/og/venue` in tahti-org).

### Intentionally consolidated, not missing

- Posts and newsletter compose live together in `/studio/updates`.
- Channel edit, gallery, text, and rotation settings live together in `/studio/channel`.
- Fan tiers, subscriber payout statistics, Stripe state, grants, and subscriptions live under Studio → Audience (`/studio/audience`); listener Your subs stay under Settings → Account.
- Radio slots, series, and episodes are handled by `/studio/shows`; production dashboard aliases resolve there.
- Production settings sub-pages map into the smaller Account, Artist, Channel, Broadcast, and Connections sections (Audience lives under Studio).
