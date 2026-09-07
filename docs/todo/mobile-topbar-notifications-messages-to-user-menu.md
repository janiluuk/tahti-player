# Mobile top bar: move Notifications/Messages into the user menu

**Status:** open

Requested 2026-09-07: on mobile only, move the Notifications and
Messages icon buttons out of the top bar and into the user (avatar)
menu dropdown, to free up horizontal space for the top navigation.

## Found

`AppTopNav.tsx` renders Notifications (`BellIcon`, ~line 421) and
Messages (`MessageSquareIcon`, ~line 548) as two always-visible icon
buttons with their own popovers, unconditionally — not gated on
`useIsMobile()` (the component already calls `useIsMobile()` for other
things, e.g. `TahtiLogoLink markOnly={isMobile}`). The user (avatar)
menu dropdown is the same file, ~line 645-755 — a `role="menu"` list of
`role="menuitem"` links/buttons (Artist panel, My channel, Settings,
tahti.live, Log out), a natural place to add two more menu items.

## Scope

- On mobile (`isMobile === true`): hide the standalone Notifications
  and Messages top-bar buttons + their popovers; add "Notifications"
  and "Messages" entries to the user-menu dropdown instead (as
  `role="menuitem"` links, matching the existing item style — likely
  navigating to `/messages`... check whether standalone routes exist
  for these or if they're popover-only today before deciding whether
  menu items should open the same popover UI or navigate to a page).
- Desktop (non-mobile) keeps the current always-visible top-bar icons
  unchanged.
- Preserve unread badges (notification count, unread-message indicator)
  somewhere visible from the user menu trigger itself (e.g. a dot/count
  on the avatar button) so unread state doesn't become invisible on
  mobile — not yet decided how; check `unreadNotifications` usage
  (~line 201) and the mobile bottom nav's own unread-lighting pattern
  (`MobileChrome.tsx` / `navigationActive.ts`) for a precedent to match
  rather than inventing a new indicator style.

Not started — needs the unread-indicator placement decided before
implementing (or reasoned through against the mobile bottom nav's
existing precedent) rather than guessed at blind.
