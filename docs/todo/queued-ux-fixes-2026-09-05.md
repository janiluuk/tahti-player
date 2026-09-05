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
- [x] **StreamOverlayEditor subtext → HelpLayer — shipped 2026-09-05.**
  The "RTMP has no built-in title metadata..." paragraph now sits inside
  a `HelpLayer` disclosure ("How the stream overlay works") instead of
  as permanent body text, using the newly-ported component (see
  `docs/todo/help-layer-component-port.md`).
- [ ] **Stream overlay cover: default placeholder + auto-fill text.**
  When no custom cover is set, show the currently-playing track's artwork
  as the placeholder in the cover slot (not just a bare `ImageIcon`) —
  needs whatever "now playing" data source Studio Go Live already has.
  Default `streamOverlayTitle`/`streamOverlaySubtitle` (when the artist
  hasn't set custom ones) to the current show's artist/title and tagline
  respectively — skip the tagline entirely (don't render an empty
  subtitle line) when it's blank, rather than showing blank text.
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
- [ ] **Stream Manager: now-playing artwork with hover play/pause —
  blocked on missing data, investigated 2026-09-05.** UI side is easy:
  `MediaArtwork` (`packages/ui/src/components/MediaArtwork/MediaArtwork.tsx`)
  already has exactly this pattern built in (`onPlay`/`isPlaying` props
  render a centered hover play/pause button at any size). The blocker:
  `StreamManagerPanel.tsx`'s current-track data (`RotationPlayback`,
  wrapping `ProgrammeItem` from `api/studio-extras.ts`) carries no
  artwork field at all — checked `ProgrammeItem`, `SignalStatus`,
  `ChannelManageStats` (`api/broadcast.ts`) — none of them return a cover/
  artwork URL for the currently-playing rotation item. This needs either
  a backend addition (the rotation-status endpoint returning the sound's
  artwork URL) or a client-side lookup from `rotation.item.id` against
  the studio sounds list (extra fetch, likely N+1-ish if done per-poll —
  needs a real endpoint change instead). Don't build this without that
  backend piece; flagging rather than guessing at a workaround.
- [x] **Go Live: move header subtext into the help layer — shipped
  2026-09-05.** Dropped trivial `StudioPanel` `description` captions
  (Connect broadcasting software / Recording / Multistream) and the
  always-visible OBS/Icecast paste instructions; expanded the
  `broadcast` Help Center article to cover what was removed. **Not
  done**: "restore the calendar view to the top panel" — no "calendar"
  reference has ever existed in this file's git history; needs the user
  to point at which calendar (candidates: `StudioScheduleView.tsx`,
  `RadioBookingCalendar.tsx`, `StudioEventsView.tsx`) rather than a
  guess.
- [x] **Port `HelpLayer` from tahti, use it on Go Live — shipped
  2026-09-05.** The sibling `tahti` repo's `DesignerHelpLayer` (inline
  collapsible "? Help" toggle) was ported to
  `packages/tahti-web/src/components/HelpLayer.tsx` (asked the user
  whether to port it; confirmed yes) and wired into `StudioGoLiveView.tsx`
  as one page-level "How broadcasting works here" disclosure containing
  the explanations moved out in the item above. The Help Center article
  content from that earlier pass was kept too (durable reference,
  doesn't conflict with the inline copy). See
  `docs/todo/help-layer-component-port.md`. **Follow-up**: the
  `StreamOverlayEditor` subtext item below should use this new
  `HelpLayer` component too, not the Help Center.
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
- [x] **Show info form: dropdowns + layout + status button — shipped
  2026-09-05.** `showType`/`visibility` segmented controls replaced with
  `Select`; tagline moved onto the show-name row; added a yellow/green
  "Show info" status button to the "Ready to take over the rotation"
  panel that opens the form in a modal. **Flag**: kept the inline panel
  in place rather than removing it (ambiguous which was wanted) — see
  `docs/todo/show-info-form-dropdowns-and-status-button.md`.
- [x] **ChannelView: duplicate OnAir badge, playlist-download → share
  modal, social icons, subtext — shipped 2026-09-05 (partial; see flag).**
  Removed the hero block's own duplicate on-air badge (masthead's is
  kept). Replaced the "download as playlist" button with a "Playlist"
  copy-link row in `ChannelShareButton`'s modal (copies the live stream
  URL, toasts). Added X/Facebook/LinkedIn/email share icons. Removed the
  modal's subtext caption. **Not done**: "move the player above the
  tabs" — real structural change to the block-rendering system, needs
  its own pass; see `docs/todo/channelview-badge-dedup-and-share-modal.md`
  for exactly what that requires.
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
- [x] **Channel Designer: duplicate "Open my channel" link — fixed
  2026-09-05.** Located the real component:
  `packages/tahti-web/src/components/ChannelDesigner.tsx` (the
  Storybook-cataloged `Designer`, per the many `ChannelDesigner*.stories.tsx`
  files — this is a hand-authored component, not one exclusive to
  Storybook). `openChannelLink` was rendered twice: once in the main
  top action row (next to "More"/Save, line ~1384) and again in the
  "Live page preview" panel's own header, right-aligned (line ~1474) —
  that second one is "the right corner" the report meant. Removed the
  second occurrence and the now-pointless `justify-between` on its
  wrapper; kept the one next to Save (more useful — it's where you'd
  look right after saving).
