# Tahti port checklist — `@tahti-player/tahti-web`

Living checklist of **prod `apps/web` → Nuclear tahti-web POC**.  
Companion tables: [FEATURES.md](./FEATURES.md). Mock offline paths: [MOCKS.md](./MOCKS.md).

**Last audited:** 2026-09-03 against `tahti-org` apps/web + public/me APIs.

---

## Status tags

| Tag            | Meaning                                                       |
| -------------- | ------------------------------------------------------------- |
| `done`         | Ported and wired to live API (prod builds do not silent-mock) |
| `partial`      | UI or API incomplete vs prod                                  |
| `missing`      | Not in POC                                                    |
| `mock-only`    | Works under `VITE_FORCE_MOCK=1` / intentional Nuclear chrome  |
| `unwired`      | UI present but fake / link-out / not connected to API         |
| `link-out`     | Deep-links to `tahti.live` instead of in-POC flow             |
| `out-of-scope` | Explicitly not rebuilding (admin, marketing site, etc.)       |

---

## Priority backlog (implement next)

Ordered by listener/artist value × API readiness:

1. [x] **Stash upload + delete** — `POST /api/me/stash/prepare` → PUT → `POST /api/me/stash`, `DELETE /api/me/stash/:id`
2. [x] **Stats plays detail** — `GET /api/me/stats/plays` time series on `/studio/stats`
3. [x] **Account security (TOTP)** — `/api/me/totp/*` in Settings → Account
4. [x] **Venue register** — `POST /api/v1/venues` at `/venues/register`
5. [x] **Channel chat hardening** — fail closed on join failure in prod; hCaptcha and rail parity shipped
6. [x] **Sources OAuth polish** — live start URLs plus SoundCloud, Bandcamp, Google Drive, and Mixcloud callback return shapes land on the matching in-client source
7. [x] **Stash share links** — grant expiring read/download access and revoke active shares
8. [x] **Membership purchase** — `/signup/payment` Stripe checkout and Account entry point
9. [x] **Distribution / radio slots / moderate** — live API-backed Studio surfaces
10. [x] **Full Three.js visualizer presets** — ten distinct analyser-reactive scenes in the channel hero and ambient page background, lazy-loaded outside the initial listen bundle
11. [ ] **Multitrack timeline editing** — editor callout + map inventory
12. [x] **Press-kit gallery upload** — `/api/me/press-kit/images/*` upload/delete; `ArtistGalleryPanel` wired into the gallery tab
13. [ ] **Channel member invites (email, no account yet)** — moderator-by-username is live-API and done; a true accept-token email invite has no backing API and isn't clearly needed given the user flows.
14. [x] **Listener-only dashboard** — non-artists route to My Library
15. [ ] **Production cutover** — replace `apps/web` listen/studio with this client

**UX honesty / map:** `/more` (Tahti map) surfaces port backlog + mock inventory from `portInventory.ts` (synced with this file).

---

## Done / ported (high level)

- Listen directory, channel HLS + archive, radio, profile, collections, smart links, embeds
- Auth: login / TOTP login / register / logout / email verify
- Follows, fan subscribe checkout, my subscriptions, governance vote/comments, DMs
- Add-to-playlist → `/api/me/collections`
- Studio: home, Go Live wizard, archive/Music, upload, releases, collections/album designer, Broadcast (`/studio/schedule`) with 24/7 programme, channel design, updates/newsletter, revenue/Connect, fan-tier editor
- Stats summary + top tracks/countries + **plays time series**
- Stash list/play/download + **upload/delete/share/revoke**
- Settings shell (Nuclear sections) + artist/discovery/domain/notifications/social
- Venue directory + **register**
- Account **TOTP enable/disable**

---

## Mock / stub / unwired inventory

Things that look like product UI but are incomplete, offline-only, or still link out:

