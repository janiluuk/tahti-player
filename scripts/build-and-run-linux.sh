#!/usr/bin/env bash
# Deprecated: prefer `pnpm desktop` / `tahti-ops desktop run` from the repo root.

set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "This command must be run on Linux." >&2
  exit 1
fi

repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository_root"

exec "$repository_root/scripts/build-and-run-player.sh" "$@"
