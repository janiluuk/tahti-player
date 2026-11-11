# E2E coverage gap: features × roles

**Status:** open

Mapped 2026-11-02 from the 26 specs in `packages/tahti-web/e2e/` against the
user manual (`packages/docs/user-manual/`) and the Studio / Admin / Library
navigation. Roles: **Anonymous** (signed out), **Listener** (account, no
channel), **Artist** (channel owner), **Admin** (board).

How the suite runs: the `e2e-mock` job in `ci.yml` runs `roles-*`,
`use-cases-*`, `routes-uncovered`, `view-before-edit` and `batch-fixes*`
against the mock app on **master pushes and manual `workflow_dispatch`**
(not on pull requests; not a required check). Locally:
`VITE_FORCE_MOCK=1 pnpm exec vite --port 5196 --strictPort` in
`packages/tahti-web`, then `PLAYWRIGHT_BASE_URL=http://localhost:5196 pnpm
exec playwright test <specs>` (on a Mac set `PLAYWRIGHT_CHROMIUM_PATH` to
Google Chrome). Helpers in `e2e/helpers/auth.ts`: `signIn()` (artist),
`signInAsListener()`, `signInAsBoard()`, `acknowledgeGuidelines()`; a fresh
page is signed out.

Legend: ✅ use case exercised (clicks, saves, asserts a result) · ◐ page only
renders (route health) · ❌ nothing.

## Matrix

Re-checked 2026-11-09 against the specs (several cells had gone stale).

| Feature | Anonymous | Listener | Artist | Admin |
| --- | --- | --- | --- | --- |
| Front page (Listen), sections, order | ✅ (plays a release card) | ❌ | ◐ | — |
| Latest News carousel, Sources | ✅ (news post dialog) | ✅ (add / remove a source) | ❌ | — |
| Radio, schedule, radio show | ◐ | ❌ | ◐ | — |
| Discover, search, tags | ✅ (search opens a track) | ◐ (Feed pages on) | ◐ | — |
| Channel and artist pages, follow | ◐ | ✅ (follow, channel comment) | ◐ (designer parity) | — |
| Player: play, pause, seek, fullscreen | ✅ (play, pause) | ✅ (seek, full screen skip / pause / minimize) | ✅ (minimize, queue) | — |
| Queue | ❌ | ✅ | ✅ | — |
| Favorites | — | ✅ | ✅ (like a listed track) | — |
| Playlists (own, collaborative add / undo) | — | ✅ (create from a track, collaborative add / undo) | ◐ (editor opens) | — |
| Library History / Following | — | ✅ | ◐ | — |
| Listening stats | — | ◐ (Stats / History tabs) | ❌ | — |
| Comments, chat, messages | ✅ (comment asks to log in) | ✅ | ✅ (moderation) | — |
| Jam (listen together) | ✅ (invite asks to log in) | ✅ | ✅ (own playlist, host, end) | — |
| Listening parties (attend / schedule) | ✅ (link asks to log in, stays on the party) | ✅ (join live, scheduled) | ✅ (schedule, cancel) | — |
| Support an artist: fan sub, track purchase | ✅ (guest email sub) | ✅ (buy, subscribe, cancel; stale) | ✅ (sees orders) | ✅ (audit log) |
| Public reader: release, track, embeds, legal | ✅ | — | — | — |
| Sign up, log in, verify, reset password | ✅ (register, Enter submits) | ✅ (listener sign-up) | ✅ | — |
| Notifications, account menu dots | — | ✅ | ✅ (filter, mark read) | ✅ (mark read) |
| Settings (account, playback, appearance) | — | ✅ (playback switch, theme) | ◐ (redirects) | — |
| Add-ons (Listen widgets, themes, visualizers) | — | ✅ (Radio Browser on / off) | ✅ (stale) | — |
| Membership and Co-op governance | ✅ (prompted to log in, history) | ✅ (correction request to the board) | ✅ (vote, discuss, draft motion) | ◐ |
| Studio Home, stream manager | — | gate ✅ | ✅ | — |
| Uploads, tracks, track editor, mastering | — | gate ✅ | ✅ | — |
| Releases, distribution, smart links | — | — | ✅ (create, publish draft, smart link) | — |
| Broadcast: go live, green room, schedule, shows, events | — | — | ✅ (new show, event, party, stream stop, green room open / invite / page) | — |
| Channel designer, branding, gallery, press kit | — | — | ✅ (stale) | — |
| Fans: posts, newsletter, memberships, store, earnings | — | — | ✅ (post, newsletter, tier, store price) | — |
| Stats and insights | — | — | ✅ | — |
| Profile hub | — | — | ✅ (profile story) | — |
| Admin Overview (dashboard, status, monitoring) | — | denied ✅ | denied ✅ | ✅ |
| Admin Inbox queues (support, beta, radio, reports, themes) | — | — | — | ✅ (support, beta, radio, reports) |
| Admin People (users, roles, suspension) | — | — | — | ✅ (suspend, role filter) |
| Admin Content (news, announcements, Selects, top lists, radio, venues, presets) | — | — | — | ✅ (news, announcements, presets, top lists, venues, radio cover) |
| Admin Co-op (board, AGM, grants, finances) | — | — | — | ◐ |
| Admin Platform (add-ons, languages, vendors, storage, logs, map) | — | — | — | ✅ (add-on review, translation CSV, storage, logs) |
| Layout: desktop / phone chrome | ✅ (phone More → Library) | ✅ (no Studio on phone) | ✅ | ✅ |

## Missing use cases (todo)

Use cases already covered are in `HISTORY.md`; the matrix above shows what
each role exercises.

- [ ] Listener: plays a collection with the collection player; the row highlights. (Blocked: `CollectionPlayerWidget` is not placed anywhere yet; placement is a product decision.)
- [x] Listener: Radio station filter and the public schedule's week paging (`use-cases-coverage-gap.spec.ts`).
- [x] Anonymous queue, artist History listening stats and Library playlists (`use-cases-coverage-gap.spec.ts`).
- [x] Artist Latest News sources and Admin Co-op beyond opening tabs (grant cycle preview, governance tabs) (`use-cases-coverage-gap-2.spec.ts`).
- [x] Artist: likes a track from an artist-page list and finds it under Library → Favorites (`use-cases-coverage-gap.spec.ts`).
- [ ] Remaining: artist Settings coverage, and the collection player (placement is a product decision).

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

Player specs (`use-cases-listener-6`) stream the mock tracks' SoundHelix MP3s,
so they need network access; the seek bar is inert while a track loads
(`tabindex="-1"`), so wait for `tabindex="0"` and for playback to start
before each seek.

### Findings from the 2026-11-09 specs

| Screen | Issue | Kind | Suggestion |
| --- | --- | --- | --- |
| Player bar seek | A seek right after Play, before the stream starts, is lost: playback restarts at 0:00 when the audio loads | bug | Keep the pending `seekTarget` in `playerStore` until the audio has loaded, then apply it |
