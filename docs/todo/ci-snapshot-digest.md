# CI snapshot digest

**Status:** open

## Goal

When Vitest HTML snapshots fail in CI, produce a collective review surface:

1. Sticky PR comment listing every failed `(Snapshot)` test
2. Expected / received HTML + Playwright screenshots as a `snapshot-digest` artifact
3. Job summary with the same inventory

## Approach

- Shared Vitest 4 reporter (`scripts/ci/vitest-snapshot-reporter.mjs`) writes
  per-package `snapshot-digest/failures.json`
- Root script `scripts/ci/build-snapshot-digest.mjs` aggregates, renders
  Playwright PNGs, writes `digest.md` / `digest.json`
- `ci.yml` + `coverage.yml` upload artifact; CI posts sticky PR comment
