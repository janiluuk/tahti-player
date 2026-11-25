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

## Merge to production (2026-11-25)

Measured on master pushes #2178, #2176 and 51abf41da (REST `actions/runs/<id>/jobs`). The beta deploy is `deploy-tahti-web-selfhosted.yml` on vimage, started by `workflow_run` when the whole CI workflow succeeds.

| Stage | Before (#2178) | After (estimate) |
| ----- | -------------- | ---------------- |
| Merge → CI run created | 3 s | 3 s |
| Every CI job except the journeys | done at +4.3 min | same |
| E2E journeys (4 shards, slowest) | done at +8.1 min (7.1 min of Playwright; 9.9 min on #2176) | 6 shards: ~+5.5 min |
| CI done → deploy job started | 6 s | 6 s |
| Deploy: pnpm cache restore + setup + install | ~57 s | gone (artifact download ~30-45 s) |
| Deploy: `pnpm build` on vimage | 130 s | gone (built by CI `web-dist` in parallel with the tests) |
| Deploy: docker build + restart + smoke | 14-40 s | same |
| **Merge → production** | **12.5 min (14 min on #2176)** | **~7-7.5 min** |

Changes: CI `web-dist` job builds the production bundle on master pushes and uploads `tahti-web-dist`; the self-hosted deploy downloads it from the triggering CI run (`workflow_dispatch` still builds on the runner, without restoring the pnpm store from the Actions cache since it persists on vimage); journeys run in 6 shards instead of 4.

Production artifact pass (2026-11-25): every CI/manual deploy build now declares
`TAHTI_WEB_DEPLOY_PROFILE=prod`; Vite removes the 166.6 MB `public/map/`
diagnostics atlas from `dist/` while preserving other public assets. CI and both
deploy workflows fail if `dist/map` returns, and the CI summary records artifact
bytes/files. `build:diagnostics` and the beta deploy profile retain the atlas.

Watch after merge: the first master deploy (artifact download from vimage, its duration, the site serving the CI-built bundle); the slowest journey shard (shards are balanced by test count, not time: 3.7 vs 7.1 min at 4 shards).

Further options, not done: running journeys against a `vite build` + `vite preview` bundle instead of the cold dev server; the per-commit 1 GB turbo caches can push the pnpm store and Playwright caches out of the 10 GB Actions cache.

## E2E shard balance (2026-11-26)

Playwright shards by file unless tests are fully parallel, so the 6 journey shards took 3-7 min (whole master run 6-7 min). The journeys step now passes `--fully-parallel`, which shards by test. Local check: all 306 journey tests pass fully parallel (4 workers, no flaky retries, 11.4 min).

Fully parallel did not even them out: on the first master run (#2189) every shard had 51 tests, and the Playwright step still took 178-378 s (3.0-6.3 min of tests, no retries). The cause was the cold Vite dev server compiling each route on first visit. Measured locally on shard 3/6 (2 workers, CI=1):

| Server | Wall | Summed test time | Retries |
| ------ | ---- | ---------------- | ------- |
| Cold dev server | 201 s | 393 s | 1 (first attempt 76 s) |
| Warm dev server | 156 s | 306 s | 0 |
| Built mock bundle + `vite preview` | 129 s | 252 s | 0 |

Full journeys glob against the built bundle: 306 passed, no retries, 7.9 min at 4 workers (11.4 min on the dev server); summed test time 1865 s (about 2688 s on the dev server), about 2.6 min per shard at 2 workers if evenly split.

Changes: each journey shard builds `vite build --mode e2e-mock` (about 30 s locally, 16 MB, into `dist-e2e-mock/`) in the background while Playwright installs, then serves it with `vite preview` on 5196. `validateProductionBuildEnvironment` allows `VITE_FORCE_MOCK=1` only in that mode and refuses a deploy profile there; every other build still refuses mock. Specs that imported `/src/api/*.ts` in `page.evaluate` (only the dev server serves those) use `window.__tahtiE2e` (`src/e2e/testHooks.ts`), installed only when `DEV` or mode `e2e-mock`; the production bundle has no trace of it. The journeys step uses `--reporter=list,json` (per-test durations in the log) and uploads `e2e-mock-timings-<n>` (JSON) for later balancing.

Watch on the next master runs: the bundle build time on the runner (log of "Serve the mock bundle"), per-shard spread, and any spec that relied on dev-only behaviour (`import.meta.env.DEV` is false in the bundle).

## Left


- [ ] Watch a few CI runs with `isolate: false` (0.0.485): local shards went from ~85-93 s to ~15 s. Leaks come from hand-patched globals and `node_modules` state, not `vi.mock` (per-file registry in Vitest 4.1); hunt with `--sequence.shuffle.files --sequence.seed=<n>` (see `docs/agent/TESTING.md`).
- [ ] Product call: run the e2e journeys in their own workflow so beta/Storybook deploys don't wait for them.
- [ ] Turbo remote cache for tahti-player needs a `TURBO_TOKEN` secret (ops).
- [ ] Optional: a 5th tahti-org test shard (renames the `(n/4)` checks).
