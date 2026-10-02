# Artist channel page redesign

**Status:** open

The artist channel page (`/channel/:slug`, `packages/tahti-web/src/views/ChannelView.tsx` plus `src/components/channel-view/`) still doesn't look professional. Example: https://beta.tahti.live/channel/tahti-selects

## Reported problems (user, 2026-10-02)

- **False "On air" badge**: the red on-air badge shows on tahti-selects although nobody is live.
  - The badge renders when `channel.state === 'LIVE' && Boolean(channel.hlsUrl)` (`ChannelView.tsx:272`, badge at ~579).
  - Not yet checked: whether the API reports `LIVE` while the 24/7 rotation plays. If it does, the page needs to tell a real live broadcast from rotation playback (for example "24/7 rotation" instead of "On air").
- **Borders around the page**: remove the framed and bordered look. The channel should use the full container width.
- **Top-right icons cut off**: the header action icons are clipped.
- **Content cut off**: the content, including the tracklist, is clipped.

## Plan

- [ ] Reproduce on beta at desktop and phone widths and capture before screenshots.
- [ ] Confirm what the API returns for `state` and `hlsUrl` on a rotation-only channel, then fix the on-air logic.
- [ ] Redesign the layout:
  - full-width container, with no outer border or frame;
  - a header whose actions never clip;
  - a tracklist and blocks that don't overflow.
- [ ] Use `@tahti-player/ui` components throughout and update the affected Storybook stories and snapshots.
- [ ] Capture after screenshots in dark and light themes at desktop and phone widths.
