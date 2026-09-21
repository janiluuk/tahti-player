# CUTOVER — Nuclear `@tahti-player/tahti-web` → production `apps/web`

**Goal:** Replace the production Next.js client (`tahti-org` monorepo `apps/web`, served on `tahti.live` / `app.tahti.live`) with the Vite + Nuclear UI client (`@tahti-player/tahti-web`, currently `beta.tahti.live`).

**Repos**

| Tree | Role |
|------|------|
| `/home/jani/workspace/tahti-player/packages/tahti-web` | Beta POC (this package) |
| `/home/jani/workspace/tahti-org` | Production monorepo (API, worker, `apps/web`, Swarm, CI) |
| [`FEATURES.md`](FEATURES.md) | Prod → POC feature parity tracker |
| [`WORKPLAN.md`](WORKPLAN.md) | POC remaining checklist |
| [`SEO-OG-NOTES.md`](SEO-OG-NOTES.md) | SEO/OG current-state audit + plan |
| [`deploy/README.md`](deploy/README.md) | Beta deploy (vimage `:15180`) |
| `tahti-org/ops/beta-tahti-live.md` | Live beta routing / auth notes |
| `tahti-org/ops/ARCHITECTURE.md`, `DEPLOY.md`, `RUNBOOK.md` | Prod topology & rollouts |
| `tahti-org/docs/flows/site-map.md` | Canonical route map |
| `tahti-org/docs/e2e-screenshots/` | Screenshot atlas (apps/web) |

**Non-goals for this doc:** implementing features, deploying production, touching `website/` (static marketing site — separate stack).

---

## Executive summary

Beta already talks to **live** `api.tahti.live` / `chat.tahti.live` / `cdn.tahti.live` with democked auth, listen, studio core, Stripe fan-subs, DMs, and governance. Cutover is therefore mostly **client replacement + URL compatibility + hosting**, not a data migration.

**Blockers before flipping production traffic**

1. **Canonical URL compatibility** — prod uses `/c/:slug`, `/dashboard/*`, `/u/:user/subscribe`; POC uses `/channel/$slug`, `/studio/*`, `/subscribe/$username`. Without redirects/aliases, embeds, emails, Stripe returns, OAuth return URLs, and shared links break.
2. **Missing / partial product surfaces** — multitrack editor depth, help/legal depth, and production-only integration soak tests (see FEATURES.md).
3. **Admin & marketing split** — **Decided 2026-08-17:** the Nuclear admin port (22/22 pages, see [`UI-REDESIGN-WORKLOG.md`](UI-REDESIGN-WORKLOG.md) admin table) stays a completed side project, **not** on the cutover critical path. Production board admin keeps running the existing Next `/admin/*` on its current host (subdomain) after cutover; the listen/studio SPA does not need to serve `/admin/*` for go-live. Revisit switching admin over to Nuclear in a later, separate decision. `(marketing)` / apply / some info pages still live in `apps/web` while `website/` is a separate static site — host split for those still needs deciding.
4. **SSR/SEO regression** — Next `sitemap.ts`, `generateMetadata`, OG cards become SPA problems unless rebuilt (prerender, edge meta, or keep a thin SSR shell).
5. **Cookie / same-origin model** — today beta proxies `/tahti-api` → API so `tahti_session` is host-only on `beta.tahti.live`. Production must keep a **same-origin API proxy** (or deliberately set `Domain=.tahti.live`) and update `APP_URL` return paths.
6. **Repo / AGPL / UI stack** — both trees are AGPL. **Decided 2026-08-17:** vend `@tahti-player/tahti-web` + minimal Nuclear UI packages into `tahti-org` (Option A, §3.1) rather than a submodule/subtree or published-package split — single deploy train. **Decided 2026-08-17:** ship the current Nuclear look as-is; no Tahti-brand token remap before cutover.

**Recommended sequence:** freeze feature inventory → route alias layer → parity P0 → move package into `tahti-org` → replace `tahti/web` image with nginx SPA → dual-run behind canary host → cutover → soak → deprecate beta.

---

## Prioritized checklist (P0 / P1 / P2)

### P0 — must have before production DNS/NPM switch

