# Mobile player bar: broken controls + queue should open full-screen tracklist

**Status:** open

User report (2026-09-06):

1. In the mobile player bar, only a mute button is visible and it
   doesn't respond — there should be a big play/pause button instead.
2. Pressing the queue button in mobile view should open a full-screen
   view with a tracklist component showing the queue, highlighting the
   currently playing track (instead of whatever it does today).

## Investigation notes

- `components/ConnectedPlayerBar.tsx:88` — `if (!playerBarVisible ||
  !playable || (isMobile && isPlaying)) return null;` — the entire
  compact player bar unmounts on mobile exactly while something is
  playing (`isPlaying = status === 'playing' || status === 'loading'`).
  No other component fills in a mobile mini-player during that state
  (checked `MobileChrome.tsx`'s `MobileBottomNav`/`MobileDrawer` — no
  playback controls there; nothing sets `fullScreenPlayerOpen` true
  automatically when mobile playback starts). This looks like the root
  cause of "no working play/pause, just a stray mute control" — needs
  browser reproduction at a real mobile viewport to confirm exactly
  what renders (this condition, or a separate CSS overflow issue in
  `PlayerBarRoot.tsx`'s 3-column grid squeezing out the center Controls
  column while leaving the right-side Volume visible — both are
  plausible, only one may be the real cause, verify before fixing).
- Queue button (`onQueueClick` in the same file) currently calls
  `toggleBottomQueue()` on mobile — check `SidebarQueuePanel.tsx` /
  wherever `bottomQueueOpen` renders today to see what that produces
  now (a bottom sheet/drawer, presumably not full-screen with a proper
  tracklist + current-track highlight).
- Check Storybook (`packages/storybook/src/`) for any existing
  full-screen tracklist / queue example to reuse rather than building a
  new one from scratch — `FullScreenPlayer.tsx` may already have
  reusable queue-list markup.

## Plan

1. Reproduce both issues live in the browser (dev server, mobile
   viewport emulation) before changing anything — confirm the actual
   render path for "mute button only."
2. Fix the mobile compact bar so play/pause is always the primary
   control and actually responds (swap the broken condition/CSS,
   whichever is the real cause).
3. Make the mobile queue button open a full-screen tracklist (reuse an
   existing tracklist/queue-list component if one exists in Storybook
   or `SidebarQueuePanel`/`FullScreenPlayer`), with the currently
   playing track visually highlighted.
