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
  runbook: [final-season-hardening.md](final-season-hardening.md). Partial
  2026-10-21: `app.tahti.live` and the `*.tahti.live` channel wildcard now
  forward to the beta SPA container (`:15180`), like the apex; channel
  subdomains open their channel (#1456). Left: a prod SPA image instead of the
  beta container, the apex vs marketing-site decision, and board admin on
  Next vs the SPA admin.
- [ ] **Tahti Radio does not play.** `cdn.tahti.live/hls-live/tahti-radio/master.m3u8`
  lists `stream-mp3-192.m3u8` and `stream-aac-320.m3u8`; both 404 (rechecked
  2026-10-20). The rotation encoder isn't writing HLS.
- [ ] **tahti-org #879** (`GET /api/v1/events/upcoming`) must reach production
  for the front page's Coming up row; until then the row stays hidden.
- [ ] **Beta content** — test releases ("asdada", "test") show in the front
  page's New releases row; unpublish them on the owning account.

## Artist (Studio)

- [x] New ALBUM/EP collections default to private; create release POST sends
  `state: 'DRAFT'` (batch 79).
- [x] Channel hero says rotation, not live, when nobody is broadcasting (#1418).
- [x] Collections list has a row menu; delete from the editor lands on
  `/library/collections` (#batch 79; menu already on master).
- [x] Empty Queue side panel auto-collapses when the queue empties (batch 79;
  also starts collapsed since layoutStore v8).
- [x] Own channel track table hides the Artist column for the owner (batch 79).
- [x] Library section tabs stay a single scrollable row (`PHONE_SCROLL_TAB_LIST`).
- [x] Collections list uses one label — "Edit" (batch 79).
- [ ] Track editing lives under Library while uploads/releases are reached from
  Studio; the sidebar highlight jumps mid-task.
- [x] Channel designer links to the public channel ("Open my channel →").
- [x] Tracks rows have aria-labels / tooltips on icon actions.
- [ ] Sign-in lands an artist on `/`, not Studio (product call).
- [ ] **Channel add-on block layout** (parity): add-on widgets render on the
  channel page via `/api/v1/channels/:slug/addons`, but the legacy order/width
  (Full / Half / Third) and logo block (`/api/me/channel/blocks*`,
  `/api/v1/channels/:slug/blocks`) have no editor or renderer.
  - 2026-10-27 (batch 90): renderer and add-on width editor. The channel page
    reads `/blocks` and lays out logo and add-on blocks in 6-unit rows (same
    packing as tahti-org); add-ons not in the layout still list below. Studio
    add-ons (artist scope) get a Full / Half / Third width per add-on; the
    first change lays out every add-on in list order, and Move up/down,
    install and remove keep the layout in step. Left: an editor for logo
    blocks (upload via `/api/me/media`) and a check on beta.
- [ ] **Google Drive import** (parity): API exists (`/api/me/google-drive/picker-config`,
  `/import`, cloud-import jobs); tahti-web connects Drive but has no Picker.
  Import progress for queued jobs is shown on Upload (#1412).
- [x] MusicBrainz prompt re-enable toggle in Settings → Artist → Connections
  (batch 79).

## Listener

- [ ] Player "Try again" after a stream error (#1406 announces failures; a
  reload needs an `AudioEngine` change).
- [x] History empty copy explains the ~30 s play-report threshold (batch 79).
- [x] Play button shows loading while `status === 'loading'` (MediaArtwork +
  player bar; batch 79).
- [x] Queue rows are named; only act as buttons when reorderable (#1420).
- [x] Account menu says Studio / My artist profile (#1419).
- [x] Favorites channel cards use a denser phone grid (batch 79).
- [ ] Beta seed data: channel `0fpmbnvefhfgrqd6fdp`; seeded tracks share one MP3.

## Platform

- [x] Mixcloud-embed connect probe skipped (#1417).
- [x] Signed-out `/api/auth/me` 401 handled without throwing (batch 79; Network
  tab may still show the status until the API returns a soft 200).
- [ ] Beta auth rate limit: a second login within a minute got 429 on
  2026-10-19 although tahti-org #875 (separate auth bucket) is merged; verify
  after the next API deploy.
- Radio station CORS preflights: tracked in
  [radio-nova-nrj-playback.md](radio-nova-nrj-playback.md).
