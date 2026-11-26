# Replay channels that cannot play (tahti-org)

**Status:** open

Reported 2026-11-26: "lot of the replay channels show error when playing, do
not show non-playable replay channels". tahti-web now hides them on its own
(0.0.4xx, `src/components/listen-view/onAirChannels.ts`); the API should stop
listing them so every client gets it right.

## What production returned (2026-11-26)

`GET https://api.tahti.live/api/v1/channels` → `live: 0`, `replaying: 8`,
`recent: 0`. Every replay was `state: LIVE`, `goneLiveAt: null`,
`fallbackEnabled: true`, and every `hlsUrl` answered 200 with fresh segments.

| Channel | Master | `/items` | `nowPlaying` | Audio |
| ------- | ------ | -------- | ------------ | ----- |
| yaniho | `master.m3u8` (mp3 + aac) | 50 | set | music |
| tahti-selects | `master.m3u8` | 5 | set | music |
| tahti-radio | `master.m3u8` | 0 (radio) | set | music, own row |
| tahti, alexx, 0fpmbnvefhfgrqd6fdp, jani, mrb | `master-free.m3u8` (mp3 only) | 0 | null | silence, -91 dB |

So 7 were listed on Listen (Tahti Radio has its own row) and 2 played music.
The other 5 fail twice over:

- **The error.** Their `master-free.m3u8` (FREE tier) has one variant tagged
  `CODECS="mp3"`, which is not an RFC 6381 codec string. hls.js in Chromium
  rejects it as `FATAL mediaError/manifestIncompatibleCodecsError` and the
  player shows an error. `master.m3u8` survives because its AAC variant is
  `mp4a.40.2`. Loading `stream-mp3-192.m3u8` directly plays fine. This hits
  every FREE-tier channel, live broadcasts included, not only replays.
- **Nothing to play.** They have no public sounds: `channel-fallback-reconciler`
  still bootstraps their 24/7 rotation, Liquidsoap streams silent filler, and
  the orchestrator never writes `nowPlaying*` because no sound is on air.

## API changes

0. `apps/worker/src/lib/hls-minio-sync.ts` (line ~57) writes
   `#EXT-X-STREAM-INF:BANDWIDTH=192000,CODECS="mp3"`. Use
   `CODECS="mp4a.40.34"` (MPEG-1/2 Layer III) or drop `CODECS` for that
   variant, in both `master.m3u8` and `master-free.m3u8`; update
   `hls-minio-sync.test.ts`. Highest priority: it breaks FREE-tier live too.
1. `apps/api/src/routes/channels/list.ts`, the `replayingChannels` query:
   only list a channel whose rotation has something to play, e.g. add
   `sounds: { some: { isPublic: true, status: 'READY', mp3Key: { not: null } } }`
   (match the `/api/channels/:slug/items` filter and whatever the channel
   Liquidsoap template rotates; there is an `@@index([channelId, isPublic, status])`),
   and drop
   cards whose `nowPlaying` is null after `toCard` (no track for 2 minutes).
   Same filter for the `OFFLINE` + `fallbackEnabled` branch, whose `hlsUrl`
   is always null today and so can never play from the card.
2. `apps/worker/src/jobs/channel-fallback-reconciler.ts`: its query is only
   `state: 'OFFLINE'` + `fallbackEnabled: true`, so it spawns a rotation for
   a channel with no sounds. Add the same `sounds: { some: … }` filter, and
   have `channel-watchdog.ts` stop a rotation whose last sound went private
   or was deleted. The dead-air shutdown (`lib/dead-air.ts`) does not catch
   these: it looks at segment age, and silent filler still writes fresh
   segments every 4 s.
3. Optional contract field: `replayPlayable: boolean` on the channel card
   (`ChannelListResponseSchema` in `@tahti/shared`) if the list must keep
   these channels for another client. tahti-web reads `hlsUrl` +
   `nowPlaying` today and would switch to the field.

## Done when

- A FREE-tier `master-free.m3u8` plays in hls.js (Chromium) without
  `manifestIncompatibleCodecsError`.
- `GET /api/v1/channels` lists no replay channel with a null `nowPlaying`
  or a null `hlsUrl`.
- No Liquidsoap rotation runs for a channel with zero public sounds.
- tahti-web keeps its client filter as a guard; fold this file into HISTORY.
