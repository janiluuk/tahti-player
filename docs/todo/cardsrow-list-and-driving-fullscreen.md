# CardsRow list mode + driving fullscreen

**Status:** open

## Goal

1. `CardsRow` Storybook widget: toolbar icon toggles cards ↔ list; mobile defaults to list.
2. Mobile full-screen player: swipe left/right for next/previous.
3. Browser-complete fullscreen = driving mode — large targets, less chrome, swipe-first.

## Plan

- [ ] CardsRow `layout` / toggle + list rows; mobile default list
- [ ] Stories + unit tests
- [ ] FullScreenPlayer swipe via `useHorizontalSwipe`
- [ ] Driving layout when `document.fullscreenElement` / `screenFilled`
- [ ] Stories for DrivingMode; bump + worklog
