# Full player: living static backdrop and cover glow

**Status:** partial

Requested 2026-11-25.

## Goal

In the full-screen player (`packages/tahti-web/src/components/FullScreenPlayer.tsx`):

1. When the background is a static image, give it really subtle movement (slow drift / scale / parallax), so it feels alive without drawing attention.
2. Give the glass panel behind the cover art the same subtle movement.
3. Make the glass panel subtly radiate the dominant colour of the cover art (soft glow around the panel).
4. A name (title / artist) that doesn't fit scrolls slowly back and forth (ping-pong, unlike the looping player-bar `MarqueeText`).
5. Title changes animate with a smooth transition; offer 4 subtle options to pick from (e.g. crossfade, slide up, blur-in, letter fade).

## Constraints

- Respect `prefers-reduced-motion`: no movement, glow may stay static.
- Keep it cheap: CSS transforms / opacity only, no per-frame blend modes or extra blur layers (see `desktop-ui-slowness.md`, WebKitGTK compositing).
- Covers without art use the default artwork; the glow follows whatever is shown.
- Cover colour extraction: reuse an existing palette/dominant-colour helper if one exists before adding a new one.

## Built (0.0.488)

- [x] The static `CoverAmbience` glow uses a slower, smaller transform than event banners; the cover glass panel drifts independently.
- [x] The panel glow uses the existing `useDominantColor` sample and falls back cleanly while no colour is available.
- [x] `OverflowPingPongText` measures the actual overflow and moves title, show and artist names only as far as needed.
- [x] `FullScreenPlayer.titleTransition` offers `fade`, `slide-up`, `soft-scale` and `slide-side`; all use opacity/transforms only.
- [x] Reduced motion disables backdrop, panel, name and title movement while leaving the colour glow static.
- [x] Storybook has the static-art, long-name, four transition and reduced-motion states; focused component and play tests pass.

## Left

- [ ] Pick the final default title transition. Listeners can choose it themselves in Settings → Appearance → "Full-screen title change" (0.0.491, `playbackPrefsStore.fullPlayerTitleTransition`); the default stays `fade` until the user picks.
