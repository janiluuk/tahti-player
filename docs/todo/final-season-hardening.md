# Final season - security / performance hardening

**Status:** open

From a 2026-10-17 sweep of `packages/tahti-web` + sibling `../tahti-org`
API/edge. Not a full pentest; concrete evidence only. Do not invent API.

The cutover is done (see [`packages/tahti-web/CUTOVER.md`](../../packages/tahti-web/CUTOVER.md));
its remaining ops items (prod build/container, rollback, crawler QA) live
there. Batch A (tahti-org #866-#871) and Batch B (tahti-player #1072-#1078)
shipped and are folded into [`HISTORY.md`](HISTORY.md). Only open items
remain below.

## P1

Shipped: deploy builds fail if the client bundle inlines an absolute
`VITE_TAHTI_API_URL` (same-origin `/tahti-api` only).

## P2 - hardening

| # | Item | Repo | Notes | Size |
| --- | --- | --- | --- | --- |
| 19 | Rate limit `RATE_LIMIT_REDIS_FAIL_OPEN=false` in prod | tahti-org | Default fail-open when Redis is down. Production now runs compose (`deploy_prod.sh`), not Swarm; set it there. Also `first-100-users-infra.md` #1 | S (config) |
| 20 | Host-only cookies + shrink credentialed `*.tahti.live` CORS / CSRF plan | tahti-org | Phase-7 double-submit never shipped; XSS on any subdomain = session | M |
| 21 | Enforce CSP (today report-only on API edge) | tahti-org | `infra/Caddyfile` `(security_headers)` | M |
| 22 | Upload magic / stricter `audio/*` verification | tahti-org | prepare/complete | M |
| 23 | Screen-reader pass on listen + studio critical paths | tahti-web | Also listed in CUTOVER "Still open" | L |
| 24 | Ambient WebGL cost (opt-in already; desktop CPU) | tahti-web / player | Known; reduced-motion/pause exist | M |
| 25 | Auth user PII in `localStorage` (`tahti-web-auth`) | tahti-web | Cookie is httpOnly; snapshot is XSS-readable | S |
| 26 | Product-flagged nav leftovers | tahti-web | Distribution StudioNav sibling, `/chat` chrome, mobile More - see feature-swipe flags if still open | product |

## Out of season

- AI-DJ / radio-dj POC (kill-switch; not production)
- Track visualizer video editor (PulseForge)
- Server-side multitrack render depth
- i18n / Tahti brand token remap

## Already OK (don't reopen)

- Mock gated in production builds (`buildPolicy.ts`)
- Stripe webhook signature fail-closed in prod
- Admin `requireBoard`; internal routes gated
- Session `credentials: 'include'` + same-origin cookie rewrite
- Three.js / mermaid lazy; queue virtualization >200
- Rate-limit plugin exists (auth/API tiers); support contact limited

Capacity / ops follow-on: [`first-100-users-infra.md`](first-100-users-infra.md).
