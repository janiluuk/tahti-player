# Mobile bottom menu: readability and Android gesture bar

**Status:** open

Reported 2026-11-20.

## Problems

- The mobile bottom menu is too thin and hard to read (small labels/icons, tight height).
- On Android the menu is cut off: the system bottom swipe indicator (gesture bar) overlaps it.

## Plan

- [ ] Raise the bar height and label size/contrast for readability.
- [ ] Pad the bar with `env(safe-area-inset-bottom)` (and check `viewport-fit=cover` in the HTML meta) so it clears the Android gesture bar and iOS home indicator.
- [ ] Check the Android APK / TWA build too, not only the mobile browser.
- [ ] Update the mobile bottom-nav e2e / Storybook play for the new height.
