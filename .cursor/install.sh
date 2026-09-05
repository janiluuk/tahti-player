#!/usr/bin/env bash
set -euo pipefail

# Cloud Agent bootstrap for Tahti Player.
#
# The repo requires Node >=24 (see .nvmrc / package.json "engines") and pnpm
# 10.33.4 (package.json "packageManager"). The base image ships nvm, so we use
# it to guarantee Node 24 regardless of the image default, then activate pnpm
# through corepack and install the monorepo with the committed lockfile.
#
# This script is idempotent: re-running it converges on the same state without
# rewriting the lockfile.

NODE_MAJOR=24
PNPM_VERSION=10.33.4

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "nvm not found at $NVM_DIR; installing nvm..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
fi

# shellcheck disable=SC1091
source "$NVM_DIR/nvm.sh"

nvm install "$NODE_MAJOR"
nvm alias default "$NODE_MAJOR"
nvm use "$NODE_MAJOR"

corepack enable
corepack prepare "pnpm@$PNPM_VERSION" --activate

node -v
pnpm -v

pnpm install --frozen-lockfile
