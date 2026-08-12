# CUTOVER — Nuclear `@nuclearplayer/tahti-web` → production `apps/web`

**Goal:** Replace the production Next.js client (`tahti` monorepo `apps/web`, served on `tahti.live` / `app.tahti.live`) with the Vite + Nuclear UI client (`@nuclearplayer/tahti-web`, currently `beta.tahti.live`).

**Repos**

| Tree | Role |
|------|------|
| `/home/jani/workspace/tahti-nuclear/packages/tahti-web` | Beta POC (this package) |
| `/home/jani/workspace/tahti` | Production monorepo (API, worker, `apps/web`, Swarm, CI) |
| [`FEATURES.md`](FEATURES.md) | Prod → POC feature parity tracker |
| [`WORKPLAN.md`](WORKPLAN.md) | POC remaining checklist |
| [`deploy/README.md`](deploy/README.md) | Beta deploy (vimage `:15180`) |
| `tahti/ops/beta-tahti-live.md` | Live beta routing / auth notes |
| `tahti/ops/ARCHITECTURE.md`, `DEPLOY.md`, `RUNBOOK.md` | Prod topology & rollouts |
| `tahti/docs/flows/site-map.md` | Canonical route map |
| `tahti/docs/e2e-screenshots/` | Screenshot atlas (apps/web) |

**Non-goals for this doc:** implementing features, deploying production, touching `website/` (static marketing site — separate stack).

---

## Executive summary

Beta already talks to **live** `api.tahti.live` / `chat.tahti.live` / `cdn.tahti.live` with democked auth, listen, studio core, Stripe fan-subs, DMs, and governance. Cutover is therefore mostly **client replacement + URL compatibility + hosting**, not a data migration.

**Blockers before flipping production traffic**

1. **Canonical URL compatibility** — prod uses `/c/:slug`, `/dashboard/*`, `/u/:user/subscribe`; POC uses `/channel/$slug`, `/studio/*`, `/subscribe/$username`. Without redirects/aliases, embeds, emails, Stripe returns, OAuth return URLs, and shared links break.
2. **Missing / partial product surfaces** — membership purchase, password/security, venue register, distribution, radio slots, moderate, setup-channel in-app, listener dashboard, full Three.js presets, Sources OAuth polish (see FEATURES.md).
3. **Admin & marketing split** — `/admin/*` is out-of-scope for Nuclear UI; `(marketing)` / apply / some info pages live in `apps/web` while `website/` is a separate static site. Decide hosts before deleting Next.
4. **SSR/SEO regression** — Next `sitemap.ts`, `generateMetadata`, OG cards become SPA problems unless rebuilt (prerender, edge meta, or keep a thin SSR shell).
5. **Cookie / same-origin model** — today beta proxies `/tahti-api` → API so `tahti_session` is host-only on `beta.tahti.live`. Production must keep a **same-origin API proxy** (or deliberately set `Domain=.tahti.live`) and update `APP_URL` return paths.
6. **Repo / AGPL / UI stack** — both trees are AGPL; decision is whether to **vend Nuclear UI into `tahti`**, keep a **git submodule/subtree**, or **publish private packages**. Brand (Nuclear chrome vs Tahti brand) is a product decision, not only a legal one.

**Recommended sequence:** freeze feature inventory → route alias layer → parity P0 → move package into `tahti` (or CI-vendored) → replace `tahti/web` image with nginx SPA → dual-run behind canary host → cutover → deprecate beta.

---

## Prioritized checklist (P0 / P1 / P2)

### P0 — must have before production DNS/NPM switch

