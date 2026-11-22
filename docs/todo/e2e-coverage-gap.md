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
| Front page (Listen), sections, order | ✅ (plays a release card) | ✅ (hide a section, Reset widgets, adds a Spotify artist row) | ◐ | — |
| Latest News carousel, Sources | ✅ (news post dialog) | ✅ (add / remove a source) | ❌ | — |
| Radio, schedule, radio show | ✅ (favorite a station) | ✅ (filter, play / pause a station, schedule weeks) | ◐ | — |
| Discover, search, tags | ✅ (search opens a track) | ✅ (Artists genre filter opens the artist, Venues on a phone) | ✅ (widget order sticks) | — |
| Channel and artist pages, follow | ◐ | ✅ (follow, channel comment) | ◐ (designer parity) | — |
| Player: play, pause, seek, fullscreen | ✅ (play, pause) | ✅ (seek, full screen skip / pause / minimize) | ✅ (minimize, queue) | — |
| Queue | ❌ | ✅ | ✅ | — |
| Favorites | — | ✅ | ✅ (like a listed track) | — |
| Playlists (own, collaborative add / undo) | — | ✅ (create from a track, collaborative add / undo; Library → Playlists tab at 1440/390) | ◐ (editor opens) | — |
| Library History / Following | — | ✅ | ◐ | — |
| Listening stats | — | ◐ (Stats / History tabs) | ❌ | — |
| Comments, chat, messages | ✅ (comment asks to log in) | ✅ | ✅ (moderation) | — |
| Jam (listen together) | ✅ (invite asks to log in) | ✅ | ✅ (own playlist, host, end) | — |
| Listening parties (attend / schedule) | ✅ (link asks to log in, stays on the party) | ✅ (join live, scheduled) | ✅ (schedule, cancel) | — |
| Support an artist: fan sub, track purchase | ✅ (guest email sub) | ✅ (buy, subscribe, cancel; stale) | ✅ (sees orders) | ✅ (audit log) |
| Public reader: release, track, embeds, legal | ✅ | — | — | — |
| Sign up, log in, verify, reset password | ✅ (register, Enter submits) | ✅ (listener sign-up) | ✅ | — |
| Notifications, account menu dots | — | ✅ (unread announced, named quick view) | ✅ (filter, mark read) | ✅ (mark read) |
| Settings (account, playback, appearance) | — | ✅ (playback switch, theme) | ✅ (Artist role and city, language to Finnish and back) | — |
| Add-ons (Listen widgets, themes, visualizers) | — | ✅ (Radio Browser on / off, Spotify artist widget) | ✅ (stale) | — |
| Membership and Co-op governance | ✅ (prompted to log in, history) | ✅ (correction request to the board) | ✅ (vote, discuss, draft motion) | ◐ |
| Studio Home, stream manager | — | gate ✅ | ✅ | — |
| Uploads, tracks, track editor, mastering | — | gate ✅ | ✅ (refuses a PDF named .mp3) | — |
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
- [x] Artist Settings → Artist, listener Listen section hide / reset, artist Discover widget order, anonymous radio favorite (`use-cases-coverage-gap-3.spec.ts`).
- [x] Listener Radio play / pause, Discover Artists and Venues, a Spotify artist Listen widget, and artist Settings language (`use-cases-coverage-gap-4.spec.ts`).
- [x] Artist refuses a non-audio upload, search announces its result count, listener notifications say which are unread (`use-cases-hardening.spec.ts`).
- [ ] Remaining: the collection player (placement is a product decision).

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
| Track page (`/t/:id`) | Six emoji buttons plus Comment for every timestamp; signed out they all read "Log in to add …" | messy, fixed | `TimelineReactionBar`: one React button opens the emoji set; signed out it is one "Log in to react" (checked 2026-11-22) |
| Studio release detail | Three rows of tabs (Studio, Music sub-row, release tabs) | messy, fixed | `StudioNav` `isStudioDetailRoute` drops the section rows on detail pages (checked 2026-11-22) |
| Admin → People | The user list is a radio group (search exists: it is a searchbox) | practicality, kept | `SelectableList` is a master-detail picker; the radio group gives one tab stop and arrow keys |

### Findings from fixing the legacy specs (2026-11-03)

| Screen | Issue | Kind | Suggestion |
| --- | --- | --- | --- |
| Library (`/library/*`) | Twelve tabs in one row (Overview … Smart links) | messy, fixed | Catalog moved to Studio → Music; Library is Favorites · Playlists · History · Following · Files |

### Findings from mock multi-viewport pass (2026-11-19)

| Screen | Issue | Kind | Suggestion |
| --- | --- | --- | --- |
| Go live (`/studio/go-live`) | StudioNav + sidebar stayed mounted on a takeover surface | messy | Hide StudioNav / sidebar / mobile bottom nav via `isGoLiveTakeoverPath` (shipped) |
| Library Playlists | Tab missing from Library sections; create path unclear | gap | `/library/playlists` + Create playlist → Studio collections (shipped; `library-playlists.spec.ts`) |

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
| Player bar seek | A seek right after Play, before the stream starts, is lost: playback restarts at 0:00 when the audio loads | bug, fixed 2026-11-11 | `AudioEngine` keeps the `seekTarget` until `loadedmetadata`, then applies it (`AudioEngine.seek.test.tsx`) |

