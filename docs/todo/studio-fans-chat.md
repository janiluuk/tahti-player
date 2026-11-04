# Studio Fans: Chat on the hub

**Status:** partial

## Goal

Studio → Fans main page includes Chat (enable/off on the page) and simple
moderation (access, messages, bans, moderators). Consolidate Settings →
Channel Chat/Moderators and related links here.

## Done (this PR)

1. `ChannelChatSettings` on `StudioFansView`.
2. Settings Channel Chat/Moderators → pointer to Fans.
3. Profile hub Chat/Moderators → `/studio/fans`; `/studio/moderation` redirects there; ModerateChannel owner link updated.
4. Storybook Fans play asserts Chat; ChannelPanel tests; bump `0.0.314`.

## Left

- Live verify on beta after merge.
