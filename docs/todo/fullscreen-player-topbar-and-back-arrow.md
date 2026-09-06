# Fullscreen Player — Hide Top Bar & Back Arrow

**Status:** open

When the fullscreen player is open, the app's top navigation bar
(`AppTopNav`) covers the top portion of the cover image. Fix this by
hiding the top bar while fullscreen is active, and replace the current
minimize icon (top-right) with a large back-arrow in the top-left corner.

## Current state

- `FullScreenPlayer` is a `fixed inset-0 z-[60]` overlay — it covers all
  layout chrome visually, but `AppTopNav` remains rendered underneath.
- The only close control is a small `Minimize2Icon` in the top-right corner
  (`FullScreenPlayer.tsx:117-127`).
- `AppShell.tsx` renders `AppTopNav` unconditionally (line 529). The
  `fullScreenPlayerOpen` state is read (line 233) but only used for the
  keyboard shortcut toggle (line 396), not for hiding chrome.

## Changes

### 1. Hide AppTopNav when fullscreen player is open

**File:** `packages/tahti-web/src/components/AppShell.tsx`

- Read `fullScreenPlayerOpen` from `useLayoutStore` (already read for the
  keyboard shortcut).
- Conditionally skip rendering `<AppTopNav>` when `fullScreenPlayerOpen` is
  `true`.
- Also skip rendering `<ConnectedPlayerBar>` in fullscreen (the player bar
  is redundant while the full player is showing).

### 2. Replace minimize icon with large back arrow

**File:** `packages/tahti-web/src/components/FullScreenPlayer.tsx`

Remove the top-right minimize button block (lines 117-127):

```tsx
<div className="relative z-10 flex justify-end p-4">
  <Tooltip content="Minimize player" side="top">
    <Button size="icon-sm" variant="text" onClick={close} aria-label="Minimize player">
      <Minimize2Icon size={20} aria-hidden />
    </Button>
  </Tooltip>
</div>
```

Replace with a large back arrow in the top-left corner:

```tsx
<div className="absolute inset-x-0 top-0 z-10 flex items-start p-4">
  <Tooltip content="Back to player" side="right">
    <Button size="icon" variant="text" onClick={close} aria-label="Minimize player"
      className="size-12 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50">
      <ArrowLeftIcon size={28} aria-hidden />
    </Button>
  </Tooltip>
</div>
```

Key differences:
- Position: top-**left** (was top-right via `justify-end`).
- Size: `size-12` icon button with `ArrowLeftIcon size={28}` (was
  `size-8` / `size={20}`).
- Style: translucent rounded background (`bg-black/30 backdrop-blur-sm`)
  for visibility over cover art.
- Tooltip text: "Back to player" (was "Minimize player").
- Import `ArrowLeftIcon` from `lucide-react`, remove `Minimize2Icon` import
  if no longer used.

### 3. Keyboard shortcut unchanged

`V` key still toggles fullscreen in `AppShell.tsx:396`. No change needed.

## NOT in scope
- Gesture swipe-down to minimize (mobile).
- Animating the cover image on enter/exit.
- Removing the `Escape` key close (keep as secondary close path).
