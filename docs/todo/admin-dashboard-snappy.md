# Admin dashboard and slow pages

**Status:** open

## Problem

The admin dashboard (`/admin`) takes a long time to load, every time it is opened. It should show cached data at once and refresh in the background.

## Plan

- [ ] Measure: what `/admin` fetches on open (`fetchAdminDashboard` and the panels' own calls), how long each takes, and whether the API side is the slow part (`../tahti-org`).
- [ ] Cache the dashboard data on the client (stale-while-revalidate through the existing GET cache from `navigation-performance.md`), so a return visit renders the last result immediately.
- [ ] If the API call itself is slow, cache or precompute it server-side (separate tahti-org slice).
- [ ] Sweep other pages that load slowly on every visit (admin hubs, Studio home, stats, governance) and list them here with timings before fixing.
