#!/usr/bin/env bash

set -euo pipefail

if ! command -v java >/dev/null 2>&1; then
  echo "Java (JDK 17+) is required. Install it and set JAVA_HOME." >&2
  exit 1
fi

if [[ -z "${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}" ]]; then
  echo "ANDROID_HOME (or ANDROID_SDK_ROOT) must point at an installed Android SDK." >&2
  exit 1
fi

repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository_root"

if [[ ! -d packages/player/src-tauri/gen/android ]]; then
  pnpm --filter @tahti-player/player tauri android init
fi

exec pnpm --filter @tahti-player/player tauri android run --debug "$@"
