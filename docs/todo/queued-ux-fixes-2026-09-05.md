# Queued UX fixes (2026-09-05)

**Status:** open — queued by the user during a session, not yet started.
One item per fix; check each off and fold into HISTORY.md once shipped.

- [ ] **Admin panel left padding.** Admin content starts with noticeably
  more left padding than Library/Studio — should begin at the same
  horizontal position. Likely an `AppShell`/`AdminPageLayout` padding
  mismatch against the Studio/Library shells; compare their root
  container classes.
- [ ] **Rename "Stream Playlist Manager" → "Stream Manager".** No literal
  string `"Stream Playlist Manager"` exists anywhere in
  `packages/tahti-web/src` (checked 2026-09-05) — this is almost
  certainly the user's own name for `StreamManagerPanel.tsx` (rendered
  from `StudioGoLiveView.tsx`), which has no panel-level heading of its
  own today (only an internal `<h3>Stream overlay</h3>` on its Overlay
  tab, line ~803). Before renaming anything, confirm with the user (or
  screenshot) exactly which visible label they mean — there may be
  nothing to rename yet, just something to *add* as "Stream Manager".
- [x] **Stream overlay tab leaks after collapsing the manager — root
  cause found, not yet fixed.** `StreamManagerPanel.tsx`: the
  collapse/expand state is `rotationExpanded` +
  `(!rotationPlaying || rotationExpanded)`, and that guard wraps the tab
  list itself (line ~624) and the `stats` tab's content (line ~653,
  `activeTab === 'stats' && (!rotationPlaying || rotationExpanded)`) —
  but the `overlay` tab's content block (line ~800,
  `activeTab === 'overlay' && canControl && (...)`) was never given the
  same `(!rotationPlaying || rotationExpanded)` condition. That's the
  whole bug: one missing clause. Fix: add the same guard to the overlay
  block (and re-verify the `rotation` tab's own block at line ~738 has it
  too, for consistency — do the "integrity check" the user asked for
  across all three tab blocks, not just overlay, in case there's a
  second instance of the same drift).
- [ ] **Collapse "Connect Broadcasting Software" by default.** Currently
  shows full broadcasting options up front. Should default collapsed,
  showing only server name + stream key (key hidden behind a reveal icon,
  with copy next to it), with an expand control that reveals the rest.
  User's own note: this likely requires moving the RTMP credentials
  display out of whatever tab structure currently hosts it, since a
  collapsed summary needs to sit above/outside the tabs to be visible
  before expanding.
- [ ] **Go Live: proper toaster on save, and the notification toaster's
  scrollbar.** Saving settings in Go Live should show a real `toast`
  (success/error), not just silent state updates — audit
  `StudioGoLiveView.tsx`/`StreamManagerPanel.tsx` save handlers for spots
  still missing one (mirrors the `toast` vs. hand-rolled `msg` consolidation
  already tracked in `packages/tahti-web/WORKPLAN.md`). Separately: the
  notifications toaster shows a visible scrollbar — investigate the
  Sonner/Toast container's overflow styling; user wants bigger icons
  there instead of (implicitly) small ones causing cramped layout.
- [ ] **Stream overlay text styling: color picker + opacity-layer toggle.**
  In `StreamOverlayEditor.tsx` (now with a "Show overlay title" toggle and
  live cover preview, shipped 2026-09-05 — see
  `docs/todo/stream-overlay-cover-upload-and-title-toggle.md`), add: (1) a
  color picker for the title/subtitle text color (currently hardcoded
  white/`0xcbd5e1` in `buildRtmpMirrorOutput` on the sibling `tahti`
  repo's orchestrator — this needs a new persisted field there too, same
  shape as `streamOverlayShowTitle`), (2) a toggle for a dark
  opacity/scrim layer behind the text (also needs to actually render in
  the real ffmpeg/Liquidsoap output, not just the preview). The preview's
  `OverlayTextPreview` component already has a gradient scrim baked in
  unconditionally — when this ships, that scrim should become
  conditional on the new toggle, shown in the preview exactly when
  enabled, matching the "Show overlay title" preview-gating pattern.
- [ ] **Stream overlay cover: default placeholder + auto-fill text.**
  When no custom cover is set, show the currently-playing track's artwork
  as the placeholder in the cover slot (not just a bare `ImageIcon`) —
  needs whatever "now playing" data source Studio Go Live already has.
  Default `streamOverlayTitle`/`streamOverlaySubtitle` (when the artist
  hasn't set custom ones) to the current show's artist/title and tagline
  respectively — skip the tagline entirely (don't render an empty
  subtitle line) when it's blank, rather than showing blank text. Also:
  remove the explanatory paragraph at the top of `StreamOverlayEditor`
  ("RTMP has no built-in title metadata...") and move that copy into the
  page's help layer instead of sitting permanently in the form body —
  same "inline-help-text → Tooltip/help-layer" pattern as the
  Studio/Admin UX sweep's `inline-help-text` category
  (`STUDIO-ADMIN-UX-SWEEP.md`), just routed to the page help layer here
  instead of a Tooltip badge since a help layer already exists for this
  page.