## Audit 2026-11-22 (folded from `e2e-fix-and-audit.md`)

The CI `e2e-mock` glob (`.github/workflows/ci.yml`) now also runs the routes, library, nav/layout, release-detail chrome, a11y play controls, event calendar, cutover-vital, real-user journeys, plugin store, radio cover, channel designer, clips, full-screen minimize, mastering and stash specs: 285 tests, passing twice in a row with `--retries=0` locally. New: `use-cases-channel-row-hover.spec.ts`, `use-cases-radio-add-by-url.spec.ts`. Deleted: `routes-listen.spec.ts` (redirects live in `routes-library`).

Still outside CI:
- [ ] `listings-news`: phone row waveform width assertion predates the phone track-list grid (0.0.435); update to the new layout.
- [ ] `channel-designer-parity`: the mock disagrees with itself (`api/studio-extras/profile.ts:66` "Demo Artist" vs `mock-session.ts:264` "artist").
- [ ] `listener-purchase-flow` (buy) and `fan-sub-and-track-purchase`: setting purchase access by importing `api/purchase-tiers.ts` in the page leaves `tahti-mock-uploaded-sounds` on FREE; drive it through the Studio UI (`PurchaseAccessSection`) instead.
- [ ] `artist-site-chrome`: skips unless the base URL contains 127.0.0.1 (CI uses localhost).

App findings (product calls, not fixed):
- Radio show pages (`/radio/show/$channelSlug`) are only linked from `RadioBookingCalendar.tsx`; the Radio Shows tab is gone. Link them from Radio or Schedule?
- The mock artist has no Studio events (`/studio/schedule?show=events` is empty) although `evt-mock-1` opens for editing.

Run against `VITE_FORCE_MOCK=1` vite on `127.0.0.1:5197`, `--workers=2 --retries=0`.

"In CI?" is the current `e2e-mock` glob in `.github/workflows/ci.yml`; "Proposed" is the glob after this audit.

### Specs that were already in CI

All 176 tests passed on the first full run except `use-cases-coverage-gap-3` "moves a Discover widget later" (fixed, see below). Two new specs were added under the `use-cases-*` glob.

| Spec | In CI? | Status | Action |
| --- | --- | --- | --- |
| `roles-*.spec.ts` (2) | yes | current | none |
| `use-cases-*.spec.ts` (31) | yes | current | `coverage-gap-3` Discover order: assert through the Move earlier state (the widgets sit in a masonry, and a new Upcoming events widget now follows Most played) |
| `use-cases-artist-5.spec.ts` | yes | current | "publishes a draft release" already opens "More release actions" first and passes |
| `use-cases-channel-row-hover.spec.ts` | new | current | new: hover reveals only that row's play control; Shift+click queues without playing (`/channel/yaniho`) |
| `use-cases-radio-add-by-url.spec.ts` | new | current | new: Radio → Browse stations → Add URL; the station shows in the radio stations row on `/radio` and on Listen |
| `routes-uncovered.spec.ts` | yes | current | now covered by the `routes-*` glob |
| `view-before-edit.spec.ts` | yes | current | none |
| `batch-fixes*.spec.ts` (3) | yes | current | none |

### Specs outside CI

