# Desktop app UI feels slow (scrolling, menu navigation)

**Status:** partial

2026-11-03: the user reported sluggish scrolling again on the release build. `main.rs` no longer sets `WEBKIT_DISABLE_COMPOSITING_MODE=1` by default (only on SteamOS or with `TAHTI_SAFE_RENDERING=1`), so WebKitGTK composites on the GPU. A release build launched with `WEBKIT_DISABLE_COMPOSITING_MODE=0` on this NVIDIA 580 / Wayland machine started without new errors; waiting on the user's scroll check.
**Reported:** 2026-09-21 by the user after running `pnpm dev` (debug build) on Linux/NVIDIA (Wayland session). Radio thumbnails were also missing — fixed separately (`e0914956e`, `packages/player/vite.config.ts` now serves/bundles `tahti-web/public/{radio-logos,artwork-presets,mock,assets}`).

## Shipped (2026-11-19)

- Ambient backdrop mode on `ThreeVisualizer` / `ChannelVisualizer`: no antialias, DPR cap 1, 15 fps (channel stages stay at 30 fps + AA).
- `AmbientBackground` dropped `mix-blend-screen` (opacity only) so WebKit is not forced into per-frame blend compositing under DMABUF-off.
- Player chrome (`BottomBar` / PlayerBar) `backdrop-blur-xl` → `backdrop-blur-sm`.
- User manual platform notes match `main.rs` compositing defaults.

## What is known

- `main.rs` always sets `WEBKIT_DISABLE_DMABUF_RENDERER=1`; compositing is only forced off on SteamOS or `TAHTI_SAFE_RENDERING=1`.
- The app-wide `AmbientBackground` is **on by default** for themes with visualization.
- `32f5b4c4a` (ThreeVisualizer): paused while hidden, resize only on change, no rebuild on play/pause; ambient now uses the cheaper backdrop path above.
- Ambient visuals skip frames while the page scrolls (`startVisibleRenderLoop({ pauseWhileScrolling })`, 150 ms quiet window).
- `pnpm dev` is an unoptimized Rust build, which adds its own slowness.

## To test (user is debugging; report back)

- [ ] Scrolling smooth with compositing on after the ambient/chrome wins? If not, try Settings → "Show animated background" off.
- [ ] Release build (`pnpm build`) vs debug: how much is just the debug build?
- [ ] Which theme is active? (The background only exists on visualization themes.)
- [ ] Any other views that lag with the background off (library table, queue, menus)? Note them here.

## Possible follow-ups (pick after the results)

- Default the ambient background off when GPU rendering is unavailable/forced off, or add a frame-time governor that drops to a still background.
- Audit remaining `backdrop-blur` on scrolling surfaces outside the player chrome.
- Fold this file into HISTORY when the scroll check is confirmed.
