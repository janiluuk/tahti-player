# Final season — security / performance / cutover hardening

**Status:** partial

First fix list from a 2026-10-17 sweep of `packages/tahti-web` + sibling
`../tahti-org` API/edge. Goal: finish beta → production client cutover safely.
Not a full pentest; concrete evidence only. Do not invent API.

Related: [`packages/tahti-web/CUTOVER.md`](../../packages/tahti-web/CUTOVER.md),
[`FEATURES-REMAINING.md`](../../packages/tahti-web/FEATURES-REMAINING.md),
`tahti-org/ops/nuclear-web-cutover.md`.

## Season order (recommended)

1. **Live API safety** (can ship before cutover) — SSRF, suspend sessions, email display names, log scrubbing.
2. **Cutover P0 ops** — same-origin proxy, runbook rehearsal, vend SPA, diagnostics off, hCaptcha sitekey.
3. **Client security hardening** — `javascript:` hrefs, CSP, Stripe redirect allowlist.
4. **Perf / quality same train** — CDN CORS, feed N+1, Studio Music virtualization, error boundary.
5. **Post-soak** — a11y SR pass, rate-limit fail-closed, CSRF/host-only cookie model, upload magic.

---

## P0 — before production DNS / traffic flip

| # | Item | Repo | Why | Evidence | Size |
| --- | --- | --- | --- | --- | --- |
| 1 | **Avatar URL proxy SSRF** | tahti-org | Auth’d `GET /api/me/profile/avatar/proxy` fetches arbitrary URLs with no private-IP/DNS/redirect guards (unlike `fetch-image-url.ts`) | `apps/api/src/routes/me/avatar.ts`; DTO bare `.url()` | S — reuse `fetchImageFromUrl` |
| 2 | **Same-origin API proxy on prod edge** | both / ops | Host-only `tahti_session` via `/tahti-api` + cookie rewrite; without prod proxy, auth/OAuth break | CUTOVER P0 open; `tahti-web/deploy/nginx.conf`; `ops/beta-tahti-live.md` | L (ops) |
| 3 | **Cutover runbook rehearsed** | ops | Rollback = previous `tahti/web` image; never practiced on canary | CUTOVER P0 unchecked | L (ops) |
| 4 | **Vend SPA into `tahti-org` + replace image** | both | Option A decided; migration not started; CI still builds Next client | CUTOVER Phase 3.1; FEATURES-REMAINING cutover row | L |
| 5 | **Unsanitized user `href`s** | tahti-web | Channel links + governance `remoteUrl`/`minutesUrl` skip `isHttpUrl` → `javascript:` XSS/phishing | `ChannelViewBlocks.tsx`, `ChannelLinksEditor.tsx`, `GovernanceMeetingDetailView.tsx` | S |
| 6 | **Prod build: diagnostics off + hCaptcha sitekey** | tahti-web | Beta hardcodes `VITE_ENABLE_DIAGNOSTICS=1`; hCaptcha sitekey unset → chat join fails if API secret set | `deploy/deploy-vimage.sh`; `useHcaptcha.ts`; `buildPolicy.ts` | S |
| 7 | **SPA document CSP** | tahti-web | Only nosniff + Referrer-Policy; CSP only on disco-widget sandbox | `deploy/nginx.conf` | M |

## P1 — same release train or immediately after

| # | Item | Repo | Why | Evidence | Size |
| --- | --- | --- | --- | --- | --- |
| 8 | **`cdn.tahti.live` ACAO** | tahti-org | CORP only; Pro Editor Web Audio silent on archive CDN | `infra/Caddyfile` cdn block vs stream `Access-Control-Allow-Origin *` | S |
| 9 | **Suspended users keep sessions** | tahti-org | Login checks `suspendedAt`; `validateSession` / `requireAuth` do not | `routes/auth/login.ts`, `lib/session.ts`, `plugins/auth.ts` | S |
| 10 | **Email-as-display-name rejection** | tahti-org | No `safeDisplayName` / `containsEmail` on register/profile (player AGENTS assumes API rejects) | `packages/shared` DTOs; `routes/me/profile.ts`, `auth/register.ts` | S |
| 11 | **Feed N+1 playable resolution** | tahti-web | Per-item `fetchArtistPlayables` after feed load | `FeedView.tsx` | M |
| 12 | **Virtualize Studio Music list** | tahti-web | Full archive `<ul>` map; queue already virtualized | `StudioSoundsView.tsx` | M |
| 13 | **App / router error boundary** | tahti-web | Render throw → blank root | `TahtiApp.tsx`, `router.tsx` | S–M |
| 14 | **Stripe checkout/portal URL allowlist** | tahti-web | Raw `location.assign(checkoutUrl)` | Subscribe / signup / membership / release ops | S |
| 15 | **Scrub `INTERNAL_SECRET` from request logs** | tahti-org | Full `request.url` logged; Icecast/Liquidsoap `?secret=` | `plugins/request-log.ts`; internal routes | S |
| 16 | **Email bounce SNS `SubscribeURL` SSRF** | tahti-org | Post-auth `fetch(subscribeUrl)` with no allowlist | `routes/webhooks/email-bounce.ts` | S |
| 17 | **Collections `expand=items` unbounded** | tahti-org | No `take`; N+1 cover work | `routes/collections/me.ts` | M |
| 18 | **CI assert: no absolute `VITE_TAHTI_API_URL` in prod image** | tahti-web | Cross-origin API breaks host-only cookie model | `api/http.ts`; deploy unsets today | S |

