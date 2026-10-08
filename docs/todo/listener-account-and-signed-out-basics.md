# Listener account, and the basics without signing in

**Status:** partial

User ask (2026-10-04): add a separate listener user who is registered but has no Studio or Admin features, and make sure all the basic things work without ever having to log in.

## What exists (checked 2026-10-04)

- `AccountRole` is `'BOARD' | 'ARTIST' | 'LISTENER'` in `packages/tahti-web/src/api/types.ts`.
- The mock app signs in as `demo@tahti.live`, a board artist. The capture scripts and most manual checks use that account, so a listener's view is rarely exercised.
- Storybook has `MOCK_USERS.listener`, used by a few stories.
- `scripts/audit-left-menu.mjs` already visits every route signed out and found no route that loses the left menu.

## Done (2026-10-05)

- Settings: Channel & chat and Broadcast are hidden from an account with no channel; the profile section is called Profile (#525).
- Studio: a listener is offered "Create your channel" instead of "Artist access required", with no Studio tab bar and no dialog opening by itself (#526).
- Signed out, track page: reactions and Add open sign-in instead of being disabled; "Comments are off" is no longer a login link (#524).
- Signed-out pass over track, artist, channel, collection, radio station, Favorites, Library, Messages, Feed, History and the subscribe page: report, follower list, queue and download work; Library, Messages and Feed ask for sign-in.
- Second pass (search, Help, channel comments, artist follow): the artist page offers Follow to a signed-out visitor and opens sign-in (#535); the top search has one clear button and Enter opens the first result (#537, #538). Help and channel comments needed no change.
- Found on the way: the artist header buttons wrap on phones (#536), feed cards say "an album" (#539), Favorites has an empty state for tracks (#540), the Messages start form is spaced and starts on Enter (#543).
- `scripts/audit-signed-out.mjs` clicks Follow, Add, a reaction and Comment and checks the search (#544).

## Done (2026-10-08)

- Search on phones: the phone top bar has a search button that opens a search row across the bar (#567). Before, a phone had no search.
- `scripts/audit-signed-out.mjs` opens the public pages at 390 px, fails on sideways scroll and checks the phone search (#573).
- Found on the way, at 390 px: the menu drawer opened with a "Close" tooltip over its first item (#566), the rail filter box shrank to one letter (#568), a venue with no photo showed an empty box (#569), Messages showed an empty thread box (#572).

## Plan

- [ ] 1. Decide what a listener sees where Studio is in the sidebar. It still shows Studio to everyone, signed out included.
- [ ] 2. Library as a listener still lists artist tools (Recordings, Embeds, Smart links, upload). Decide which a listener keeps.
- [ ] 3. Add a listener pass to the capture scripts (the audit script covers both since #533 and #544, and phones since #573).

## Open questions for the user

- Should a listener see a "Become an artist" entry where Studio would be, or nothing?
- Which signed-out actions should work with no account at all (for example likes or history kept in the browser)?
