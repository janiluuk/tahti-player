# Radio Browser: "Add URL" to personal list + station info view

**Status:** open

## Request

- Context/caveat from the user: the personal radio stream widget can go
  stale (a saved station's stream URL can stop resolving over time) —
  noted here as background, not a separate ask, unless it turns out to
  be a real bug worth its own investigation.
- In the Radio Browser directory (`RadioBrowserDirectoryCard` in
  `packages/tahti-web/src/components/plugin-store/RadioCategory.tsx`,
  Settings → Add-ons → Radio — same card as
  [[radio-browser-directory-fixes]]), add an **"Add URL" button** that
  reveals a stream-URL field, validates it as a playable
  stream/playlist, and adds it to the user's personal radio list.
- In that personal radio list, add a **"view" (info) icon** per station
  that shows: website, language flag, description, and — if the station
  has a programming link configured — its current programme.

## Existing building blocks (nothing here needs inventing from scratch)

- **"Bring your own stream" already exists**, just not wired to the
  personal list: `RadioBrowserDirectoryCard` already has a
  streamUrl-entry dialog (`streamUrlDraft` state, ~line 486) that calls
  `resolveStreamUrl()` (extracts a direct stream from a pasted playlist
  URL, `radio-sources.ts:112`) and `testRadioStream()`
  (`radio-sources.ts:354`) to validate playability before saving. The
  "Add URL" button the user wants is largely: reuse this same
  draft+validate flow, but persist the result as a
  `SavedBrowserStation` (see below) instead of whatever it currently
  does with it (check current save target — it may currently only feed
  `RADIO_STATIONS`/curated rows, not the personal list).
- **The "personal radio list" is `SavedBrowserStation`**
  (`packages/tahti-web/src/stores/listenerWidgetsStore.ts`,
  `savedBrowserStations` array) — "Radio Browser stations saved onto
  Listen tiles". Rendered via
  `packages/tahti-web/src/components/ListenerWidgetsSection.tsx`. This
  is almost certainly what the user means by "his radio list" — confirm
  before implementing, in case there's a second list this could mean
  instead.
- **URL → metadata lookup already exists**:
  `lookupStationByUrl(streamUrl)` (`radio-sources.ts:172`) queries
  radio-browser.info's `/stations/byurl/` endpoint and returns a full
  `RadioStation` (name, homepage, favicon, tags, country, countryCode,
  codec, bitrate) for any URL already listed in that public directory —
  this can auto-populate most of the "view" info for free when the
  pasted URL matches a known station.
- **Country flag**: `flagEmoji(countryCode)`
  (`packages/tahti-web/src/lib/countries.ts:63`) already exists and is
  used elsewhere in this file — likely what "language flag" means here
  (a country flag, not a language-specific icon); confirm with the user
  if a literal spoken-language indicator was meant instead.

## Gaps — fields that don't exist yet

- `SavedBrowserStation` today only has `{ id, name, streamUrl, favicon,
  country }` — no `homepage`, `countryCode` (only `country` name
  string, not the 2-letter code `flagEmoji` needs), `description`, or a
  programming-link field. All four need adding to the type and to
  wherever a station gets saved into `savedBrowserStations`.
- **Description**: radio-browser.info's API has no description field
  (confirmed in `RadioBrowserStation`'s shape, `radio-sources.ts:138`) —
  this would have to be user-entered at add-time, not auto-fetched.
- **"Current programme"**: no programming-link field or "now playing
  program" fetch exists anywhere in this repo today. This is the same
  gap already logged on the `tahti-org` side as
  `docs/todo/internet-radio-now-playing-scraper.md` (6 Finnish presets
  there already carry a `programmingUrl` field + per-station schedule
  pages, but no scraper implementation yet either). Worth deciding
  whether this personal list's "current programme" reuses that same
  `tahti-org` API/data model (if these stations are meant to sync with
  `tahti-org`'s `InternetRadioStation`) or is a fully separate,
  tahti-player-local feature — these are two different apps/data
  stores today with no visible link between them.

## Open questions before implementing

- Confirm "his radio list" = `SavedBrowserStation` /
  `ListenerWidgetsSection`, not some other list.
- Confirm "language flag" = country flag via `flagEmoji(countryCode)`.
- Decide whether "current programme" ties into the `tahti-org`
  `internet-radio-now-playing-scraper.md` work or is independent.
- Where does a user manually enter "description" — at add-time in the
  new URL field's form, or editable later from the view/info panel?
