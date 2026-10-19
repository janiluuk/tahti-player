# E2E on beta — artist + listener UX findings (2026-10-19)

**Status:** open

Task-based journeys run against **beta.tahti.live** (real API, real accounts —
no mock), desktop 1440×900 and phone 390×844:

- `packages/tahti-web/scripts/journeys/listener-tasks-journey.mjs`
- `packages/tahti-web/scripts/journeys/artist-tasks-journey.mjs`
- harness `scripts/journeys/task-lib.mjs` (times each task, records console
  errors, failed/slow `/api` calls, unnamed controls, overflow)

Run: `TAHTI_E2E_EMAIL=… TAHTI_E2E_PASSWORD=… TAHTI_E2E_LISTENER_EMAIL=…
TAHTI_E2E_LISTENER_PASSWORD=… node scripts/journeys/<x>-tasks-journey.mjs`
(`JOURNEY_BASE_URL` overrides the target). Output:
`docs/e2e-journeys/{listener,artist}-tasks/{desktop,phone}/REPORT.md` +
screenshots. The artist run creates an `e2e-test …` track and release and
deletes both at the end.

Priorities: **P0** blocks a core task · **P1** confusing / wrong · **P2** polish.

## Artist

- [ ] **P0 — Upload page always fails on the real API with a bare
  "Validation error".** `StudioUploadView.tsx:192` calls
  `uploadSoundFile({ file })` with no `title`; tahti-org `PrepareUploadSchema`
  requires `title` (`min(1)`), so `POST /api/uploads/prepare` → 400. The
  Upload dialog on Tracks works because it falls back to the file name
  (`UploadTrackDialog.tsx`). Fix: same fallback on the page (and the page
  copy promises "we'll read the embedded title … filename is used"). Also
  show the API's `issues[]` instead of "Validation error".
- [ ] **P1 — Add-to-release picker offers tracks that can't be added.** A
  still-processing upload is listed in "Add content to album"; pressing Add
  → `400 Sound item not found` toast (API only accepts `status: 'READY'`,
  tahti-org `routes/collections/me.ts`). Disable/label PENDING rows
  ("Processing…") and map that error to plain words.
- [ ] **P1 — Picker shows "Unknown artist" for every one of the artist's own
  tracks** (`artistName` null on hearthis imports / uploads). Fall back to
  the channel display name.
- [ ] **P1 — Processing track shows a fake waveform and "3:00" duration**
  for an 8-second file on `/studio/sounds/$id`, and the list row's Play
  button is enabled for a PENDING track. Show a processing placeholder, no
  duration, disabled Play.
- [ ] **P1 — New uploads (dialog path) and new releases are Public
  immediately**, including an empty 0-item EP. Default new releases to
  draft/private until they have tracks; make upload visibility explicit in
  the dialog.
- [ ] **P1 — Signed-in artist sees "Subscribe" on their own channel** and the
  hero says "Stream is live — hit Play live…" while the badge says
  "24/7 ROTATION" (not live). Hide Subscribe for the owner; word the
  rotation state as rotation.
- [ ] **P1 — Collections list has no row menu; delete is only on the release
  page**, and deleting from Studio lands on `/library/collections`
  (Library) instead of `/studio/collections`.
- [ ] **P2 — Sign-in lands an artist on `/` (Listen), not Studio.**
- [ ] **P2 — Empty "Queue" side panel stays open across Studio** (~25% of
  1440 px) so Studio tables truncate (public channel Title column shows
  "Don't Turn A…"). Collapse the queue by default on Studio routes or when
  empty.
- [ ] **P2 — Own channel track table wastes width**: Artist column repeats
  the channel name on every row and Source ("hearthis") is shown while
  Title is truncated. Hide Artist when every row is the owner.
- [ ] **P2 — Library tab bar wraps to two rows at 1440** (10 tabs: Overview …
  Local files) and go-live sits under two tab rows (Studio sections +
  Broadcast sub-tabs: Prep, Credentials, Recording, Destinations, Green
  room, Schedule, Events, Shows, Channel, Radio).
- [ ] **P2 — "Design" vs "Edit" row buttons** on the Collections list for the
  same action, by collection type.
- [ ] **P2 — Track editing lives under Library while uploads/releases are
  reached from Studio**; the sidebar switches highlight from Studio to
  Library mid-task.
- [ ] **P2 — No link from the channel designer to the public channel.**
- [ ] **P2 — Tracks rows are six icon-only buttons** (play, download, edit,
  stats, queue, more) with no visible labels.

## Platform / beta

- [ ] **P1 — Beta API is behind tahti-org `main`.** 404 on beta, present on
  main: `GET /api/me/sound/processing`, `/api/me/collection-subscriptions`,
  `/api/v1/internet-radio/now-playing`, `/api/channels/:slug/schedule`. Deploy
  tahti-org (ops) — the web client already calls them.
- [ ] **P2 — `GET /api/me/mixcloud-embed` 404s on every upload page load.**
  The import-source status probe (`src/api/sources/catalog.ts:262`) builds
  `/api/me/${id}` for every source, including the search-only
  `mixcloud-embed` (`capabilities.connect: false`), which has no route in
  tahti-org. Skip the probe when `connect` is false.
