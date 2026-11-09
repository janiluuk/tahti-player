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
- Locally, run stories in chunks of ~60 files.

## Next

- [ ] Bisect by time: a story-free file that only waits 120s in one session, to see whether the drop needs any story at all.
- [ ] Try Chromium with `--disable-features=...` for websocket throttling, or a newer Playwright Chromium.
