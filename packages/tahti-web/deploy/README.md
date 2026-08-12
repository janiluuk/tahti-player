# Deploy beta (`beta.tahti.live`)

Deploys this package onto **vimage** beside production Tahti (`/srv/tahti`), talking to the **public** API.

## Quick deploy

From the Nuclear monorepo root:

```bash
pnpm deploy:tahti-beta
```

Or:

```bash
./packages/tahti-web/deploy/deploy-vimage.sh
```

SSH target defaults to `vimage` (root@192.168.2.100). Override with `DEPLOY_HOST` / `REMOTE_PATH` / `HOST_PORT`.

## What gets installed

| Path / port | Role |
|-------------|------|
| `/srv/tahti` | Production stack (not modified) |
| `/srv/tahti-beta` | Beta SPA `dist/` + `deploy/` |
| `192.168.2.100:15180` | Container `tahti-beta-web` |

## API wiring

1. Build leaves `VITE_TAHTI_API_URL` / `VITE_FORCE_MOCK` / `VITE_ALLOW_MOCK_FALLBACK` unset → browser calls `/tahti-api/...` with **no mock fixtures**.
2. Container nginx (`nginx.conf`) proxies `/tahti-api/` → `https://api.tahti.live/` (and `/api/` the same way).
3. Chat: `VITE_CENTRIFUGO_WS=wss://chat.tahti.live/connection/websocket`.
4. Media / HLS: absolute `cdn.tahti.live` URLs from the API (CORS allows `beta.tahti.live`).

Production CORS already allows `*.tahti.live`.

## Auth / session cookies

`tahti_session` is **host-only** (API sets no `Domain`). Cookies from `tahti.live` / `api.tahti.live` are **not** sent to beta.

**Use a real account on beta:** open [https://beta.tahti.live/login](https://beta.tahti.live/login) and sign in with your production email/password (or TOTP). Login POSTs to same-origin `/tahti-api/api/auth/login`; nginx forwards `Set-Cookie` onto `beta.tahti.live`, then `/tahti-api/api/auth/me` works with `credentials: 'include'`.

Do not point the SPA at `https://api.tahti.live` directly in the beta build — that would set cookies on `api.tahti.live` while the app still calls `/tahti-api` on beta.

## Nginx Proxy Manager (Pi4)

Configured as Proxy Host **#61**:

| Field | Value |
|-------|--------|
| Domain | `beta.tahti.live` |
| Forward | `http://192.168.2.100:15180` (vimage `tahti-beta-web`) |
| SSL | `*.tahti.live` (npm-162), force HTTPS |

DNS already aliases `beta.tahti.live` with `tahti.live`. Do **not** forward to pi4 `:15180` — that was the old local copy.

Ops note in the Tahti repo: `ops/beta-tahti-live.md`.
