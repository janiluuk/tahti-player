# CI performance audit (tahti-player and tahti-org)

**Status:** partial

Requested 2026-11-24. Shipped: tahti-player #2162 (master journeys in 4 shards, 25.5 → ~9 min; tahti-web vitest 4 shards; Storybook plays on 3 runners; shallow master checkouts) and tahti-org #1158 (Prisma migration baseline as its own parallel job, OpenAPI generation no longer waits for tests).

## tahti-web vitest isolation trials (2026-11-24, shard 1/4 locally, 249 files)

| Mode | Wall time | Result |
| ---- | --------- | ------ |
| default (forks, isolated) | 2m16s-2m32s | all pass |
| `--no-isolate` | 23 s | 36 files / 86 tests fail (module state and mocks leak between files) |
| `--pool=threads` (isolated) | 2m42s | slower; 4 locale-dependent tests fail |

Import (~650 s summed) and setup/environment (~450 s summed) dominate; the tests themselves take ~30 s.

## Local runs (0.0.487)

`turbo test` no longer builds dependencies first (102 s → ~72 s cold); root `pnpm test` skips Storybook; `pnpm test:changed` (~7 s) and `test:plays:changed` (~28 s) run only what a branch touches; `run-plays.mjs` runs plays in 50-file Chromium sessions (full 565 files in 256 s). ui stays isolated: React `useId`/dnd-kit id counters survive `vi.resetModules`, so snapshots depend on file order. See `docs/agent/TESTING.md`.

## Left

- [ ] One full unsharded tahti-web run in five failed all of `SettingsView.test.tsx` once (not reproduced since); find the leaking file if it recurs.

- [ ] Watch a few CI runs with `isolate: false` (0.0.485): local shards went from ~85-93 s to ~15 s. A `vi.mock` registered in one file still applies to later files in the same worker; revert to isolated if a shard turns flaky.
- [ ] Product call: run the e2e journeys in their own workflow so beta/Storybook deploys don't wait for them.
- [ ] Turbo remote cache for tahti-player needs a `TURBO_TOKEN` secret (ops).
- [ ] Optional: a 5th tahti-org test shard (renames the `(n/4)` checks).
