# Channel page layout is saved only in the owner's browser

**Status:** blocked

The Channel Designer's look (colors, backdrop, header style, player, visualizer) is saved through the API, but the page layout is not. `lib/channelPageLayout.ts` keeps it in `localStorage` (`tahti.channelPageLayout.<slug>`), so visitors and the owner's other devices always get `defaultChannelPageLayout()`.

Affected settings: which sections show (releases, tracks, latest, feed, news, events, chat, programming, navigation tabs, embeds, playlists), block widths and offsets, and the Identity toggles (Show avatar, Show bio, Show Subscribe button, Show follower and play counts).

## Needs

- [ ] tahti-org: a channel field for the layout (JSON, validated like the look), returned on the public channel and saved from the designer. Blocked: tahti-org change, not started.
- [ ] tahti-web: load the layout from the channel response, fall back to localStorage once to migrate an existing local layout, then save through the API.
- [ ] Docs: `packages/docs/user-manual/studio/your-channel.md` already describes these settings as part of the page; check it still matches once they persist.
