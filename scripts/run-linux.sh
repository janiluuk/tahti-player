#!/usr/bin/env bash

set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "This command must be run on Linux." >&2
  exit 1
fi

repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
application_path="$repository_root/packages/player/src-tauri/target/release/tahti-player"

if [[ ! -x "$application_path" ]]; then
  echo "No compiled Linux player was found at $application_path." >&2
  echo "Run pnpm player:build:run first." >&2
  exit 1
fi

exec "$application_path" "$@"
