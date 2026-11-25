# Full player: living static backdrop and cover glow

**Status:** open

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

## Plan

- [ ] Locate the static-image backdrop path and the cover glass panel (`FullScreenPlayer.tsx` ~L458).
- [ ] Add slow drift animation to both (shared keyframes / Tailwind utility).
- [ ] Derive cover colour and apply a soft coloured glow to the glass panel.
- [ ] Ping-pong scroll for overflowing names; 4 title-change transitions behind a prop, user picks one.
- [ ] Storybook story / play for both states (static image, reduced motion).