## P2 — post-soak / hardening

| # | Item | Repo | Notes | Size |
| --- | --- | --- | --- | --- |
| 19 | Rate limit `RATE_LIMIT_REDIS_FAIL_OPEN=false` in prod | tahti-org | Default fail-open when Redis down | S (config) |
| 20 | Host-only cookies + shrink credentialed `*.tahti.live` CORS / CSRF plan | tahti-org | Phase-7 double-submit never shipped; XSS on any subdomain = session | M |
| 21 | Enforce CSP (today report-only on API edge) | tahti-org | `infra/Caddyfile` `(security_headers)` | M |
| 22 | Upload magic / stricter `audio/*` verification | tahti-org | prepare/complete | M |
| 23 | Screen-reader pass on listen + studio critical paths | tahti-web | CUTOVER P1 a11y still open | L |
| 24 | Ambient WebGL cost (opt-in already; desktop CPU) | tahti-web / player | Known; reduced-motion/pause exist | M |
| 25 | Auth user PII in `localStorage` (`tahti-web-auth`) | tahti-web | Cookie is httpOnly; snapshot is XSS-readable | S |
| 26 | Product-flagged nav leftovers | tahti-web | Distribution StudioNav sibling, `/chat` chrome, mobile More — see feature-swipe flags if still open | product |

## Explicitly out of season (do not block cutover)

- AI-DJ / radio-dj POC (kill-switch; not production)
- Track visualizer video editor (PulseForge)
- Server-side multitrack render depth
- Nuclear admin replacing Next `/admin/*` (decided out of path)
- i18n / Tahti brand token remap

## Already OK (don’t reopen)

- Mock gated in production builds (`buildPolicy.ts`)
- Stripe webhook signature fail-closed in prod
- Admin `requireBoard`; internal routes gated
- Session `credentials: 'include'` + beta cookie rewrite
- Three.js / mermaid lazy; queue virtualization >200
- Rate-limit plugin exists (auth/API tiers); support contact limited

## Done this season

_(append PR links as items ship; fold to HISTORY when season closes)_

| Item | PR |
| --- | --- |
| Avatar URL proxy SSRF | [tahti-org#866](https://github.com/janiluuk/tahti-org/pull/866) |
| Suspended session / token reject | [tahti-org#867](https://github.com/janiluuk/tahti-org/pull/867) |
| Email-as-display-name rejection | Already on `main` ([tahti-org#560](https://github.com/janiluuk/tahti-org/pull/560)) |
| CDN `cdn.tahti.live` ACAO | [tahti-org#868](https://github.com/janiluuk/tahti-org/pull/868) |
| Scrub `?secret=` from request logs | [tahti-org#869](https://github.com/janiluuk/tahti-org/pull/869) |
| SNS SubscribeURL SSRF | [tahti-org#870](https://github.com/janiluuk/tahti-org/pull/870) |
| Sanitize channel / governance hrefs | [tahti-player#1072](https://github.com/janiluuk/tahti-player/pull/1072) |
| Prod diagnostics off + hCaptcha sitekey path | [tahti-player#1073](https://github.com/janiluuk/tahti-player/pull/1073) |
| Stripe checkout/portal URL allowlist | [tahti-player#1074](https://github.com/janiluuk/tahti-player/pull/1074) |
| App / router error boundary | [tahti-player#1075](https://github.com/janiluuk/tahti-player/pull/1075) |

| Feed N+1 playable batching | [tahti-player#1076](https://github.com/janiluuk/tahti-player/pull/1076) |
| Virtualize Studio Music list | [tahti-player#1077](https://github.com/janiluuk/tahti-player/pull/1077) |
| SPA document CSP | [tahti-player#1078](https://github.com/janiluuk/tahti-player/pull/1078) |
| Collections `expand=items` take | [tahti-org#871](https://github.com/janiluuk/tahti-org/pull/871) |

## First ~100 users (follow-on)

Capacity / ops realism after Batch A/B: see [`first-100-users-infra.md`](first-100-users-infra.md)
(P0: Swarm rate-limit fail-closed, fallback pool cap, status-bar poll soften, backup cron verify).

