# E2E coverage gap: features × roles

**Status:** open

Mapped 2026-11-02 from the 26 specs in `packages/tahti-web/e2e/` against the
user manual (`packages/docs/user-manual/`) and the Studio / Admin / Library
navigation. Roles: **Anonymous** (signed out), **Listener** (account, no
channel), **Artist** (channel owner), **Admin** (board).

How the suite runs today: manual only (`workflow_dispatch`, `run_e2e=true`,
against beta.tahti.live). Locally: `VITE_FORCE_MOCK=1 npx vite --port 5196`
in `packages/tahti-web`, then
`PLAYWRIGHT_BASE_URL=http://localhost:5196 npx playwright test`. Sign-in
helpers: `signIn()` (artist `artist@tahti.live`), board = `signIn()` plus a
`localStorage` role edit (`routes-admin-deep.spec.ts`). There is **no
listener or anonymous helper**; listener journeys sign in as the artist.

Legend: ✅ use case exercised (clicks, saves, asserts a result) · ◐ page only
renders (route health) · ❌ nothing.

## Matrix

| Feature | Anonymous | Listener | Artist | Admin |
| --- | --- | --- | --- | --- |
| Front page (Listen), sections, order | ◐ | ❌ | ◐ | — |
| Latest News carousel, Sources | ❌ | ❌ | ❌ | — |
| Radio, schedule, radio show | ◐ | ❌ | ◐ | — |
| Discover, search, tags | ◐ | ❌ | ◐ | — |
| Channel and artist pages, follow | ◐ | ❌ | ◐ (designer parity) | — |
| Player: play, pause, seek, fullscreen | ❌ | ❌ | ✅ (minimize, queue) | — |
| Queue | ❌ | ❌ | ✅ | — |
| Favorites | — | ❌ | ◐ | — |
| Playlists (own, collaborative add / undo) | — | ❌ | ◐ (editor opens) | — |
| Library History / Following | — | ❌ | ◐ | — |
| Listening stats | — | ❌ | ❌ | — |
| Comments, chat, messages | ❌ | ❌ | ❌ | — |
| Jam (listen together) | ❌ | ❌ | ❌ | — |
| Listening parties (attend / schedule) | ❌ | ❌ | ◐ | — |
| Support an artist: fan sub, track purchase | ✅ (guest email sub) | ✅ (buy, subscribe, cancel; stale) | ✅ (sees orders) | ✅ (audit log) |
| Public reader: release, track, embeds, legal | ✅ | — | — | — |
| Sign up, log in, verify, reset password | ✅ (register, Enter submits) | ❌ (listener sign-up) | ✅ | — |
| Notifications, account menu dots | — | ❌ | ❌ | ❌ |
| Settings (account, playback, appearance) | — | ❌ | ◐ (redirects) | — |
| Add-ons (Listen widgets, themes, visualizers) | — | ❌ | ✅ (stale) | — |
| Membership and Co-op governance | ✅ (prompted to log in, history) | ❌ | ✅ (vote, discuss, draft motion) | ◐ |
| Studio Home, stream manager | — | gate ❌ | ✅ | — |
| Uploads, tracks, track editor, mastering | — | gate ❌ | ✅ | — |
| Releases, distribution, smart links | — | — | ◐ | — |
| Broadcast: go live, green room, schedule, shows, events | — | — | ◐ + stream stop ✅ | — |
| Channel designer, branding, gallery, press kit | — | — | ✅ (stale) | — |
| Fans: posts, newsletter, memberships, store, earnings | — | — | ◐ | — |
| Stats and insights | — | — | ✅ | — |
| Profile hub | — | — | ◐ | — |
| Admin Overview (dashboard, status, monitoring) | — | denied ❌ | denied ❌ | ◐ |
| Admin Inbox queues (support, beta, radio, reports, themes) | — | — | — | ◐ |
| Admin People (users, roles, suspension) | — | — | — | ◐ (profile) |
| Admin Content (news, announcements, Selects, top lists, radio, venues, presets) | — | — | — | ✅ (news, radio cover); rest ◐ |
| Admin Co-op (board, AGM, grants, finances) | — | — | — | ◐ |
| Admin Platform (add-ons, languages, vendors, storage, logs, map) | — | — | — | ◐ |
| Layout: desktop / phone chrome | ◐ | ❌ | ✅ | ✅ |

## Missing use cases (todo)

### Infrastructure