- [ ] **P1 — CSP violation on every page**: an inline script is blocked by
  `script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com`
  (hash `sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg=`). Find the
  inline script in the built `index.html` and move it to a file or add the
  hash.
- [ ] **P1 — Auth rate limit still tight on beta**: a second sign-in within a
  minute → `429 POST /api/auth/login` (see memory note on loosening
  `RATE_LIMIT_AUTH_MAX` / separate `rl:auth:` bucket). The journeys wait 65 s
  before the phone pass because of it.
- [ ] **P2 — `GET /api/auth/me` 401 logged as a console error on every
  signed-out load.** Treat 401 as "signed out" silently.
- [ ] Radio stream CORS preflights (Bauer, Nelonen, Radio Helsinki, YleX
  `Icy-MetaData`) on every Listen load — already tracked in
  [radio-nova-nrj-playback.md](radio-nova-nrj-playback.md).

## Listener

The listener account supplied (`listener@example.com`) was rejected by beta
(`401 Invalid email or password`), so the listener journey ran with the
artist account; channel-less gating is still unverified on beta. Re-run with
a real listener account.

- [ ] **P0 — Tahti Radio (24/7 rotation) does not play on beta.**
  `cdn.tahti.live/hls-live/tahti-radio/master.m3u8` lists
  `stream-mp3-192.m3u8` and `stream-aac-320.m3u8`; both are `404
  NoSuchKey`. The rotation encoder isn't writing HLS (ops). Meanwhile the UI
  still says "ON AIR" / "LIVE NOW" and the only feedback is a tiny "ERROR"
  under the player's Play button.
- [ ] **P1 — Radio failure has no real error state.** When a stream fails to
  load (Tahti Radio above, CORS-blocked stations), show "Can't reach this
  station right now" + Retry in the player and on the station card, and
  stop showing "LIVE NOW" for a stream that doesn't load.
- [ ] **P1 — Subscribe is the only way to follow an artist, and it dead-ends.**
  The channel "Subscribe" link goes to `/subscribe/<user>`, which says "No
  active fan tiers yet" (heading repeated twice). There is no free Follow
  (`followArtist`/`unfollowArtist` exist in `api/client.ts` but no view calls
  them). Hide Subscribe when the artist has no tiers; add a free Follow.
- [ ] **P1 — Favorites → "Liked on Tahti" shows "Could not load your likes /
  Not Found"** because beta lacks `GET /api/me/likes` (exists on main).
  Clears once beta is deployed; the message could say the feature isn't
  available yet instead of "Not Found".
- [ ] **P1 — History empty after playing.** Phone `/history` said "Nothing to
  show yet" minutes after this account played two tracks to 1–10 s. Check
  the play-report threshold and whether History reads the same source;
  if a minimum play length is required, say so in the empty state.
- [ ] **P1 — `GET /api/me/collections?expand=items` fires ~8× in parallel on
  every page** (each 2.5–3 s on beta). Dedupe through one shared query /
  cache.
- [ ] **P1 — "On air · Live" row on Listen shows channels marked "Replay"**,
  not live ones. Rename the row or filter to live channels.
- [ ] **P2 — Enter in the global search jumps to the first suggestion** (an
  artist's `/u/…` page) instead of a results page; there's no way to see
  all results for a query from the keyboard.
- [ ] **P2 — No space-bar play/pause.** Space does nothing (focus lands on
  `#main-content`); `content/keyboardNavigation.ts` lists no play/pause key.
- [ ] **P2 — Play takes ~3.8 s from click to sound** for a CDN MP3 (signed
  in, beta). Show a loading state on the Play button until `playing`.
- [ ] **P2 — Track tables show the username (`liis-kask-ee`) in the Artist
  column** on the channel page while the hero shows the display name; Title
  truncates ("B-Sides & Dem…") with spare width in Duration/Released.
- [ ] **P2 — Queue rows are `role="button"` with no accessible name**
  (`[data-queue-item-id]`, `aria-disabled="true"`).
- [ ] **P2 — Account menu says "Artist panel" / "My channel"** while the
  sidebar says "Studio" for the same place.
- [ ] **P2 — Phone (390): Library tab row is cut off** (Overview, Sounds,
  Collections, then a clipped icon); Favorites shows one full-width channel
  card per screen, pushing Tracks far down; Discover "most played" widget
  is a tall box with one row.
- [ ] **P2 — Beta seed data**: a channel named `0fpmbnvefhfgrqd6fdp` shows on
  Listen and Favorites; seeded tracks from different artists play the same
  MP3 (`tahti-selects/cmsw40u5j000h…`).

## Not issues (checked)

- Track playback works signed out and signed in (206 from cdn.tahti.live,
  ~4 s to start).
- Favouriting a track works and shows on `/favorites` with a filled heart.
- Upload via the Tracks page dialog, title/description edit + reload,
  release create, release delete and track delete all work on beta.
- New uploads from the dialog show a clear "Still processing" notice on the
  track page.
