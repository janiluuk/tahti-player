# Storybook play runner disconnects after ~90 seconds

**Status:** open

## Problem

A single `vitest --project storybook` browser session drops all its websockets about 70–97 seconds after Chromium starts, whatever story is running: "[vitest] Browser connection was closed while running tests". The run then stops. It reproduces locally on every run longer than that (`--no-file-parallelism`, or the full suite) and on master. On CI it shows up as the occasional "browser crashed" shard, when a shard runs longer than ~90s.

## What is ruled out (2026-11-09)

- Not a renderer or network-service crash: no `Inspector.targetCrashed`; `--enable-features=NetworkServiceInProcess2` changes nothing.
- Not a navigation: the top frame navigates once, at start.
- Not Vite: no dependency re-optimisation, no HMR sends, `server.hmr: false` changes nothing.
- Not Node HTTP timeouts: `headersTimeout`/`requestTimeout` = 0 changes nothing.
- Not Playwright: `Target.closeTarget` comes after the disconnect (normal teardown).
- Server logs show the browser closing the sockets (client FIN), first the tester iframe's Vite socket (Chrome logs `webSocketFrameError` with an empty message), then the orchestrator.
- Not the stories' own sockets: Centrifugo (`centrifugoWsUrl`) points at `localhost:8000` in dev.

## Mitigation in place

- Playwright context `reducedMotion: 'reduce'` (`packages/storybook/vitest.config.ts`): WebGL visualizers stay static, stories run much faster, so CI shards finish well under 90s. Stories about motion opt back in with `withMotionAllowed` (`packages/storybook/src/_lib/motion.tsx`).
- CI retries a shard once when it disconnects without a failing story (`.github/workflows/ci.yml`).
- CI runs ten shards of ~50 files (was six of 85, which hit the drop on master 2026-11-11, retry included); two jobs run five shards each.
- Locally, run stories in chunks of ~60 files.

## Bisect by time (2026-11-18)

Neither run dropped on the Mac, so time alone does not cause it:

- A story-free browser test that waits 150s in one Chromium session (plain `@vitest/browser-playwright`, `--disable-dev-shm-usage`): passes.
- One story whose `play` waits 150s, run through the `storybook` project (preview, decorators, `reducedMotion`): passes.

The drop needs many story files in one session: the tester iframe reloading per file, or something a set of stories leaves behind (sockets, workers, timers).

## File-count bisect note (2026-11-19)

Recipe for the next pass (do not run the full suite in one session):

```bash
# From packages/storybook — pick ~60 story files, then halves.
pnpm exec vitest --project storybook --no-file-parallelism \
  src/tahti-web/Studio*.stories.tsx src/tahti-web/Track*.stories.tsx
# If it drops: split the glob in half and repeat until one file (or pair)
# reproduces under ~90s. Log open sockets/workers via CDP Performance /
# Target.getTargets between files.
```

CI already uses ten shards (~50 files) + one retry; keep local chunks ≤60.

## File-count bisect (2026-11-19, next-30)

- `packages/storybook/src/tahti-web` alone is **406** story files — far above the
  ~90s drop threshold if run as one session.
- A single family (`Studio*.stories.tsx`, ~40 files) stays under the CI shard
  size (~50) that already finishes before the disconnect window.
- No single-file culprit isolated in this pass; the failure mode remains
  **many story files per Chromium session** (tester iframe reload / leftover
  sockets), not wall-clock alone (see 2026-11-18 note).

## Mitigation shipped with next-30

- Keep CI at ten shards (~50 files) + one retry (already in `ci.yml`).
- Document local chunks ≤60 in this todo and in AGENTS testing notes.
- Prefer running Storybook play tests by package/family glob, not the whole
  `tahti-web` tree, when debugging locally.

## Next

- [ ] Optional: CDP socket/worker census between files if a shard still drops
      under ~50 files.
- [ ] Try Chromium with `--disable-features=...` for websocket throttling, or a newer Playwright Chromium.