| Surface                           | What’s fake / thin                                                                           | Fix path                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `VITE_FORCE_MOCK=1` whole app     | Full fixture session ([MOCKS.md](./MOCKS.md))                                                | Keep for demos; never default in prod        |
| Dev silent mock fallback          | When API down + `VITE_ALLOW_MOCK_FALLBACK` (default on in Vite dev)                          | `VITE_ALLOW_MOCK_FALLBACK=0` for strict live |
| Spotify / SoundCloud stream URLs  | Always DEMO_MP3, live or mock (neither API exposes a real per-track preview here); Play/Queue now labeled "demo audio" | Wire real preview / import playables         |
| Channel chat                      | Fail closed when join fails (prod); mock send only under FORCE_MOCK; hCaptcha powers both chat surfaces | Live soak testing                            |
| Themes                            | Nuclear local presets (`mock-ok`)                                                            | Keep — not a Tahti API                       |
| Help / legal                      | Static hub + disco-widgets + artist gallery articles + support form                          | Keep                                         |
| Settings extras                   | Email invites for people without an account have no backing API                              | Keep existing-user moderation in-client      |
| Favorites / history               | Listen Favorites/History in **localStorage**; follows merge from `/api/me/following`         | Optional: sync with API if/when exists       |
| Pro editor                        | Partial vs prod multitrack — callout on editor                                               | Timeline + export parity                     |
| Feature map `/more`, Screen atlas | Port inventory panel + doc chrome (`mock-ok`)                                                | Keep                                         |
| Board `/admin/*`                  | 22 API-backed pages; some production detail and bulk operations remain scope-trimmed          | Continue detail-page parity                  |

---

## Gap matrix vs prod `apps/web` (not yet / partial)

### Public / anonymous

| Prod                                          | POC                | Status                     |
| --------------------------------------------- | ------------------ | -------------------------- |
| `/listen`                                     | `/`                | `done`                     |
| `/c/:slug` live+archive+chat                  | `/channel/$slug`   | `partial` (chat)           |
| `/radio`, `/u/:user`, collections, `/r/:slug` | matching           | `done`                     |
| `/venues`                                     | `/venues`          | `done`                     |
| `/venues/register`                            | `/venues/register` | `done`                     |
| `/transparency`, `/status`                    | matching           | `done`                     |
| `/help/*`                                     | `/help` + articles | `done`                     |
| `/`, `/apply`, marketing                      | —                  | `missing` / `out-of-scope` |
| Green room `/u/:user/green-room`              | matching           | `done`                     |

### Auth / account

| Prod                         | POC                | Status               |
| ---------------------------- | ------------------ | -------------------- |
| Login / TOTP / join / verify | matching           | `done`               |
| `/signup/payment` membership | matching            | `done`               |
| Password recovery            | forgot/reset routes | `done`               |
| TOTP setup/disable           | Settings → Account | `done`               |
| `/setup-password`            | matching            | `done`               |

### Listener

| Prod                                | POC        | Status    |
| ----------------------------------- | ---------- | --------- |
| Follow / fan sub / DMs / governance | matching   | `done`    |
| Listener dashboard                  | `/library` | `done`    |
| Server-side favorites library       | `/favorites` local | `partial` |

### Artist studio

| Prod                                                              | POC                          | Status                                               |
| ----------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------- |
| Broadcast / upload / archive / releases / collections             | matching                     | `done`                                               |
| Stash                                                             | `/studio/stash`              | `done` — upload, playback, delete, share, revoke      |
| Stats + detail/plays                                              | `/studio/stats`              | `done` (plays series; no map viz)                    |
| Editor                                                            | `/studio/editor`             | `partial`                                            |
| Distribution, radio slots, moderate                                | matching                     | `done`                                               |
| Revenue / Audience                                                | `/studio/audience`            | `done` — fan-sub stats, merged payout history (fan-subs + Revelator royalties), Connect, tiers tab, help tour |
| Press kit / members / moderators                                  | settings sections + link-out | `partial`                                            |

### Out of scope

- `/admin/*`, board financial tooling, ops, marketing `website/`

---

## How to verify

```bash
unset VITE_FORCE_MOCK
VITE_ALLOW_MOCK_FALLBACK=0 pnpm --filter @tahti-player/tahti-web dev

# Offline demo
VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev
```

Update this file when a backlog item ships or a new `unwired` surface is found.
