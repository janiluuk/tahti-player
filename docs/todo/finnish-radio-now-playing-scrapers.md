# Now-playing scrapers for the six Finnish radio stations

**Status:** partial

**Blocker (narrowed 2026-10-19):** tahti-org polite User-Agent + per-station
kill switch on programme-page fetches. Product call settled: **ICY only** for
YleX / Radio Rock / Suomipop (no Areena API key, no Nelonen widget RE).

User ask (2026-10-04): make a scraper for each of the six Finnish stations in the radio catalog, so Listen, the player and the station page show what is playing instead of just the station name.

The stations are the catalog in `packages/tahti-web/src/content/radioStations.ts`: YleX, Radio Helsinki, Radio Rock, Suomipop, NRJ and Radio Nova.

## Decision (2026-10-19)

| Station        | Now-playing source                                      |
| -------------- | ------------------------------------------------------- |
| Radio Helsinki | Programme-page parser (existing)                        |
| NRJ            | Programme-page parser (Bauer / radioplay.fi, existing)  |
| Radio Nova     | Programme-page parser (Bauer / radioplay.fi, existing)  |
| YleX           | **ICY only** (`nowPlayingIcyOnly`) — no Yle API key     |
| Radio Rock     | **ICY only** — no Nelonen widget reverse-engineering    |
| Suomipop       | **ICY only** — same                                                     |

Client: `stationNowPlayingSource` clears `programmingUrl` when
`nowPlayingIcyOnly` is set so `fetchStationNowPlaying` goes straight to
`readIcyStreamTitle`.

## What exists

- tahti-org parsers for `radiohelsinki.fi` and `radioplay.fi` (NRJ, Nova).
- tahti-web player bar / station page / Listen share `fetchStationNowPlaying`.

## Left

- [ ] tahti-org: clear User-Agent on programme-page fetches + server-side
      kill switch per station host (client already respects
      `nowPlaying: false` / icy-only).
- [ ] Optional: wire catalog Helsinki/NRJ/Nova into the worker sync job
      (today it only refreshes user-added `InternetRadioStation` rows).

## Open questions — settled

- Yle API key vs ICY → **ICY**.
- Nelonen widget scrapers → **not pursuing**; ICY only.
