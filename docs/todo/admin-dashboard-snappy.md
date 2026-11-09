# Admin dashboard and slow pages

**Status:** partial

## Problem

The admin dashboard (`/admin`) takes a long time to load, every time it is opened. It should show cached data at once and refresh in the background.

## Done (2026-11-09)

- `/admin` renders the last loaded dashboard at once and refreshes in the background (`lib/useSnapshotFetch.ts`: memory + sessionStorage per tab, cleared on login/logout; "Updating…" while it refreshes, "Showing the last loaded data" if the refresh fails). Several of its ten calls hit paths the 30 s GET cache never caches (health, status, queues), so before this every open waited on the slowest one.

- `/admin/financial` uses the same hook, one snapshot per year; its panels' changes refetch in the background instead of blanking the page. The hook gained `mutate` (local edits update the snapshot) and switches snapshots when its key changes.

- 2026-11-09, 30 more pages on `useSnapshotFetch` (each renders its last result at once, refreshes in the background, keeps local edits through `mutate`): admin Venues, Missed shows, Top lists, Storage user + overview, Status, Grant cycle, Languages, News, Announcements, Beta, Content reports, Radio submissions, Station suggestions, Fan-sub artists, Grants and Annual reports tabs; public Status, Platform news, Governance history, member directory, Transparency grant year + resolutions; Library Smart links + Media; Studio Events, Groups, Listening parties, Download gates, Stats detail. `apiResult()` unwraps `{ data, meta }` and throws on an API failure so the snapshot stays; the test setup clears snapshots after each test.

## Plan

- [ ] Measure: what `/admin` fetches on open (`fetchAdminDashboard` and the panels' own calls), how long each takes, and whether the API side is the slow part (`../tahti-org`).
- [ ] If the API call itself is slow, cache or precompute it server-side (separate tahti-org slice).
- [ ] Left on the old pattern (need more than a drop-in): admin governance overview, Users (debounced search), Studio Distribution (two error states), Editor list, Mastering (large editor source), Group detail, Radio show (polling), Subscribe, Smart link page, Discover.
