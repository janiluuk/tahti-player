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
- [x] **Rename "Stream Playlist Manager" → "Stream Manager" — fixed
  2026-09-05.** Found it: `StreamManagerPanel.tsx`'s title text was
  `"Stream playlist manager"` (lowercase p/m — the earlier case-sensitive
  grep for the capitalized form missed it). Changed to `"Stream
  Manager"`.
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
- [x] **Stream Manager stats + overlay restructuring — shipped
  2026-09-05.** `Signal` stat's rotation case now reads `Offline` (not
  `Rotation`). `Output` renamed to `Mode`. `Time left` replaced with a
  clickable `Overlay` (`On`/`Off`) stat that opens `StreamOverlayEditor`
  in a modal — it already toasts its own save result and has the on/off
  toggle. The `overlay` tab is gone entirely (tab list, content block,
  `activeTab` narrowed to `'rotation' | 'stats'`); the modal is now the
  only entry point. See
  `docs/todo/stream-manager-header-and-overlay-modal.md`.
- [x] **Go Live multistream "Add destination" modal was broken/unusable —
  fixed 2026-09-05.** Confirmed: `MulticastDestinationForm.tsx` (dropdown
  `Select` for provider, cramped one-row layout, no port split, no
  enabled toggle, no wired save/error state) was exactly the "unusable"
  one. The real, working version was `MulticastConfigureDialog`, local to
  `PluginStorePanel.tsx` (Settings → Add-ons → Multistream). Extracted it
  to its own shared file and rewired Go Live to use it via a small
  provider-picker step; deleted the old form entirely. See
  `docs/todo/multicast-configure-dialog-unification.md`.
- [x] **Stream Manager: artist/track/status stat layout — shipped
  2026-09-05.** Header "Current track" block: bold/primary line now shows
  `artistName`, secondary line shows `title` + duration (artist no longer
  paired with duration). Status dot: green pulsing for `Live`, static
  yellow for `Playing` (rotation), none for `Paused`/`Stopped`; the
  redundant text pill next to it removed. **Flag**: "replace the current
  track with the artist" could also have meant dropping the title
  entirely rather than demoting it — kept the title on the secondary line
  since deleting displayed data seemed the riskier misread; revisit if
  that's not what was wanted. See
  `docs/todo/stream-manager-header-and-overlay-modal.md`.
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
- [ ] **Top-nav broadcast icon: rotation dot + live-only flash + Stream
  Manager quick-access icon.** `AppTopNav.tsx`'s broadcast icon already
  has everything needed to distinguish states —
  `useOwnBroadcastPresence`/`resolveBroadcastPresence`
  (`lib/broadcastPresence.ts`) returns `kind: 'live' | 'rotation' |
  'preview' | 'offline'` — but `broadcastTone` only branches on
  `isLive`/`hasConnectionIssue`(error)/`hasBroadcastWarning`(preview,
  warning); `rotation` and `offline` both fall through to the same
  `'idle'` (no color, no dot) bucket today. Add a `rotation` case: a
  static yellow dot (no pulse animation — reuse the existing
  `border-accent-yellow/70 bg-accent-yellow/15 text-accent-yellow` color
  but drop the `motion-safe:animate-[pulse_...]` part). Per the request,
  pulsing/flashing should be reserved for `live` only — check whether
  `preview`'s current pulse should also become static, or if pulsing for
  "preview" (about to go live) is intentional and only rotation should be
  exempted; clarify if unsure rather than silently changing preview's
  behavior too. Separately: add a Stream Manager icon next to the
  broadcast one in the top nav that, on click, opens `StreamManagerPanel`
  inside a modal only (no navigation) — check `StreamManagerPanel`'s
  props for what it needs (`slug`, `channelState`, etc. — see its usage
  in `StudioGoLiveView.tsx`) to render it standalone in a `Dialog`.
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
- [ ] **Show info form: dropdowns + layout + status button.** Located:
  `BroadcastPreflightPanel.tsx` (rendered inline in
  `StudioGoLiveView.tsx`'s "Before you start" section) — `showType` and
  `visibility` are currently hand-rolled segmented-control-style radio
  groups (`role`/`checked` pattern around line 188–227), not the shared
  `Select` component; replace both with `Select` and make them fit
  better (narrower row — check whether they should sit side by side).
  Move the tagline field onto the same row as the show name field.
  Separately: add a compact status button on the "Ready to take over the
  rotation" panel (`StudioGoLiveView.tsx`, the panel whose title switches
  between that and "Signal ready"/etc., around line ~372) labeled "Show
  info" — yellow status if `showInfoConfirmed` is false / fields are
  empty, green once filled in. Clicking it opens `BroadcastPreflightPanel`
  in a modal to edit, instead of (or in addition to — clarify) its current
  always-inline placement. Note: `ShowInfoConfirmed` already exists as a
  small "confirmed" indicator component next to this panel — check
  whether it should be replaced by the new status button or kept
  alongside it.
