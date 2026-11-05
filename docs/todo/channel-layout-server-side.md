# Channel page layout is saved on the channel

**Status:** partial

The Channel Designer's page layout (which sections show, block widths and offsets, navigation tabs, the Identity toggles) used to live only in the owner's `localStorage`, so visitors always got `defaultChannelPageLayout()`.

## Done

- [x] tahti-org #1075: `Channel.pageLayoutJson`, `pageLayout` on `PATCH /api/me/channel/visual`, returned on `GET /api/channels/:slug` and the owner's visual.
- [x] tahti-web: `ChannelView` applies the channel's `pageLayoutJson` (and seeds this browser's copy); the designer's look load does the same; saving the layout and the Settings-side toggles go through `persistChannelPageLayout` (local + API, toast on failure); an owner's existing local layout is uploaded once when the channel has none.

## Left

- [ ] Deploy tahti-org #1075 (and #1074 before it), then ship this.
- [ ] `loadArtistLookVisibility` (player and backdrop on/off in the designer) is still per browser; fold it into the page layout or the look if visitors should see it.