- [x] **Decision:** monorepo placement — **Option A**, vend into `tahti-org` (`apps/web` or new `apps/listen`). See §4. Migration itself not yet started.
- [x] **Decision:** admin host after cutover — **Next `/admin/*` stays canonical** on its current host; Nuclear's 22-page admin port stays built but unused for now, revisit later.
- [x] **Decision:** marketing stays on the apex `website/`; the product SPA is canonical at `app.tahti.live`, with `/listen` linking to its listen home. The SPA keeps compatibility pages for `/for-artists`, `/how-it-works`, and `/about`, while `/apply` and `/signup` lead into its join flow.
- [x] **Route compatibility layer** — permanent redirects or dual routes for `/c/*` ↔ `/channel/*`, `/dashboard/*` ↔ `/studio/*`, subscribe paths, `/listen` → `/`.
- [x] **API `APP_URL` + Stripe/OAuth return URLs** have matching SPA aliases for the current production API strings, including Sources OAuth, membership, fan subscriptions, Stripe Connect, distribution, and social OAuth. Production still needs `APP_URL=https://app.tahti.live` at the traffic flip.
- [ ] **Same-origin API proxy** on production web edge — the SPA nginx image contract now includes `/tahti-api`, `/api`, host-safe cookie rewriting, forwarded host/protocol, and `/health`; the production service/upstream switch remains pending. Centrifugo WS stays `wss://chat.tahti.live`.
- [x] **Parity P0 features** from FEATURES.md: membership purchase, password/security, in-client setup-channel, venue register, and Sources OAuth callback returns are implemented in the SPA.
- [x] **Strip / gate POC-only surfaces** for prod builds: `/more` and Screen atlas require `VITE_ENABLE_DIAGNOSTICS=1`; mock-enabled production builds now fail. Beta explicitly enables diagnostics for review.
- [x] **SEO minimum:** `robots.txt`, a static + API-fed sitemap index, canonical tags, and route-aware browser metadata for `/c`, `/u`, `/r` are implemented. Server-rendered dynamic OG values for non-JS bots now come from `GET /api/og/{channel,profile,release}/:slug` in `tahti/apps/api` (new `apps/api/src/routes/og.ts`), proxied to by a bot-user-agent `map` in `deploy/nginx.conf` — see [`SEO-OG-NOTES.md`](SEO-OG-NOTES.md) for the audit and design. Real browsers/JS-executing crawlers are unaffected and still get the client-side sync.
- [x] **Playwright / vital journey** covers callback compatibility, mock login, go-live, upload, subscription offers, keyboard navigation, and the beta review map.
- [ ] **Cutover runbook rehearsed** on staging/canary (rollback = previous `tahti/web` image + NPM/Caddy upstream).
- [x] **Legal pages** bind to real terms/privacy/AGPL (not “POC summary + link-out”). `TermsView`/`PrivacyView`/`AgplView` port prod's actual `(info)/terms`, `/privacy`, `/agpl` page copy verbatim (`/home/jani/workspace/tahti-org/apps/web/src/app/(info)/...`) instead of a short summary linking out to `tahti.live`.

### P1 — should ship in the same release train or immediately after

