# First ~100 users — infra + app readiness

**Status:** partial

**Verified on vimage 2026-11-02** (ssh, read-only):
- Rate limits: the running `tahti-stack-api-1` has `RATE_LIMIT_REDIS_FAIL_OPEN=false`, auth 120 / api 2000 per minute (tahti-org #1032). P0 #1 and final-season #19 are done.
- Disk: root 68 % (36 GB free), `/share/disk2` 7 %.
- Backups: `/etc/cron.d/tahti-backup` runs `scripts/backup.sh all` nightly; Postgres dumps land in `/share/disk2/tahti-backups/pg` (latest 2026-11-02 03:00, 30-day retention). Broken and fixed in tahti-org#1042: the weekly restore test failed every week and leaked a postgres container each run (8 still running, operator to remove), and the vimage6 off-host push failed every night (rrsync path). The fixed restore test passed on today's dump (137 tables, 24 users).

**Left (ops):** remove the leaked `tahti-restore-test-*` containers; after #1042 deploys, run `sudo /srv/tahti/scripts/backup.sh vimage6` once and check `status`; the local MinIO mirror folder is empty although the log says 3 buckets synced; no DR alias (`tahti-dr`) is configured, so there is no offsite MinIO copy.

**Note (2026-10-28):** production runs docker compose on vimage
(tahti-org `deploy-production.yml` → `scripts/deploy_prod.sh`,
`infra/docker-compose.stack.yml`); the Swarm `infra/docker-stack.yml` path is
dormant. #872 set `RATE_LIMIT_REDIS_FAIL_OPEN=false` only in
`docker-stack.yml`; `docker-compose.stack.yml` does not set it, so production
is fail-open unless the host `.env` sets it (verify). The compose PgBouncer pool is 25, not 30. Swarm-specific steps
below need re-checking against compose (verify).

Small-production hardening for ~100 concurrent/registered users on the
existing compose / Caddy / Postgres / Redis / MinIO / Centrifugo stack. Not
hyperscale. Complements [`final-season-hardening.md`](final-season-hardening.md)
(security/cutover); this file is capacity and ops realism.

Sources: `../tahti-org/ops/ARCHITECTURE.md`, `DEPLOY.md`, `RUNBOOK.md`,
`BACKUP.md`, `infra/docker-stack.yml`, `docs/technical/rate-limit-policy.md`,
`infra/centrifugo.json`.

## Verdict (working)

**Ready with caveats** once Batch A/B security PRs land and the P0 items
below are done or accepted. The stack already has PgBouncer, API replica=3,
Redis AOF + 2 GB LRU, Centrifugo×2, healthchecks, and daily backup cron —
enough for 100 users if artist libraries and polling stay bounded.

## P0 — do before inviting ~100

| # | Item | Repo / where | Size | Notes |
| --- | --- | --- | --- | --- |
| 1 | **Rate limit fail-closed in Swarm** | tahti-org `infra/docker-stack.yml` + policy doc | S | Set `RATE_LIMIT_REDIS_FAIL_OPEN=false` on `api`. Code default remains fail-open for local/dev. |
| 2 | **Cap channel fallback sound pool** | tahti-org `routes/internal/channel-fallback.ts` | S | Unbounded `sound.findMany` for READY playback keys can OOM/lock on huge archives. Cap ~500. |
| 3 | **Soften ConnectedStatusBar poll** | tahti-web `ConnectedStatusBar.tsx` | S | Was 5 s × (sounds list + conversations + storage) per signed-in artist with bar visible → ~12 req/min/user. Target ≥15 s. |
| 4 | **Confirm backup cron on manager** | ops | L | `sudo ./scripts/install-crons.sh`; from tahti-player `pnpm tahti-ops backup status`; weekly `restore-test` log. Already documented — verify live, do not assume. |
| 5 | **Land remaining Batch A/B** | both | — | Collections `expand` take, CSP, feed N+1, virtualize Studio Music, suspend sessions, CDN CORS, log scrub, SNS SSRF. |

## P1 — same week / first soak

| # | Item | Repo / where | Size | Notes |
| --- | --- | --- | --- | --- |
| 6 | **Postgres `max_connections` vs PgBouncer** | ops | L | Swarm: PgBouncer `DEFAULT_POOL_SIZE=30`, `MAX_CLIENT_CONN=500`. Postgres image has no explicit `max_connections` (default 100). Keep `max_connections >= pool + admin headroom` (e.g. 100–120). Do **not** point Prisma migrate at PgBouncer. |
| 7 | **Redis single-node OK** | docs | S | Documented: one Redis + AOF is fine for ~100 sessions/rate-limits. HA not required until multi-region or Redis is a chronic SPOF. |
| 8 | **MinIO disk / DR alias** | ops | L | Watch volume usage; provision `tahti-dr` UpCloud alias if still WARNING in `BACKUP.md`. Presign TTLs already sane (PUT ~900 s, GET ~3600 s). |
| 9 | **Centrifugo capacity** | ops | L | 2×1 G replicas; history 100–200 / 1 h. Fine for ~100 chat users. Watch RSS if many channel namespaces open at once. |
| 10 | **List `take` audit beyond collections** | tahti-org | M | `/api/me/sound` already `take: 100`; channel public items `50`. Still unbounded: single-collection management GET, reorder reply items, sitemap users/releases (OK at 100). Cap management collection items if artists hit 1k+ tracks. |
| 11 | **Logging / PII** | tahti-org | S–M | Request-log secret scrub (Batch A). Avoid logging emails/tokens in workers; keep Loki retention modest. |
| 12 | **Container limits** | ops | L | API 1 CPU/1 G ×3, Postgres 2 CPU/4 G, Redis 2.5 G, MinIO 2 G — adequate. Raise API memory only if OOMKilled under upload spikes. |

## L ops checklist (exact paths)

```bash
# On Swarm manager (after stack deploy with new env)
docker service update --env-add RATE_LIMIT_REDIS_FAIL_OPEN=false tahti_api   # if not already in stack file
docker service ps tahti_api tahti_pgbouncer tahti_redis tahti_postgres
curl -fsS https://api.tahti.live/health

# Backups (from tahti-player monorepo; cron on the host may still call backup.sh)
sudo ./scripts/install-crons.sh   # on Swarm manager / tahti-org checkout
pnpm tahti-ops backup status
sudo tail -n 50 /var/log/tahti-backup.log /var/log/tahti-restore-test.log

# Pool sanity (inside pgbouncer / postgres)
# SHOW POOLS;  SHOW STATS;  (via psql to pgbouncer admin)
# SELECT count(*) FROM pg_stat_activity;

# Disk
df -h /share/disk2
mc admin info tahti
```

Files: `infra/docker-stack.yml`, `infra/pgbouncer/README.md`, `ops/BACKUP.md`,
`ops/RUNBOOK.md`, `docs/technical/rate-limit-policy.md`.

## Already OK (don’t reopen)

- PgBouncer transaction pool in front of Postgres (PLAT-003)
- API healthchecks + restart policies; update rollback on API
- CDN / SPA cache headers (`max-age` immutable for hashed assets)
- Listen heartbeat 3 min; notification poll 20 s; now-playing 30–45 s
- Rate-limit plugin tiers (auth 10/min, API 120/min)

## Done (append PR links)

| Item | PR |
| --- | --- |
| Rate-limit fail-closed in Swarm | [tahti-org#872](https://github.com/janiluuk/tahti-org/pull/872) (merged) |
| Channel fallback `take` 500 | [tahti-org#873](https://github.com/janiluuk/tahti-org/pull/873) (merged) |
| Status bar poll 15s | [tahti-player#1079](https://github.com/janiluuk/tahti-player/pull/1079) (merged) |
| Todo docs landed | [tahti-player#1080](https://github.com/janiluuk/tahti-player/pull/1080) |
