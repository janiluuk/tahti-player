# RELEASE

Extracted from root `AGENTS.md` for on-demand reading.

## Changelog

`packages/player/changelog.json` is the source of truth for the in-app "What's New" tab and auto-generated GitHub release notes. The "What's New" tab groups entries by week and shows one row per week (same-week entries are merged into one row), so every entry should also be readable as one line within that combined row.

When building a user-facing feature, fix, or improvement, add an entry to the top of the array according to the format you find there. **Every entry's `description` must explain how the change makes things better for the person using it, in plain language — not what changed at the implementation level.** Write it for the reader of the "What's New" tab, not for a reviewer of the diff: say what they can now do, or what stopped being broken, not which component/file/API changed. "Bandcamp tracks now play in-app" is right; "Added BANDCAMP to the EmbedProvider union and wired embedSrcFor" is wrong — that belongs in the worklog entry and commit message, not the changelog.

## Releasing

### Tahti Player

Releases are triggered by git tags. The workflow builds for macOS (arm64/x64), Linux, and Windows. Release notes are auto-generated from `packages/player/changelog.json`.

```bash
# 1. Bump versions, update the appstream metainfo, commit, and tag
pnpm release:prepare X.Y.Z

# 2. Push the tag
git push origin player@X.Y.Z
```

`release:prepare` does everything that's needed for a release. Do not bump versions or edit any files by hand when preparing a release.

The `release-player.yml` workflow creates a GitHub release with platform binaries.

### Plugin SDK

Published to npm via the `release-plugin-sdk.yml` workflow.

```bash
# 1. Update version in packages/plugin-sdk/package.json
# 2. Commit the version bump
git add packages/plugin-sdk/package.json && git commit -m "plugin-sdk@X.Y.Z"

# 3. Tag and push
git tag plugin-sdk@X.Y.Z
git push origin plugin-sdk@X.Y.Z
```

The workflow builds with `build:npm`, runs tests, and publishes to npm.
