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
| Sign up, log in, verify, reset password | ✅ (register, Enter submits) | ✅ (listener sign-up) | ✅ | — |
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
- [x] Role journeys run on every code PR against the mock app (`e2e-mock` job in `ci.yml`, Vite with `VITE_FORCE_MOCK=1`, one retry). Not a required check yet; make it one once it has been green for a week.
- [x] Fix or retire the specs that fail on the mock app: 45 → 38 on 2026-11-02, 38 → 0 on 2026-11-03 (all 185 tests pass on the mock app). `signIn()` now dismisses the guidelines toast for every spec.

### Anonymous

- [x] Plays a track page and a release card from the front page without an account (`use-cases-anonymous.spec.ts`, `use-cases-mixed-4.spec.ts`).
- [x] Reactions ask to log in; a favorite is kept on the device and shows in Library → Favorites; a channel opens from Live now (`use-cases-anonymous.spec.ts`).
- [x] Searches and opens a track result (`use-cases-anonymous.spec.ts`).
- [x] Opens a community story and a Tahti news post in their dialogs (`use-cases-listener-2.spec.ts`; the news post from `/news` in `use-cases-anonymous.spec.ts`).
- [x] Library shows Favorites and the other tabs disabled "needs an account" (`roles-anonymous-listener.spec.ts`).
- [x] Admin, `/messages` and Studio ask to sign in (`roles-anonymous-listener.spec.ts`, `use-cases-anonymous.spec.ts`).
- [x] Reset password needs an email before it sends (`use-cases-anonymous.spec.ts`).

### Listener

- [x] Signs up as a listener (no channel) and lands on Listen; Studio is not in the sidebar (`use-cases-listener-4.spec.ts`; Join now has a Listener account type).
- [x] Follows an artist → Library → Following; the Feed lists posts and releases and pages on (`use-cases-listener*.spec.ts`).
- [x] Favorites a track or a radio station → Library → Favorites, and removes it (`use-cases-listener*.spec.ts`, `batch-fixes.spec.ts`). Releases cannot be favorited (Favorites holds channels and tracks).
- [x] Builds a playlist from Add to playlist; adds a track to someone's collaborative playlist and undoes it (`use-cases-listener-4.spec.ts`; mock `*-open-crate` collections are collaborative).
- [ ] Plays a collection with the collection player; the row highlights. (Blocked: `CollectionPlayerWidget` is not placed anywhere yet; placement is a product decision.)
- [x] A played track shows in Library → History; listening stats and the history list switch tabs (`use-cases-listener*.spec.ts`).
- [x] Comments on a track and deletes it, comments on a channel page, replies in a DM (`use-cases-listener*.spec.ts`, `use-cases-mixed-4.spec.ts`). Live chat bans are left under Artist.
- [x] The avatar dot loses a dot after Mark all read (`use-cases-listener-3.spec.ts`).
- [x] Adds a Latest News source and removes one (`use-cases-listener.spec.ts`).
- [x] Starts a Jam from a playlist; joins a live listening party; a scheduled one offers Join at the start (`use-cases-listener-3.spec.ts`, `use-cases-mixed-3.spec.ts`).
- [x] Settings: playback, appearance/theme save and persist (light/dark and a playback switch survive a reload). There are no notification preferences in the app to test.
- [x] Opens `/admin` and `/studio`: "Board access required" and "Studio is for artists", no Studio in the sidebar (`roles-anonymous-listener.spec.ts`).

### Artist

- [x] Uploads a track end to end and lands on its page (`use-cases-artist-3.spec.ts`).
- [ ] Creates a release, adds tracks and artwork, publishes; smart link page shows it. (Creating one: `use-cases-artist-3`; publishing a draft, opening its smart link and setting a preset cover: `use-cases-artist-5`; adding tracks from the release page is not possible: tracks are added from the track editor.)
- [ ] Broadcast hub: agenda chips filter; Go live flow reaches the green room; schedules a show and an event; schedules and cancels a listening party. (Chips filter, Go live opens and links back, an event is added, a listening party is scheduled and cancelled (`use-cases-artist-5.spec.ts`): covered.)
- [ ] Fans hub: writes and schedules a post; sends a newsletter; creates a membership tier; adds a store item; Earnings shows orders. (Publishes and schedules a post, saves a newsletter draft, creates a membership tier and a store price, toggles the Store: covered; Earnings lists a track purchase and a fan subscription (`listener-purchase-flow`, `fan-sub-and-track-purchase`). Sends a newsletter (`use-cases-artist-5.spec.ts`).)
- [x] Profile hub cards open Settings panels and the Story saves (`roles-artist-admin-hubs.spec.ts`, `use-cases-artist-*.spec.ts`).
- [ ] Moderates chat (ban, moderator add) and comments. (Adds and removes a moderator; bans a sender and lifts a ban; removes a listener comment from the channel page (`use-cases-artist-5.spec.ts`): covered.)
- [x] Stats range picker and per-track insights from a release's stats tab (`use-cases-artist.spec.ts`, `routes-studio-stats.spec.ts`).
- [x] Release detail tabs; the track editor's three tabs and renaming a track (`use-cases-artist*.spec.ts`).

