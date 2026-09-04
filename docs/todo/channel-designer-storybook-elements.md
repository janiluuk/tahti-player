# Channel Designer → Storybook elements

**Status:** in progress — Player panel extracted; layout-only rows next.

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
| Releases…Gallery | layout-only hints | Visibility eye only — next |
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
6. Layout-only look rows (releases…gallery) copy/visibility

When correcting an element: extract its panel from `ChannelDesigner.tsx`
into `components/channel-designer/` if it is still an inline JSX blob,
wire the live designer to the extracted component, update the story.

## Out of scope for this pass

- Live Three.js dual-context issues (stories use `livePreview: false`
  unless explicitly testing visualizer)
- Saving / API (mock under Storybook `VITE_FORCE_MOCK`)
- Visualizer / overlay / video slots still owned by ChannelDesigner (mock
  placeholders in Storybook until those extract)
