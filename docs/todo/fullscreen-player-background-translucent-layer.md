# Fullscreen Player — Apply Translucent Layer to Background Art

**Status:** open

The fullscreen player's title card uses `bg-background/35 backdrop-blur-md`
for readability over the visualizer. The background art itself (the
`ChannelVisualizer` layer) only uses `opacity-60` with no blur. Apply the
same translucent treatment to the background art so the entire backdrop has
a consistent look.

## Current state

**Background visualizer** (`FullScreenPlayer.tsx:113-115`):
```tsx
<div className="absolute inset-0 opacity-60">
  <ChannelVisualizer className="h-full w-full" artworkUrl={coverUrl} />
</div>
```

**Title card** (`FullScreenPlayer.tsx:136-137`):
```tsx
<div className="bg-background/35 max-w-md rounded-xl px-6 py-3 text-center backdrop-blur-md">
```

The title card has a 35% alpha background tint + backdrop blur. The visualizer
backdrop has only a flat 60% opacity — no tint, no blur.

## Change

**File:** `packages/tahti-web/src/components/FullScreenPlayer.tsx`

Replace the visualizer wrapper:
```tsx
<div className="absolute inset-0 opacity-60">
```

With the same translucent layer as the title:
```tsx
<div className="bg-background/35 absolute inset-0 backdrop-blur-md">
```

This adds the `--background` colour tint at 35% alpha and a medium backdrop
blur, matching the title card. Remove `opacity-60` since the translucency
is now driven by the background alpha rather than element-level opacity.

## Effect
- The background art becomes tinted with the theme background colour at 35%
  alpha (matches the title card).
- A medium backdrop blur softens the visualizer, making foreground content
  (cover image, title, controls) stand out more.
- Consistent visual treatment across the entire fullscreen backdrop.

## NOT in scope
- Changing the title card styling.
- Adjusting the `bgStyle` radial gradient tint on the root container.
- Performance impact of backdrop-blur on the visualizer canvas (low concern
  — the visualizer is already rendered at a capped DPR of 2).
