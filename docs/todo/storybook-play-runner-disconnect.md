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

## Next

- [ ] Bisect by count: run the same 60 files with `--no-file-parallelism` in halves until one file (or a pair) reproduces the drop under 90s; log open WebSockets/workers per file via `performance`/CDP.
- [ ] Try Chromium with `--disable-features=...` for websocket throttling, or a newer Playwright Chromium.
