# Radio channel → open radio page

**Status:** open

## Goal

On a radio channel’s page, show an icon button that opens the radio page (`/radio`) when the channel is `channelKind === 'RADIO'`. Hide it for every other channel. On RadioStationView, only show the external website Globe when `detailUrl` is present.

## Plan

- [x] `ChannelPageActions`: RadioTower `ButtonLink` → `/radio` for RADIO only
- [x] i18n `channelPage.openRadio` (en + fi)
- [x] Gate RadioStationView website button on `detailUrl`
- [x] Unit tests for show/hide + href
- [ ] Prettier, type-check, lint, bump, worklog
