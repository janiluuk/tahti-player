# Mobile bottom menu: readability and Android gesture bar

**Status:** partial

Reported 2026-11-20.

## Problems

- The mobile bottom menu is too thin and hard to read (small labels/icons, tight height).
- On Android the menu is cut off: the system bottom swipe indicator (gesture bar) overlaps it.

## Done (2026-11-20)

- Cause of the cut-off: the bar had a fixed `h-16` and took `env(safe-area-inset-bottom)` as padding inside those 64px, so on a gesture-bar phone the items were squeezed and clipped.
- `MobileBottomNav` now has `min-h: calc(var(--mobile-nav-h, 72px) + env(safe-area-inset-bottom))`, so it grows by the inset. `--mobile-nav-h` is 72px.
- Labels `text-xs font-medium` (were 10px), icons 22px (were 18px).
- Unit test in `MobileChrome.test.tsx`.
- Active tab contrast (2026-11-20, "hard to see which section is open"): the open section gets a filled `bg-primary/25` pill behind the icon, a bold label in `text-foreground`, and a primary bar at the top edge; other tabs stay `text-foreground-secondary`.
- In-page tab strips (2026-11-21): the selected `segmented` tab (`@tahti-player/ui` `Tabs`, the default variant used by Discover and other section tabs) gets a `bg-primary/20` fill and a 2px `ring-primary/60` below `md`; desktop unchanged.

## Left

- [ ] Check on a real Android phone with gesture navigation (Chrome) that the bar clears the swipe indicator.
- [ ] If the Android APK WebView reports a 0 inset while drawing edge to edge, pass the native navigation-bar inset in as a CSS variable.
