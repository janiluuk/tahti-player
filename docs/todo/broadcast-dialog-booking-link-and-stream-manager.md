# Broadcast dialog: add booking calendar link, move Stream Manager in

**Status:** open

Requested 2026-09-07:
1. Add a link to the booking calendar info in the Broadcast dialog.
2. Move the Stream Manager icon from the top bar into the Broadcast
   dialog as a "Stream manager" icon button, instead of its own
   standalone top-bar icon.

## Found

`AppTopNav.tsx`:
- The "Broadcast dialog" is actually the Broadcast-status **popover**
  (`broadcastOpen` state, `~line 322-391`), triggered by the `RadioIcon`
  top-bar button. It currently has two `role="menuitem"` links: "Open
  broadcast studio" (`/studio/go-live`) and, when signed in, "Open
  Green Room chat" (`/u/$username/green-room`). Add a third item here
  for the booking calendar link.
- Stream Manager is currently a **separate**, always-visible top-bar
  icon button (`~line 393-401`, `ListMusicIcon`, `aria-label="Open
  stream manager"`) that calls `setStreamManagerOpen(true)`, opening a
  real `Dialog` (`~line 849-856`, `<Dialog.Title>Stream Manager
  </Dialog.Title>` wrapping `<StreamManagerPanel />`). To move it in:
  remove the standalone button, add a "Stream manager" `role="menuitem"`
  button inside the broadcast popover that calls
  `setStreamManagerOpen(true)` (closing the popover itself first,
  matching the existing `setBroadcastOpen(false)` pattern on the other
  two menu items) — the `streamManagerOpen` state and the `Dialog`
  itself don't need to move, only the trigger.

## Booking calendar — route needs picking, not yet decided

Two existing "booking calendar" surfaces in this codebase, not
obviously the same audience:
- `/schedule` (`RadioScheduleView` / `RadioBookingCalendar.tsx`) —
  listener-facing radio schedule, `?station=mine|radio` search param;
  linked from `RadioView.tsx` ("Open booking calendar") and
  `ScheduleDialog.tsx`.
- `/studio/schedule` (`StudioScheduleView`) — already linked from
  Settings (`SettingsPanels.tsx` line ~1650), reads as the
  artist-facing schedule/booking management surface.

Since the Broadcast dialog is an artist-facing "go live" control (only
rendered `{user && hasChannel ? ...}`), `/studio/schedule` is the more
likely intended target, but confirm what "booking calendar" actually
shows on each route before wiring the link, rather than guessing.

## Scope
- [ ] Add "Booking calendar" menu item to the Broadcast popover,
      linking to the correct route (see above — verify first).
- [ ] Move "Stream manager" trigger from standalone top-bar icon into
      the Broadcast popover as a menu item; remove the old button.
- [ ] Live-verify both in the browser (desktop, since Broadcast is
      already `hidden sm:block` / desktop-only today).
