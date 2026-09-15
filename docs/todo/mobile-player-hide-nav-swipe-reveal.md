# Mobile: hide status bar; hide nav while playing, swipe up to reveal

**Status:** open

Logged from a user request mid-session (2026-09-15), not yet scoped or
implemented.

## Ask (verbatim)

"dont show the statusbar with mobile. if the player is playing, dont
show the navigation by default, swiping bit up should reveal it"

## Reading of it

1. On mobile, don't show the status bar.
2. When the player is actively playing, the (bottom tab) navigation
   should be hidden by default.
3. A small swipe-up gesture should reveal the navigation again.

## Open questions before implementation

- "Status bar" — the OS/browser chrome (PWA `display`/`theme-color`
  handling), or an in-app status/now-playing bar element? Needs
  pointing at the specific element or confirming it means the native
  browser UI.
- Which bottom nav — the main tab bar (mobile `AppShell`'s bottom
  navigation), or something else?
- Swipe-up gesture: reveal-and-stay, or reveal-then-auto-hide again
  after a timeout? Should it also work from anywhere on screen, or only
  from near the bottom edge (avoiding conflicts with scrollable content)?
- Should this apply to every route, or only within the player-active
  views (Listen/Channel/Radio)?

## Where this likely lives

Mobile layout/nav chrome is in `AppShell.tsx`; player-active state is
already read elsewhere via `usePlayerStore`. No investigation done yet
beyond locating the likely files.
