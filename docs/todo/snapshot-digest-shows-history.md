# Snapshot digest: show what this PR changed, not standing failures

**Status:** partial
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

## Progress (2026-09-21)

- [x] Stale `HistoryRow` snapshot updated (the hover-reveal classes moved from the wrapper div onto the play button; same behavior).
- [x] `scripts/ci/build-snapshot-digest.mjs`: every mismatch gets a fingerprint (package + file + test + hash of the received output, paths/ANSI normalized). With a baseline (`snapshot-baseline/digest.json`, or `SNAPSHOT_BASELINE_JSON`) it lists only new mismatches in the table/details, screenshots only those, and puts the rest in one collapsed "N mismatch(es) already failing on master" block. No new mismatches gives one line ("No new snapshot differences in this PR."). No baseline lists everything and says so. `digest.json` `count` still means every mismatch (CI uses it to tell snapshot-only failures from other failures); new fields `newCount`, `standingCount`, `baselineAvailable`, `standing[]`. Old baselines without fingerprints match on package + file + test name. Tested locally with synthetic failures for all three cases.
- [x] `.github/workflows/ci.yml`: "Fetch master snapshot baseline" step (pull_request only, `continue-on-error`) takes the latest finished master run's `snapshot-digest` artifact; none means master had no mismatches, so the baseline is empty; `actions: read` added to the workflow permissions for it.
- [ ] **Verify on a real PR** (needs CI): first PR run after merge should show only its own mismatches. Watch that `gh run list/download` works with the default token and that master's run uploads the artifact when it has mismatches.
- [ ] `coverage.yml` has the same digest steps (artifact `snapshot-digest-coverage`) and was not changed; add the same baseline step there if its comment is also wanted.
