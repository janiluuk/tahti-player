#!/usr/bin/env bash
# Deprecated: prefer `tahti-ops desktop launch` (or `pnpm desktop` after build).

set -euo pipefail

if [[ -z "${TAHTI_OPS_QUIET:-}" ]]; then
  echo "note: prefer \`pnpm tahti-ops desktop launch\` after a build." >&2
fi

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "This command must be run on Linux." >&2
  exit 1
fi

repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
application_path="$repository_root/packages/player/src-tauri/target/release/tahti-player"

if [[ ! -x "$application_path" ]]; then
  echo "No compiled Linux player was found at $application_path." >&2
  echo "Run pnpm desktop or tahti-ops desktop run first." >&2
  exit 1
fi

exec "$application_path" "$@"