- [ ] **Storybook refresh + Channel Designer layout save/restore.**
  Two separate asks, not done: (1) Generate/update Storybook stories to
  reflect the current state of tahti-player — broad, cross-cutting;
  needs its own pass to find which components have drifted from their
  stories (new props added this session alone: `PluginStoreItem.compact`,
  `CopyField.maskable`, `MulticastConfigureDialog` extraction,
  `ConfigurableCard.asModal`, etc. — likely more repo-wide, worth a
  dedicated sweep rather than folding into this item). (2) Layout
  save/restore: `ChannelDesigner.tsx`'s `saveButton` (`SaveButton`,
  ~line 1265, label "Save layout" when not `lookOnly`) currently has no
  concept of a previous-state snapshot — `save()` (search this file) just
  persists `layout`/`layoutDirty` directly. Add: on save, stash the
  previous layout value; show a new icon button next to `saveButton`
  that restores it — only after a save has actually happened (not
  before). Clarify persistence scope before building: in-memory for the
  current editing session only (lost on reload) vs. something durable —
  in-memory is the cheaper/likely-intended reading given "temporarily",
  but confirm rather than assume if it matters.
- [ ] **Channel Designer: gallery "+" add-images modal + hover
  delete/reorder.** Find the gallery/slideshow section in
  `ChannelDesigner.tsx` (search for `galleryMode`/`slideshowImages`,
  already referenced elsewhere in this file per the `ChannelView.tsx`
  hero block props) — add a "+" tile/button that opens a modal to pick
  which images become part of the slideshow (reuse whatever image-
  picker/upload pattern the rest of the designer already uses, e.g. the
  image-slot hover pattern from `docs/todo/stream-overlay-cover-upload-and-title-toggle.md`
  — delete-badge + reveal-on-hover is the established convention here).
  On existing gallery images, hovering should reveal a delete icon and a
  drag handle for reordering (check if any existing list in this app
  already has drag-to-reorder — e.g. rotation/playlist editors — reuse
  that mechanism rather than adding a new drag library if one isn't
  already a dependency).

- [ ] **Channel Designer: Background section — visualization tab +
  solid-only color + gradient preset wiring.** Three related asks in
  `ChannelDesigner.tsx`'s Background section (search for
  `ChannelDesignerBackdropPanel`-related fields — there's already a
  `ChannelDesignerBackdropPanel.stories.tsx`, likely the same
  component): (1) add a "Visualization" tab showing previews of the
  different visualizer presets the user says were "reserved for it" —
  find whatever preset catalog already exists
  (`resolvePublicVisualizerPreset`/`ChannelVisualizer`, used in
  `ChannelView.tsx` — check there for a full preset enum/list) and
  confirm what "reserved" refers to before assuming presets already
  exist unused. (2) The background color picker should only show when
  the mode is "solid" — currently presumably always visible regardless
  of mode. (3) Picking a gradient preset should actually update/preview
  the background gradient live — currently described as not doing that.
  (4) The gradient color swatches are labeled with names that belong to
  a different container/context (a copy-paste labeling bug, not a logic
  bug) — find and fix the mismatched labels once located.
- [ ] **Channel Designer: PlayerVisualizerControls under "Player
  visualizer" tab.** `ChannelDesigner.tsx` already has a
  `ChannelDesignerPlayerVisualizer.stories.tsx` (Storybook) and likely a
  "Player visualizer" tab/section already exists but doesn't currently
  render `PlayerVisualizerControls` — locate that component (search the
  repo for `PlayerVisualizerControls`) and confirm whether it exists
  already or needs to be built, then wire it into that tab. Update the
  corresponding Storybook story to match once done (same "keep
  Storybook in sync" ask as the broader Storybook-refresh item above).

- [ ] **Radio browser directory: layout, cover images, enable flow.**
  Multiple asks for whatever view is the "radio browser directory"
  (likely `RadioView.tsx` and/or a dedicated stations-directory
  component under Discover — need to locate the exact file first,
  there's also `RadioStationCover.tsx` for individual station covers).
  (1) Collapse the genre icon grid under an "All genres" disclosure
  instead of always showing every genre icon. (2) Move the search bar
  above the search button, with the search button embedded inside the
  search box itself (icon-button suffix, not a separate button below).
  (3) Make the Stations tab the first/default tab (find whatever tab
  list controls this view — Genres/Stations/etc.). (4) Station cover
  images can't be updated/edited currently — investigate why (permission
  check? broken upload handler? read-only by design for imported
  stations?) and fix; the user separately asked to "scrape them to
  production if you can already" — that's a data/content task (fetching
  real station artwork and pushing it to the production database),
  not a UI change, and needs its own scoping (source of the images,
  which stations, whether this repo even has prod DB access) before
  attempting. (5) Enabling a station should add it to a list at the top
  (of what — the directory itself, or a separate "enabled stations"
  panel? — confirm), using an icon button for the enable action instead
  of whatever control it uses today. (6) Remove a "changes are saved for
  this add-on" message somewhere in this same area (likely a toast or
  inline notice tied to enabling/reordering stations — find its exact
  source before removing, since if it's the only save-confirmation
  users get, removing it outright could be the wrong fix vs. e.g.
  replacing it with a toast).

- [ ] **Audio plugins/add-ons: rename Mastering, relabel section, icon
  active button, access tier.** Locate the audio plugins/add-ons list
  (likely `PluginStorePanel.tsx` or a dedicated audio-tools catalog —
  there's already a Pro Editor view (`StudioProEditorView.tsx`), so
  check whatever registers it as a plugin/add-on entry). Rename the
  "Mastering" entry's label to "Reference Match", with "by: Pro Editor"
  as its attribution/subtitle. Change its active/enabled indicator to
  an icon button (matching the icon-button convention used elsewhere —
  `Tooltip` + `aria-label`) instead of whatever it uses today. Label the
  whole section/category as "Audio tools". Set its access tier to
  "Artists and above" — find whatever access-tier/role field gates
  other plugins (e.g. free vs. member-only add-ons) and apply the same
  mechanism rather than inventing a new one.
