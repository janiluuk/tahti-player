# Radio Nova and NRJ do not play in production

**Status:** partial

Reported by the user on 2026-10-19: on production, the curated stations
Radio Nova and NRJ do not play. The other curated stations are not reported.

## What is known

- Both stations are Bauer Media streams defined in
  `packages/tahti-web/src/content/radioStations.ts` (and the mock preset store
  `src/api/internetRadioPresetsMockStore.ts`):
  `https://stream-redirect.bauermedia.fi/{nrj/nrj,radionova/radionova}_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein`
  (64 kbps AAC, `codec: 'AAC'`).
- The redirect still works (checked 2026-10-19 with curl): `302` to
  `https://streaming.radioplay.fi/<station>/<station>_64.aac?…&aw_0_1st.skey=<unix time>`,
  which answers `200 audio/aac`. So the stations are up and the URLs are not dead.
- Neither host sends `Access-Control-Allow-Origin`. In the mock app the
  console shows `Access to fetch at 'https://stream-redirect.bauermedia.fi/…'
  … has been blocked by CORS policy` for both on every Listen load. That is
  the now-playing ICY metadata fetch in `src/api/radio-sources.ts`
  (`Icy-MetaData: 1`), which is best-effort and caches the failure; it should
  not stop playback by itself.
- `AudioEngine.tsx` loads audio with `crossOrigin = 'anonymous'` (for the
  visualizer analyser) and retries once without it on `error`. With no CORS
  headers the first load must fail, so these two stations always depend on
  that fallback.
- The production CSP allows `media-src https:` and `connect-src https:`, so
  CSP is not blocking the audio element.

- 2026-10-27: cause found. `stream-redirect.bauermedia.fi` answers the
  302 without `Access-Control-Allow-Origin` (the target
  `streaming.radioplay.fi` does send it), so the `crossOrigin = 'anonymous'`
  load fails and `AudioEngine.onError` reloads without CORS. By then the
  `play` event has already routed the element through the Web Audio graph
  (`createMediaElementSource`), and a media element source fed by a
  non-CORS resource outputs silence. The player says "playing" and nothing
  is heard. Fixed client-side in `fix/radio-cors-fallback-silence`: the
  graph is only built for CORS loads, and a stream that needs the no-CORS
  fallback plays on a fresh `<audio>` element outside the graph (no
  visualizer for those stations). Verify on production after deploy, then
  close this file.

- 2026-11-02: reproduced on production in headless Chromium (AAC supported):
  both station pages end with `MediaError` 4 ("no supported source") on the
  `stream-redirect.bauermedia.fi` URL, with or without its query string,
  even in a plain `<audio>` outside the app. The URL it redirects to,
  `https://streaming.radioplay.fi/<station>/<station>_64.aac?…`, plays (6 s
  of HE-AAC, no error) and sends `Access-Control-Allow-Origin:
  https://tahti.live`. The stations now use that URL directly: the bundled
  list and mock here, the seed script plus a data migration for the two
  `core.InternetRadioPreset` rows in tahti-org. Left: confirm on
  production after both deploy, then close this file.

## To check

1. Reproduce on production in a real browser (Chrome and Firefox, desktop and
   phone) with devtools open: does the `<audio>` element error, and what is
   `audio.error.code`? Does the no-CORS retry in `AudioEngine.onError` run?
2. Whether the redirect + time-stamped `skey` breaks the retry: the fallback
   reassigns the original `stream-redirect` URL; check that the second load
   follows the redirect and does not reuse a failed cached response.
3. Whether production plays these stations through the curated list or
   through API presets (tahti-org) with a different URL for the same station.
4. AAC support: a browser or build without the AAC codec (some Chromium
   builds, Linux without codecs) cannot play `audio/aac`; the other curated
   stations may be MP3. If so, prefer an MP3 or HLS variant from Bauer if one
   exists, or mark the codec in the UI.
5. Whether Bauer blocks or geo-limits by `Referer` / `Origin` (the
   `playerid=BMUK_tunein` parameter borrows TuneIn's player id).

## Done when

Radio Nova and NRJ play on production in Chrome and Firefox, or the stations
are replaced or removed with the reason recorded in HISTORY.

- 2026-11-03: NRJ removed from the bundled station list, the mock presets
  and its logo at the user's request. The production list also comes from
  tahti-org's `InternetRadioPreset` rows: disable NRJ there (Admin → Radio
  presets) to take it off every surface. Radio Nova stays; close this file
  once Nova is confirmed playing on production.
