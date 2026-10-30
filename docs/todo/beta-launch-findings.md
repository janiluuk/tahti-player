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

## Ops

The domain switch is done (every host serves the SPA since 2026-10-21;
Next `apps/web` removed 2026-10-28). Remaining host/build decisions are in
[`packages/tahti-web/CUTOVER.md`](../../packages/tahti-web/CUTOVER.md).

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
    install and remove keep the layout in step.
  - 2026-10-30 (batch 117): Studio add-ons (artist scope) can add a logo
    block. The image uploads through `/api/me/media`, then
    `POST /api/me/channel/blocks` with `type: LOGO` and
    `{ assetId, url }`. Width is Full / Half / Third, remove deletes the
    block, and the create toast can undo. Listeners do not see the editor.
    Left: a check on beta.
- [ ] **Google Drive import** (parity): API exists (`/api/me/google-drive/picker-config`,
  `/import`, cloud-import jobs); tahti-web connects Drive but has no Picker.
  Import progress for queued jobs is shown on Upload (#1412).
  - 2026-10-27 (batch 90): Picker added. Drive's configure dialog (Sources
    and Studio → Upload's Import sources) has "Choose files from Drive":
    picker-config → Google Picker (audio only, multi-select) → POST
    `/import` in batches of 20. nginx CSP allows `apis.google.com` scripts
    and the `docs.google.com` frame. Left: check against real Picker keys on
    beta (needs `GOOGLE_DRIVE_*` incl. the developer key on the API).
- [x] MusicBrainz prompt re-enable toggle in Settings → Artist → Connections
  (batch 79).

## Listener

- [x] Player "Try again" after a stream error (#1406 announces failures; a
  reload needs an `AudioEngine` change).
  - 2026-10-27 (batch 90): `playerStore.retry()` bumps a reload nonce that
    `AudioEngine` reloads the source on. The toast's Try again and any play
    press from the error state use it and keep the queue (Try again used to
    replace the queue with the one track).
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
