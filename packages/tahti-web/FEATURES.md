# Feature port checklist — prod Tahti → `@nuclearplayer/tahti-web`

Track what has been ported from `apps/web` into the Nuclear listen/studio POC.

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
6. [x] Fan-sub tier editor — Settings → Money (`/api/me/fan-tiers`)

## Checklist — shipped vs remaining

**Shipped (beta)**

- [x] Listen directory, channel HLS, archive, radio, profile, collections, smart links
- [x] Auth login / TOTP / register / logout
- [x] Email verify page (`/verify`)
- [x] Follows, favorites/history (local), fan subscribe checkout, DMs, governance
- [x] Add to playlist
- [x] Studio: Go Live dashboard, upload, releases, collections/album designer; all music lives first in My Library
- [x] Studio: schedule, stats summary, channel design, updates, revenue/Connect
- [x] Channel visualizer POC + analyser
- [x] Fan tier create / activate-deactivate
- [x] Settings shell (Nuclear sections), Sources hub (partial OAuth UX)
- [x] Embeds
- [x] Artist Branding workspace: profile picture, channel outlook, gallery visibility, fullscreen slideshow, and 10-image press kit selection

**Remaining / partial**

- [x] Channel chat hardening — hCaptcha wired on anonymous join (`useHcaptcha` in `ChannelChatPanel`), one shared component powers both the rail and standalone `/chat/$slug` route (parity by construction). Not yet soak-tested against a live hCaptcha site key in production.
- [x] Full Three.js visualizer preset set — all ten production preset names now have distinct Three.js scenes, use the shared analyser, honor reduced motion, and load from a separate lazy chunk (`ChannelVisualizer.tsx`, `visuals/ThreeVisualizer.tsx`)
- [x] Stash upload / delete
- [x] Stats detail page (beyond summary) — `/studio/stats/detail` (`StudioStatsDetailView.tsx`) shipped, worklog row 14 approved
- [x] Sources OAuth silent-mock demock polish — start URLs are real (`oauthStartUrl()` → `/api/me/*/oauth/start`, `api/sources.ts:189`) and mock-connect is hard-gated behind `VITE_FORCE_MOCK`; browser verification covers the API's production return shapes for SoundCloud, Bandcamp, Google Drive, and Mixcloud, including provider selection, visible connected/error/login messaging, and query cleanup in the SPA.
- [x] Venue register
- [x] Membership purchase (`/signup/payment`) — Stripe checkout + mock activate
- [x] TOTP at login (manage/settings depth still thin)
- [x] Account security — TOTP enroll/manage panel in Settings (`SecurityTotpPanel`); matches prod (TOTP is the only account security setting there too)
- [x] Distribution (catalog + Revelator + Spotify profile)
- [x] Channel moderators (`/studio/moderation`)
- [x] Listener-only dashboard (`/dashboard` routes non-artists to `/library`)
- [x] Board admin — all 22 pages ported, gated on `user.isBoard` (see UI-REDESIGN-WORKLOG.md admin table); several sub-pages deliberately scope-trimmed, see §6 note
- [x] Radio slots depth — series and episodes are now **live-API**, matching bookings. Added `LiveShowEpisode` model + `intervalHours`/`scheduleNote` on the existing `LiveShowSeries` table in `tahti-org` (`packages/db/prisma/schema.prisma`, migration `20260822140000_live_show_episodes`), plus `PATCH /api/me/channel/show-series/:seriesId`, `GET/POST /api/me/channel/show-series/:seriesId/live-show-episodes`, `GET/PATCH /api/me/channel/live-show-episodes/:id` on the existing `channel-schedule.ts` route plugin (17 passing tests). `api/shows.ts` in this repo now calls those endpoints with the standard mock-fallback pattern (`forceMock()`/`allowMockFallback()`, mirroring `fetchShowBookings`); verified against a real local instance of the `tahti-org` API (create series, create episode with a custom title, list — all round-trip correctly). `SERIES_KEY`/`EPISODES_KEY` localStorage remain only as the `VITE_FORCE_MOCK` fixture path.
- [ ] Multitrack timeline editing — confirmed greenfield (no track array/timeline model anywhere), a multi-day build needing a rendering-architecture decision first, not a slice. Press-kit gallery is done (see above); member invites checked and mostly already covered — adding a moderator by existing username is live-API at `/studio/moderation`. A true email-invite-for-non-account-holders flow is a separate, larger feature with no backing API; deferred, not clearly needed.
- [x] Settings modal mobile responsiveness — was broken two ways: (1) a horizontal-scroll tab strip with no scroll affordance made most sections undiscoverable, and (2) the section list and content panes visually overlapped (root cause: `sm:flex` was silently losing to a later plain `hidden` rule in this codebase's compiled Tailwind output — same class of bug already worked around once in `SettingsPanelNav.tsx`'s `sm:w-56!`). Redesigned `SettingsPanel`/`SettingsPanelNav`/`SettingsPanelContent` (`@nuclearplayer/ui`) to a native list-then-detail mobile pattern: below `sm`, tapping a section swaps a full vertical section list for that section's content plus a back button; `sm:` and up shows both panes side by side as before (now with `sm:flex!` to make the override reliable). Verified in-browser at both a narrow and a desktop viewport; 237 `@nuclearplayer/ui` tests pass.
- [ ] Production cutover for `apps/web`

