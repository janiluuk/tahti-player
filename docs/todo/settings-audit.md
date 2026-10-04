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
- Panels are not consistent: Notifications builds its own cards (`rounded-xl border p-4` with an `h3`), the moderation panels use `StudioPanel`, and most toggles are bare `SettingsToggle` rows. Pick one panel component for all of Settings.

## Unwired or placeholder controls

- Discovery: "List in Listen directory", "Allow Tahti Radio pickup" and "Featured on Listen home" are disabled switches marked "Coming soon". No API exists for them.
- Notifications → Visibility: "Show favourites" is a disabled placeholder. Notifications: "Announce releases" is a disabled placeholder.
- Playback: "Crossfade" is disabled (not supported by the web player).
- Decide for each: build it, or remove it until it exists. Six dead switches make the page look broken.

## Likely bugs

- [ ] "Show share button on my channel and Broadcast" (Discovery) is saved in the browser only (`channelShareStore`, localStorage). The text says it controls what listeners see, but nothing reaches the API, so it has no effect for anyone else or on another device.
- [ ] Broadcast → Radio and Green room switches save without checking the result (`void patchProgramme(...)`, `void patchGreenRoomPrefs(...)`). On a failed save the switch stays flipped and nothing is shown.
- [ ] The same unchecked save pattern is in `SocialOAuthPlatform.tsx` and one `patchMeProfile` call in `ArtistPanel.tsx`.
- [ ] Username & domain: "Rename" changes the public address with no confirmation, and results appear as a plain note under the form instead of a toast or field error.

## Crowding

- [ ] Account has 12 tabs (session, security, two-factor, API tokens, membership, governance, storage, notifications, mentions, subscriptions, purchases, privacy). Group them: Sign-in and security / Membership and billing / Notifications / Privacy and data.
- [ ] Artist has 8 tabs (identity, story, people, connections, branding, gallery, press kit, release visuals) in a 591-line panel.
- [ ] Section descriptions under the title repeat the tab names; drop them once tabs are grouped.

## Needs a decision

- "Moderators who can manage the channel": the API only delegates chat moderation (remove messages, ban from chat). There is no role that can edit the channel. If that is wanted, it needs tahti-org work first.
- The section is named "Channel & chat" because "Channel & moderation" does not fit the settings sidebar without being cut off. Say if another name is preferred.
