# Settings close button / tooltip

**Status:** open

## Problem

- Hovering the Settings × shows the “Close” tooltip on the left side of the modal.
- × / Esc / outside click still leave Settings open (reopen race + hit target).

## Fix

- Drop Floating UI Tooltip on `DialogXClose` (aria-label + title); pin × with `z-[100]` after panel children.
- Stop URL sync while `dismissRouteOpen`; navigate to a non-settings return path (or `/`) instead of `history.back()`.
