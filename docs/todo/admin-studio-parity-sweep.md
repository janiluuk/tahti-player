# Admin + Studio parity sweep vs legacy tahti-org `apps/web` (2026-10-20)

**Status:** open

Final sweep before beta.tahti.live becomes the main site. Method (scripts in
that session's scratchpad, `sweep.py` / `rev.py`):

1. For each of the 124 legacy `apps/web` pages under `/admin/*` and
   `/dashboard/*`, follow its local imports and collect every `/api/...`
   endpoint it calls; flag endpoints tahti-web never calls.
2. Reverse: every `/api/me/*` and `/api/admin/*` route in tahti-org
   `apps/api` that no tahti-web file references.
3. Read each candidate by hand (URLs built from a base variable are not gaps).

Pages that only `redirect()` (16, e.g. `/dashboard/settings/comments` →
notifications, `/dashboard/stats/detail` → stats tab) need no port.

## Result

**Admin: no endpoint gaps.** Every endpoint the legacy admin pages use is
called by tahti-web (users + restrictions, support detail, financial
ledger/fan-subs/legacy members, governance audit/report/resolutions, grants
year, per-channel programme and sounds, workers/crons, add-on versions,
venues verify/unverify, annual reports). `GAP-MAPPING.md`'s admin
"Missing"/"Partial" notes predate those ports and should be re-checked
against this list when it is next edited.

## Studio / artist gaps (API exists, no tahti-web UI)

- [ ] **Channel add-on blocks.** Legacy `/dashboard/channel/edit` →
  `_channel-blocks-panel.tsx` places add-on widgets (and a logo block) on
  the channel page with Full / Half / Third widths and drag order.
  API: `GET/POST /api/me/channel/blocks`, `PATCH/DELETE …/:id`,
  `PUT …/reorder`; public render `GET /api/v1/channels/:slug/blocks`.
  tahti-web has neither the editor nor the public render.
- [ ] **Upload a track to Mixcloud.** Legacy sound editor
  (`sound-mixcloud.tsx`, `mixcloud-actions.ts`): `GET/POST
  /api/me/sound/:id/mixcloud` (upload + status). tahti-web only connects
  Mixcloud and imports from it.
- [ ] **Google Drive import + cloud-import job status.** Legacy
  `/dashboard/upload/import/google-drive` (Picker via
  `GET /api/me/google-drive/picker-config`, `POST /api/me/google-drive/import`)
  and both Drive and SoundCloud import panels poll
  `GET /api/me/cloud-import/jobs(/:jobId)`. tahti-web connects Drive in
  Sources but has no picker, no import call and no job list.
  (`dead-end-leftovers.md` says "Drive import (API)"; the API exists.)
- [ ] **MusicBrainz default publish preference.** Legacy Settings →
  Connections and release publish read/write `GET/PATCH
  /api/me/musicbrainz/default` (remembered "also submit to MusicBrainz").
- [ ] **Studio dashboard cards.** Legacy `/dashboard` shows channel funnel
  stats (`GET /api/me/channel-funnel-stats`), the fan-sub payout summary
  (`GET /api/me/fan-sub-payouts/summary`) and recent sounds
  (`GET /api/me/sound/recent`). tahti-web `/studio` has none of the three.
- [ ] **Ban from a chat message.** `POST
  /api/me/moderate/:slug/chat/messages/:id/ban` (ban the author of a
  message in one step) has no caller; moderators ban by fingerprint list.

## Listener

- [ ] **Track reactions** (`/api/reactions/track/:id`), shown on legacy
  track rows and the full-screen player. Before wiring: the route ignores
  blocks and suspended artists and announces every LOVE in channel chat
  (see cross-repo notes).

## Not gaps (checked)

- Legacy API calls with no tahti-web caller in legacy either:
  `PATCH /api/me/channel/slideshow`, `POST /api/me/sound/:id/editor/bounce`.
- Per-member picture upload, RTMP target edit/delete/stream-key, add-on
  version upload, insights, annual reports, social connect: tahti-web
  builds these URLs from a base variable.
