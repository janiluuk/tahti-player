# Admin overview: still slow, stats below the fold, Grafana cannot connect

**Status:** open

User report 2026-11-11.

## Still slow

The admin panel is still slow to load. `/admin` (`AdminDashboardView`) already
renders the last result at once and refreshes in the background
(`admin-dashboard-snappy.md`, `useSnapshotFetch`). That did not make the
first open, or a refresh with no snapshot, feel fast. Measure what
`fetchAdminDashboard` and the panels wait on, and cache or precompute the
slow calls in tahti-org if the API is the wait.

## Stats belong at the top

On the admin overview, the stats sit below the rest of the page
(`CommunityStatsPanel` is rendered after system health, queues and the
other panels in `AdminDashboardView`). Move those stats to the top of the
overview so they are the first thing on the page.

## Grafana cannot connect

Opening Grafana from tahti.live says it cannot connect. Admin links and
embeds use `https://grafana.tahti.live` unless `VITE_GRAFANA_URL` is set
(`lib/grafanaMonitoring.ts`): the dashboard vitals link, Admin → Monitoring
embeds, and Admin → Logs. Fix the connection from tahti.live (host, proxy,
or auth) so those links and embeds open.