| Spec | In CI? | Status | Action |
| --- | --- | --- | --- |
| `a11y-play-controls.spec.ts` | no | current | add to CI |
| `artist-site-chrome.spec.ts` | no | current | keep out of CI: it skips unless the base URL contains `127.0.0.1`, and CI uses `localhost` |
| `channel-clips.spec.ts` | no | current | add to CI |
| `channel-designer-artist-look.spec.ts` | no | current | add to CI |
| `channel-designer-elements.spec.ts` | no | stale | fixed: shared `signIn`, `acknowledgeGuidelines` instead of a hard Acknowledge click; add to CI |
| `channel-designer-parity.spec.ts` | no | current, red on mock | keep out of CI: mock data mismatch (designer shows the Studio profile mock "Demo Artist", `/channel/artist` shows "artist") |
| `cutover-vital.spec.ts` | no | stale | fixed: track Playlists tab is an inline Sets picker (no "Choose playlists" dialog); hearthis opens the import wizard (choose, review, finish); `/listen/feed` redirects to Discover → Feed. Add to CI |
| `event-calendar.spec.ts` | no | current | add to CI |
| `fan-sub-and-track-purchase.spec.ts` | no | stale | fixed the post-signup login and added the bundled WAV fixture as a fallback for `riff.wav`; still red (see purchase setup below). Manual only |
| `fullscreen-player-minimize.spec.ts` | no | current | add to CI |
| `layout-stability.spec.ts` | no | current | add to CI |
| `library-playlists.spec.ts` | no | current | add to CI |
| `library-sounds-bulk.spec.ts` | no | stale | fixed: List view is Track size → List; dialogs asserted by heading. Add to CI |
| `library-sounds-embeds.spec.ts` | no | current | add to CI |
| `listener-purchase-flow.spec.ts` | no | stale | fixed the post-signup login (subscribe test passes); the buy test is red (see purchase setup below). Manual only |
| `listings-news.spec.ts` | no | stale | deleted the homepage article test (the `article-card` testid is gone and `use-cases-anonymous` covers the news dialog). The phone row waveform test is red while the mobile track list layout is being reworked (`mobile-track-list-layout`); revisit after that ships |
| `mastering.spec.ts` | no | current | add to CI |
| `nav-chrome.spec.ts` | no | current | add to CI |
| `plugin-store.spec.ts` | no | stale | fixed: Channel → Multicast now only links to Go live destinations; the Radio Browser card's button is "Configure Radio Browser directory". Add to CI |
| `radio-cover.spec.ts` | no | stale | fixed: Configure button name. Add to CI |
| `real-user-journeys.spec.ts` | no | stale | fixed: registration ends on "Check your email"; Library highlight via `aria-current`; History tab name is exact; Stats sections are radios ("Plays and listeners"). Add to CI |
| `routes-admin-deep.spec.ts` | no | stale | fixed: Support is the idle default Inbox chip (by design, `inboxChipSelected`); `/admin/reports` lands on "Annual reports". Add to CI |
| `routes-discover-radio.spec.ts` | no | stale | fixed: `/themes` lands on Appearance; deleted "a radio show is reachable from the Radio page" (no Shows tab, see findings). Add to CI |
| `routes-governance.spec.ts` | no | current | add to CI |
| `routes-library.spec.ts` | no | current | folded in the old `/listen/*` links from `routes-listen`. Add to CI |
| `routes-listen.spec.ts` | no | dead | deleted: `/listen/feed` is Discover → Feed; its routes moved into `routes-library`, feed content is covered by `use-cases-listener-2` |
| `routes-public-reader.spec.ts` | no | current | add to CI |
| `routes-settings-redirects.spec.ts` | no | current | add to CI |
| `routes-studio-content.spec.ts` | no | stale | fixed: the mock artist's Schedule → Events has no rows, so the edit form opens `evt-mock-1` directly; the episode review page has no "Public show details" section. Add to CI |
| `routes-studio-stats.spec.ts` | no | current | add to CI |
| `stash-and-subscriber-access.spec.ts` | no | current | add to CI |
| `studio-release-detail-chrome.spec.ts` | no | current | add to CI |
| `viewport-studio-sounds.spec.ts` | no | stale | fixed: at 768 px there is no sidebar or bottom nav; check the Library tabs instead. Add to CI |

### Findings

- **Radio show pages have no entry point from Radio.** The Shows tab is gone; `/radio/show/$channelSlug` is only linked from `RadioBookingCalendar.tsx:581`. Product call: link shows from the Radio page or the Schedule.
- **Purchase setup in the commerce specs does not stick on the mock.** `listener-purchase-flow` and `fan-sub-and-track-purchase` set PURCHASE access via `page.evaluate(() => import('/src/api/purchase-tiers.ts'))`. `setSoundAccess` returns `{ ok: true }`, yet `tahti-mock-uploaded-sounds` in localStorage still says `FREE` straight after, so the track page shows Download and no Buy button. Cause not pinned down. Suggested: drive access through the Studio UI (`PurchaseAccessSection`) instead of importing app modules.
- **Mock data mismatch for the designer parity spec.** `api/studio-extras/profile.ts:66` hard-codes `displayName: 'Demo Artist'`, while `mock-session.ts:264` and `mockChannel('artist')` give "artist". The real API returns one name, so this is mock-only.
- **Mock artist has no Studio events.** `/studio/schedule?show=events` shows "No events listed yet" for `artist@tahti.live`, while `/studio/events/evt-mock-1/edit` opens. Check whether that's intended.

### Proposed CI glob

```
e2e/roles-*.spec.ts e2e/use-cases-*.spec.ts e2e/routes-*.spec.ts e2e/view-before-edit.spec.ts e2e/batch-fixes*.spec.ts e2e/nav-chrome.spec.ts e2e/layout-stability.spec.ts e2e/studio-release-detail-chrome.spec.ts e2e/library-*.spec.ts e2e/viewport-studio-sounds.spec.ts e2e/a11y-play-controls.spec.ts e2e/event-calendar.spec.ts e2e/cutover-vital.spec.ts e2e/real-user-journeys.spec.ts e2e/plugin-store.spec.ts e2e/radio-cover.spec.ts e2e/channel-designer-elements.spec.ts e2e/channel-designer-artist-look.spec.ts e2e/channel-clips.spec.ts e2e/fullscreen-player-minimize.spec.ts e2e/mastering.spec.ts e2e/stash-and-subscriber-access.spec.ts
```

Kept out: `artist-site-chrome`, `channel-designer-parity`, `fan-sub-and-track-purchase`, `listener-purchase-flow`, `listings-news`.

