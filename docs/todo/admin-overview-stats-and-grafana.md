# Admin overview: still slow, stats below the fold, Grafana cannot connect

**Status:** open

User report 2026-11-11.

## Still slow

The admin panel is still slow to load. `/admin` (`AdminDashboardView`) already
renders the last result at once and refreshes in the background
(`useSnapshotFetch`, folded 2026-11-22). That did not make the
first open, or a refresh with no snapshot, feel fast. Measure what
`fetchAdminDashboard` and the panels wait on, and cache or precompute the
slow calls in tahti-org if the API is the wait.

Web side done 2026-11-16: `CommunityStatsPanel` keeps its own snapshot
(`admin-community-stats`; a refresh where all three calls fail keeps the
saved numbers) and renders above the dashboard's loading state, so its
three calls run next to the dashboard's ten instead of after them.

API side done 2026-11-22 (tahti-org#1128): `/api/admin/stats/cron-runs` read
every cron run ever written (~450 ms on 300k rows) and now does one indexed
lookup per job (~2 ms); cron-runs, queues and system-health share one result
per process for `ADMIN_STATS_CACHE_SEC` (default 20 s). Left: a retention
sweep for the cron-run table (tahti-org `docs/remaining-work.md`).

## Stats belong at the top

Done in 0.0.380. `CommunityStatsPanel` is the first block on the admin
overview, above system health.

## Grafana cannot connect

Opening Grafana from tahti.live says it cannot connect. Admin links and
embeds use `https://grafana.tahti.live` unless `VITE_GRAFANA_URL` is set
(`lib/grafanaMonitoring.ts`): the dashboard vitals link, Admin → Monitoring
embeds, and Admin → Logs. Fix the connection from tahti.live (host, proxy,
or auth) so those links and embeds open.
