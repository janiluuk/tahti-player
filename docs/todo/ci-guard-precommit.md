# Catch cheap CI guards before push

**Status:** open

Requested 2026-10-30 after PR #1714 failed on two guards that take seconds to
run locally:

- `Storybook (plays 1/2)` - `generate-storybook-surfaces.mjs --check`: two rows
  were hand-inserted into `STORYBOOK-SURFACES.md` in the wrong place instead of
  running `pnpm storybook:surfaces`.
- `Build + lint` - `pnpm check:file-size`: `DiscoverView.tsx` grew past 800
  lines.

Both guards fail the whole PR (and the required `CI` job) late, after minutes
of runner time, and they recur because nothing runs them before push.

## Plan

1. **Pre-commit auto-fix (lint-staged)** - in root `package.json`
   `lint-staged`, add:
   - `packages/storybook/src/**/*.stories.{ts,tsx,js,jsx,mjs}` and
     `packages/tahti-web/STORYBOOK-SURFACES.md` → a small wrapper that runs
     `node scripts/generate-storybook-surfaces.mjs` and `git add`s the md.
     Generation is ~100 ms and deterministic, so regenerate rather than just
     check: hand edits are overwritten with the canonical order.
   - `*.{ts,tsx}` → `pnpm tahti-ops check size` (only fails on new or grown
     files, so it is safe to run on any commit).
2. **Pre-push hook** - add `.husky/pre-push` running the same fast guards
   repo-wide (`storybook:surfaces --check`, `check:file-size`). Catches
   commits made with `--no-verify` or from agents that skip lint-staged.
   Keep it under ~5 s; no tests, no builds.
3. **One entry point** - add `pnpm check:guards` that runs every cheap CI
   guard, used by the pre-push hook and by CI, so a new guard is added in one
   place and can't drift between local and CI.
4. **CI fails fast and clearly** - move the surfaces check out of the
   Storybook matrix into the `Changes` (or a new `Guards`) job so it fails in
   ~10 s instead of after Playwright setup, and print the fix command as a
   `::error::` annotation on the PR.
5. **Agent docs** - one line in `AGENTS-START-HERE.md`: never hand-edit
   `STORYBOOK-SURFACES.md`; run `pnpm storybook:surfaces`.

## Open questions

- Should the pre-push hook be skippable via an env var for emergency pushes,
  or is `--no-verify` enough?
- Optional: a bot/autofix workflow that commits the regenerated md on the PR.
  Not recommended - steps 1-2 make it unnecessary and it adds push
  permissions to CI.
