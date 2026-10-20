# Studio stats: audience breakdown

**Status:** open

Requested 2026-10-20 from a reference screenshot (a hearthis.at-style stats
page). Studio → Stats (`views/studio/stats/`) already has daily plays,
hourly ("Time"), a country map + top countries, top lists, engagement and
download gates. This item covers the rest of that page.

## Panels to add

1. **Daily statistic, stacked** — plays and downloads per day in one bar
   (two series), plus a **Download CSV** action for the range.
2. **Listener loyalty** — share of listeners still listening at 0 … 100 % of
   a track (drop-off curve).
3. **Country list beside the map** — scrollable two-column list with flag
   and share %, next to `ListenerWorldMap`; then a **City** list under it.
4. **Audience breakdown** section with an **Ignore bot traffic** toggle:
   - **Browser** (Chrome, Firefox, Mobile Safari, Edge, app clients such as
     "hearthis.at App", VLC, WeChat…, plus Unknown)
   - **OS versions** (Windows 10, macOS 10.15, iOS 26.x, Android 10–16,
     GNU/Linux, Bot, Unknown)
   - **Device type** (Desktop, Smartphone, Tablet, Unknown)
   - **Device company** (Apple, Samsung, Huawei, Sony, OPPO, Realme…, Unknown)
   - **Source** (referrer host or client: chrome, safari, podcast, external
     sites, beta.tahti.live)

   Each is a two-column list: icon, name, share %. Lists only, not charts.

## API dependency (`../tahti-org`)

None of this can be built from current data. `engagement.ListenSession` stores
`countryCode` and `source` (a `ListenSource` enum) but no user agent,
referrer, city or listened fraction; `ListenEvent` is a dedupe row per day.

Needed in tahti-org (ask the user before editing the sibling repo):

- Store a parsed UA on the listen session (browser, OS + version, device
  type, device vendor, `isBot`); never the raw UA string or IP. Pick a parser
  (e.g. `ua-parser-js`) plus a bot list.
- Store the referrer **host only** (no path/query) or a client id.
- City from the existing geo lookup, kept coarse (drop below a k-anonymity
  threshold such as 5 listeners per city).
- Listened fraction / max position per session, for the loyalty curve.
- Aggregate routes scoped to the artist with the same range params as
  `fetchStatsPlays` (e.g. `GET /api/studio/stats/audience?dimension=browser`,
  `/stats/loyalty`, `/stats/cities`), returning shares, not raw rows.
- Daily downloads next to plays in the daily stats response; a CSV export.

Privacy: aggregated shares only, a minimum bucket size before a name is
shown (otherwise "Other"), and nothing per listener. Update the privacy
copy if new fields are stored.

## Web slices (after the API exists)

- [ ] Stacked plays + downloads daily chart + Download CSV (`PlaysTab`)
- [ ] Country list beside the map + City list (`OverviewTab` / `TrackInsightsPanel`)
- [ ] Listener loyalty curve
- [ ] `AudienceBreakdown` component (`@tahti-player/ui` share list + story),
      Browser / OS / Device type / Device company / Source panels, Ignore bot
      traffic toggle
- [ ] Mock fixtures in `api/mock` for every new endpoint; Storybook story for
      the new Stats tab state
- [ ] Same breakdown on the per-track insights view (`StudioTrackInsightsView`)
