# Now-playing scrapers for the six Finnish radio stations

**Status:** partial

User ask (2026-10-04): make a scraper for each of the six Finnish stations in the radio catalog, so Listen, the player and the station page show what is playing instead of just the station name.

The stations are the catalog in `packages/tahti-web/src/content/radioStations.ts`: YleX, Radio Helsinki, Radio Rock, Suomipop, NRJ and Radio Nova.

## What exists (checked 2026-10-04)

- tahti-org `apps/worker/src/lib/internet-radio-now-playing.ts` has HTML parsers keyed by host: `radiohelsinki.fi` (current show plus song) and `radioplay.fi` (Bauer: NRJ, Radio Nova).
- The `internet-radio-now-playing-sync` worker job runs them every 10 minutes, but only for `InternetRadioStation` rows (stations a user added), and stores `currentProgramTitle` / `currentProgramArtist`. Catalog stations and admin presets are not covered.
- tahti-web reads the ICY `StreamTitle` from the stream itself for admin presets on Listen (`readIcyStreamTitle`). Catalog stations show language and bitrate only.
- The station page (`/radio/station/:stationId`) links out to the station's programme page and shows no current programme.

## Missing

| Station        | Site                    | State                                                                         |
| -------------- | ----------------------- | ----------------------------------------------------------------------------- |
| Radio Helsinki | radiohelsinki.fi        | Parser exists; not run for the catalog station                                |
| NRJ            | radioplay.fi/nrj        | Parser exists; not run for the catalog station                                |
| Radio Nova     | radioplay.fi/radio-nova | Parser exists; not run for the catalog station                                |
| YleX           | areena.yle.fi           | No parser. The worker notes say Yle Areena needs an API key                   |
| Radio Rock     | radiorock.fi            | No parser. Nelonen Media's widget is fetched client-side, nothing in the HTML |
| Suomipop       | supla.fi/suomipop       | No parser. Same Nelonen/Supla client-side widget                              |

## Done (2026-10-04)

- tahti-org#699: `GET /api/v1/internet-radio/now-playing?url=<programme page>` reads a station's page on demand (https, hosts with a parser only), cached for a minute. The parsers moved to `@tahti/shared`.
- #493 and #499: Listen's catalog station cards, the board's radio presets and the station page show "Programme · Artist — Track", falling back to the stream title.
- That covers Radio Helsinki, NRJ and Radio Nova. A probe of radiorock.fi and supla.fi/suomipop found no now-playing data in the served HTML.

## Plan

- [ ] 1. tahti-org: one scraper module per station with a shared interface (`fetchNowPlaying(station) -> { program, artist, title }`), with a recorded fixture and a test each. Find the JSON endpoints the Radio Rock and Suomipop widgets call; decide on a Yle API key or the ICY title for YleX.
- [x] 3. tahti-web: also show it in the player bar title while a catalog station plays. The title came with #505; the batch-51 follow-up makes the player bar and the OS media controls (Media Session) share it, polls only while the station plays and the tab is visible, and drops answers for a station the listener has left.
- [ ] 4. Keep polite: one request per station per interval, a clear User-Agent, and a kill switch per station when a site changes or objects.
  - Client side done: `fetchStationNowPlaying` shares one lookup per station for 25 seconds across the player bar, the station page and Listen, and a catalog station with `nowPlaying: false` in `radioStations.ts` is never asked (programme page or stream).
  - Still open (tahti-org): the User-Agent on the API's page fetches and a server-side switch per station.

## Open questions for the user

- Is a Yle API key acceptable for YleX, or should it stay on the ICY title?
- How fresh does it need to be? The current job refreshes every 10 minutes, which is too slow for track-level display.
