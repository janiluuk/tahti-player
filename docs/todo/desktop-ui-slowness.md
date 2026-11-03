# Desktop app UI feels slow (scrolling, menu navigation)

**Status:** partial

2026-11-03: the user reported sluggish scrolling again on the release build. `main.rs` no longer sets `WEBKIT_DISABLE_COMPOSITING_MODE=1` by default (only on SteamOS or with `TAHTI_SAFE_RENDERING=1`), so WebKitGTK composites on the GPU. A release build launched with `WEBKIT_DISABLE_COMPOSITING_MODE=0` on this NVIDIA 580 / Wayland machine started without new errors; waiting on the user's scroll check.
**Reported:** 2026-09-21 by the user after running `pnpm dev` (debug build) on Linux/NVIDIA (Wayland session). Radio thumbnails were also missing — fixed separately (`e0914956e`, `packages/player/vite.config.ts` now serves/bundles `tahti-web/public/{radio-logos,artwork-presets,mock,assets}`).

## What is known

- `main.rs` forces `WEBKIT_DISABLE_DMABUF_RENDERER=1` and `WEBKIT_DISABLE_COMPOSITING_MODE=1` (NVIDIA blank-screen/crash workaround); the dev log also shows `libEGL warning: failed to create dri2 screen`. WebKit is therefore software-rendering, so full-window animation and blend modes cost CPU.
- The app-wide `AmbientBackground` (fixed full-window WebGL canvas, `mix-blend-screen`, antialias on) is **on by default** for themes with visualization. Before `32f5b4c4a` it ran every rAF and rebuilt its WebGL context on every play/pause.
- `32f5b4c4a` (ThreeVisualizer): 30 fps cap, paused while hidden, resize only on change, no rebuild on play/pause. **Not yet measured.**
- `pnpm dev` is an unoptimized Rust build, which adds its own slowness.

## To test (user is debugging; report back)

- [ ] Restart `pnpm dev` after `32f5b4c4a`: is scrolling/menu navigation better?
- [ ] Settings → "Show animated background" off: smooth? (If yes, the background was the cause.)
- [ ] Release build (`pnpm build`) vs debug: how much is just the debug build?
- [x] GPU path with compositing on (`WEBKIT_DISABLE_COMPOSITING_MODE=0`, DMABUF still off): starts and renders on NVIDIA 580 / Wayland (2026-11-03). Now the default.
- [ ] Scrolling smooth with compositing on? If not, try the ambient background off next.
- [ ] Which theme is active? (The background only exists on visualization themes.)
- [ ] Any other views that lag with the background off (library table, queue, menus)? Note them here.

## Possible follow-ups (pick after the results)

- Default the ambient background off when GPU rendering is unavailable/forced off, or add a frame-time governor that drops to a still background.
- Lower pixel ratio / disable antialias for the ambient canvas; drop `mix-blend-screen` (forces per-frame compositing).
- 23 `backdrop-blur` uses across tahti-web/ui are expensive under software rendering; audit the ones on scrolling surfaces.
- Real numbers belong in [player-performance-optimizations.md](player-performance-optimizations.md) (baseline/budgets); fold this file into it or HISTORY when resolved.
