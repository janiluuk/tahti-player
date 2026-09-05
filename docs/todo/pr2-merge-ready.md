# PR #2 merge-ready autopilot

**Status:** open

Goal: make https://github.com/janiluuk/tahti-player/pull/2 merge-ready (green CI, mergeable, comments triaged). Do not merge.

## Pass 1 findings (2026-09-04)

- Mergeable: yes (no conflicts)
- Unresolved review threads: none
- CI red on both `ci` (Lint) and `coverage`
- Same failures also present on `master` HEAD `7eebf5f1`

### Lint

- `@tahti-player/player` prettier on `packages/player/changelog.json`
- Single-item `contributors` arrays formatted multiline; prettier wants `"jani"` / `"nukeop"` inline
- PR already added two new entries with inline form; rest of file inherited broken formatting from master

### Coverage

- 9 snapshot failures across player views (App, Album, Artist x2, Sources, Themes, Search, PluginStore, Plugins)
- Diffs are branding/tab-icon UI drift, not Studio Stats/subtabs code from this PR
- Identical set fails on master; updating snapshots is required for required checks to pass

## Plan

1. Run prettier/eslint --fix on `packages/player/changelog.json`
2. Update the 9 failing player snapshots with vitest `-u`
3. Verify with scoped player lint + the snapshot tests
4. Commit, push, watch CI

## Done locally

- Fixed `changelog.json` contributors formatting (419 → 0 multiline singles)
- Updated 9 player snapshots (App, Album, Artist x2, Sources, Themes, Search, PluginStore, Plugins)
- Verified: `player` lint clean, `tahti-web` lint clean, full player test suite green (676 pass), UI package tests green
