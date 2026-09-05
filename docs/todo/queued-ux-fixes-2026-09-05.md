# Queued UX fixes (2026-09-05)

**Status:** open — queued by the user during a session, not yet started.
One item per fix; check each off and fold into HISTORY.md once shipped.

- [x] **Admin panel left padding — fixed 2026-09-05.** Root cause: 9 of
  25 Admin views' `ViewShell` had `classes={{ root: 'px-0 pt-0 mx-auto
  max-w-{3xl,4xl,5xl,7xl}' }}` — a centered, width-capped column — while
  every Studio/Library view (and the other 16 Admin views) uses just
  `px-0 pt-0` (full width, flush left). On a normal desktop viewport that
  centering reads as "extra left padding" versus Studio/Library, which is
  exactly the report. `AppShell`'s own `MAIN_CONTENT_PADDING` wrapper is
  identical for every route — not the cause. Stripped `mx-auto max-w-*`
  from all 9 (`AdminContentView`, `AdminAnnouncementsView`,
  `AdminSelectsView`, `AdminNewsView`, `AdminTopListsView`,
  `AdminDashboardView`, `AdminUsersView`, `AdminStreamsView`,
  `AdminStatusView`) for consistency with the rest.
- [ ] **Rename "Stream Playlist Manager" → "Stream Manager".** No literal
  string `"Stream Playlist Manager"` exists anywhere in
  `packages/tahti-web/src` (checked 2026-09-05) — this is almost
  certainly the user's own name for `StreamManagerPanel.tsx` (rendered
  from `StudioGoLiveView.tsx`), which has no panel-level heading of its
  own today (only an internal `<h3>Stream overlay</h3>` on its Overlay
  tab, line ~803). Before renaming anything, confirm with the user (or
  screenshot) exactly which visible label they mean — there may be
  nothing to rename yet, just something to *add* as "Stream Manager".
- [x] **Stream overlay tab leaks after collapsing the manager — fixed
  2026-09-05.** Root cause: `StreamManagerPanel.tsx`'s collapse/expand
  guard `(!rotationPlaying || rotationExpanded)` wraps the tab list and
  the `stats`/`rotation` tabs' content, but the `overlay` tab's block
  never had it. Added the same guard there. Integrity check of the other
  two tabs: `stats` was already correctly guarded as a whole;
  `rotation`'s two sub-sections (`ChannelRotationEditor`, the RTMP targets
  list) were each independently guarded already — only its "Stop stream"
  button is intentionally unguarded (a primary action that should stay
  reachable while collapsed). No second instance of the drift found.
- [x] **Collapse "Connect Broadcasting Software" by default — shipped
  2026-09-05.** `StudioGoLiveView.tsx`'s "Connect broadcasting software"
  panel now always shows a compact RTMP server + stream key summary
  (`CopyField` gained a `maskable` prop — dots + eye-icon reveal toggle +
  copy), pulled out of the OBS/Traktor/Icecast app-picker entirely so it
  doesn't depend on which one is selected. A chevron button in the panel
  header (`credentialsExpanded` state, default `false`) reveals the full
  app picker + per-app credentials + OBS preset + instructions.
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
- [ ] **Stream Manager stats + overlay restructuring.** In
  `StreamManagerPanel.tsx`'s `stats` tab: show "Offline" instead of
  "Rotation" for the `Signal` stat's rotation-fallback value (currently
  `rotationPlaying ? 'Rotation' : 'No encoder'` — user wants the rotation
  case itself to read differently, likely "Offline" for the whole stat
  set when only rotation is running, not actually broadcasting — clarify
  exact wording/condition before implementing). Rename the `Output`
  `StatChip` label to `Mode`. Replace the `Time left` `StatChip` entirely
  with an "Overlay" stat showing on/off (from
  `streamOverlayShowTitle`) — clicking it opens the overlay config
  (`StreamOverlayEditor`) in a modal (reuse the `Dialog` pattern already
  used elsewhere in this file, e.g. the multistream destination dialog),
  where the artist can edit fields and toggle the overlay on/off; on save,
  show a toast with the result and update the stat chip's on/off state
  from the response (not just optimistically). Once this ships, remove
  the separate `overlay` tab from the manager entirely (`Tabs.List`'s
  third tab, `activeTab === 'overlay'` block, and the now-unused
  `MonitorPlayIcon` import) — the modal replaces it as the only entry
  point to the overlay editor from this panel.
