# E2E coverage gap: features × roles

**Status:** open

Mapped 2026-11-02 from the 26 specs in `packages/tahti-web/e2e/` against the
user manual (`packages/docs/user-manual/`) and the Studio / Admin / Library
navigation. Roles: **Anonymous** (signed out), **Listener** (account, no
channel), **Artist** (channel owner), **Admin** (board).

How the suite runs: the `e2e-mock` job in `ci.yml` runs `roles-*`,
`use-cases-*`, `routes-uncovered`, `view-before-edit` and `batch-fixes*` on
every code PR against the mock app (not a required check yet). Locally:
`VITE_FORCE_MOCK=1 pnpm exec vite --port 5196 --strictPort` in
`packages/tahti-web`, then `PLAYWRIGHT_BASE_URL=http://localhost:5196 pnpm
exec playwright test <specs>` (on a Mac set `PLAYWRIGHT_CHROMIUM_PATH` to
Google Chrome). Helpers in `e2e/helpers/auth.ts`: `signIn()` (artist),
`signInAsListener()`, `signInAsBoard()`, `acknowledgeGuidelines()`; a fresh
page is signed out.

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
| Player: play, pause, seek, fullscreen | ✅ (play, pause) | ❌ | ✅ (minimize, queue) | — |
| Queue | ❌ | ✅ | ✅ | — |
| Favorites | — | ❌ | ◐ | — |
| Playlists (own, collaborative add / undo) | — | ❌ | ◐ (editor opens) | — |
| Library History / Following | — | ❌ | ◐ | — |
| Listening stats | — | ❌ | ❌ | — |
| Comments, chat, messages | ✅ (comment asks to log in) | ✅ | ✅ (moderation) | — |
| Jam (listen together) | ✅ (invite asks to log in) | ✅ | ❌ | — |
| Listening parties (attend / schedule) | ❌ | ❌ | ◐ | — |
| Support an artist: fan sub, track purchase | ✅ (guest email sub) | ✅ (buy, subscribe, cancel; stale) | ✅ (sees orders) | ✅ (audit log) |
| Public reader: release, track, embeds, legal | ✅ | — | — | — |
| Sign up, log in, verify, reset password | ✅ (register, Enter submits) | ✅ (listener sign-up) | ✅ | — |
| Notifications, account menu dots | — | ✅ | ✅ (filter, mark read) | ✅ (mark read) |
| Settings (account, playback, appearance) | — | ❌ | ◐ (redirects) | — |
| Add-ons (Listen widgets, themes, visualizers) | — | ❌ | ✅ (stale) | — |
| Membership and Co-op governance | ✅ (prompted to log in, history) | ❌ | ✅ (vote, discuss, draft motion) | ◐ |
| Studio Home, stream manager | — | gate ❌ | ✅ | — |
| Uploads, tracks, track editor, mastering | — | gate ❌ | ✅ | — |
| Releases, distribution, smart links | — | — | ◐ | — |
| Broadcast: go live, green room, schedule, shows, events | — | — | ✅ (new show, event, party, stream stop); green room ◐ | — |
| Channel designer, branding, gallery, press kit | — | — | ✅ (stale) | — |
| Fans: posts, newsletter, memberships, store, earnings | — | — | ◐ | — |
| Stats and insights | — | — | ✅ | — |
| Profile hub | — | — | ◐ | — |
| Admin Overview (dashboard, status, monitoring) | — | denied ❌ | denied ❌ | ◐ |
| Admin Inbox queues (support, beta, radio, reports, themes) | — | — | — | ◐ |
| Admin People (users, roles, suspension) | — | — | — | ◐ (profile) |
| Admin Content (news, announcements, Selects, top lists, radio, venues, presets) | — | — | — | ✅ (news, announcements, presets, top lists, venues, radio cover) |
| Admin Co-op (board, AGM, grants, finances) | — | — | — | ◐ |
| Admin Platform (add-ons, languages, vendors, storage, logs, map) | — | — | — | ◐ |
| Layout: desktop / phone chrome | ✅ (phone More → Library) | ✅ (no Studio on phone) | ✅ | ✅ |

## Missing use cases (todo)

Use cases already covered are in `HISTORY.md`; the matrix above shows what
each role exercises.

- [ ] Listener: plays a collection with the collection player; the row highlights. (Blocked: `CollectionPlayerWidget` is not placed anywhere yet; placement is a product decision.)
- [ ] Artist: the Go live flow reaches the green room (a new show, an event and a listening party are covered by `use-cases-artist-5/6.spec.ts`).
- [ ] Listener: Radio and Discover use cases (tag filter, schedule); the Listen and Discover views are being reworked, so wait for that to land.
- [ ] Artist: Jam from Studio, Listener: Player seek and fullscreen.

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
| Track page (`/t/:id`) | Six emoji buttons plus Comment for every timestamp; signed out they all read "Log in to add …" | messy | One "React" button that opens the emoji set; one sign-in prompt |
| Studio release detail | Three rows of tabs (Studio, Music sub-row, release tabs) | messy | Per the navigation plan: a back link and title replace the section rows on detail pages |
| Admin → People | The user list is a radio group (search exists: it is a searchbox) | practicality, kept | `SelectableList` is a master-detail picker; the radio group gives one tab stop and arrow keys |

### Findings from fixing the legacy specs (2026-11-03)

| Screen | Issue | Kind | Suggestion |
| --- | --- | --- | --- |
| Library (`/library/*`) | Twelve tabs in one row (Overview … Smart links) | messy | Per the navigation plan, move the catalog tabs to Studio → Music |

## Specs on the mock app

All CI mock specs pass on the mock app (2026-11-03). Specs that need a fresh
browser context per role (`stash-and-subscriber-access`) sign out in the same
context instead, since the mock keeps uploads in the first browser's storage.
