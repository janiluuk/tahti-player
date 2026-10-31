#!/usr/bin/env bash
# Pull latest images and restart containers on the Tahti hosts.
#
# Usage (from anywhere):
#   ./packages/tahti-ops/scripts/pull-restart.sh [host ...]
#
# Defaults to: pi4.local pi5.local web.local vimage.local
#
# Per host: pulls the image of every non-exited container with a tagged
# public image (skips locally built ones), restarts every running
# container, prunes dangling images, and reports which containers ended
# up unhealthy/exited/restarting. Exit code 1 if any host had issues.
set -uo pipefail

DEFAULT_HOSTS=(pi4.local pi5.local web.local vimage.local)
if [[ $# -ge 1 ]]; then
  HOSTS=("$@")
else
  HOSTS=("${DEFAULT_HOSTS[@]}")
fi

SSH_OPTS=(-o ConnectTimeout=10 -o BatchMode=yes)

remote_script() {
  cat <<'REMOTE'
set -uo pipefail
fail=0
pull_one() {
  local img="$1" out
  echo "pull ${img}"
  if ! out="$(timeout "${PULL_TIMEOUT:-900}" docker pull "$img" 2>&1 </dev/null)"; then
    echo "PULL FAILED: ${img}"
    printf '%s\n' "$out" | tail -3 | sed 's/^/  /'
    fail=1
  fi
}
declare -A seen
while IFS=$'\t' read -r name image; do
  [[ -n "$image" ]] || continue
  case "$image" in
    local/*) continue ;;
  esac
  ref="${image%%@*}"
  if [[ "$ref" =~ ^[0-9a-f]{12,64}$ ]]; then
    continue
  fi
  [[ -n "${seen[$image]:-}" ]] && continue
  seen["$image"]=1
  pull_one "$image"
done < <(docker ps -a --format '{{.Names}}\t{{.Image}}')
echo "restart (running containers)"
if ! out="$(docker restart $(docker ps -q) 2>&1 </dev/null)"; then
  echo "RESTART FAILED"
  printf '%s\n' "$out" | tail -5 | sed 's/^/    /'
  fail=1
fi
sleep 5
docker image prune -f >/dev/null 2>&1 </dev/null || true
echo "status"
echo "  unhealthy:    $(docker ps -a --filter health=unhealthy --format '{{.Names}}' | tr '\n' ' ')"
echo "  restarting:   $(docker ps -a --filter status=restarting --format '{{.Names}}' | tr '\n' ' ')"
echo "  exited/dead:  $(docker ps -a --filter status=exited --filter status=dead --format '{{.Names}} ({{.Image}})' | tr '\n' ' ')"
if [[ "$fail" -eq 0 ]] \
  && [[ -z "$(docker ps -a --filter health=unhealthy -q)" ]] \
  && [[ -z "$(docker ps -a --filter status=restarting -q)" ]] \
  && [[ -z "$(docker ps -a --filter status=exited -q)" ]] \
  && [[ -z "$(docker ps -a --filter status=dead -q)" ]]; then
  echo "RESULT: ok"
else
  echo "RESULT: issues"
  fail=1
fi
exit "$fail"
REMOTE
}

overall=0
for h in "${HOSTS[@]}"; do
  echo "=== ${h} ==="
  if ssh "${SSH_OPTS[@]}" "$h" 'bash -s' < <(remote_script); then
    echo
  else
    echo "!! ${h}: failed (ssh error or issues above)"
    echo
    overall=1
  fi
done

echo "=== summary ==="
if [[ "$overall" -eq 0 ]]; then
  echo "all hosts ok"
else
  echo "issues detected (see above)"
fi
exit "$overall"
