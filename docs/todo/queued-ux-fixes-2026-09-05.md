# Queued UX fixes (2026-09-05)

**Status:** open — queued by the user during a session, not yet started.
One item per fix; check each off and fold into HISTORY.md once shipped.

- [ ] **Admin panel left padding.** Admin content starts with noticeably
  more left padding than Library/Studio — should begin at the same
  horizontal position. Likely an `AppShell`/`AdminPageLayout` padding
  mismatch against the Studio/Library shells; compare their root
  container classes.
- [ ] **Rename "Stream Playlist Manager" → "Stream Manager".** Find the
  literal string and any route/component names that echo it; a plain
  label rename unless the component itself is also named after the old
  string (in which case just the visible label needs to change, not the
  file/export name, unless doing so is free).
- [ ] **Stream overlay tab leaks after collapsing the manager.** Repro:
  open Stream Playlist Manager, switch to the Overlay tab, then collapse
  the manager — the stream overlay form stays visible instead of
  collapsing with it. Sounds like the overlay form is mounted outside (or
  independently conditioned from) the manager's own collapsed/expanded
  state. Do an integrity check of the component structure here, not just
  a one-line visibility patch — the user explicitly asked for that.
- [ ] **Collapse "Connect Broadcasting Software" by default.** Currently
  shows full broadcasting options up front. Should default collapsed,
  showing only server name + stream key (key hidden behind a reveal icon,
  with copy next to it), with an expand control that reveals the rest.
  User's own note: this likely requires moving the RTMP credentials
  display out of whatever tab structure currently hosts it, since a
  collapsed summary needs to sit above/outside the tabs to be visible
  before expanding.
