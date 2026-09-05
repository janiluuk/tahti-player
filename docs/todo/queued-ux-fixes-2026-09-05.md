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
- [x] **Go Live: proper toaster on save — shipped 2026-09-05 (partial;
  see flag).** Found two genuinely silent-on-success actions in
  `StudioGoLiveView.tsx`: `toggleRecording` (only ever showed an error
  banner, never confirmed success) and the per-target Enable/Disable
  button (gave *no* feedback at all, not even on failure). Both now use
  `toast.success`/`toast.error`. **Flag**: did *not* touch the `message`/
  `setMessage` live-status banner (go-live/end-broadcast text) — a prior
  sweep (`WORKPLAN.md`'s toast-consolidation entry, 2026-09-04) already
  reviewed this exact file and explicitly decided it's an intentional
  persistent status banner, not transient feedback to convert. If "proper
  toaster on save" was actually asking to revisit *that* decision (not
  just the two silent gaps found), say so explicitly — this pass assumed
  it wasn't. Notification dropdown's visible scrollbar (`AppTopNav.tsx`)
  fixed by adding the app's existing `tahti-hide-scrollbar` utility class
  (already used the same way in `AppShell`/`RightRailPanel`/
  `DesktopLibraryPanel`). **Not done**: "use big icons instead" — the
  notification list items currently have *no* icon at all (just
  title/body text + an optional badge/button), so it's unclear what this
  refers to exactly; needs clarification (per-notification-type icons?
  something else visible only in a screenshot?) rather than a guess.
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
- [x] **Stream Manager: icon-button playlist edit, with confirm — shipped
  2026-09-05.** `StreamManagerPanel.tsx`'s text "Playlist" button (`+`
  icon) is now an icon-only pencil button (`Tooltip` + `aria-label="Edit
  playlist"`, per the icon-button convention). "Add to rotation"/"Replace
  rotation" no longer apply immediately — they set a `pendingApply`
  state that a new `ConfirmDialog` (reused, not a one-off) confirms
  before actually calling `handleApplyCollectionToRotation`; "Replace"
  gets an explicit warning that it removes every track currently in
  rotation.
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
- [x] **Top-nav broadcast icon: rotation dot + live-only flash + Stream
  Manager quick-access icon — shipped 2026-09-05.** `AppTopNav.tsx`: the
  previous `hasConnectionIssue` (`channelState === 'LIVE' &&
  !signalConnected`) branch was mathematically identical to
  `broadcast.kind === 'rotation'` and rendered as a *red pulsing error* —
  i.e. the normal "24/7 rotation is carrying the channel, nothing is
  actually broadcasting" state looked like an outage. Replaced with an
  explicit `isRotation` check rendering a **static** yellow dot (no
  pulse); `preview` also stays static (`warning` class, pulse dropped) —
  only `live` pulses/flashes now, matching "only flash the top
  notification if user is live". Applied the same tone mapping to the
  expanded dropdown's own status dot for consistency (it already treated
  this state as non-error before the fix; now the collapsed icon agrees
  with it). Separately: added a `ListMusicIcon` "Stream manager" icon
  button next to the broadcast icon that opens `StreamManagerPanel`
  (`slug`, `channelState` from `user.channel`) standalone inside a
  `Dialog.Root` modal — no navigation, no other props wired (playback
  toggle, rotation-change callback) since this is a quick-glance/control
  surface, not the full Go Live page context.
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
- [ ] **ChannelView (Storybook component): player position, duplicate
  OnAir badge, playlist-download → share modal.** Located: `views/
  ChannelView.tsx` has two `OnAirBadge` usages (line ~576 and ~1142) —
  one is the reported duplicate "on air" at the top; figure out which one
  is the real one to keep before removing the other (they may be for
  different render paths, e.g. mobile vs desktop — check before deleting
  either). Move the player above the `Tabs.Root` (~line 1384) — check
  current DOM order relative to the tabs first. Remove the
  `DownloadIcon`-labeled "download as playlist" button (~line 1164,
  near `ChannelShareButton` ~1169) and instead add a "Playlist" button
  with a copy icon inside `ChannelShareButton`'s share modal — clicking
  copies the playlist link to the clipboard (use the shared `CopyButton`
  component, not a hand-rolled clipboard call) and shows a toast. In that
  same share section, add common social-media share icons (check if a
  shared "share to X" icon set/component already exists anywhere in the
  app before building one). Also: remove the explanatory subtext from the
  share channel modal (`ChannelShareButton.tsx`) — another
  inline-help-text-must-go instance, matching the pattern used elsewhere
  today.
- [ ] **CatalogView: invisible artist titles + hide support widgets until
  configured.** No file named `CatalogView` (or close variants) exists in
  `packages/tahti-web/src` — this may be a `Catalog`-named view in the
  *sibling* `tahti` repo's `apps/web` instead of here, or a differently-
  named component in this repo (check `DirectoryArtistCardGrid` and the
  Discover/Listen artist grids first). Confirm which repo/file before
  starting. Once located: (1) artist title text is invisible — almost
  certainly a text-color-on-background contrast bug (a dark-on-dark or
  light-on-light class), fix the color token, not a one-off hardcoded
  color. (2) Don't show "support" widgets (fan-sub / tip / purchase-tier
  prompts — check `FanTiersEditor.tsx`/`AudienceVisibilitySection.tsx`
  for the relevant enabled/configured flag) on an artist's page/catalog
  until that artist has actually set up and enabled their subscription
  tiers — needs whatever flag distinguishes "tiers configured" from
  "tiers exist but not enabled" from "no tiers at all".
- [ ] **Channel Designer: tabs under the player, dynamic per enabled
  section, visual editor for adding them.** Locate the `Designer`
  component in Storybook (`packages/storybook/src/tahti-web/`) and its
  real counterpart (likely the channel-editing view backing
  `ChannelView`/a dedicated designer route — confirm which before
  editing). Move the tabs from the header to below the video player.
  Remove the "Published on your channel" text. Tabs should be dynamic
  based on which sections the artist has enabled — by default only
  "Home" exists, so hide the tab bar entirely when there's only one
  section (nothing to switch between). Clicking the tabs area, or
  selecting a "tabs" element in the designer's own editing UI, should
  open configuration for which sections to add (e.g. a separate
  "Releases" tab) — needs a visual/inline editor for adding sections, not
  a settings-panel-only flow (check if the designer already has some
  visual-editing affordance for other elements to match its pattern).
  Switching tabs should animate the content transition to the newly
  selected section instead of an instant swap. This is a substantial,
  multi-part feature (new data model for "which sections are enabled",
  new visual tab-config UI, content-switch animation) — scope and
  sequence it as its own effort rather than a quick pass; don't start
  implementation without confirming which real (non-Storybook) view this
  maps to.
