# Now-playing scrapers for the six Finnish radio stations

**Status:** open

User ask (2026-10-04): make a scraper for each of the six Finnish stations in the radio catalog, so Listen, the player and the station page show what is playing instead of just the station name.

The stations are the catalog in `packages/tahti-web/src/content/radioStations.ts`: YleX, Radio Helsinki, Radio Rock, Suomipop, NRJ and Radio Nova.

## What exists (checked 2026-10-04)

- tahti-org `apps/worker/src/lib/internet-radio-now-playing.ts` has HTML parsers keyed by host: `radiohelsinki.fi` (current show plus song) and `radioplay.fi` (Bauer: NRJ, Radio Nova).
- The `internet-radio-now-playing-sync` worker job runs them every 10 minutes, but only for `InternetRadioStation` rows (stations a user added), and stores `currentProgramTitle` / `currentProgramArtist`. Catalog stations and admin presets are not covered.
- tahti-web reads the ICY `StreamTitle` from the stream itself for admin presets on Listen (`readIcyStreamTitle`). Catalog stations show language and bitrate only.
- The station page (`/radio/station/:stationId`) links out to the station's programme page and shows no current programme.

## Missing

| Station | Site | State |
| --- | --- | --- |
| Radio Helsinki | radiohelsinki.fi | Parser exists; not run for the catalog station |
| NRJ | radioplay.fi/nrj | Parser exists; not run for the catalog station |
| Radio Nova | radioplay.fi/radio-nova | Parser exists; not run for the catalog station |
| YleX | areena.yle.fi | No parser. The worker notes say Yle Areena needs an API key |
| Radio Rock | radiorock.fi | No parser. Nelonen Media's widget is fetched client-side, nothing in the HTML |
| Suomipop | supla.fi/suomipop | No parser. Same Nelonen/Supla client-side widget |

## Plan

- [ ] 1. tahti-org: one scraper module per station with a shared interface (`fetchNowPlaying(station) -> { program, artist, title }`), with a recorded fixture and a test each. Find the JSON endpoints the Radio Rock and Suomipop widgets call; decide on a Yle API key or the ICY title for YleX.
- [ ] 2. tahti-org: run the sync for the six catalog stations (not only user-added rows), cache the result, and expose it on a public route such as `GET /api/v1/internet-radio/now-playing`.
- [ ] 3. tahti-web: show programme and track on the Listen radio cards, in the player bar title, and in a "Now playing" block on the station page. Fall back to the ICY title, then to the station name.
- [ ] 4. Keep polite: one request per station per interval, a clear User-Agent, and a kill switch per station when a site changes or objects.

## Open questions for the user

- Is a Yle API key acceptable for YleX, or should it stay on the ICY title?
- How fresh does it need to be? The current job refreshes every 10 minutes, which is too slow for track-level display.
