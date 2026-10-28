# Deploy `tahti-web` (every public host)

Deploys this package onto **vimage** beside the tahti-org stack (`/srv/tahti`), talking to the **public** API. Despite the `beta` names (`tahti-beta-web`, `/srv/tahti-beta`, `deploy:tahti-beta`), this container serves production: since 2026-10-21 Pi4 NPM forwards every public host (apex, `www`, `app`, `beta`, `admin`, `staging`, `<slug>.tahti.live`, radio, embed) to it. Open decisions on a production-named build: [`../CUTOVER.md`](../CUTOVER.md).

## Quick deploy

From the Tahti Player monorepo root:

```bash
pnpm deploy:tahti-beta
```

Or:

```bash
./packages/tahti-web/deploy/deploy-vimage.sh
```

SSH target defaults to `vimage` (root@192.168.2.100). Override with `DEPLOY_HOST` / `REMOTE_PATH` / `HOST_PORT`.

## Beta vs prod-shaped builds

| Profile | How | Diagnostics (`VITE_ENABLE_DIAGNOSTICS`) |
|---------|-----|----------------------------------------|
| **beta** (default) | `pnpm deploy:tahti-beta` | On — `/more` + Screen atlas for review |
| **prod** | `TAHTI_WEB_DEPLOY_PROFILE=prod pnpm deploy:tahti-beta` | Off — prod-shaped SPA |

The CI deploy (`deploy-tahti-web-selfhosted.yml`) builds with diagnostics **on** and without `VITE_HCAPTCHA_SITEKEY`, so production currently runs the beta profile (see CUTOVER "Still open").

Pass `VITE_HCAPTCHA_SITEKEY` in the deploying shell when the API has `HCAPTCHA_SECRET` set; otherwise chat join fails closed. The script forwards the sitekey into the Vite build when present and warns when it is missing.

## What gets installed

| Path / port | Role |
|-------------|------|
| `/srv/tahti` | tahti-org stack (not modified) |
| `/srv/tahti-beta` | SPA `dist/` + `deploy/` (serves production) |
| `192.168.2.100:15180` | Container `tahti-beta-web` |

## API wiring

1. Build leaves `VITE_TAHTI_API_URL` unset → browser calls `/tahti-api/...`.
2. Container nginx (`nginx.conf`) proxies `/tahti-api/` → `https://api.tahti.live/`.
3. Chat: `VITE_CENTRIFUGO_WS=wss://chat.tahti.live/connection/websocket`.

Production CORS already allows `*.tahti.live`.

## Nginx Proxy Manager (Pi4)

`beta.tahti.live` is Proxy Host **#61**; `app.` (#48), the apex (#47) and the `*.tahti.live` wildcard (#55) forward to the same upstream:

| Field | Value |
|-------|--------|
| Domain | `beta.tahti.live` |
| Forward | `http://192.168.2.100:15180` (vimage `tahti-beta-web`) |
| SSL | `*.tahti.live` (npm-162), force HTTPS |

DNS already aliases `beta.tahti.live` with `tahti.live`. Do **not** forward to pi4 `:15180` — that was the old local copy.

Ops note in the Tahti repo: `ops/beta-tahti-live.md`.

## CI deploy (GitHub Actions)

Two workflows can deploy this package after a push to `master`; both are
gated so a public-repo fork PR can never trigger them (`workflow_run`
after `CI` succeeds, or manual `workflow_dispatch` — never
`pull_request`/`pull_request_target`), and they share one concurrency
group (`deploy-tahti-web`) so only one can run at a time.

- **`.github/workflows/deploy-tahti-web.yml`** — GitHub-hosted runner,
  SSHes in through a jumphost (`vimage` sits on a private LAN). Needs the
  `DEPLOY_SSH_PRIVATE_KEY` repo secret; the job no-ops safely if it's
  unset. Requires exposing SSH externally (jumphost + port-forward) —
  dormant/unused as of 2026-09-02, kept as a documented alternative.
- **`.github/workflows/deploy-tahti-web-selfhosted.yml`** — a
  self-hosted GitHub Actions runner registered directly on `vimage`
  (label `tahti-deploy`) builds and deploys locally, no SSH/external
  exposure needed at all. **This is the active path.** Set up
  2026-09-02:
  - Runner runs as an unprivileged `gha-runner` user (member of the
    `docker` group), not root — `/srv/tahti-beta` is owned by
    `gha-runner` so the workflow can rsync/build/compose there directly.
  - Installed as a systemd service
    (`actions.runner.janiluuk-tahti-player.vimage-beta.service`), enabled
    at boot; check with `systemctl status
    actions.runner.janiluuk-tahti-player.vimage-beta` on vimage, or
    `~/actions-runner/svc.sh status` as `gha-runner`.
  - To re-register (e.g. token rotation, new runner): as `gha-runner`,
    `cd ~/actions-runner && ./config.sh remove --token <token>` then
    reconfigure with a fresh registration token from
    `gh api -X POST repos/janiluuk/tahti-player/actions/runners/registration-token`.
