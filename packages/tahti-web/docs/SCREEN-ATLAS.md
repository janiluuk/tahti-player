# Screen atlas — app.tahti.live → Nuclear UI

**2026-09-04:** Live map shots live under `public/map/nuclear/` (not only
`docs/redesign-shots/`). Recapture with `scripts/capture-map-screens.mjs`.
This inventory table below is historical (2026-08); the `/more` atlas and
`src/content/mapScreens.ts` are the current source of truth.

Inventory of production (`apps/web` / app.tahti.live) surfaces vs Nuclear (`@tahti-player/tahti-web` / beta.tahti.live), with screenshot status.

**Legend**

| Status | Meaning |
|--------|---------|
| **shot** | Nuclear UI exists + screenshot under `docs/redesign-shots/` |
| **ui-no-shot** | Nuclear route exists; screenshot missing or stale |
| **partial** | Nuclear covers part of prod (missing subflows) |
| **missing** | No Nuclear UI yet |
| **out-of-scope** | Explicitly not in Nuclear cutover (e.g. marketing `website/`, admin until Phase later) |

Screenshots are Nuclear UI only (mock or beta). Prod is the source of *what must exist*; Nuclear is the visual target.

---

## 1. Anonymous / public

| Prod path | Nuclear path | Shot | Status |
|-----------|--------------|------|--------|
| `/` (marketing) | — (stays `website/` / Phase 0) | — | out-of-scope |
| `/listen` | `/` · `/listen` | `listen-home-v1.png` | shot |
| `/radio` | `/radio` | `listen-radio-v1.png` | ui-no-shot → capture |
| `/radio/show/[channelSlug]` | `/channel/$slug` (radio channel) | — | partial |
| `/c/[slug]` | `/channel/$slug` · `/c/$slug` | `listen-channel-v1.png` | shot |
| `/u/[username]` | `/u/$username` | `listen-artist-v1.png` | ui-no-shot → capture |
| `/u/[username]/c/[slug]` | `/u/$username/c/$slug` | — | ui-no-shot |
| `/u/[username]/subscribe` | `/subscribe/$username` · alias | `subscribe-v1.png` | shot |
| `/u/[username]/green-room` | — | — | missing |
| `/r/[slug]` | `/r/$slug` | `listen-smartlink-v1.png` | ui-no-shot → capture |
| `/v/[slug]` venue public | — | — | missing |
| `/venues` | `/venues` | `venues-v1.png` | ui-no-shot → capture |
| `/venues/register` | `/venues/register` | `venues-register-v1.png` | ui-no-shot → capture |
| `/embed/c/[slug]` | `/embed/c/$slug` | `embed-channel-v1.png` | ui-no-shot → capture |
| `/embed/r/[id]` | `/embed/r/$id` | — | ui-no-shot |
| `/embed/col/[slug]` | `/embed/col/$slug` | — | ui-no-shot |
| `/login` | `/login` | `auth-login-v1.png` | ui-no-shot → capture |
| `/join` | `/join` | `auth-join-v1.png` | ui-no-shot → capture |
| `/verify` | `/verify` | — | ui-no-shot |
| `/signup` · `/signup/profile` · `/signup/broadcast` | `/join` (+ gaps) | — | partial |
| `/signup/payment` | `/signup/payment` | — | ui-no-shot |
| `/setup-password` | — | — | missing |
| `/apply` | — | — | missing |
| `/help` | `/help` | `help-v1.png` | ui-no-shot → capture |
| `/help/*` (for-artists, broadcast, …) | `/help/$slug` | — | partial |
| `/help/support` | — | — | missing |
| `/status` | `/status` | — | ui-no-shot |
| `/transparency` (+ methodology) | `/transparency` | — | partial |
| `/governance` (+ venues, feature-requests) | `/governance` | — | partial |
| `/about` `/terms` `/privacy` `/agpl` | same | — | ui-no-shot |
| `/for-artists` `/how-it-works` | — | — | missing (info marketing) |
| `/feed` | — | — | missing |

---

## 2. Authenticated listener

| Prod path | Nuclear path | Shot | Status |
|-----------|--------------|------|--------|
| Library / follows (dashboard listener bits) | `/library` | `listener-library-v1.png` | ui-no-shot → capture |
| History | `/library/history` · `/history` | — | ui-no-shot |
| Favorites | `/favorites` | — | ui-no-shot |
| DMs `/dashboard/messages` | `/messages` · `/library/messages` | `listener-messages-v1.png` | ui-no-shot → capture |
| Account settings | `/settings/*` · `/account` | `settings-v1.png` | ui-no-shot → capture |
| Sources OAuth | `/sources` | — | partial |
| Chat (channel) | right rail + `/chat/$slug` | — | partial (no left Chat button; use rail toggle) |
| Themes | `/themes` | — | ui-no-shot |

---

## 3. Artist studio (prod `/dashboard/*`)

