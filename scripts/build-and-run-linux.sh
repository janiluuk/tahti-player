#!/usr/bin/env bash

set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "This command must be run on Linux." >&2
  exit 1
fi

repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository_root"

pnpm --filter @tahti-player/player --fail-if-no-match build:frontend
pnpm --filter @tahti-player/player --fail-if-no-match tauri build \
  --no-bundle \
  -c '{"build":{"beforeBuildCommand":""},"bundle":{"active":false,"createUpdaterArtifacts":false}}'

exec "$repository_root/scripts/run-linux.sh" "$@"
