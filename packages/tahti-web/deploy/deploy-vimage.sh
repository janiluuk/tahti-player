#!/usr/bin/env bash
# Deploy @tahti-player/tahti-web to vimage next to production Tahti.
#
# Layout on the host:
#   /srv/tahti          production stack (untouched)
#   /srv/tahti-beta     this SPA + nginx → public https://api.tahti.live
#   host :15180         publish for Nginx Proxy Manager → beta.tahti.live
#
# Usage (from Tahti Player repo root):
#   pnpm deploy:tahti-beta
#   # or
#   ./packages/tahti-web/deploy/deploy-vimage.sh
#
# Profiles:
#   TAHTI_WEB_DEPLOY_PROFILE=beta (default) — enables VITE_ENABLE_DIAGNOSTICS=1
#   TAHTI_WEB_DEPLOY_PROFILE=prod — omits diagnostics (cutover / prod-shaped build)
#
# Env overrides:
#   DEPLOY_HOST            SSH host (default: vimage)
#   REMOTE_PATH            remote dir (default: /srv/tahti-beta)
#   HOST_PORT              published host port (default: 15180)
#   VITE_CENTRIFUGO_WS     chat websocket (default: wss://chat.tahti.live/...)
#   VITE_HCAPTCHA_SITEKEY  optional; passed through to the Vite build when set
#                          (required for chat join when the API has HCAPTCHA_SECRET)
#   TAHTI_WEB_DEPLOY_PROFILE  beta|prod (default: beta)
set -euo pipefail

HOST="${DEPLOY_HOST:-vimage}"
REMOTE_PATH="${REMOTE_PATH:-/srv/tahti-beta}"
HOST_PORT="${HOST_PORT:-15180}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"
IMAGE="${DEPLOY_IMAGE:-tahti-beta-web:local}"
CENTRIFUGO_WS="${VITE_CENTRIFUGO_WS:-wss://chat.tahti.live/connection/websocket}"
DEPLOY_VERSION="$(date -u +%Y%m%d%H%M%S%3N)"
PROFILE="${TAHTI_WEB_DEPLOY_PROFILE:-beta}"

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "error: missing required command: $1" >&2
    exit 1
  }
}

need ssh
need rsync
need pnpm

if [[ "${PROFILE}" != "beta" && "${PROFILE}" != "prod" ]]; then
  echo "error: TAHTI_WEB_DEPLOY_PROFILE must be beta or prod (got: ${PROFILE})" >&2
  exit 1
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  . "$NVM_DIR/nvm.sh"
  nvm use 24 >/dev/null 2>&1 || true
fi

echo "==> Building @tahti-player/tahti-web (${PROFILE})"
echo "    API: same-origin /tahti-api (proxied to https://api.tahti.live)"
echo "    Chat WS: ${CENTRIFUGO_WS}"
echo "    Deploy version: ${DEPLOY_VERSION}"
if [[ -n "${VITE_HCAPTCHA_SITEKEY:-}" ]]; then
  echo "    hCaptcha sitekey: set"
else
  echo "    hCaptcha sitekey: unset (chat join fails closed if API has HCAPTCHA_SECRET)"
fi
cd "$REPO_ROOT"

BUILD_ENV=(
  env
  -u VITE_TAHTI_API_URL
  -u VITE_FORCE_MOCK
  -u VITE_ALLOW_MOCK_FALLBACK
  "VITE_CENTRIFUGO_WS=${CENTRIFUGO_WS}"
  "VITE_DEPLOY_VERSION=${DEPLOY_VERSION}"
)

if [[ "${PROFILE}" == "beta" ]]; then
  BUILD_ENV+=("VITE_ENABLE_DIAGNOSTICS=1")
else
  # Prod-shaped build: leave diagnostics unset so /more and Screen atlas stay gated.
  BUILD_ENV+=(-u VITE_ENABLE_DIAGNOSTICS)
fi

if [[ -n "${VITE_HCAPTCHA_SITEKEY:-}" ]]; then
  BUILD_ENV+=("VITE_HCAPTCHA_SITEKEY=${VITE_HCAPTCHA_SITEKEY}")
fi

"${BUILD_ENV[@]}" pnpm --filter @tahti-player/tahti-web build

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
"

echo "==> Deployed (${PROFILE})"
echo "    Local upstream:  http://192.168.2.100:${HOST_PORT}"
echo "    Public (DNS+NPM): https://beta.tahti.live"
echo "    See packages/tahti-web/deploy/README.md for Nginx Proxy Manager steps."
