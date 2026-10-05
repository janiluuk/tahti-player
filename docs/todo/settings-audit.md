# Settings audit: structure, unwired items and likely bugs

**Status:** partial

User ask (2026-10-04): audit Settings thoroughly. Make sure it uses the standard Storybook components and follows professional UI guidelines, flag bugs and unwired items, and restructure it to be less crowded. Add a Chat tab under the channel section, move the chat settings there, and give channel moderators their own section.

## Done (2026-10-04)

- The channel section is now "Channel & chat" with five tabs: Channel Designer, Discovery, Username & domain, Chat, Moderators.
- **Chat** gathers what was in three places: "Enable live chat" (was under Discovery), "Show today's listener count in my chat" (was under Account → Notifications → Visibility), "Only fan subscribers can post" and chat bans (were under Moderation).
- **Moderators** is its own tab: the list, add by username, remove with a confirm, and a sentence on what a moderator can and cannot do.
- Broadcast lost its read-only "Moderators" tab, which duplicated the list and told people to manage it "from your account on tahti.live".
- Fixed: the connections-visibility toggle marked itself as saving under the `chatEnabled` key.
- The moderation panels are shared components (`components/moderation/*`), used by Settings and by Studio → Moderation.

## Component audit

- No hand-rolled `<button>`, `<input>`, `<select>`, `<textarea>`, `<a>` or `<img>` is left in `src/views/settings/`.
- Panels: `StudioPanel` is the one card component. The moderation panels used it; Notifications (#541) and Mentions (#542) now do too. Left: most other tabs are bare `SettingsToggle` rows under an `h2` with no card at all (Visibility, Discovery, Playback); decide whether those get panels too.

## Fixed since the audit

- The share-button switch is saved on the account and hides the button for every visitor (tahti-org#700, #496).
- Broadcast → Radio and Green room switches undo themselves and show the error when a save fails (#495).
- Renaming a channel asks first and says the stream key may change (#497).
- The six disabled "Coming soon" controls are removed: Show favourites and Announce releases (#522), the three Discovery switches and Crossfade (#523).
- Account's tabs are four groups: Sign-in & security, Membership & billing, Notifications, Privacy & data (#527).
- An account with no channel does not see Channel & chat or Broadcast (#525).

## Likely bugs

- None left: Username & domain shows failures as red alerts since #511.

## Crowding

- Done 2026-10-05: Artist's eight tabs are three groups (#530), and the section descriptions that repeated the tab names are gone (#532).

## Needs a decision

- "Moderators who can manage the channel": the API only delegates chat moderation (remove messages, ban from chat). There is no role that can edit the channel. If that is wanted, it needs tahti-org work first.
- The section is named "Channel & chat" because "Channel & moderation" does not fit the settings sidebar without being cut off. Say if another name is preferred.
