# CUTOVER - `apps/web` → `@tahti-player/tahti-web`

**Status: done.** `tahti-web` is the only Tahti web client. The full phased
plan (decisions, parity, route aliases, SEO, runbook) is in git history:
`git show 64f00ee95:packages/tahti-web/CUTOVER.md`. Shipped work is in
[`docs/todo/HISTORY.md`](../../docs/todo/HISTORY.md).

## Where things stand (2026-10-28)

- **2026-10-21 proxy flip:** Pi4 NPM forwards every public host (apex, `www`,
  `app`, `beta`, `admin`, `staging`, `<slug>.tahti.live`, `radio`, embed) to
  the `tahti-beta-web` container on vimage `:15180`. The container serves
  `dist/` and proxies `/tahti-api` and `/api` to `https://api.tahti.live`
  (same-origin, host-only `tahti_session`).
- **2026-10-28, tahti-org #1030:** the legacy Next.js `apps/web` is removed.
  Board admin is the SPA admin (`/admin/*`); see
  [`docs/DECISIONS.md`](../../docs/DECISIONS.md). `@tahti/ui`,
  `@tahti/api-client` and `@tahti/addon-sdk` stay in tahti-org.
- Custom-domain host routing (PLAT-051) is gone; no channel uses a custom
  domain. Channel subdomains open their channel (#1456, #1702).
- **Deploys:** merging tahti-player `master` rebuilds and redeploys the SPA
  (`.github/workflows/deploy-tahti-web-selfhosted.yml`, self-hosted runner on
  vimage, see [`deploy/README.md`](deploy/README.md)). Merging tahti-org
  `main` deploys the API/worker stack to production (`deploy-production.yml`
  → `scripts/deploy_prod.sh`, compose up on vimage). The `v*`-tag Swarm
  `deploy.yml` path is dormant.
- Route aliases for old `/c/*`, `/dashboard/*`, `/u/:user/subscribe`, OAuth
  and Stripe returns: `lib/prodPathRedirects.ts`, `lib/cutoverReturns.ts`.

## Still open

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
  [`SEO-OG-NOTES.md`](SEO-OG-NOTES.md).
- [ ] **Rollback (verify).** With Next gone, rollback means redeploying an
  earlier tahti-player commit's build. Never rehearsed.
- [ ] **Post-switch regression (verify).** The no-drop ledger in
  [`GAP-MAPPING.md`](GAP-MAPPING.md) was never ticked on the final host:
  login/TOTP, membership checkout, fan subscribe and portal returns, Stripe
  Connect, OAuth source returns, email links (`APP_URL`), embeds on a
  third-party page, go-live and upload.
- [ ] **Accessibility:** a real screen-reader pass on listen and studio
  critical paths (also `final-season-hardening.md` P2 #23).
- [ ] **P2 policy:** upstream Nuclear sync policy for `@tahti-player/ui` and
  themes; favorites/history stay device-local (`LOCALSTORAGE-KEYS.md`) unless
  an API sync is added.

Desktop MCP / MPD / Jam are desktop-only; never expose `/mcp` on the public
edge ([`docs/MCP.md`](docs/MCP.md)).
