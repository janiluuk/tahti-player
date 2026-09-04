# Channel Designer → artist page full control

**Status:** shipped client-side 2026-09-04 (0.0.69+).

## Done

- Artist header: headerStyle, video, color scheme, brandAccentPreset
  gradient, visualizer + visualSettingsJson
- Player stage: player gradient, visualizer, NowPlayingOverlay, player
  text overlay
- Page: background palette + ambient backgroundVisualPreset
- Designer: background visualizer picker
- ChannelView: same player/background schemes + brand gradient
- PublicChannel: brandAccentPreset + mock look extras; fetchChannel maps
  live `textLayer*` → `textOverlay*`; live save also PATCHes
  `/api/me/channel/text-layer`
- E2E: `e2e/channel-designer-artist-look.spec.ts`

## Still API-limited (live multi-device)

Player/background gradient JSON and backgroundVisualPreset still lack
dedicated Prisma columns — mock exposes them on PublicChannel; live
clients keep `tahti.channelLookExtras.{slug}` until sibling API adds them.
`visualSettingsJson` is still missing from PublicChannelViewSchema on
live GET (designer saves it; public page may not receive tuning).
