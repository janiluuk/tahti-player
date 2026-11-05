# Final season - security / performance hardening

**Status:** open

From a 2026-10-17 sweep of `packages/tahti-web` + sibling `../tahti-org`
API/edge. Not a full pentest; concrete evidence only. Do not invent API.

The cutover is done; the hosting state and its open ops items are below.
Batch A (tahti-org #866-#871) and Batch B (tahti-player #1072-#1078)
shipped and are folded into [`HISTORY.md`](HISTORY.md). Only open items
remain below.

## Hosting today (2026-10-28, from the retired CUTOVER.md)

- **2026-10-21 proxy flip:** Pi4 NPM forwards every public host (apex, `www`,
  `app`, `beta`, `admin`, `staging`, `<slug>.tahti.live`, `radio`, embed) to
  the `tahti-beta-web` container on vimage `:15180`. The container serves
  `dist/` and proxies `/tahti-api` and `/api` to `https://api.tahti.live`
  (same-origin, host-only `tahti_session`).
- **2026-10-28, tahti-org #1030:** the legacy Next.js `apps/web` is removed.
  Board admin is the SPA admin (`/admin/*`); see
  [`docs/DECISIONS.md`](../DECISIONS.md). `@tahti/ui`,
  `@tahti/api-client` and `@tahti/addon-sdk` stay in tahti-org.
- Custom-domain host routing (PLAT-051) is gone; no channel uses a custom
  domain. Channel subdomains open their channel (#1456, #1702).
- **Deploys:** merging tahti-player `master` rebuilds and redeploys the SPA
  (`.github/workflows/deploy-tahti-web-selfhosted.yml`, self-hosted runner on
  vimage, see [`deploy/README.md`](../../packages/tahti-web/deploy/README.md)). Merging tahti-org
  `main` deploys the API/worker stack to production (`deploy-production.yml`
  → `scripts/deploy_prod.sh`, compose up on vimage). The `v*`-tag Swarm
  `deploy.yml` path is dormant.
- Route aliases for old `/c/*`, `/dashboard/*`, `/u/:user/subscribe`, OAuth
  and Stripe returns: `lib/prodPathRedirects.ts`, `lib/cutoverReturns.ts`.

## Hosting and ops still open

Items marked **verify** were never confirmed done; check before closing them.

- [ ] **Production build and container.** Production traffic runs on the
  beta container (`tahti-beta-web`, `/srv/tahti-beta`), and the CI deploy
  builds with `VITE_ENABLE_DIAGNOSTICS=1`, so `/more` and the Screen atlas
  are on every public host. Decide: prod-profile build in CI
  (`TAHTI_WEB_DEPLOY_PROFILE=prod` equivalent) and a production-named
  container/path or image. Also decide whether vending the SPA into
  tahti-org (Option A, decided 2026-08-17, never started) is still wanted.
- [ ] **hCaptcha sitekey (verify).** The CI build does not pass
  `VITE_HCAPTCHA_SITEKEY`. If the API has `HCAPTCHA_SECRET` set, chat join
  fails closed.
- [ ] **Apex vs marketing site.** The apex serves the SPA, but
  `tahti-org/website/` still exists and `deploy-production.yml` still
  deploys it. Decide whether to retire `website/` or put it back on the apex.
  `index.html` canonical is `https://app.tahti.live/`; confirm the canonical
  host once this is decided.
- [ ] **`beta.tahti.live` fate.** NPM #61 points at the same container. The
  2026-08-17 plan was to sunset beta after a soak; decide alias, redirect or
  remove.
- [ ] **SEO crawler QA (verify).** Client-side metadata and the bot OG proxy
  (`deploy/nginx.conf` → `GET /api/og/*` in tahti-org) are built. Fetch
  `/c`, `/u`, `/r`, `/t`, `/v` and `/u/:user/c/:slug` with a bot user agent
  on the production hosts and confirm the tags. Notes:
  [`SEO-OG-NOTES.md`](../../packages/tahti-web/SEO-OG-NOTES.md).
- [ ] **Rollback (verify).** With Next gone, rollback means redeploying an
  earlier tahti-player commit's build. Never rehearsed.
- [ ] **Post-switch regression (verify).** The no-drop ledger (the archived
  `GAP-MAPPING.md`, see [`docs/ARCHIVE.md`](../ARCHIVE.md)) was never ticked on the final host:
  login/TOTP, membership checkout, fan subscribe and portal returns, Stripe
  Connect, OAuth source returns, email links (`APP_URL`), embeds on a
  third-party page, go-live and upload.
- [ ] **Accessibility:** a real screen-reader pass on listen and studio
  critical paths (also P2 #23 below).
- [ ] **P2 policy:** upstream Nuclear sync policy for `@tahti-player/ui` and
  themes; favorites/history stay device-local ([`LOCALSTORAGE-KEYS.md`](../../packages/tahti-web/LOCALSTORAGE-KEYS.md)) unless
  an API sync is added.

Desktop MCP / MPD / Jam are desktop-only; never expose `/mcp` on the public
edge ([`docs/MCP.md`](../../packages/tahti-web/docs/MCP.md)).


## P1

Shipped: deploy builds fail if the client bundle inlines an absolute
`VITE_TAHTI_API_URL` (same-origin `/tahti-api` only).

## P2 - hardening

| # | Item | Repo | Notes | Size |
| --- | --- | --- | --- | --- |
| 20 | Host-only cookies + shrink credentialed `*.tahti.live` CORS / CSRF plan | tahti-org | Phase-7 double-submit never shipped; XSS on any subdomain = session | M |
| 21 | Enforce CSP (today report-only on API edge) | tahti-org | `infra/Caddyfile` `(security_headers)` | M |
| 22 | Upload magic / stricter `audio/*` verification | tahti-org | PR'd 2026-11-05: tahti-org#1071 (415 `not_audio` on complete) + web message #1853; close once merged | M |
| 23 | Screen-reader pass on listen + studio critical paths | tahti-web | not done yet | L |
| 24 | Ambient WebGL cost (opt-in already; desktop CPU) | tahti-web / player | Known; reduced-motion/pause exist | M |
| 25 | Auth user PII in `localStorage` (`tahti-web-auth`) | tahti-web | Done in #1764: the snapshot drops the email and channel extras | S |
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
