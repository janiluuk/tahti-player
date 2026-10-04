# Listener account, and the basics without signing in

**Status:** open

User ask (2026-10-04): add a separate listener user who is registered but has no Studio or Admin features, and make sure all the basic things work without ever having to log in.

## What exists (checked 2026-10-04)

- `AccountRole` is `'BOARD' | 'ARTIST' | 'LISTENER'` in `packages/tahti-web/src/api/types.ts`.
- The mock app signs in as `demo@tahti.live`, a board artist. The capture scripts and most manual checks use that account, so a listener's view is rarely exercised.
- Storybook has `MOCK_USERS.listener`, used by a few stories.
- `scripts/audit-left-menu.mjs` already visits every route signed out and found no route that loses the left menu.

## Plan

- [ ] 1. Mock app: a second mock login for a plain listener (registered, no channel, not a member of the board), selectable at sign-in. Studio and Admin entries must not show for it.
- [ ] 2. Audit as that listener: sidebar, top bar, Settings sections, Library, Favorites, messages, subscriptions, purchases, notifications. List every Studio or Admin control that leaks through and every dead end.
- [ ] 3. Audit signed out: play a channel, radio station and track; browse Discover, an artist page, a collection, a smart link; search; open Help; read comments; report something. Every action that needs an account should say so and offer sign-in, never fail silently or show an error.
- [ ] 4. Fix what the two audits find, one slice each.
- [ ] 5. Add the listener and signed-out passes to the capture and audit scripts so they stay covered.

## Open questions for the user

- Should a listener see a "Become an artist" entry where Studio would be, or nothing?
- Which signed-out actions should work with no account at all (for example likes or history kept in the browser)?
