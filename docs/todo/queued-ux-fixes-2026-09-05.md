# Queued UX fixes (2026-09-05)

**Status:** open

Open items only. Shipped bullets folded to HISTORY.md on 2026-09-05.

- [ ] **Full player view: left/back arrow does nothing — should minimize
  the player.** Reported 2026-09-07. `FullScreenPlayer.tsx`'s top-right
  button (`packages/tahti-web/src/components/FullScreenPlayer.tsx`,
  around line 123) already wires `onClick={close}` →
  `useLayoutStore`'s `setFullScreenPlayerOpen(false)`, and on this
  branch (`perf/polling-and-dom-audit`) it renders as a `Minimize2Icon`;
  the `.claude/worktrees/workplan-cycle` copy of the same file instead
  renders an `ArrowLeftIcon` in that same spot with the same
  `onClick={close}` wiring. Since the handler looks correctly wired in
  both variants read from source, this needs live browser
  verification (deployed/dev build) to find the actual failure —
  possibly an overlay/z-index stealing the click, a stale build, or a
  different left-arrow element entirely that this pass didn't find.

- [ ] **Library: tracks missing for some users.** Reported 2026-09-07
  alongside a "Library shows Studio tabs" report — that half is fixed
  (see HISTORY, 2026-09-07). Remaining, unconfirmed: `MyDiscographyView`
  (Library's Sounds tab, `MyDiscographyView.tsx:189`) gates its entire
  success branch on `hasChannel = Boolean(user?.channel)` — falsy
  renders "No sounds yet" regardless of `loading`/fetched `items`.
  Checked whether this gate is simply wrong: `StudioGate.tsx`'s
  `requireChannel` guard means Studio upload routes already require a
  channel, so in principle any user with real sound records already has
  `user.channel` truthy, and this gate should never trip for them —
  which means removing it blindly could be the wrong fix. Needs live
  repro against a real signed-in session that has sounds but shows
  none, to see whether `user.channel` is actually falsy at that moment
  (a real regression, e.g. stale auth-store hydration or a backend
  response change) or whether the bug is elsewhere (e.g.
  `fetchStudioSounds()` itself returning empty for that account).
  Don't guess-fix without that confirmation.

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

- [ ] **(Later) Channel Designer: tabs off by default, opt-in via
  Navigation section + configuration dialog.** Lower priority per the
  user ("add to later todo"). Relates to the earlier-queued "Channel
  Designer: tabs under the player, dynamic per enabled section" item
  above — refines it: tabs should not appear in the profile by default
  at all; the user has to explicitly turn them on from a "Navigation"
  section that should be selectable/available in the Layers list
  (`ChannelLayersMenu`'s "Layers" tab — see `addItemType`/layout item
  types for the pattern to add a new configurable layout element type).
  Add a configuration dialog for that Navigation section letting the
  user pick which content sections appear under each tab. Do this as
  part of the same effort as the earlier tabs-under-player item, not
  separately — they're the same feature.

