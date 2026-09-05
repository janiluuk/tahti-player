# Queued UX fixes (2026-09-05)

**Status:** open

Open items only. Shipped bullets folded to HISTORY.md on 2026-09-05.

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