- [ ] Distribution, radio slots, moderate, press-kit / invites polish, listener-only dashboard.
- [x] Full visualizer preset parity — ten distinct Three.js scenes, lazy-loaded outside the initial listen bundle.
- [ ] Multitrack / pro editor depth vs prod ffmpeg/waveform stack (port or keep “good enough”).
- [x] Nuclear screenshot atlas refreshed across all 38 referenced beta screens; each comparison now explains what the user can do, and the Mermaid site map reflects the current route and workspace structure. Production `tahti-org/docs/e2e-screenshots/` remains a post-vendoring follow-up.
- [ ] Accessibility pass (keyboard, focus, live regions, contrast) on listen + studio critical paths. Covered so far: player bar seek/volume/controls keyboard + ARIA, chat `role="log"` live region and reaction labels (earlier pass); global search now a real combobox (arrow-key roving through results, `aria-activedescendant`, `role="listbox"`/`option`) instead of Tab-only; `MobileDrawer` (mobile nav/chat/queue slide-over) gained a focus trap + Escape-to-close (it was hand-rolled without either); nav links (`SidebarNavigationItem` in `@tahti-player/ui`, mobile bottom nav) now set `aria-current="page"`. Studio upload path: `StudioUploadView` and `UploadTrackDialog` had a validation/error message `<p>` with no live-region role at all (screen readers got zero announcement on a failed upload) — added `role="alert"` for errors, `role="status"` for the dialog's success note, matching the `role="alert"`/`role="status"` split already used elsewhere (`TrackEditDialog`, `StudioChannelView`). `StudioGoLiveView`'s status banner already has `role="status"`, but always at that priority (never `role="alert"`) and detects "is this an error" via a fragile message-text regex rather than real state — noted, not fixed this pass. Still open: contrast audit, and the go-live/editor half of the Studio critical-path pass.
- [x] Bundle budget: mermaid is lazy (own `mermaid.core-*`/`cytoscape.esm-*`/`katex-*` chunks, confirmed in build output); Three.js is lazy too (`ChannelVisualizer.tsx` already `lazy()`-imports `ThreeVisualizer`, its own 528 kB chunk, not in `index-*.js`). CSS audit: one 152 kB CSS file for the whole app (`dist/assets/index-*.css`) — expected given Tailwind's JIT scans all sources into one stylesheet regardless of route; genuine per-route CSS splitting isn't a quick config flip without restructuring how Tailwind is wired into the build, so leaving as a known limitation rather than a bug. `LibraryView` (History's charts, `react-activity-calendar`) was pulled out of the main bundle this session (own 326 kB chunk) after it briefly regressed the main `index-*.js` by +367 kB.
- [ ] CI: replace `apps/web` Docker build with SPA build; keep lint/format/typecheck gates.
- [ ] Preview/PR envs serve the new client (or document that previews stay Next until cutover).
- [ ] CDN CORS + embed parents verified for SPA origin. **Embed parents: verified clean** — `deploy/nginx.conf` sets no `X-Frame-Options`/`frame-ancestors` on the SPA's own routes (the one `frame-ancestors 'none'` in that file is scoped to the unrelated disco-widget sandbox iframe document), so `/embed/*` isn't blocked from being framed by third-party sites. **CDN CORS: real gap found, not yet fixed** — `tahti-org/infra/Caddyfile`'s `cdn.tahti.live` block (archive items/covers/waveforms — what `StudioProEditorView`'s audio source resolves to) sets `Cross-Origin-Resource-Policy: cross-origin` but no `Access-Control-Allow-Origin`, unlike the sibling `stream.tahti.live` (live HLS) block which has `Access-Control-Allow-Origin "*"`. CORP alone doesn't satisfy a CORS check, so the Pro Editor's `crossOrigin="anonymous"` load of cdn-hosted audio (see the comment above the `audio.crossOrigin = 'anonymous'` line in `StudioProEditorView.tsx`) fails and silently falls back to non-CORS playback — the live Web Audio preview graph (EQ/Compressor/Limiter/Filter, `src/plugins/audio-fx/`) goes inaudible with no user-facing indication for any archive item served from `cdn.tahti.live`. Fix is a one-line addition mirroring the `stream.tahti.live` block (`header Access-Control-Allow-Origin "*"` in the `cdn.tahti.live` block); left unmade here — production Caddy edge config in the `tahti-org` repo, not something to push through without the person who owns that deploy signing off.
- [x] Help/support form live (not link-out only) — `SupportContactForm` posts to the real `POST /api/support/contact` (see FEATURES.md).

### P2 — follow-ups / nice-to-have

