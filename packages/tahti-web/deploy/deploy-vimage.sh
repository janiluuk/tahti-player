#!/usr/bin/env bash
# Deploy @nuclearplayer/tahti-web beta to vimage next to production Tahti.
#
# Layout on the host:
#   /srv/tahti          production stack (untouched)
#   /srv/tahti-beta     this SPA + nginx → public https://api.tahti.live
#   host :15180         publish for Nginx Proxy Manager → beta.tahti.live
#
# Usage (from Nuclear repo root):
#   pnpm deploy:tahti-beta
#   # or
#   ./packages/tahti-web/deploy/deploy-vimage.sh
#
# Env overrides:
#   DEPLOY_HOST      SSH host (default: vimage)
#   REMOTE_PATH      remote dir (default: /srv/tahti-beta)
#   HOST_PORT        published host port (default: 15180)
#   VITE_CENTRIFUGO_WS  chat websocket (default: wss://chat.tahti.live/...)
set -euo pipefail

HOST="${DEPLOY_HOST:-vimage}"
REMOTE_PATH="${REMOTE_PATH:-/srv/tahti-beta}"
HOST_PORT="${HOST_PORT:-15180}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NUCLEAR_ROOT="$(cd "$ROOT/../.." && pwd)"
IMAGE="${DEPLOY_IMAGE:-tahti-beta-web:local}"
CENTRIFUGO_WS="${VITE_CENTRIFUGO_WS:-wss://chat.tahti.live/connection/websocket}"

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "error: missing required command: $1" >&2
    exit 1
  }
}

need ssh
need rsync
need pnpm

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  . "$NVM_DIR/nvm.sh"
  nvm use 22 >/dev/null 2>&1 || nvm use 24 >/dev/null 2>&1 || true
fi

echo "==> Building @nuclearplayer/tahti-web"
echo "    API: same-origin /tahti-api (proxied to https://api.tahti.live)"
echo "    Chat WS: ${CENTRIFUGO_WS}"
cd "$NUCLEAR_ROOT"
# Leave VITE_TAHTI_API_URL unset so the client uses /tahti-api.
# Unset mock + mock-fallback so production data is used (no Northern Lights fixtures).
# Optional: export VITE_HCAPTCHA_SITEKEY before deploy for anonymous chat captcha.
BUILD_ENV=(
  env
  -u VITE_TAHTI_API_URL
  -u VITE_FORCE_MOCK
  -u VITE_ALLOW_MOCK_FALLBACK
  "VITE_CENTRIFUGO_WS=${CENTRIFUGO_WS}"
)
if [[ -n "${VITE_HCAPTCHA_SITEKEY:-}" ]]; then
  BUILD_ENV+=("VITE_HCAPTCHA_SITEKEY=${VITE_HCAPTCHA_SITEKEY}")
fi
"${BUILD_ENV[@]}" pnpm --filter @nuclearplayer/tahti-web build

if [[ ! -f "$ROOT/dist/index.html" ]]; then
  echo "error: build did not produce dist/index.html" >&2
  exit 1
fi

echo "==> Syncing → ${HOST}:${REMOTE_PATH}"
ssh "$HOST" "mkdir -p '${REMOTE_PATH}/dist' '${REMOTE_PATH}/deploy'"
rsync -az --delete \
  "$ROOT/dist/" "${HOST}:${REMOTE_PATH}/dist/"
rsync -az --delete \
  --exclude 'deploy-vimage.sh' \
  --exclude 'README.md' \
  "$ROOT/deploy/" "${HOST}:${REMOTE_PATH}/deploy/"

# Compose publishes HOST_PORT; rewrite the port in the remote compose file if needed.
if [[ "${HOST_PORT}" != "15180" ]]; then
  ssh "$HOST" "sed -i \"s/15180:80/${HOST_PORT}:80/\" '${REMOTE_PATH}/deploy/docker-compose.yml'"
fi

echo "==> Building image ${IMAGE} and starting container on :${HOST_PORT}"
ssh "$HOST" "cd '${REMOTE_PATH}' && \
  docker build -t '${IMAGE}' -f deploy/Dockerfile . && \
  docker compose -f deploy/docker-compose.yml up -d --force-recreate && \
  docker image prune -f >/dev/null 2>&1 || true"

echo "==> Smoke checks"
ssh "$HOST" "set -e
  code=\$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:${HOST_PORT}/)
  echo \"spa:\${code}\"
  test \"\${code}\" = '200'
  code=\$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:${HOST_PORT}/tahti-api/api/v1/channels/directory)
  echo \"api-proxy:\${code}\"
  test \"\${code}\" = '200'
  names=\$(curl -sS http://127.0.0.1:${HOST_PORT}/tahti-api/api/v1/channels/directory | python3 -c 'import sys,json; print(\", \".join(i[\"displayName\"] for i in json.load(sys.stdin)[\"items\"][:5]))')
  echo \"directory-sample:\${names}\"
  echo \"\${names}\" | grep -vq 'Northern Lights'
  radio=\$(curl -sS http://127.0.0.1:${HOST_PORT}/tahti-api/api/channels/tahti-radio)
  echo \"\${radio}\" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get(\"hlsUrl\"), d; print(\"tahti-radio:\", d.get(\"state\"), (d.get(\"hlsUrl\") or \"\")[:64])'
  # Cookie forwarding (logout clears session cookie on this origin)
  sc=\$(curl -sS -D - -o /dev/null -X POST http://127.0.0.1:${HOST_PORT}/tahti-api/api/auth/logout | tr -d '\\r' | grep -i '^set-cookie:' || true)
  echo \"set-cookie-forward:\${sc:-MISSING}\"
  echo \"\${sc}\" | grep -qi 'tahti_session'
"

echo "==> Deployed"
echo "    Local upstream:  http://192.168.2.100:${HOST_PORT}"
echo "    Public (DNS+NPM): https://beta.tahti.live"
echo "    Login: https://beta.tahti.live/login (real prod account → cookie on beta via /tahti-api)"
echo "    See packages/tahti-web/deploy/README.md for Nginx Proxy Manager steps."