### Admin

- [x] Section row Overview · Inbox · People · Content · Co-op · Platform; a hub card opens its page and the back link returns (`roles-artist-admin-hubs.spec.ts`; Platform → Languages).
- [ ] Inbox: chips switch queues; resolves a support ticket; approves a beta application and a radio submission; handles a content report. (Chips, a beta approval, a ticket reply and resolve, a radio approval, a dismissed report: covered.)
- [x] People: picks a user, filters by role, picks a role, suspends and restores (`use-cases-admin*.spec.ts`).
- [ ] Content: publishes news, an announcement, edits Selects rotation and a top list, verifies a venue, replaces an artwork preset. (Publishes news; Announcements from the hub; Selects picker; top-list period; venue unverify / verify: covered.)
- [x] Co-op: Grants / AGM / Records tabs, a grant year, the Financial page (`use-cases-admin-2/3.spec.ts`).
- [x] Platform: approves an add-on, imports a language CSV (`use-cases-artist-5.spec.ts`), storage per user, logs filter.
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
| Artist page header (`/u/:username`) | Nine actions in the header (Subscribe, press kit, RSS, Embed, Report, Block, Open channel, Follow, followers); the icon-only Subscribe had no accessible name (named in #1771) | messy | Keep Follow and Subscribe; move the rest into one "More" menu |
| Track page (`/t/:id`) | Six emoji buttons plus Comment for every timestamp; signed out they all read "Log in to add …" | messy | One "React" button that opens the emoji set; one sign-in prompt |
| Every page (mock) | The community guidelines toast stays until acknowledged, sits over the top search bar and blocks clicks on tabs | practicality | Show it once as a banner on Listen, not a toast over navigation |
| Settings → Themes | Theme cards said "Built-in Nuclear theme" | labels, fixed (#1771) | "Built-in theme" |
| Studio → Fans → Posts | The page was titled "Updates" while the card and help say Posts | labels, fixed (#1771) | Titled Posts (Newsletter on its tab) |
| Studio release detail | Three rows of tabs (Studio, Music sub-row, release tabs) | messy | Per the navigation plan: a back link and title replace the section rows on detail pages |
| Studio → Stats | A second tab row (Overview, Plays, Top lists, Insights) on a page that is meant to be one page with sections | messy | Section links in the page instead of a tab row |
| Messages | Three ways in on one screen (Message @username + Start + Search, Your contacts, conversation list); opening a conversation briefly mounts two threads, so typing can land in the one that disappears | messy / bug, remount fixed | `/messages/$id` is a child route, so the page stays mounted; one search box is still open |
| Admin → People | The user list is a radio group (search exists: it is a searchbox) | practicality, kept | `SelectableList` is a master-detail picker; the radio group gives one tab stop and arrow keys |
| Artwork Play overlays (Studio → Sounds and every `MediaArtwork`) | On desktop the Play overlay was `visibility: hidden` until hover, so Tab never reached it and screen readers missed it | a11y, fixed (#1771) | Opacity-only fade; `a11y-play-controls.spec.ts` |
| Admin → Inbox → Radio submissions | Approve / Reject gave no feedback and, on the mock app, nothing changed | practicality, fixed | A toast names the track and the row's badge updates |
| Admin → Venues | Verify / Unverify returned a 500 on the mock app (no mock branch) | bug, fixed | Mock branch added |
| Studio → Fans → Store | Two empty states stacked ("No prices yet", "Add a price first") | messy, fixed (#1771) | One line under the price list |
| Release page (`/r/night-drive`) on the mock app | The Listen card says Night Drive, the page says First Light EP | mock data, fixed | The mock smart link is titled after its slug |
| Radio visualizer (Cymatics) | Loaded `/piz_compressed.exr`, which no package ships, logged EXRLoader errors on `/radio`, and the orb, cymatics and landscape shapes never showed | bug, fixed | A 64×32 generated gradient map, built a frame after mount |
| Settings → Artist | Saving showed the same "Artist info saved." twice (inline text and a toast) | messy, fixed | Toast on success; inline text only for an error |

### Findings from fixing the legacy specs (2026-11-03)

| Screen | Issue | Kind | Suggestion |
| --- | --- | --- | --- |
| SoundCloud / Bandcamp / Google Drive connect callback | The "connected" toast never showed: two redirects dropped the status | bug, fixed | Redirect straight to Settings → Add-ons → Import with status and provider |
| Settings → Add-ons links (`?category=listen`, `import`, …) | Every link opened the role tab with the Radio group open, not the group it named | bug, fixed | The category reaches the panel; its group opens |
| Studio track, collection and playlist editors | The 12-tab Library strip sat above a page that already has a back link | messy, fixed | Back link and title only |
| Library (`/library/*`) | Twelve tabs in one row (Overview … Smart links) | messy | Per the navigation plan, move the catalog tabs to Studio → Music |
| Artist page header | The email subscribe button and the fan-tiers link were both named "Subscribe to …" | labels, fixed | "Email updates from …" |
| Every page | Alt+3 opened Feed, though the sidebar's third item is Discover; both panel toggles were "Collapse panel" | labels, fixed | Alt+1–5 follow the sidebar; "Collapse left / right panel" |
| Studio hubs, Admin hubs | Back links were named only "Broadcast", "Fans", "Content" | a11y, fixed | "Back to …" |
| Studio home | Cards said Updates and Revenue; the pages are Posts and Earnings | labels, fixed | Posts, Earnings |
| Settings → Artist → Links & press | Placeholders like `https://…/x / twitter` | labels, fixed | Real example URLs |
| Pro editor → Mastering | Nine EQ sliders named Freq / Gain / Q; the add-on picker had two Close buttons | a11y, fixed | "Band 1 gain" etc.; one close |
| Settings → Broadcast → Multistream | "Multistream", "multicast source" and "live destinations" for the same thing; Close beside Add | labels, fixed | Destination throughout; Cancel |
| Settings → Themes | Copy mentioned Three.js, "the stock Nuclear default" and "ported from the Tahti frontend" | labels, fixed | Plain descriptions |
| Add-ons → Listen widgets | Every widget's Uninstall had the same name; Radio Browser's heading read "byradio-browser.info" | a11y, fixed | "Uninstall YouTube"; a space after "by" |
| Release → Advanced → Fingerprinting | Each track's Re-fingerprint / Check buttons were identical | a11y, fixed | A named group per track |
| Listen cards (stations, releases) | Overlay buttons were "Play" and "Favorite" with no item name | a11y, fixed | `Card` names them after its title |
| Track rows, Listen station cards | Row buttons are "Queue" and "Favorite" with no track name | a11y, fixed | `playQueueFavoriteActions({ itemName })` and `Card itemName`: "Queue Night Drive", "Play YleX" |
| `/radio` | Every visit opened each preset's audio stream to read ICY metadata; most fail CORS and log errors | optimization, fixed | Skip HLS playlists; remember unreadable streams for a day |
| Settings → Artist → Press kit | "Up to 30 photos" in the drop zone, "0 of 10 press kit images" below, and "Add images in the Gallery tab first" next to a drop zone | messy, fixed | One Photos panel: "up to 30 photos", "n of 10 photos in the press kit" |
| Settings → Artist → Branding | Tab "Artist branding" › tab "Branding" › heading "Artist branding"; 18 colour swatches | messy, heading fixed | Inner heading dropped; the swatch count is a design call (saved looks reference the ids) |
| Add-ons → Radio Browser | Once activated the button is a disabled "Active"; there is no way back | practicality, fixed | An on switch beside Active on every activated add-on |
| Admin → Radio → rotation | The artist column shows "Tahti Radio submissions" (the playlist owner) for every row | mock data, fixed | The API already sends the track artist; the mock now does too |
| Listening parties on the mock app | A scheduled party was gone after a reload | mock, fixed | Mock parties in sessionStorage |
| Collections, playlists, sounds, releases, shows | Every page opened straight into its edit form | messy, fixed | Read-only by default; `EditIconButton` (Edit details) shows the form, `?edit=true` links open it |
| Studio release (mock) | Publishing or saving any release renamed it "Mock EP" | mock, fixed | The mock patch merges into the seeded release |
| Track rows, track page, Stats, 404 (axe) | `aria-label` on plain spans, an h3 straight under the h1, a chart div with a label, no h1 on Page not found | a11y, fixed | Screen-reader text, `headingLevel`, `role="img"`, `PageEmpty headingLevel={1}` |
| Studio and admin lists | Several "More", "Manage", "Open", "Delete" and log "Copy" buttons with the same name | a11y, fixed | Named after the item |
| Channel designer on the mock app | The slideshow PATCH had no mock branch ("Backdrop saved, but slideshow settings could not be updated"), and the look was lost on reload | mock, fixed | Mock gallery in localStorage, look in sessionStorage |

## Specs on the mock app

All 185 tests pass on the mock app (2026-11-03). Specs that need a fresh browser
context per role (`stash-and-subscriber-access`) sign out in the same context
instead, since the mock keeps uploads in the first browser's storage.
