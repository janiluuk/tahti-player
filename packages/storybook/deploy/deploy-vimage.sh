#!/usr/bin/env bash
# Deploy the static @tahti-player/storybook build onto vimage.
#
# Layout on the host:
#   /srv/tahti-storybook   this build's storybook-static/ + deploy/
#   host :15181            publish for Nginx Proxy Manager -> storybook.tahti.live
#
# Usage (from Nuclear repo root):
#   pnpm deploy:tahti-storybook
#   # or
#   ./packages/storybook/deploy/deploy-vimage.sh
#
# Env overrides:
#   DEPLOY_HOST    SSH host (default: vimage)
#   REMOTE_PATH    remote dir (default: /srv/tahti-storybook)
#   HOST_PORT      published host port (default: 15181)
set -euo pipefail

HOST="${DEPLOY_HOST:-vimage}"
REMOTE_PATH="${REMOTE_PATH:-/srv/tahti-storybook}"
HOST_PORT="${HOST_PORT:-15181}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NUCLEAR_ROOT="$(cd "$ROOT/.." && pwd)"
IMAGE="${DEPLOY_IMAGE:-tahti-storybook-web:local}"

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
  nvm use 24 >/dev/null 2>&1 || true
fi

echo "==> Building @tahti-player/storybook"
cd "$NUCLEAR_ROOT"
pnpm --filter @tahti-player/storybook build

if [[ ! -f "$ROOT/storybook-static/index.html" ]]; then
  echo "error: build did not produce storybook-static/index.html" >&2
  exit 1
fi

echo "==> Syncing -> ${HOST}:${REMOTE_PATH}"
ssh "$HOST" "mkdir -p '${REMOTE_PATH}/storybook-static' '${REMOTE_PATH}/deploy'"
rsync -az --delete \
  "$ROOT/storybook-static/" "${HOST}:${REMOTE_PATH}/storybook-static/"
rsync -az --delete \
  --exclude 'deploy-vimage.sh' \
  "$ROOT/deploy/" "${HOST}:${REMOTE_PATH}/deploy/"

if [[ "${HOST_PORT}" != "15181" ]]; then
  ssh "$HOST" "sed -i \"s/15181:80/${HOST_PORT}:80/\" '${REMOTE_PATH}/deploy/docker-compose.yml'"
fi

echo "==> Building image ${IMAGE} and starting container on :${HOST_PORT}"
ssh "$HOST" "cd '${REMOTE_PATH}' && \
  docker build -t '${IMAGE}' -f deploy/Dockerfile . && \
  docker compose -f deploy/docker-compose.yml up -d --force-recreate && \
  docker image prune -f >/dev/null 2>&1 || true"

echo "==> Smoke check"
ssh "$HOST" "set -e
  code=\$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:${HOST_PORT}/)
  echo \"storybook:\${code}\"
  test \"\${code}\" = '200'
"

echo "==> Deployed"
echo "    Local upstream:  http://192.168.2.100:${HOST_PORT}"
echo "    Next step: add an Nginx Proxy Manager entry on pi4 for storybook.tahti.live"
echo "    forwarding to that address (same pattern as beta.tahti.live -> Proxy Host #61)."
