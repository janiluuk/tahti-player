#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

VERSION="${1:-}"

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "  version: Semantic version (e.g., 1.47.0)"
  exit 1
fi

echo "=== Tahti Player Production Deployment ==="
echo "Version: $VERSION"
echo ""

# Step 1: Build frontend
echo "Step 1: Building frontend..."
cd "$PROJECT_DIR/packages/player"
pnpm build:frontend
echo "Frontend built successfully."
echo ""

# Step 2: Update version in package files
echo "Step 2: Updating version to $VERSION..."
cd "$PROJECT_DIR"

# Update player package.json
jq --arg v "$VERSION" '.version = $v' packages/player/package.json > packages/player/package.json.tmp && mv packages/player/package.json.tmp packages/player/package.json

# Update tauri.conf.json version
jq --arg v "$VERSION" '.version = $v' packages/player/src-tauri/tauri.conf.json > packages/player/src-tauri/tauri.conf.json.tmp && mv packages/player/src-tauri/tauri.conf.json.tmp packages/player/src-tauri/tauri.conf.json

# Update metainfo.xml release info (if it exists)
if [ -f "packages/player/src-tauri/resources/live.tahti.player.metainfo.xml" ]; then
  echo "Metainfo file found, updating release info..."
  # The prepare-release.mjs handles this, we'll skip manual metainfo update
  echo "  (metainfo update handled separately)"
fi

echo "Version updated in package files."
echo ""

# Step 3: Git commit and tag
echo "Step 3: Creating git tag and commit..."
cd "$PROJECT_DIR"

git add packages/player/package.json packages/player/src-tauri/tauri.conf.json

if [ -f "packages/player/src-tauri/resources/live.tahti.player.metainfo.xml" ]; then
  git add packages/player/src-tauri/resources/live.tahti.player.metainfo.xml
fi

if git diff --cached --quiet; then
  echo "Version files already match ${VERSION}; no release commit needed."
else
  git commit -m "player@${VERSION}"
fi

if git rev-parse -q --verify "refs/tags/player@${VERSION}" >/dev/null; then
  echo "Git tag player@${VERSION} already exists."
else
  git tag "player@${VERSION}"
  echo "Git tag player@${VERSION} created."
fi
echo ""

# Step 4: Build Tauri
echo "Step 4: Building Tauri application..."
cd "$PROJECT_DIR/packages/player"
pnpm tauri build
echo "Tauri build completed."
echo ""

echo "=== Deployment preparation complete! ==="
echo "Version: $VERSION"
echo "Built binary: packages/player/src-tauri/target/release/tahti-player"
echo "To publish: git push origin player@${VERSION}"