- [ ] **Decision:** monorepo placement (A: move into `tahti/apps/web` or `apps/listen`; B: keep building from `tahti-nuclear` and only swap the Docker image). See §4.
- [ ] **Decision:** admin host after cutover (`admin.tahti.live` Next remnant vs board-only link-out to frozen Next vs rewrite later).
- [ ] **Decision:** marketing / apply / for-artists — stay on `website/` + redirects, or port minimal pages into SPA.
- [ ] **Route compatibility layer** — permanent redirects or dual routes for `/c/*` ↔ `/channel/*`, `/dashboard/*` ↔ `/studio/*`, subscribe paths, `/listen` → `/`.
- [ ] **API `APP_URL` + Stripe/OAuth return URLs** aligned to new paths (or aliases that match current API strings).
- [ ] **Same-origin API proxy** on production web edge (parity with beta `nginx.conf` `/tahti-api` + `/api`), Centrifugo WS still `wss://chat.tahti.live`.
- [ ] **Parity P0 features** from FEATURES.md: membership purchase (`/signup/payment`), password/security, setup-channel (no link-out), venue register (if still product-required). Sources OAuth demock polish is marked done on beta — still verify callback returns land on SPA (not prod dashboard link-outs) before cutover.
- [ ] **Strip / gate POC-only surfaces** for prod builds: `/more` feature map, Screen atlas, `VITE_FORCE_MOCK` / mock fallback dead code paths.
- [ ] **SEO minimum:** `robots.txt`, sitemap (static + API-fed), per-route OG tags for `/c`, `/u`, `/r` (prerender or meta service).
- [ ] **Playwright / vital journey** against new client on stack; smoke login → go-live → upload → subscribe.
- [ ] **Cutover runbook rehearsed** on staging/canary (rollback = previous `tahti/web` image + NPM/Caddy upstream).
- [ ] **Legal pages** bind to real terms/privacy/AGPL (not “POC summary + link-out”).

### P1 — should ship in the same release train or immediately after

- [ ] Distribution, radio slots, moderate, press-kit / invites polish, listener-only dashboard.
- [ ] Full visualizer preset parity (or explicit product acceptance of canvas/WebGL subset).
- [ ] Multitrack / pro editor depth vs prod ffmpeg/waveform stack (port or keep “good enough”).
- [ ] E2E screenshot atlas refresh under `tahti/docs/e2e-screenshots/` + new route manifest.
- [ ] Accessibility pass (keyboard, focus, live regions, contrast) on listen + studio critical paths.
- [ ] Bundle budget: code-split mermaid (already lazy), defer Three.js, audit Nuclear UI CSS.
- [ ] CI: replace `apps/web` Docker build with SPA build; keep lint/format/typecheck gates.
- [ ] Preview/PR envs serve the new client (or document that previews stay Next until cutover).
- [ ] CDN CORS + embed parents verified for SPA origin.
- [ ] Help/support form live (not link-out only).

### P2 — follow-ups / nice-to-have

