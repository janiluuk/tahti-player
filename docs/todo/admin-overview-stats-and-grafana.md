# Admin overview: still slow, stats below the fold, Grafana cannot connect

**Status:** partial

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

Opening Grafana from tahti.live said it cannot connect. Admin links and
embeds use `https://grafana.tahti.live` unless `VITE_GRAFANA_URL` is set
(`lib/grafanaMonitoring.ts`): the dashboard vitals link, Admin → Monitoring
embeds, and Admin → Logs.

Checked 2026-11-23 from the lab Mac (`curl`):

- `grafana.tahti.live` resolves (91.153.206.148), TLS is fine, `/api/health`
  answers `200` (Grafana 13.0.1), `/d/<uid>` redirects to `/login`, and a
  login POST with an `Origin` header gets a normal 401 (no CSRF/origin
  failure). Grafana sends no `X-Frame-Options` and no `frame-ancestors`, so
  `allow_embedding` is already on; in a dev build with no CSP the sign-in page
  renders inside the admin frame.
- **Root cause (fixed in tahti-player, 0.0.442):** tahti-web's own CSP
  (`deploy/nginx.conf` `$tahti_csp`, the header production sends on
  tahti.live) had no `https://grafana.tahti.live` in `frame-src`, so the
  browser refused the embed and showed a blocked frame. The frame's `load`
  event still fires for a blocked frame, so the old 12 s "did not load"
  notice never showed either. `frame-src` now lists the Grafana host
  (pinned by `deployNginxConf.test.ts`), and `MonitoringEmbedPanel` swaps the
  frame for an "Open Grafana" panel on a CSP violation report or when a
  `no-cors` probe of `/api/health` fails.
- Grafana's sign-in page focuses its username field from script, which
  scrolled the admin page down to the frame; the panel puts the scroll back
  until the viewer acts.

Server side (verify after the tahti-web 0.0.442 deploy that the embed shows
Grafana's sign-in page on tahti.live):

1. Done 2026-11-23: Grafana's `root_url` was unset (boot data said
   `appUrl: "http://localhost:3000/"`, so links Grafana builds itself pointed
   at localhost). vimage6 `/opt/monitoring/grafana/grafana.ini` now starts with
   `[server] domain = grafana.tahti.live` and
   `root_url = https://grafana.tahti.live/` (backup
   `grafana.ini.bak-2026-11-23`), `monitoring-grafana` restarted; the login
   page reports `appUrl: "https://grafana.tahti.live/"`.

2. Embedding needs nothing more for tahti.live: grafana.tahti.live is the
   same site, so the default `SameSite=Lax` session cookie is sent inside the
   frame. Only if the embed must work from another site (a localhost dev
   build signed in to production Grafana) set, with HTTPS only:

   ```ini
   [security]
   allow_embedding = true
   cookie_secure = true
   cookie_samesite = none
   ```

   and keep the openresty proxy from adding `X-Frame-Options`.
3. A custom `VITE_GRAFANA_URL` build must add that origin to `frame-src` in
   `deploy/nginx.conf` too.
