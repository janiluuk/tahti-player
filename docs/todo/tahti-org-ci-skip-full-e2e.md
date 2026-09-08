# tahti-org CI: don't always run full e2e

**Status:** open

## What the user asked for

2026-09-08: optimize the `tahti-live` CI flow — don't always run the full
e2e suite.

## What's true today

Lives in `../tahti-org` (not this repo), `.github/workflows/ci.yml`. The
`on:` block (lines 7-11) has no `paths:` filter — every push to `main` and
every PR runs the full pipeline unconditionally, including two e2e jobs that
each spin up Postgres/Redis and boot the real API server:

- `vital-flows-e2e` (line 244) — `bash tests/e2e/vital-flows.sh`.
- `user-journeys-e2e` (line 332) — `bash tests/e2e/user-journeys.sh`, plus a
  seed script and optional web build.

Both gate the final `ci-summary` job (lines 533-546). There's also a
separate `e2e-phase4.yml` and a weekly `stack-smoke.yml` (full docker-compose
stack + Playwright) — those already run on their own triggers, not on every
push, so likely not part of "always run."

## Not done — needs a decision, not a guess

What "don't always run" should mean here — pick one (or combine) before
touching `tahti-org`:
- Path-filter the e2e jobs (skip when the diff only touches e.g. `docs/`,
  `website/`, non-`apps/api`+`apps/worker` code).
- Only run full e2e on `main` pushes / pre-merge, and run a cheaper subset
  (or skip entirely) on draft PRs / early pushes to a PR.
- Cache/skip when a prior successful run already covered the same commit
  range (e.g. `paths-filter` action + `needs` gating).

This is a `tahti-org` change — per this repo's CLAUDE.md, don't edit/deploy
`../tahti-org` without the user's go-ahead on the specific approach; this
file just tracks the ask and the facts, scoped to a `tahti-org` session/
worktree when picked up.