- [ ] i18n strategy (neither client is truly localized today — decide before investing).
- [ ] Rebrand Nuclear themes → Tahti brand tokens (or keep Nuclear as differentiator).
- [ ] Upstream Nuclear sync policy for `@nuclearplayer/ui` / themes.
- [ ] Deprecate `beta.tahti.live` (DNS/NPM #61, `/srv/tahti-beta`) or keep as canary.
- [ ] Archive or slim `apps/web` Next tree (admin-only extract).
- [ ] Channel custom-domain / wildcard host behaviour with SPA (Caddy/NPM #55).
- [ ] Client-only storage migration story for favorites/history (localStorage namespaced).

---

## Phase 0 — Decisions & freeze

- [ ] **0.1** Freeze FEATURES.md statuses; tag a “cutover baseline” commit on `tahti-nuclear` and note matching `tahti` API SHA.
- [ ] **0.2** Choose **placement** (see §4) and **admin strategy** (see §1.1).
- [ ] **0.3** Choose **URL policy**: preserve prod paths as canonical (recommended) vs advertise Nuclear paths and 301 forever.
- [ ] **0.4** Choose **brand policy**: ship Nuclear look on day one vs Tahti-skinned Nuclear components.
- [ ] **0.5** Choose **beta fate**: keep as canary, rename to `next.tahti.live`, or sunset post-cutover.
- [ ] **0.6** Confirm **out-of-scope** list with product (admin, marketing site, Revelator/distribution depth, etc.).
- [ ] **0.7** Add pointer doc in production repo: `ops/nuclear-web-cutover.md` → this file (path or mirrored copy).

---

## Phase 1 — Gap inventory

Track against [`FEATURES.md`](FEATURES.md) and `tahti/docs/flows/site-map.md`. Update checkboxes here as inventory closes.

### 1.1 Scope boundaries

| Area | Prod today | Cutover stance | Action |
|------|------------|----------------|--------|
| Board admin `/admin/*` | Next in `apps/web` (~35 pages) | **Out-of-scope** for Nuclear UI (FEATURES) | [ ] Decide host: keep Next admin app, or temporary link-out to frozen deploy |
| Marketing `website/` | Separate static nginx image | **Do not merge into SPA**; off-limits unless explicitly requested | [ ] Ensure apex/`/` IA: listen hub vs marketing (redirect matrix) |
| `(marketing)` / `(info)` in apps/web | `/`, `/apply`, `/for-artists`, `/how-it-works`, … | Overlaps website + SPA | [ ] Inventory which URLs must 301 to `website/` vs port |
| Embeds `/embed/*` | Next + `@tahti/ui` | POC has routes | [ ] Parity QA (c/r/col/u) + iframe CSP |
| SSR / SEO | Next sitemap + metadata | SPA gap | [ ] Plan prerender/meta (§7) |
| i18n | Essentially EN-only both sides | No hard gap | [ ] Explicit non-goal or future track |
| Accessibility | Mixed | Not systematically ported | [ ] Audit P1 |

### 1.2 Feature matrix (summary — detail in FEATURES.md)

**Shipped on beta (`live-api`)** — verify once more on cutover candidate build:

- [ ] Listen directory, channel HLS/archive/chat, radio, profile, collections, smart links
- [ ] Auth login / TOTP / register / logout / email verify
- [ ] Follows, fan subscribe checkout, DMs, governance
- [ ] Studio: go-live, music/archive, upload, releases, collections designer, schedule, stats (+ detail), channel design, updates, revenue/Connect, stash
- [ ] Fan-tier editor, add-to-playlist, embeds, status/transparency

**Partial / missing (must classify P0 vs defer):**

- [ ] Venue register
- [ ] Membership purchase (`/signup/payment`)
- [ ] Password / security settings
- [ ] Listener-only dashboard
- [ ] Distribution / radio slots / moderate
- [ ] Setup-channel (currently link-out / StudioGate)
- [ ] Sources OAuth silent-mock polish
- [ ] Full Three.js visualizer preset set
- [ ] Multitrack timeline + press-kit polish
- [ ] Help depth / support form
- [ ] Legal pages full text (not summary)

### 1.3 Route map diff (compatibility required)

| Prod | POC | Cutover need |
|------|-----|--------------|
| `/` marketing or listen | `/` listen hub | [ ] Redirect matrix with `website/` |
| `/listen` | `/` | [ ] Alias `/listen` |
| `/c/:slug` | `/channel/$slug` | [ ] **P0** dual route or 301 |
| `/dashboard/*` | `/studio/*` | [ ] **P0** aliases + email/Stripe paths |
| `/u/:user/subscribe` | `/subscribe/$username` | [ ] **P0** alias (API success URLs use prod form) |
| `/dashboard/messages` | `/library/messages` | [ ] Alias |
| `/signup/*` | — | [ ] Port or keep Next island |
| `/admin/*` | — | [ ] Host decision |
| `/apply` | — | [ ] website or port |
| `/v/:slug` venues public? | `/venues` list | [ ] Confirm venue public pages |
| `/more`, `/themes` | POC-only / Nuclear | [ ] Prod: hide or keep as power-user |

### 1.4 Client-only / non-API state

- [ ] Document localStorage keys: theme, chat handle, favorites/history scopes (`libraryStore`)
- [ ] Confirm no IndexedDB / service worker assumptions that differ from Next
- [ ] No DB migrations expected (same API) — still verify no Next server-actions-only writes

---

## Phase 2 — Feature parity workstream

Work from FEATURES.md; mark done there and here.

### 2.1 Listen / public

- [ ] Channel URL canonicalization (`/c/:slug`)
- [ ] Chat captcha + access gating (already hardened — regression test)
- [ ] Radio parity + overlays
- [ ] Smart link + collection OG/share
- [ ] Venues list + register (if P0)
- [ ] Embed players offline/third-party site test

### 2.2 Auth / account

- [ ] Login / TOTP / register / verify / logout (regression)
- [ ] Membership purchase flow
- [ ] Password change + security (TOTP enroll if prod has it)
- [ ] Session cookie via same-origin proxy only (no direct `api.tahti.live` cookie split)

### 2.3 Listener

- [ ] Follows / library
- [ ] Fan subscribe + customer portal returns
- [ ] Governance vote/comments
- [ ] DMs
- [ ] Listener dashboard (or explicit redirect to `/library`)

### 2.4 Artist studio

- [ ] Studio home + **in-app setup-channel**
- [ ] Go Live / multistream / signal meters
- [ ] Upload prepare→PUT→complete + imports (SC/Bandcamp/Drive/URL)
- [ ] Archive / releases / collections designer
- [ ] Schedule / stats / revenue
- [ ] Stash
- [ ] Distribution / radio slots / moderate (P1)
- [ ] Editor depth decision (Tone/ffmpeg vs Nuclear EQ/stems)

### 2.5 Settings / sources / money

- [ ] Settings sections vs prod settings subnav — map 1:1 critical fields
- [ ] Fan-tier CRUD
- [ ] Sources OAuth: start on SPA, callback lands on SPA (update API return targets)
- [ ] Remove production link-outs in `sources.ts` / AccountView once paths exist

### 2.6 Payments / Stripe

- [ ] Fan subscribe Checkout
- [ ] Connect onboard + portal (`refreshUrl` / `returnUrl` currently `${APP_URL}/dashboard?…`)
- [ ] Membership Stripe/dev-direct parity with vital-flows
- [ ] Webhook unchanged (API) — only success/cancel URLs

### 2.7 Visualizers

- [ ] Accept canvas/WebGL subset **or** port Three.js presets from `apps/web`
- [ ] Analyser wiring on live + archive
- [ ] Bundle impact review

---

## Phase 3 — Architecture

### 3.1 Monorepo placement (pick one)

**Option A — Move into `tahti` (recommended for single deploy train)**

- [ ] Copy/vend `@nuclearplayer/tahti-web` → e.g. `apps/web` (replace) or `apps/listen`
- [ ] Vend minimal Nuclear deps: `@nuclearplayer/ui`, `themes`, `tailwind-config`, `model` (or rename `@tahti/nuclear-ui`)
- [ ] Wire `pnpm-workspace.yaml`, turbo lint/typecheck, Dockerfile SPA build
- [ ] Retire Next `apps/web` (or shrink to `apps/admin`)

**Option B — Keep fork, ship image only**

- [ ] CI in `tahti-nuclear` builds `registry.tahti.live/tahti/web:<tag>`
- [ ] `tahti` deploy.yml consumes that image (or dual registry)
- [ ] Clear ownership: who bumps UI packages / AGPL source offer

**Option C — Hybrid**

- [ ] `tahti` git subtree/submodule of `packages/tahti-web` + Nuclear UI packages
- [ ] Document sync cadence with `nukeop/nuclear` upstream

### 3.2 UI libraries

- [ ] Stop dual design systems long-term: Nuclear UI for listen/studio; `@tahti/ui` only if admin/marketing remain
- [ ] Token mapping: Nuclear CSS variables ↔ Tahti brand tokens (if rebrand)
- [ ] Do **not** reintroduce `apps/web/src/components/ui` duplicates

### 3.3 API contract

- [ ] Continue browser → same-origin `/api` or `/tahti-api` → `api.tahti.live`
- [ ] Inventory POC client modules (`api/client.ts`, `broadcast.ts`, `studio.ts`, `sources.ts`, `messages.ts`, `revenue.ts`) vs OpenAPI
- [ ] Remove mock fallback from production builds (already gated — audit all call sites)
- [ ] Centrifugo: `VITE_CENTRIFUGO_WS` / equivalent build arg

### 3.4 Env vars (build-time)

| Prod Next | SPA Vite | Notes |
|-----------|----------|-------|
| `NEXT_PUBLIC_API_URL` / `API_BASE` | unset + proxy, or `VITE_TAHTI_API_URL` | Prefer proxy |
| `NEXT_PUBLIC_CENTRIFUGO_WS` | `VITE_CENTRIFUGO_WS` | |
| `NEXT_PUBLIC_APP_URL` | `VITE_APP_URL` (add if missing) | Absolute links, OG |
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | `VITE_HCAPTCHA_SITE_KEY` | Chat/join |
| `SIGNUP_OPEN` | `VITE_SIGNUP_OPEN` | |
| — | `VITE_FORCE_MOCK` / `VITE_ALLOW_MOCK_FALLBACK` | **Must be unset/0 in prod** |

- [ ] Mirror Dockerfile `ARG`/`ENV` pattern from `apps/web/Dockerfile` for Vite
- [ ] API-side `APP_URL` / `PUBLIC_WEB_URL` updated when canonical host/paths change

---

## Phase 4 — Auth, cookies, domains

### 4.1 Current beta model (keep for production SPA)

- Session cookie `tahti_session`: **host-only**, `httpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/` (no `Domain=`)
- Login must hit **same origin** as the SPA so `Set-Cookie` attaches to `tahti.live` (or `app.tahti.live`)
- Beta nginx already does `/tahti-api/` → `https://api.tahti.live/` with `proxy_cookie_domain` safety

### 4.2 Cutover tasks

- [ ] Production web container/edge: SPA + API reverse proxy (copy/adapt `deploy/nginx.conf`)
- [ ] Caddy/NPM: `tahti.live` / `app.tahti.live` upstream → new web service
- [ ] Confirm wildcard channel hosts (`*.tahti.live`, NPM #55) still resolve to SPA with correct `Host` / channel slug routing
- [ ] CORS: already allows `*.tahti.live` — still needed for CDN and any residual cross-origin; same-origin API reduces cookie CORS pain
- [ ] OAuth provider redirect URIs stay on **API** (`/api/me/.../oauth/callback`); post-callback **browser redirect** targets must be SPA routes
- [ ] Stripe Connect / Checkout return URLs: update API `config.appUrl` paths or add SPA aliases matching today’s `/dashboard?…` and `/u/…/subscribe?…`
- [ ] Email links (`APP_URL` verify, invites): point at new client
- [ ] Document that beta and prod sessions **do not** share cookies (different hosts) until beta is retired
- [ ] Optional later: `Domain=.tahti.live` for shared session across subdomains — **security review** if pursued

### 4.3 Centrifugo / HLS / CDN

- [ ] Chat WS `wss://chat.tahti.live/connection/websocket` from SPA origin
- [ ] HLS/CDN absolute URLs unchanged; CORS includes new origin if any
- [ ] Captcha sitekey present in prod build

---

## Phase 5 — Infra / deploy / CI

### 5.1 Container

- [ ] New Dockerfile: multi-stage `pnpm build` → nginx (or caddy) serving `dist/`, API proxy locations
- [ ] Image still tagged `registry.tahti.live/tahti/web:<tag>` to minimize Swarm service churn **or** introduce `tahti/listen` and retarget stack
- [ ] Healthcheck: `/` 200 + maybe `/health` stub from nginx
- [ ] Drop Next runtime user/`pnpm start` assumptions

### 5.2 Swarm / Makefile / compose

- [ ] `make build-web` / `docker-compose` `web` service use new Dockerfile
- [ ] `infra/docker-stack.yml` env for web (remove Next-only vars; add Vite build args at **build** time)
- [ ] Local `stack-up.sh` / screenshot scripts point at SPA port
- [ ] Staging deploy path identical to prod

### 5.3 Edge (Pi4 NPM + Caddy)

- [ ] Production proxy hosts currently → Next web: switch upstream after image roll
- [ ] Keep `beta` host (#61) during canary; exclude from channel wildcard
- [ ] TLS wildcards unchanged (`*.tahti.live`)

### 5.4 CI (`.github/workflows/ci.yml`, `deploy.yml`)

- [ ] Build context includes Nuclear UI packages
- [ ] Lint/format/typecheck for SPA package (`pnpm lint`, `format:check`, `ci:check`)
- [ ] E2E: extend beyond API `vital-flows.sh` with Playwright against web
- [ ] Do not require marketing `website/` changes

### 5.5 Preview environments

- [ ] If PR previews exist for Next web: rebuild pipeline for SPA + API proxy
- [ ] Else document “preview = beta.tahti.live until cutover”

---

## Phase 6 — Data / migrations

- [ ] **None expected** for Postgres — same API/schema
- [ ] Confirm no Next Route Handlers were the only writers for any feature (proxy/stream routes under `apps/web`)
- [ ] Client localStorage: accept device-local favorites/history **or** add API sync later (P2)
- [ ] Stripe customer/Connect IDs unchanged
- [ ] Centrifugo tokens/channels unchanged

**Prod Next routes that proxy media (must re-home):**

- [ ] e.g. archive editor stream route (`dashboard/archive/[id]/editor/stream`) — SPA must call API/CDN directly or edge-proxy equivalent

---

## Phase 7 — QA / E2E / screenshots

### 7.1 Automated

- [ ] Port or rewrite Playwright journeys (`tests/e2e/fresh-artist-journey.mjs`, go-live, chat, upload) for new selectors/URLs
- [ ] Keep API `vital-flows.sh` (money/governance) — still valid
- [ ] Add smoke: anonymous listen HLS, login cookie round-trip via proxy, subscribe redirect, embed iframe

### 7.2 Manual / beta soak

- [ ] Multi-day soak on `beta.tahti.live` with real artists (go-live + chat + upload)
- [ ] Board smoke on whichever admin host remains
- [ ] Mobile responsive pass (replace `responsive-audit` assumptions)

### 7.3 Screenshot atlas

- [ ] Refresh `tahti/docs/e2e-screenshots/` against new UI (not `website/screenshots/`)
- [ ] Update `manifest.json` route map (`/studio` vs `/dashboard`, etc.)
- [ ] Optionally keep Nuclear `/map/nuclear/` captures for historical compare; strip from prod build

### 7.4 SEO / a11y QA

- [ ] Fetch sample `/c`, `/u`, `/r` as crawler (curl UA) — meta tags present
- [ ] Lighthouse a11y on listen + login + go-live
- [ ] Keyboard chat + player controls

---

## Phase 8 — Cutover runbook

### 8.1 Pre-flight (T−7 … T−1)

- [ ] Feature freeze on cutover branch; FEATURES.md all P0 green
- [ ] Staging/canary host running candidate image against **prod API** or prod-clone
- [ ] Rollback artifact: previous `tahti/web:<oldsha>` pulled on manager
- [ ] Comms: artists (OBS unchanged), members (login URL if host changes)
- [ ] Verify Stripe return URLs / OAuth / email links on candidate
- [ ] Backup: DB already routine; no extra schema step

### 8.2 Freeze window

- [ ] Pause non-essential deploys (API/worker OK if compatible)
- [ ] Disable signup if risky (`SIGNUP_OPEN` / Vite equiv)
- [ ] Announce short listen disruption if any (should be near-zero)

### 8.3 Deploy

1. [ ] Build & push new `tahti/web` (SPA) image — `TAG=<sha>`
2. [ ] `make deploy TAG=<sha>` (or web-only service update) — **no DB migrate required for web-only**
3. [ ] Edge: confirm upstream healthy (`curl -sf https://tahti.live/` / `app.tahti.live`)
4. [ ] Smoke:
   - [ ] `/health` or `/` 200
   - [ ] Login → `/api/auth/me` 200 with cookie
   - [ ] `/c/<known-slug>` (or redirect) plays HLS
   - [ ] Chat connects
   - [ ] One studio authenticated page
   - [ ] One Stripe return URL hit (test mode) if applicable
5. [ ] Monitor Grafana/API 5xx, Centrifugo, CDN

### 8.4 DNS / NPM notes

- [ ] Prefer **image/upstream switch** over DNS TTL games (same hostname)
- [ ] If using canary hostname first: NPM path- or host-based split, then flip primary
- [ ] Wildcard channel host exclusions remain correct (`beta` etc.)

### 8.5 Rollback

- [ ] Swarm rollback / `make rollback` to previous web image
- [ ] Edge upstream back to Next container if split
- [ ] Re-enable signup
- [ ] Postmortem: cookie/proxy/path issues first suspects
- [ ] API/DB usually untouched — avoid schema rollback

---

## Phase 9 — Deprecate POC

- [ ] After soak (suggested ≥1–2 weeks): decide beta fate
- [ ] If sunset: remove NPM #61, stop `tahti-beta-web`, delete or archive `/srv/tahti-beta`
- [ ] Update `ops/beta-tahti-live.md` → “retired, see cutover”
- [ ] Archive `tahti-nuclear` deploy scripts or retarget them to prod image builds
- [ ] Upstream Nuclear: document whether fork tracks `nukeop/nuclear` for UI-only updates
- [ ] Remove link-outs and “POC” copy from UI
- [ ] License offer page `/agpl` serves full text + source link (AGPL compliance for network use)

---

## Phase 10 — Risks & open decisions

| Risk / decision | Why it matters | Options |
|-----------------|----------------|---------|
| **Nuclear branding vs Tahti brand** | First-paint identity; trust | Ship Nuclear look; skin tokens; hybrid listen Nuclear / studio Tahti |
| **AGPL** | Both codebases already AGPL-3.0 | Ensure source offer UX; if vendoring Nuclear, keep license headers & offer |
| **Bundle size (mermaid / three)** | Mobile listen UX | Mermaid already dynamic-import — **exclude from prod** or keep behind `/more`; lazy Three presets |
| **URL breakages** | SEO, embeds, emails, Stripe | Canonical prod paths + aliases (strongly recommended) |
| **Admin orphaning** | Board ops | Keep Next admin app on subdomain; schedule rewrite |
| **Marketing split** | Apex `/` ownership | Listen SPA at `app.` / `tahti.live/listen`; marketing stays `website/` |
| **SSR loss** | Social previews, sitemap | Prerender critical routes; API-driven OG endpoint; or edge worker |
| **Editor parity** | Artists rely on ffmpeg/waveform | Explicit MVP vs port `@tahti/audio-edit` |
| **OAuth callback UX** | Sources today link out to prod dashboard | Must complete loop on SPA before cutover |
| **Custom domains / wildcards** | Channel vanity hosts | SPA must resolve slug from host; retest Caddy rules |
| **Dual-session beta/prod** | Support confusion | Communicate re-login; sunset beta |
| **Repo sprawl** | Two monorepos | Prefer Option A (§3.1) for long-term |
| **Silent mocks** | False confidence | Prod build gates + runtime assert `import.meta.env.PROD` |

---

## Appendix A — Suggested ownership split

| Workstream | Primary repo | Notes |
|------------|--------------|-------|
| Parity features / UI | `tahti-nuclear` until move | FEATURES.md source of truth |
| API return URL / APP_URL | `tahti` | Small config/PR |
| Docker/Swarm/CI | `tahti` | Image contract |
| Beta host | `tahti-nuclear` deploy + `tahti/ops` | Until deprecated |
| E2E screenshots | `tahti/docs/e2e-screenshots` | After UI freeze |
| Marketing site | `tahti/website` | **Out of scope** unless asked |

---

## Appendix B — Quick reference commands

```bash
# Beta (POC) — live API, no mocks
cd /home/jani/workspace/tahti-nuclear
unset VITE_FORCE_MOCK VITE_ALLOW_MOCK_FALLBACK
pnpm deploy:tahti-beta
# → https://beta.tahti.live

# Prod stack (today)
cd /home/jani/workspace/tahti
make build-web TAG=<sha>
# deploy per ops/DEPLOY.md

# Feature tracker
# tahti-nuclear/packages/tahti-web/FEATURES.md
```

---

## Appendix C — Definition of done (production cutover)

- [ ] All **P0** checkboxes complete
- [ ] Production hostname serves SPA; login cookie works without visiting `api.` origin
- [ ] Legacy `/c/*` and `/dashboard/*` URLs resolve
- [ ] Stripe + OAuth returns land on SPA
- [ ] Admin reachable per chosen strategy
- [ ] Rollback tested once
- [ ] FEATURES.md marks “Production cutover for `apps/web`” done
- [ ] This document’s Phase 8 signed off in ops notes

---

*Living doc — update alongside FEATURES.md as parity closes. Mirror or link from `tahti/ops/nuclear-web-cutover.md`.*