- [x] **Go Live multistream "Add destination" modal was broken/unusable —
  fixed 2026-09-05.** Confirmed: `MulticastDestinationForm.tsx` (dropdown
  `Select` for provider, cramped one-row layout, no port split, no
  enabled toggle, no wired save/error state) was exactly the "unusable"
  one. The real, working version was `MulticastConfigureDialog`, local to
  `PluginStorePanel.tsx` (Settings → Add-ons → Multistream). Extracted it
  to its own shared file and rewired Go Live to use it via a small
  provider-picker step; deleted the old form entirely. See
  `docs/todo/multicast-configure-dialog-unification.md`.
- [ ] **Stream Manager: artist/track/status stat layout.** Move the
  artist name out from next to duration; put the current *track* where
  the artist currently sits (need to re-check exact current layout of
  whichever stat row this refers to — likely near the rotation/now-playing
  display, not the `StatChip` grid). Replace a "Playing" status label with
  "Rotation" text, shown as a status *light* (dot) — yellow for rotation,
  green for live — and remove the redundant text label next to the light
  once the color itself carries the state. Likely overlaps with the stats
  restructuring item above (`Output`→`Mode`, rotation-vs-offline wording)
  — do them together, not as two separate passes that touch the same
  stat row twice.
- [ ] **Stream Manager: icon-button playlist edit, with confirm.** Replace
  the current playlist-switch button with an icon-only edit button for
  the *current* playlist; must show a confirm dialog before actually
  switching/changing anything (destructive-ish — switching live rotation
  content). Reuse `ConfirmDialog` (already imported in
  `StudioGoLiveView.tsx` and used elsewhere in this app) rather than a new
  one-off.
- [ ] **Stream Manager: now-playing artwork with hover play/pause.** Add
  the current stream item's artwork next to the playback controls;
  clicking it plays/pauses the stream (mirrors the existing "media
  artwork play" hover pattern already used elsewhere — e.g. Listen/Discover
  card artwork, `MediaArtwork` — reuse that component/pattern rather than
  a new hand-rolled hover overlay). Show a play icon on hover when
  paused, pause icon on hover when playing, matching current playback
  state.
- [ ] **Go Live: move header subtext into the help layer; restore the
  calendar view.** Strip the explanatory subtext currently sitting under
  each panel header on `StudioGoLiveView.tsx` (e.g. "Choose your app,
  then copy the matching credentials", "Save this and future broadcasts
  to your recordings archive", etc.) and relocate/expand those
  explanations into the page's help layer instead — same
  inline-help-text-to-help-layer pattern as the `StreamOverlayEditor` item
  above; do both in the same pass since they're the same convention
  applied to the same page. Separately: "restore the calendar view to the
  top panel" — there was apparently a calendar/schedule view on this page
  before that's since been removed or moved; find it via git history on
  `StudioGoLiveView.tsx` (or ask the user which calendar, if git history
  doesn't turn up an obvious candidate) before attempting to "restore"
  anything.
- [ ] **Show creation flow: episode auto-fill + one-off/episode toggle +
  empty-state CTA.** When creating a show entry from a *series episode*
  picker, auto-fill the show form's fields from the selected series show.
  On the show form itself, add a toggle between "One-off show" and "New
  episode" (of an existing series) — need to locate the actual show
  creation view/dialog first (`StudioShowsView`? `StudioShowDetailView`?
  a dedicated create dialog?) to see current field structure before
  designing the toggle. If the artist has no shows/series yet, show a
  CTA to create one, opening a modal (reuse whatever the existing
  show/series creation modal is, if one already exists, rather than
  building a new one).
