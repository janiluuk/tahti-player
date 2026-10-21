#!/usr/bin/env bash
# One-shot runner for the 4 category e2e journeys (anonymous, listener,
# artist, admin): starts the tahti-web dev server against the app's own
# built-in rich mock dataset (VITE_FORCE_MOCK=1 — see src/api/mock*.ts;
# there is no separate database to seed), prints the demo credentials the
# journeys use, then runs the requested journey scripts.
#
# Usage:
#   ./scripts/run-e2e-journeys.sh              # all 4 journeys
#   ./scripts/run-e2e-journeys.sh artist admin # only these journeys
#   ./scripts/run-e2e-journeys.sh --keep-up    # leave the dev server running after
#
# Screenshots land in docs/e2e-journeys/<category>/{light,dark}/ (artist and
# admin also get a docs/e2e-journeys/<category>/sweep/ with every remaining
# tab at a single theme — see scripts/journeys/*.mjs for why).
#
# Run from packages/tahti-web/. See docs/E2E-JOURNEYS.md.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export JOURNEY_PORT="${JOURNEY_PORT:-5195}"
export JOURNEY_BASE_URL="http://localhost:${JOURNEY_PORT}"
export CHROMIUM_PATH="${CHROMIUM_PATH:-/usr/bin/chromium}"

# Fixed so screenshots and the credentials printed below always match. Mock
# mode accepts any password for the artist login (see buildMockLoginUser in
# src/api/mock-session.ts); listener and admin personas can't come from a
# real mock login (no channel-less or board account exists there) so their
# journeys inject the account directly into localStorage instead — see
# scripts/journeys/lib.mjs.
export JOURNEY_ARTIST_EMAIL="${JOURNEY_ARTIST_EMAIL:-artist@tahti.live}"
export JOURNEY_ARTIST_PASSWORD="${JOURNEY_ARTIST_PASSWORD:-demo-password}"
export JOURNEY_ARTIST_SLUG="${JOURNEY_ARTIST_SLUG:-demo}"

KEEP_UP=false
JOURNEYS=()
for arg in "$@"; do
  case "$arg" in
    --keep-up) KEEP_UP=true ;;
    anonymous | listener | artist | admin) JOURNEYS+=("$arg") ;;
    -h | --help)
      sed -n '2,17p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done
[[ ${#JOURNEYS[@]} -eq 0 ]] && JOURNEYS=(anonymous listener artist admin)

STARTED_DEV_PID=""
cleanup() {
  if [[ "$KEEP_UP" == false && -n "$STARTED_DEV_PID" ]]; then
    kill "$STARTED_DEV_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "── E2E journey suite (anonymous / listener / artist / admin) ──"

if ! curl -sf "$JOURNEY_BASE_URL/" >/dev/null 2>&1; then
  echo "-- Starting dev server (VITE_FORCE_MOCK=1, port ${JOURNEY_PORT}) --"
  VITE_FORCE_MOCK=1 pnpm exec vite --port "$JOURNEY_PORT" --strictPort \
    >"$ROOT/docs/e2e-journeys/.dev-server.log" 2>&1 &
  STARTED_DEV_PID=$!
  for _ in $(seq 1 45); do
    curl -sf "$JOURNEY_BASE_URL/" >/dev/null 2>&1 && break
    sleep 1
  done
fi
curl -sf "$JOURNEY_BASE_URL/" >/dev/null || {
  echo "dev server did not become ready" >&2
  exit 1
}
echo "   dev server OK: $JOURNEY_BASE_URL"

echo ""
echo "── Demo credentials in use ─────────────────────────────────"
echo "   Artist  : ${JOURNEY_ARTIST_EMAIL} / ${JOURNEY_ARTIST_PASSWORD} (real mock login)"
echo "   Listener: injected account, no real login (mock login always yields an artist)"
echo "   Admin   : injected board account, no real login (mock login can't set isBoard)"
echo "   Channel slug used for public pages: ${JOURNEY_ARTIST_SLUG}"

mkdir -p "$ROOT/docs/e2e-journeys"

status=0
for journey in "${JOURNEYS[@]}"; do
  echo ""
  echo "── ${journey} journey ──────────────────────────────────────"
  node "scripts/journeys/${journey}-journey.mjs" || status=1
done

echo ""
echo "── Screenshots ──────────────────────────────────────────────"
for journey in "${JOURNEYS[@]}"; do
  echo "   docs/e2e-journeys/${journey}/{light,dark}/"
done

exit $status
