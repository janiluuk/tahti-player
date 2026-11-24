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

## Left

- [ ] Make the 36 leaking files isolation-safe (reset stores/mocks in `afterEach`, no module-level state), then turn on `isolate: false` for tahti-web: ~7x faster unit shards.
- [ ] Product call: run the e2e journeys in their own workflow so beta/Storybook deploys don't wait for them.
- [ ] Turbo remote cache for tahti-player needs a `TURBO_TOKEN` secret (ops).
- [ ] Optional: a 5th tahti-org test shard (renames the `(n/4)` checks).
