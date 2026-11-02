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
- [ ] Fix or retire the specs that fail on the mock app (list below; 45 → 38 on 2026-11-02 after fixing macOS-only paths, renamed headings, the size picker and the clip editor's browser path).

### Anonymous

- [x] Plays a track page without an account; the player bar shows it and pauses (`use-cases-anonymous.spec.ts`). A release card is left.
- [x] Reactions ask to log in; a favorite is kept on the device and shows in Library → Favorites; a channel opens from Live now (`use-cases-anonymous.spec.ts`).
- [x] Searches and opens a track result (`use-cases-anonymous.spec.ts`).
- [ ] Opens a community story and a Tahti news post in their dialogs.
- [x] Library shows Favorites and the other tabs disabled "needs an account" (`roles-anonymous-listener.spec.ts`).
- [x] Admin, `/messages` and Studio ask to sign in (`roles-anonymous-listener.spec.ts`, `use-cases-anonymous.spec.ts`).
- [x] Reset password needs an email before it sends (`use-cases-anonymous.spec.ts`).

### Listener

- [ ] Signs up as a listener (no channel) and lands on Listen; Studio is not in the sidebar.
- [x] Follows an artist → Library → Following (`use-cases-listener.spec.ts`). The Feed side is left.
- [x] Favorites a track → Library → Favorites (`use-cases-listener.spec.ts`). Release and unfavorite left.
- [ ] Builds a playlist, reorders, adds to someone's collaborative playlist and undoes it. (Creating one from Add to playlist: covered.)
- [ ] Plays a collection with the collection player; the row highlights.
- [x] A played track shows in Library → History (`use-cases-listener.spec.ts`). Stats left.
- [ ] Comments on a track; chats on a live channel; sends and reads a direct message. (Timed comment and a DM reply: covered; live chat left.)
- [ ] Notifications and messages dots on the avatar; opening them clears the dot.
- [x] Adds a Latest News source and removes one (`use-cases-listener.spec.ts`).
- [ ] Joins a Jam and a listening party.
- [ ] Settings: playback, appearance/theme, notifications save and persist. (Light/dark switch survives a reload: covered.)
- [x] Opens `/admin` and `/studio`: "Board access required" and "Studio is for artists", no Studio in the sidebar (`roles-anonymous-listener.spec.ts`).

### Artist

- [ ] Uploads a track end to end (file → processing → public on profile).
- [ ] Creates a release, adds tracks and artwork, publishes; smart link page shows it.
- [ ] Broadcast hub: agenda chips filter; Go live flow reaches the green room; schedules a show and an event; schedules and cancels a listening party. (Chips filter, Go live opens and links back, an event is added: covered.)
- [ ] Fans hub: writes and schedules a post; sends a newsletter; creates a membership tier; adds a store item; Earnings shows orders. (Publishes a post, creates a tier, Store and Newsletter open: covered.)
- [ ] Profile hub cards open each Settings panel and saving shows on the public page. (Six Studio tabs, Profile → Story opens the Settings panel, a Fans page links back: covered in `roles-artist-admin-hubs.spec.ts`; saving left.)
- [ ] Moderates chat (ban, moderator add) and comments.
- [x] Stats range picker (`use-cases-artist.spec.ts`). Per-track insights left.
- [ ] Release detail tabs Overview · Links · Stats · Advanced; track editor Basics · Sharing · Advanced save. (Release tabs: covered.)

### Admin

- [x] Section row Overview · Inbox · People · Content · Co-op · Platform; a hub card opens its page and the back link returns (`roles-artist-admin-hubs.spec.ts`; Platform → Languages).
- [ ] Inbox: chips switch queues; resolves a support ticket; approves a beta application and a radio submission; handles a content report. (Chips and a beta approval: covered.)
- [ ] People: finds a user, changes role, suspends and restores. (Picks a user, filters by role: covered.)
- [ ] Content: publishes news, an announcement, edits Selects rotation and a top list, verifies a venue, replaces an artwork preset. (Publishes news; Announcements from the hub: covered.)
- [ ] Co-op: opens a grant year, AGM, board records; finances page totals.
- [ ] Platform: approves an add-on, imports a language CSV, storage per user, logs filter.
- [x] Dashboard: system health first and Status checks link (`use-cases-admin.spec.ts`).

## Run and review (next)

Once the use cases above pass, run the whole suite on the mock app at
1440, 768 and 390 px, with screenshots per step (`test.info().outputPath`),
and review each journey for UX, practicality and everyday use. For every
journey record: clicks to finish, dead ends, unclear labels, duplicate
controls, slow steps (anything over ~1 s on the mock app), and screens that
should be more minimal. Put each finding below as a row with the screen, what
is wrong and a suggested fix, then turn the agreed ones into slices.

### Findings so far (from writing the 2026-11-02 specs)

| Screen | Issue | Kind | Suggestion |
| --- | --- | --- | --- |
| Artist page header (`/u/:username`) | Nine actions in the header (Subscribe, press kit, RSS, Embed, Report, Block, Open channel, Follow, followers) plus an icon button with no accessible name | messy / a11y | Keep Follow and Subscribe; move the rest into one "More" menu; name the icon button |
| Track page (`/t/:id`) | Six emoji buttons plus Comment for every timestamp; signed out they all read "Log in to add …" | messy | One "React" button that opens the emoji set; one sign-in prompt |
| Every page (mock) | The community guidelines toast stays until acknowledged, sits over the top search bar and blocks clicks on tabs | practicality | Show it once as a banner on Listen, not a toast over navigation |
| Settings → Themes | Theme cards say "Built-in Nuclear theme" | labels | Say "Built-in theme" (Nuclear is the upstream project) |
| Studio → Fans → Posts | The page is titled "Updates" while the card and help say Posts | labels | Title it Posts |
| Studio release detail | Three rows of tabs (Studio, Music sub-row, release tabs) | messy | Per the navigation plan: a back link and title replace the section rows on detail pages |
| Studio → Stats | A second tab row (Overview, Plays, Top lists, Insights) on a page that is meant to be one page with sections | messy | Section links in the page instead of a tab row |
| Messages | Three ways in on one screen (Message @username + Start + Search, Your contacts, conversation list); opening a conversation briefly mounts two threads, so typing can land in the one that disappears | messy / bug | One search box over the conversation list; mount one thread |
| Admin → People | No search box; the user list is a radio group | practicality | Add search; keep the list as links or rows |
| Studio → Sounds (`/library/sounds`) | Rows have no Play button for the player (the fullscreen spec cannot start playback there) | usage | Check the row play control; add one if missing |
| Radio visualizer (Cymatics) | Loads `/piz_compressed.exr`, which no package ships, logs EXRLoader errors on `/radio`, and the orb, cymatics and landscape shapes never show (they wait for that map) | bug | Build the map with three.js `RoomEnvironment` (tried; it made the RadioView story time out on CI's software GL, so it needs a lighter map or a deferred build) |

## Specs failing on the mock app (2026-11-02, after fixes)

38 of 136 tests: `cutover-vital` 19, `plugin-store` 8,
`listener-purchase-flow` 2, `radio-cover` 2, `stash-and-subscriber-access` 2,
`channel-designer-artist-look`, `fan-sub-and-track-purchase`,
`fullscreen-player-minimize`, `mastering`, `routes-discover-radio` (radio
show link no longer on `/radio`) (1 each). Typical causes: renamed headings
and tabs, beta-only seed data and accounts, the guidelines toast, features
that moved (radio show links, Listen add-ons heading).