- [ ] i18n strategy (neither client is truly localized today — decide before investing).
- [ ] Rebrand Nuclear themes → Tahti brand tokens (or keep Nuclear as differentiator).
- [ ] Upstream Nuclear sync policy for `@tahti-player/ui` / themes.
- [ ] Deprecate `beta.tahti.live` (DNS/NPM #61, `/srv/tahti-beta`) or keep as canary.
- [ ] Archive or slim `apps/web` Next tree (admin-only extract).
- [ ] Channel custom-domain / wildcard host behaviour with SPA (Caddy/NPM #55).
- [ ] Client-only storage migration story for favorites/history (localStorage namespaced).
- [x] **Desktop MCP / MPD / Jam** — Nuclear MCP remains in `@tahti-player/player` **as-is** (not a SPA feature). Documented in [`docs/MCP.md`](docs/MCP.md); verify with `scripts/verify-nuclear-mcp-parity.mjs`.

---

## Phase 0 — Decisions & freeze

- [ ] **0.1** Freeze FEATURES.md statuses; tag a “cutover baseline” commit on `tahti-player` and note matching `tahti-org` API SHA.
- [x] **0.2** Choose **placement** (see §4) and **admin strategy** (see §1.1) — **decided 2026-08-17:** Option A monorepo placement; Next `/admin/*` stays canonical, Nuclear admin port shelved for now.
- [x] **0.3** Choose **URL policy** — preserve prod paths as canonical (already implemented via `prodPathRedirects`, P0 route-compatibility box above is checked).
- [x] **0.4** Choose **brand policy** — **decided 2026-08-17:** ship Nuclear look as-is, no Tahti-skin token remap.
- [x] **0.5** Choose **beta fate** — **decided 2026-08-17:** sunset after a soak period post-cutover (Phase 9), not a permanent canary or rename.
- [x] **0.6** Confirm **out-of-scope** list: apex marketing remains in `website/`; Next admin remains separate; multitrack rendering depth and optional integration polish do not block the client replacement.
- [x] **0.7** Production repo pointer exists at `ops/nuclear-web-cutover.md` and links back to this source-of-truth plan.

---

## Phase 1 — Gap inventory

Track against [`FEATURES.md`](FEATURES.md) and `tahti-org/docs/flows/site-map.md`. Update checkboxes here as inventory closes.

### 1.1 Scope boundaries

| Area | Prod today | Cutover stance | Action |
|------|------------|----------------|--------|
| Board admin `/admin/*` | Next in `apps/web` (~35 pages) | Nuclear port **complete** (22/22 pages, gated on `user.isBoard`) but **decided out of the cutover critical path** — Next admin stays canonical after cutover | DONE Nuclear port; TODO no cutover action needed unless the admin-host decision is revisited |
| Marketing `website/` | Separate static nginx image | **Do not merge into SPA**; apex `/` remains the marketing home | DONE; link `/listen` to `https://app.tahti.live/` at cutover |
| `(marketing)` / `(info)` in apps/web | `/`, `/apply`, `/for-artists`, `/how-it-works`, … | Minimal compatibility routes already exist in the SPA | DONE for routing; SEO rendering remains a separate P0 item |
| Embeds `/embed/*` | Next + `@tahti/ui` | POC has routes | TODO Parity QA (c/r/col/u) + iframe CSP |
| SSR / SEO | Next sitemap + metadata | SPA gap | DONE — client-side sync + `/api/og/*` bot proxy shipped; deploy + Phase 7.4 crawler QA still pending |
| i18n | Essentially EN-only both sides | No hard gap | TODO Explicit non-goal or future track |
| Accessibility | Mixed | Not systematically ported | TODO Audit P1 |

### 1.2 Feature matrix (summary — detail in FEATURES.md)

**Shipped on beta (`live-api`)** — verify once more on cutover candidate build:

- [ ] Listen directory, channel HLS/archive/chat, radio, profile, collections, smart links
- [ ] Auth login / TOTP / register / logout / email verify
- [ ] Follows, fan subscribe checkout, DMs, governance
- [ ] Studio: go-live, music/archive, upload, releases, collections designer, schedule, stats (+ detail), channel design, updates, revenue/Connect, stash
- [ ] Fan-tier editor, add-to-playlist, embeds, status/transparency

**Partial / missing (must classify P0 vs defer):**

- [x] Venue register
- [ ] Membership purchase (`/signup/payment`)
- [ ] Password / security settings
- [ ] Listener-only dashboard
- [ ] Distribution / radio slots / moderate
- [x] Setup-channel (in-app `/studio/setup-channel` + `/api/me/channel/provision`)
- [x] Sources OAuth silent-mock polish
- [x] Full Three.js visualizer preset set
- [ ] Multitrack timeline + press-kit polish
- [ ] Help depth / support form
- [x] Legal pages full text (not summary)

### 1.3 Route map diff (compatibility required)

| Prod | POC | Cutover need |
|------|-----|--------------|
| Apex `/` marketing; `app.` `/` listen | `/` listen hub | DONE host ownership decision; edge wiring remains Phase 5 |
| `/listen` | `/` | DONE Alias `/listen` |
| `/c/:slug` | `/channel/$slug` | DONE **P0** redirect alias |
| `/dashboard/*` | `/studio/*` | DONE **P0** aliases (`prodPathRedirects`) |
| `/u/:user/subscribe` | `/subscribe/$username` | DONE **P0** alias |
| `/dashboard/messages` | `/library/messages` | DONE Alias |
| `/listen` | `/` | DONE Alias |
| `/dashboard/setup-channel` | `/studio/setup-channel` | DONE In-app provision |
| `/signup/*` | `/signup`, `/signup/payment` | DONE Join + membership checkout |
| `/admin/*` | Nuclear port exists; Next remains canonical | DONE Host decision |
| `/apply` | `/join` | DONE Alias |
| `/v/:slug` venues public? | `/venues` list | DONE `VenuesView`/`VenueDetailView` are live-API, `venueDetailRoute` is `/v/$slug` matching prod exactly; register flow at `/venues/register` |
| `/more`, `/themes` | POC-only / Nuclear | DONE `/themes` is a redirect to real `/settings/$section` (not POC-only); `/more` already `beforeLoad`-redirects to `/` unless `VITE_ENABLE_DIAGNOSTICS=1`. Found and fixed a real bug while verifying this: 7 production views (`ChatView`, `GovernanceView`, `HelpView`, `LegalView`×2, `StatusView`, `TransparencyView`, `VenuesView`) linked to `/more` as a "Tahti map" breadcrumb, which silently bounced real users to `/` in prod builds. Extracted `TahtiMapLink` (`src/components/TahtiMapLink.tsx`), which renders nothing when diagnostics are off |

### 1.4 Client-only / non-API state

- [x] Document localStorage keys: theme, chat handle, favorites/history scopes (`libraryStore`) — see [`LOCALSTORAGE-KEYS.md`](LOCALSTORAGE-KEYS.md); `tahti-web:library:{scope}` is already per-user/anon, no migration step needed at cutover
- [x] Confirm no IndexedDB / service worker assumptions that differ from Next — grepped: zero `indexedDB`/`serviceWorker`/`workbox` usage anywhere in `src`, no PWA plugin in `vite.config.ts`, no service-worker file in `public/`. Nothing to reconcile.
- [x] No DB migrations expected (same API) — still verify no Next server-actions-only writes — this package has no `next` dependency at all and zero `"use server"` directives or `next/*` imports; every mutation already goes through `requestJson`/`fetch` against the real API, there's no Next-specific write path that could be left behind.

---

## Phase 2 — Feature parity workstream

Work from FEATURES.md; mark done there and here.

### 2.1 Listen / public

- [x] Channel URL canonicalization (`/c/:slug`) — `prodChannelAliasRoute` (`router.tsx`) redirects `/c/$slug` → `/channel/$slug`, already covered by the P0 route-compatibility item; this was a stale duplicate checkbox.
- [x] Chat captcha + access gating (already hardened — regression test) — audited `tahti/apps/api`: `verifyHcaptcha` fails closed when a real secret is configured (missing/invalid token → rejected), `ChatBan` is checked on both token-issue *and* message-send (defense in depth), message length is schema-capped at 500 chars (`ChatPublishProxySchema`), and `/api/chat/message` (the Centrifugo publish-proxy webhook) is gated to internal-network-only callers via `isTrustedInternalRequest` (SEC-007 — was previously reachable from the public internet, already fixed). The join-vs-publish Redis-cache fail-open/fail-closed split is deliberate and documented in `chat-captcha.ts`. No gaps found.
- [ ] Radio parity + overlays
- [x] Smart link + collection OG/share — release (`/r/*`) already had bot-facing OG; added the same for collections (`GET /api/og/collection/:slug` in `tahti/apps/api`, plus a matching nginx bot-proxy location for `/u/:username/c/:slug`). Verified: 10/10 API tests passing against a real disposable Postgres, and the nginx rewrite/precedence logic confirmed live against a real nginx container (bot UA → correct `collection:$slug` match, real browser UA → unaffected SPA fallback, an extra path segment matches neither location).
- [x] Venues list + register — `/venues`, `/venues/register`, `/v/:slug` all live-API, path matches prod
- [ ] Embed players offline/third-party site test

### 2.2 Auth / account

- [ ] Login / TOTP / register / verify / logout (regression)
- [ ] Membership purchase flow
- [ ] Password change + security (TOTP enroll if prod has it)
- [ ] Session cookie via same-origin proxy only (no direct `api.tahti.live` cookie split)

### 2.3 Listener

- [ ] Follows / library — **checked, real gap.** `followArtist`/`unfollowArtist`/`fetchFollowing` (`api/client.ts`) and `mergeServerFollowing` (`libraryStore.ts`, wired into login) are fully implemented server-round-trip functions, but grepped every view/component in `src` and none of them call `followArtist`/`unfollowArtist` — there is no Follow button anywhere in the SPA, and no page renders `fetchFollowing`'s result as a following list. The API surface is real; the UI for it doesn't exist.
- [ ] Fan subscribe + customer portal returns
- [x] Governance vote/comments — verified real and working: motion discussion (`postMotionComment`/`fetchMotionComments`) supports reading existing comments and posting new ones on open motions; a closed motion's discussion is correctly read-only (no comment box). New e2e coverage in `real-user-journeys.spec.ts`, run live against a dev server.
- [x] DMs — `MessagesView.tsx` (237 lines) is fully API-backed (`api/messages.ts`), already indirectly exercised by the existing `cutover-vital.spec.ts` suite (`/messages` heading assertion).
- [x] Listener dashboard (or explicit redirect to `/library`) — `DashboardAliasView.tsx` (bare `/dashboard`) sends a member without a channel to `/feed`, not `/library` — a deliberate choice per its own doc comment ("Feed: posts/tracks/releases from artists they follow ... instead of the 'create a channel' wall"), not a gap. Channel-having accounts go to `/studio`.

### 2.4 Artist studio

- [x] Studio home + **in-app setup-channel**
- [ ] Go Live / multistream / signal meters
- [ ] Upload prepare→PUT→complete + imports (SC/Bandcamp/Drive/URL)
- [ ] Archive / releases / collections designer
- [ ] Schedule / stats / revenue
- [ ] Stash
- [x] Distribution / radio slots / moderate (P1)
- [ ] Editor depth decision (Tone/ffmpeg vs Nuclear EQ/stems)

### 2.5 Settings / sources / money

- [ ] Settings sections vs prod settings subnav — map 1:1 critical fields
- [ ] Fan-tier CRUD
- [x] Sources OAuth: start on SPA, callback lands on matching in-client source result
- [x] Remove production link-outs in `sources.ts` / AccountView once paths exist — grepped `api/sources.ts` for `tahti.live`: none. Every `SourceDef.oauthStartPath`/`studioDeepLink` already points at an in-app SPA path (`/sources/:id`, `/studio/upload`, etc.), consumed via `src/plugins/import-sources/`. No standalone `AccountView.tsx` exists in this codebase — settings/account live in `SettingsPanels.tsx`, also link-out-free for sources. Nothing left to remove.

### 2.6 Payments / Stripe

- [ ] Fan subscribe Checkout
- [ ] Connect onboard + portal (`refreshUrl` / `returnUrl` currently `${APP_URL}/dashboard?…`)
- [ ] Membership Stripe/dev-direct parity with vital-flows
- [ ] Webhook unchanged (API) — only success/cancel URLs

### 2.7 Visualizers

- [x] Port the full ten-preset Three.js catalog from `apps/web`
- [x] Analyser wiring on live + archive
- [x] Keep Three.js out of the initial listen bundle with a lazy visualizer chunk

---

## Phase 3 — Architecture

### 3.1 Monorepo placement (pick one)

**Option A — Move into `tahti-org` — DECIDED 2026-08-17, this is the path**

Per the admin-host decision (§0.2 / §1.1), Next `apps/web` is **not** fully retired — it keeps serving `/admin/*` on its current host. The new SPA takes over listen/studio/everything-else as a new app.

- [ ] Copy/vend `@tahti-player/tahti-web` → new `apps/listen` (do not replace `apps/web` in place, since it must keep serving admin)
- [ ] Vend minimal Nuclear deps: `@tahti-player/ui`, `themes`, `tailwind-config`, `model` (or rename `@tahti/nuclear-ui`)
- [ ] Wire `pnpm-workspace.yaml`, turbo lint/typecheck, Dockerfile SPA build
- [ ] Shrink Next `apps/web` to admin-only: strip listen/studio/public routes it no longer serves once the SPA is canonical for those, keep `/admin/*`

**Option B — Keep fork, ship image only**

- [ ] CI in `tahti-player` builds `registry.tahti.live/tahti/web:<tag>`
- [ ] `tahti-org` deploy.yml consumes that image (or dual registry)
- [ ] Clear ownership: who bumps UI packages / AGPL source offer

**Option C — Hybrid**

- [ ] `tahti-org` git subtree/submodule of `packages/tahti-web` + Nuclear UI packages
- [ ] Document sync cadence with `nukeop/nuclear` upstream

### 3.2 UI libraries

- [ ] Stop dual design systems long-term: Nuclear UI for listen/studio; `@tahti/ui` only if admin/marketing remain
- [ ] Token mapping: Nuclear CSS variables ↔ Tahti brand tokens (if rebrand)
- [ ] Do **not** reintroduce `apps/web/src/components/ui` duplicates

### 3.3 API contract

- [ ] Continue browser → same-origin `/api` or `/tahti-api` → `api.tahti.live`
- [ ] Inventory POC client modules (`api/client.ts`, `broadcast.ts`, `studio.ts`, `sources.ts`, `messages.ts`, `revenue.ts`) vs OpenAPI
- [x] Remove mock fallback from production builds (already gated — audit all call sites) — audited every `catch` block across `src/api/*.ts` that references a `mock*` fixture: most already gate correctly through `allowMockFallback()`/`withMockFallback()` (`client.ts`, `broadcast.ts`, `discover.ts`, `distribution.ts`, `messages.ts`, `revenue.ts`, `studio.ts`), but found and fixed **11 real gaps** across `admin.ts` (5 — dashboard KPIs, radio admin, governance overview, integration status, languages), `artist-settings.ts` (4 — notification/discovery prefs, social connections, press kit), `channel-design.ts` (1 — visual/color scheme), and `studio-extras.ts` (1 — own profile) that unconditionally served rich fixture data (fake KPI numbers, a fabricated "Demo Artist" bio, etc.) on **any** API failure, regardless of environment — the exact "silent mocks: false confidence" risk this doc's own Phase 10 table names. All 4 files also had their own duplicated local `forceMock`/`failMeta` instead of importing `./mode`; consolidated. Regression test added (`admin.test.ts`) proving a production-mode failure now returns real empty/zeroed data with `meta.source: 'api'`, not the mock fixture.
- [ ] Centrifugo: `VITE_CENTRIFUGO_WS` / equivalent build arg

### 3.4 Env vars (build-time)

| Prod Next | SPA Vite | Notes |
|-----------|----------|-------|
| `NEXT_PUBLIC_API_URL` / `API_BASE` | unset + proxy, or `VITE_TAHTI_API_URL` | Prefer proxy |
| `NEXT_PUBLIC_CENTRIFUGO_WS` | `VITE_CENTRIFUGO_WS` | |
| `NEXT_PUBLIC_APP_URL` | `VITE_APP_URL` (add if missing) | Absolute links, OG |
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | `VITE_HCAPTCHA_SITEKEY` | Chat/join |
| `SIGNUP_OPEN` | `VITE_SIGNUP_OPEN` | |
| — | `VITE_FORCE_MOCK` / `VITE_ALLOW_MOCK_FALLBACK` | **Must be unset/0 in prod** |

- [ ] Mirror Dockerfile `ARG`/`ENV` pattern from `apps/web/Dockerfile` for Vite
- [ ] API-side `APP_URL` / `PUBLIC_WEB_URL` updated when canonical host/paths change

---

## Phase 4 — Auth, cookies, domains

### 4.1 Current beta model (keep for production SPA)

- Session cookie `tahti_session`: **host-only**, `httpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/` (no `Domain=`)
- Login must hit **same origin** as the SPA so `Set-Cookie` attaches to `tahti.live` (or `app.tahti.live`)
- Beta nginx already does `/tahti-api/` and `/api/` → `https://api.tahti.live/`, rewriting an explicit API cookie domain to the browser host when present

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

- [x] Chat WS `wss://chat.tahti.live/connection/websocket` from SPA origin — `ChannelChatPanel.tsx`'s `centrifugoWsUrl()` defaults to exactly that for any non-dev build when `VITE_CENTRIFUGO_WS` isn't explicitly set (dev-only fallback is `ws://localhost:8000/...`); `deploy-vimage.sh` also sets it explicitly to the same value. Confirmed correct.
- [ ] HLS/CDN absolute URLs unchanged; CORS includes new origin if any
- [ ] Captcha sitekey present in prod build — **checked, currently missing.** `deploy/deploy-vimage.sh` (the only deploy path this repo has) never sets `VITE_HCAPTCHA_SITEKEY` — it's not in the script's explicit env list, no `.env` file exists in this checkout, and it wasn't exported in the shell that ran the beta deploy just now. `useHcaptcha.ts`'s `configured` check means the SPA degrades gracefully client-side (no widget renders, join proceeds token-less rather than erroring) — but per the earlier chat-captcha audit (§2.1), the API's `verifyHcaptcha` fails closed *if* a real `HCAPTCHA_SECRET` is configured server-side, which would mean chat join is currently broken on beta for exactly that reason. Couldn't verify the server-side secret state without probing production config, which is out of scope here. The script itself needs no code change — it doesn't unset `VITE_HCAPTCHA_SITEKEY`, so it already passes through from the deploying shell's environment — this is a missing secret in whoever's shell runs the deploy, not a script bug. (Also fixed a doc bug while here: the env-var table below said `VITE_HCAPTCHA_SITE_KEY`; the actual code/`.env.example`/`vite-env.d.ts` all agree on `VITE_HCAPTCHA_SITEKEY`, no separating underscore.)

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

- [ ] Refresh `tahti-org/docs/e2e-screenshots/` against new UI (not `website/screenshots/`)
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
- [ ] Archive `tahti-player` deploy scripts or retarget them to prod image builds
- [ ] Upstream Nuclear: document whether fork tracks `nukeop/nuclear` for UI-only updates
- [ ] Remove link-outs and “POC” copy from UI
- [ ] License offer page `/agpl` serves full text + source link (AGPL compliance for network use)

---

## Desktop integrations (MCP / MPD / Jam)

Nuclear’s **MCP server** is Tauri-only (`packages/player` + `plugin-sdk/mcp`), localhost Streamable HTTP on `:8800–8809`. It is **preserved as-is** in this fork (parity with upstream `nuclear`). It is **out of scope** for the SPA cutover / `beta.tahti.live` — do not expose `/mcp` on the public edge. See [`docs/MCP.md`](docs/MCP.md).

## Phase 10 — Risks & open decisions

| Risk / decision | Why it matters | Options |
|-----------------|----------------|---------|
| **Nuclear branding vs Tahti brand** | First-paint identity; trust | **Decided:** ship Nuclear look as-is |
| **AGPL** | Both codebases already AGPL-3.0 | Ensure source offer UX; if vendoring Nuclear, keep license headers & offer |
| **Bundle size (mermaid / three)** | Mobile listen UX | Mermaid already dynamic-import — **exclude from prod** or keep behind `/more`; lazy Three presets |
| **URL breakages** | SEO, embeds, emails, Stripe | Canonical prod paths + aliases (strongly recommended) |
| **Admin orphaning** | Board ops | **Decided:** keep Next admin app on its current host; Nuclear's 22-page admin port stays built but shelved — schedule a future rewrite decision separately |
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
| Parity features / UI | `tahti-player` until move | FEATURES.md source of truth |
| API return URL / APP_URL | `tahti-org` | Small config/PR |
| Docker/Swarm/CI | `tahti-org` | Image contract |
| Beta host | `tahti-player` deploy + `tahti-org/ops` | Until deprecated |
| E2E screenshots | `tahti-org/docs/e2e-screenshots` | After UI freeze |
| Marketing site | `tahti-org/website` | **Out of scope** unless asked |

---

## Appendix B — Quick reference commands

```bash
# Beta (POC) — live API, no mocks
cd /home/jani/workspace/tahti-player
unset VITE_FORCE_MOCK VITE_ALLOW_MOCK_FALLBACK
pnpm deploy:tahti-beta
# → https://beta.tahti.live

# Prod stack (today)
cd /home/jani/workspace/tahti-org
make build-web TAG=<sha>
# deploy per ops/DEPLOY.md

# Feature tracker
# tahti-player/packages/tahti-web/FEATURES.md
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

*Living doc — update alongside FEATURES.md as parity closes. Mirror or link from `tahti-org/ops/nuclear-web-cutover.md`.*
