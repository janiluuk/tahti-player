# Channel Designer → Storybook elements

**Status:** correction order complete — every listed element extracted and wired.

## Goal

Review and fix Channel Designer UI **one element at a time** in Storybook
(`Tahti/Channel/Designer/*`), without needing the full channel edit chrome.

## Story inventory

| Story / element | Source | Notes |
| --- | --- | --- |
| Full designer | `ChannelDesigner` | Preview + controls |
| Look-only shell | `lookOnly` | Docked layers Look slot |
| Backdrop | `BackdropPanel` | Extracted; exclusive header styles |
| Player | `PlayerPanel` | Gradient / Video / Visualizer / Overlay |
| Player gradient | `PlayerGradientControls` | Separate palette toggle |
| Player visualizer | `PlayerVisualizerControls` | Preset chrome + tuning slot |
| Player overlay | `PlayerOverlayControls` | Stage text layer + now-playing preset grid |
| Video/image field | `VideoOrImageField` | Shared `compact` (Player tab) / `backdrop` (Header) picker |
| Layout-only rows | `LayoutOnlyLookHint` | Releases…Gallery visibility copy |
| Color scheme fields | `ColorSchemeFields` | Shared pickers |
| Header style tabs | `HeaderStyleTabs` | Segmented control |
| Page background | `PageBackgroundField` | Always-on swatch |
| Layers menu | `ChannelLayersMenu` | Background row + Add playlist |
| Playlist picker | `ChannelPlaylistPicker` | Add vs settings (`applyOnChange`) |
| Playlist block | `ChannelPlaylistBlock` | Tracklist vs Cards |

## Correction order

1. ~~Color scheme fields (shared primitive)~~
2. ~~Backdrop — full `BackdropPanel` + primitives under `channel-designer/`~~
3. ~~Player (`PlayerPanel` + `PlayerGradientControls`)~~
4. ~~Layers menu + Background always-on row (fixed translucent dock)~~
5. ~~Playlist picker + block displays~~
6. ~~Layout-only look rows (releases…gallery)~~
7. ~~Player overlay + video slots~~ — extracted to
   `components/channel-designer/PlayerOverlayControls.tsx` (stage text
   layer + now-playing preset grid, "Configure text" dialog stays
   ChannelDesigner-owned) and `VideoOrImageField.tsx` (shared
   `compact`/`backdrop` picker — Player tab and Header backdrop render the
   *same* upload state through two variants of one component, not two
   independent uploads). Stories added:
   `ChannelDesignerPlayerOverlay.stories.tsx`,
   `ChannelDesignerVideoOrImageField.stories.tsx`.

When correcting an element: extract its panel from `ChannelDesigner.tsx`
into `components/channel-designer/` if it is still an inline JSX blob,
wire the live designer to the extracted component, update the story.

## Out of scope for this pass

- Live Three.js dual-context issues (stories use `livePreview: false`
  unless explicitly testing visualizer)
- Saving / API (mock under Storybook `VITE_FORCE_MOCK`)
- `NowPlayingOverlayConfigDialog` ("Configure text") itself — still
  ChannelDesigner-owned, not extracted this pass
- The header video/image URL field's "paste any URL, not just YouTube"
  behavior (`ChannelDesigner.tsx`'s `videoUrlInput`, now inside
  `VideoOrImageField`) is a known convention exception flagged elsewhere
  (see `packages/tahti-web/WORKPLAN.md`'s media-upload-convention entry) —
  out of scope here, this pass only moved the JSX, not the behavior
