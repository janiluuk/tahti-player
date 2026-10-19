# Beta → main site: launch findings

**Status:** partial

Consolidates `e2e-beta-ux-findings.md` (real-backend e2e run on beta.tahti.live,
2026-10-19) and `admin-studio-parity-sweep.md` (legacy tahti-org `apps/web`
admin/Studio vs tahti-web, 2026-10-20). Fixed items are in HISTORY; only open
work is listed here.

How these were found:

- Journeys: `packages/tahti-web/scripts/journeys/{listener,artist}-tasks-journey.mjs`
  (+ `task-lib.mjs`); docs in `packages/tahti-web/docs/E2E-JOURNEYS.md`.
- Parity sweep: for each of the 124 legacy `/admin/*` and `/dashboard/*` pages,
  the `/api/...` endpoints it calls vs the ones tahti-web calls, plus the reverse
  over every tahti-org `/api/me/*` and `/api/admin/*` route. Admin has endpoint
  parity.

## Blocking the switch (ops)

- [ ] **Domain switch** — beta.tahti.live becomes the main site. DNS map and
  runbook: [final-season-hardening.md](final-season-hardening.md).
- [ ] **Tahti Radio does not play.** `cdn.tahti.live/hls-live/tahti-radio/master.m3u8`
  lists `stream-mp3-192.m3u8` and `stream-aac-320.m3u8`; both 404 (rechecked
  2026-10-20). The rotation encoder isn't writing HLS.
- [ ] **tahti-org #879** (`GET /api/v1/events/upcoming`) must reach production
  for the front page's Coming up row; until then the row stays hidden.
- [ ] **Beta content** — test releases ("asdada", "test") show in the front
  page's New releases row; unpublish them on the owning account.

## Artist (Studio)

- [ ] New releases (and dialog uploads) are public immediately, even an empty
  EP. Default release-like collections to draft until they have tracks.
- [ ] Channel hero says "Stream is live — hit Play live…" while the badge says
  24/7 ROTATION.
- [ ] Collections list has no row menu (delete only on the release page), and
  deleting from Studio lands on `/library/collections`.
- [ ] Empty Queue side panel stays open across Studio (~25% of 1440 px), so
  tables truncate.
- [ ] Own channel track table: Artist column repeats the owner (username, not
  display name) while Title truncates.
- [ ] Library tab bar wraps to two rows at 1440; go-live sits under two tab
  rows; Library tab row is cut off at 390 px.
- [ ] Collections list says "Design" or "Edit" for the same action.
- [ ] Track editing lives under Library while uploads/releases are reached from
  Studio; the sidebar highlight jumps mid-task.
- [ ] No link from the channel designer to the public channel.
- [ ] Tracks rows are six unlabeled icon buttons.
- [ ] Sign-in lands an artist on `/`, not Studio (product call).
- [ ] **Channel add-on block layout** (parity): add-on widgets render on the
  channel page via `/api/v1/channels/:slug/addons`, but the legacy order/width
  (Full / Half / Third) and logo block (`/api/me/channel/blocks*`,
  `/api/v1/channels/:slug/blocks`) have no editor or renderer.
- [ ] **Google Drive import** (parity): API exists (`/api/me/google-drive/picker-config`,
  `/import`, cloud-import jobs); tahti-web connects Drive but has no Picker.
  Import progress for queued jobs is shown on Upload (#1412).
- [ ] MusicBrainz prompt can't be turned back on after "Don't ask again"
  (legacy had a Settings → Connections toggle).

## Listener

- [ ] Player "Try again" after a stream error (#1406 announces failures; a
  reload needs an `AudioEngine` change).
- [ ] History showed "Nothing to show yet" minutes after playing two tracks;
  check the play-report threshold and say it in the empty state.
- [ ] Play takes ~3.8 s from click to sound; show loading on the Play button.
- [ ] Queue rows are `role="button"` with no accessible name.
- [ ] Account menu says "Artist panel" / "My channel" while the sidebar says
  Studio.
- [ ] Favorites on phone: one full-width channel card per screen.
- [ ] Beta seed data: channel `0fpmbnvefhfgrqd6fdp`; seeded tracks share one MP3.

## Platform

- [ ] `GET /api/me/mixcloud-embed` 404 on every Upload load: the source status
  probe (`api/sources/catalog.ts`) builds `/api/me/${id}` for the search-only
  `mixcloud-embed`. Skip when `capabilities.connect` is false.
- [ ] `GET /api/auth/me` 401 logged as a console error on every signed-out load.
- [ ] Beta auth rate limit: a second login within a minute got 429 on
  2026-10-19 although tahti-org #875 (separate auth bucket) is merged; verify
  after the next API deploy.
- Radio station CORS preflights: tracked in
  [radio-nova-nrj-playback.md](radio-nova-nrj-playback.md).
