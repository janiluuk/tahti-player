#!/usr/bin/env bash

set -euo pipefail

repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository_root"

pnpm --filter @tahti-player/player --fail-if-no-match build:frontend
pnpm --filter @tahti-player/player --fail-if-no-match tauri build \
  --no-bundle \
  -c '{"build":{"beforeBuildCommand":""},"bundle":{"active":false,"createUpdaterArtifacts":false}}'

application_path="$repository_root/packages/player/src-tauri/target/release/tahti-player"
if [[ ! -x "$application_path" ]]; then
  echo "No compiled player was found at $application_path." >&2
  exit 1
fi

exec "$application_path" "$@"