- [x] `signInAsListener()` (mock `listener@tahti.live`), `signInAsBoard()` and `acknowledgeGuidelines()` in `e2e/helpers/auth.ts` (2026-11-02). A signed-out fixture is not needed: a fresh page is signed out.
- [ ] Run the suite against the mock app in CI (a `vite preview` with `VITE_FORCE_MOCK=1`), not only by hand against beta.
- [ ] Fix or retire the 45 specs that fail on the mock app today (list below); most were written against beta data.

### Anonymous

- [ ] Plays a track from Listen and a release card without an account; the player bar appears, play/pause works.
- [ ] Opens a channel page and an artist page; Follow / Like / Comment ask to sign in instead of failing.
- [ ] Searches and opens a result (track plays, artist opens).
- [ ] Opens a community story and a Tahti news post in their dialogs.
- [x] Library shows Favorites and the other tabs disabled "needs an account" (`roles-anonymous-listener.spec.ts`).
- [x] Admin and `/messages` ask to sign in (`roles-anonymous-listener.spec.ts`). Studio for a visitor is left.
- [ ] Forgot password → reset link page renders and validates. (Renders: covered; validation left.)

### Listener

- [ ] Signs up as a listener (no channel) and lands on Listen; Studio is not in the sidebar.
- [ ] Follows an artist → appears in Library → Following and the Feed. (Library opens on Favorites and Following renders: covered.)
- [ ] Favorites a track and a release → Library → Favorites; unfavorites.
- [ ] Builds a playlist, reorders, adds to someone's collaborative playlist and undoes it.
- [ ] Plays a collection with the collection player; the row highlights.
- [ ] Listening history and stats record a play.
- [ ] Comments on a track; chats on a live channel; sends and reads a direct message.
- [ ] Notifications and messages dots on the avatar; opening them clears the dot.
- [ ] Adds a Latest News source, sees it in the carousel, removes it.
- [ ] Joins a Jam and a listening party.
- [ ] Settings: playback, appearance/theme, notifications save and persist.
- [x] Opens `/admin` and `/studio`: "Board access required" and "Studio is for artists", no Studio in the sidebar (`roles-anonymous-listener.spec.ts`).

### Artist

- [ ] Uploads a track end to end (file → processing → public on profile).
- [ ] Creates a release, adds tracks and artwork, publishes; smart link page shows it.
- [ ] Broadcast hub: agenda chips filter; Go live flow reaches the green room; schedules a show and an event; schedules and cancels a listening party.
- [ ] Fans hub: writes and schedules a post; sends a newsletter; creates a membership tier; adds a store item; Earnings shows orders.
- [ ] Profile hub cards open each Settings panel and saving shows on the public page. (Six Studio tabs, Profile → Story opens the Settings panel, a Fans page links back: covered in `roles-artist-admin-hubs.spec.ts`; saving left.)
- [ ] Moderates chat (ban, moderator add) and comments.
- [ ] Stats range picker and per-track insights.
- [ ] Release detail tabs Overview · Links · Stats · Advanced; track editor Basics · Sharing · Advanced save.

### Admin

- [x] Section row Overview · Inbox · People · Content · Co-op · Platform; a hub card opens its page and the back link returns (`roles-artist-admin-hubs.spec.ts`; Platform → Languages).
- [ ] Inbox: chips switch queues; resolves a support ticket; approves a beta application and a radio submission; handles a content report.
- [ ] People: finds a user, changes role, suspends and restores.
- [ ] Content: publishes news, an announcement, edits Selects rotation and a top list, verifies a venue, replaces an artwork preset.
- [ ] Co-op: opens a grant year, AGM, board records; finances page totals.
- [ ] Platform: approves an add-on, imports a language CSV, storage per user, logs filter.
- [ ] Dashboard: system health first and its links.

## Specs failing on the mock app (2026-11-02)

45 of 102 tests: `cutover-vital` 19, `plugin-store` 8, `channel-clips` 2,
`listener-purchase-flow` 2, `listings-news` 2, `radio-cover` 2,
`routes-discover-radio` 2, `stash-and-subscriber-access` 2,
`channel-designer-artist-look`, `channel-designer-elements`,
`fan-sub-and-track-purchase`, `fullscreen-player-minimize`, `mastering`,
`routes-settings-redirects` (1 each). Typical causes: renamed headings and
tabs (Studio / Admin regroup), the password policy, the guidelines toast
covering clicks, beta-only seed data.
