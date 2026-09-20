# Snapshot digest: show what this PR changed, not standing failures

**Status:** open
**Logged:** 2026-09-21 (user request)

## Problem

The CI "Snapshot digest" PR comment (`<!-- tahti-snapshot-digest -->`, built by
`scripts/ci/build-snapshot-digest.mjs`, posted by
`scripts/ci/comment-snapshot-digest.mjs`, screenshots via
`scripts/ci/publish-visual-snapshot-diffs.mjs`, fed by
`scripts/ci/vitest-snapshot-reporter.mjs`) lists every Vitest snapshot mismatch
in the run. A mismatch that already fails on `master` (for example
`packages/ui` `HistoryRow > renders with artwork and all actions`, whose
expected markup is older than the component) therefore shows up on every PR,
whether or not the PR touched it. Reviewers see the same history each time and
cannot tell which differences are new.

## Wanted

- The digest shows only differences this PR introduces or changes: compare the
  PR's mismatches against the base branch's, and drop the ones that fail
  identically there. Mismatches already failing on the base can go in a single
  collapsed "already failing on master" line with a count, not a full diff.
- Each listed difference is the real expected/received diff (and screenshot
  where there is one), for the snapshot that changed in this PR.
- A PR with no new differences says so in one line instead of repeating history.
- Also fix the underlying stale `HistoryRow` snapshot so the standing failure
  goes away (update the snapshot after confirming the component change was
  intended).

## Notes

- Base comparison needs the base run's reporter output: run the reporter on
  the base commit, or cache the base result per commit.
- Decide how to identify "the same" mismatch across runs (test id plus a hash
  of the received output is enough).
