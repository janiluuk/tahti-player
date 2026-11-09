# Admin dashboard and slow pages

**Status:** partial

## Problem

The admin dashboard (`/admin`) takes a long time to load, every time it is opened. It should show cached data at once and refresh in the background.

## Done (2026-11-09)

- `/admin` renders the last loaded dashboard at once and refreshes in the background (`lib/useSnapshotFetch.ts`: memory + sessionStorage per tab, cleared on login/logout; "Updating…" while it refreshes, "Showing the last loaded data" if the refresh fails). Several of its ten calls hit paths the 30 s GET cache never caches (health, status, queues), so before this every open waited on the slowest one.

## Plan

- [ ] Measure: what `/admin` fetches on open (`fetchAdminDashboard` and the panels' own calls), how long each takes, and whether the API side is the slow part (`../tahti-org`).
- [ ] If the API call itself is slow, cache or precompute it server-side (separate tahti-org slice).
- [ ] Sweep other pages that load slowly on every visit and list them here with timings before fixing. Candidates by number of parallel calls: admin governance overview (12; renders progressively and edits its resolutions list locally, so `useSnapshotFetch` needs a mutate hook first), admin financial (6), Discover (6), admin community stats (4), admin announcements (4).