---

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
| Help | `/help/*` | `/help` | `mock-ok` | static copy |
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
| Follow / following | profile | `/library` | `live-api` | |
| Local favorites / history | — | `/library/*` | `partial` | localStorage + follows |
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
| Schedule / programme | schedule + channel playlist | `/studio/schedule`, `/studio/channel` | `live-api` | Full 24/7 playlist source, playback settings, active rotation, ordering, and track management |
| Stats | `/dashboard/stats` | `/studio/stats` | `live-api` | summary + `/studio/stats/detail` range-chip detail page |
| Channel design | channel/edit | `/channel/$slug?edit=1` + `/studio/channel` | `partial` | Inline Edit design: presets, layers drag/hide/add; layout localStorage; look via API |
| Updates / newsletter | posts | `/studio/updates` | `live-api` | |
| Revenue / Connect | revenue | `/studio/revenue` | `live-api` | demock wave 4; onboard/portal redirect to Stripe |
| Stash | `/dashboard/stash` | `/studio/stash` | `live-api` | upload/delete + mock |
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
| Fan-sub tier editor | fan-subs settings | Settings → Money | `live-api` | create + activate/deactivate |
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
| MCP tool meta | `@nuclearplayer/plugin-sdk/mcp` | same | **complete / as-is** | |
| MPD / Nuclear Jam HTTP | Tauri player | present in player | desktop-only | Not ported to beta SPA (same as upstream) |

Web cutover (`beta.tahti.live`) does **not** host Nuclear MCP — localhost player control plane. Do not strip `packages/player/src-tauri/src/mcp/` when packaging desktop.

---

## How to verify live (not mock)

```bash
# Dev against local or proxied API (no FORCE_MOCK)
unset VITE_FORCE_MOCK
pnpm --filter @nuclearplayer/tahti-web dev

# Optional: refuse mock fallback even in dev
VITE_ALLOW_MOCK_FALLBACK=0 pnpm --filter @nuclearplayer/tahti-web dev

# Beta build (prod mode → no silent mock fallback)
pnpm deploy:tahti-beta
# then https://beta.tahti.live — login with a real Tahti account
```

Update this file when a row moves from `partial` → `live-api` or a demock wave completes.

## 2026-08-23 route and capability sweep

Compared the current `apps/web/src/app/**/page.tsx` tree in the Tahti repository with the Nuclear SPA router and the implemented views. Existing capabilities with broken legacy navigation were fixed in `prodPathRedirects.ts`: Distribution, Events, Embeds, Recordings, artist Venues, Posts, broadcast recordings, archive editor deep links, track Insights, collection creation, and the matching Artist/Broadcast/Connections/Moderation settings destinations now resolve to their in-app surfaces.

### Missing user-facing surfaces

- [ ] Public venue detail (`/v/:slug`) — venue directory and registration exist, but a shareable venue profile does not.
- [ ] Transparency methodology (`/transparency/methodology`) — the data dashboard exists without the standalone methodology explanation.
- [ ] Public/member feature requests (`/governance/feature-requests`) — board administration exists, but listeners and members cannot browse or submit requests from its Tahti route.
- [ ] Upload job detail (`/dashboard/upload/:uploadId`) — upload works, but processing state has no durable detail route after navigation or refresh.
- [ ] Signup profile and broadcaster-intake step parity (`/signup/profile`, `/signup/broadcast`) — join and membership checkout exist, but these guided steps are consolidated rather than preserved as addressable routes.

### Partial functionality

- [ ] Support (`/help/support`) has help content but no in-client ticket submission form.
- [ ] Public venue governance (`/governance/venues`) is represented through venue registration and board tools, without the production member-facing route.
- [ ] Direct-message thread URLs (`/dashboard/messages/:id`) open the inbox but do not preserve the selected conversation in the route.
- [ ] Admin detail operations remain intentionally reduced: user/support/announcement detail, bulk file operations, per-subscriber payout retry, legacy-member migration, grant preview/run, and governance report/resolution/audit tools.
- [ ] Pro editor remains shallower than Tahti's full ffmpeg/multitrack workflow; a true multitrack timeline still needs a rendering and persistence design.
- [ ] Dynamic SEO/OG parity still depends on an edge metadata or prerendering solution for artist, channel, release, collection, and venue pages.

### Intentionally consolidated, not missing

- Posts and newsletter compose live together in `/studio/updates`.
- Channel edit, gallery, text, and rotation settings live together in `/studio/channel`.
- Fan tiers, subscriber payout statistics, Stripe state, grants, and subscriptions are grouped under Settings → Money and `/studio/revenue`.
- Radio slots, series, and episodes are handled by `/studio/shows`; production dashboard aliases resolve there.
- Production settings sub-pages map into the smaller Account, Artist, Channel, Broadcast, Money, and Connections sections.