| Prod path | Nuclear path | Shot | Status |
|-----------|--------------|------|--------|
| `/dashboard` | `/studio` | `studio-home-v1.png` | shot |
| `/dashboard/broadcast` | `/studio/go-live` | `studio-go-live-v1.png` | shot |
| `/dashboard/archive` | `/studio/archive` | `studio-archive-v1.png` | shot |
| `/dashboard/archive/[id]` | `/studio/archive/$id` | `studio-archive-item-v1.png` | shot |
| `/dashboard/archive/[id]/editor` | `/studio/archive/$id/editor` | — | ui-no-shot |
| `/dashboard/upload` (+ imports, from-broadcast) | `/studio/upload` | `studio-upload-v1.png` | partial (imports thinner) |
| `/dashboard/releases` | `/studio/releases` | `studio-releases-v1.png` | shot |
| `/dashboard/releases/[id]` | `/studio/releases/$id` | `studio-release-detail-v1.png` | ui-no-shot → capture |
| `/dashboard/collections` | `/studio/collections` | `studio-collections-v1.png` | shot |
| `/dashboard/collections/[slug]` · new | `/studio/collections/$slug` | — | ui-no-shot |
| `/dashboard/editor` | `/studio/editor` | `studio-editor-v1.png` | ui-no-shot → capture |
| `/dashboard/editor/[id]` | `/studio/editor/$id` | — | ui-no-shot |
| `/dashboard/schedule` | `/studio/schedule` | `studio-schedule-v1.png` | shot |
| `/dashboard/stats` | `/studio/stats` | `studio-stats-v1.png` | shot |
| `/dashboard/stats/detail` | `/studio/stats/detail` | — | ui-no-shot |
| `/dashboard/insights/*` | — | — | missing |
| `/dashboard/channel` (+ edit, gallery, text) | `/studio/channel` | `studio-channel-v1.png` | partial |
| `/dashboard/setup-channel` | `/studio/setup-channel` | `studio-setup-channel-v1.png` | ui-no-shot → capture |
| Shows / episodes (prod events-ish) | `/studio/shows` · episodes | `studio-shows-v1.png` | partial (series localStorage) |
| Playlists | `/studio/playlists` | `studio-playlists-v1.png` | shot |
| `/dashboard/posts` · newsletter | `/studio/updates` | `studio-updates-v1.png` | ui-no-shot → capture |
| `/dashboard/revenue` | `/studio/audience` | `studio-revenue-v1.png` | ui-no-shot → capture |
| `/dashboard/distribution` | `/studio/distribution` | `studio-distribution-v1.png` | ui-no-shot → capture |
| `/dashboard/stash` | `/studio/stash` | `studio-stash-v1.png` | ui-no-shot → capture |
| `/dashboard/tahti-radio-slots` | — | — | missing |
| `/dashboard/moderate/[slug]` | — | — | missing |
| `/dashboard/embeds` | embeds routes | — | partial |
| `/dashboard/venues` | `/venues` | — | partial |
| `/dashboard/events` | `/studio/shows` | — | partial |
| Settings fan-subs, media, moderators, multistream, presskit, domain, discovery, notifications, comments, announcements, connections, green-room, artist-info, members, account | `/settings/*` panels | — | partial |
| `/dashboard/upload/import/*` | — | — | missing / thin |

---

## 4. Admin (`/admin/*`) — Nuclear **not started**

All **missing** Nuclear UI (keep Next admin until cutover Phase). No Nuclear screenshots.

| Prod | Notes |
|------|--------|
| `/admin` `/admin/dashboard` | Board home |
| `/admin/beta` | Applications |
| `/admin/users` `/admin/users/[id]` | |
| `/admin/radio` `/admin/radio-submissions` | |
| `/admin/news` `/admin/tahti-selects` `/admin/streams` | |
| `/admin/support` `/admin/support/[id]` | |
| `/admin/top-lists` `/admin/announcements` | |
| `/admin/storage` `/admin/storage/[userId]` `/admin/files` | R2 quota UI |
| `/admin/content-reports` | |
| `/admin/financial` (+ ledger, fansubs, legacy-members) | |
| `/admin/governance` (+ audit, resolutions, report) | |
| `/admin/feature-requests` `/admin/grants` `/admin/agm` | |
| `/admin/settings/vendors` `/admin/status` | |
| `/admin/channels/[slug]/*` | Archive/programme ops |
| i18n languages + CSV | Phase 0 approved, not built |

---

## 5. Coverage summary (after atlas capture 2026-08-13)

| Audience | Prod screens (approx) | Nuclear UI | Nuclear shots on disk |
|----------|----------------------|------------|------------------------|
| Anonymous / public | ~35 | ~25 | ~18 (`listen-*`, auth, help, venues, embed, legal…) |
| Listener | ~10 | ~8 | library, messages, settings, sources |
| Artist studio | ~45 | ~30 | **~22** studio-* PNGs including updates/revenue/stash/distribution |
| Admin | ~25+ | **0** | **0** — no Nuclear admin |

**Still no Nuclear UI (concrete gaps):** green-room, venue public `/v/:slug`, apply, setup-password, help/support form, feed, info marketing pages, radio slots UI, channel moderate, upload import suite depth, insights, full settings subpages parity, **entire `/admin/*`**.

**Auth note:** `/login` and `/join` open the Nuclear auth **dialog** over Listen (not separate full pages) — shots `auth-login-v1.png` / `auth-join-v1.png` reflect that.

---

## 6. Capture

```bash
# from packages/tahti-web — mock Vite on :5190
VITE_FORCE_MOCK=1 pnpm exec vite --port 5190 --strictPort
# other terminal
REDESIGN_BASE_URL=http://127.0.0.1:5190 node scripts/capture-atlas-shots.mjs
```

Update this file’s Shot column when new PNGs land.
