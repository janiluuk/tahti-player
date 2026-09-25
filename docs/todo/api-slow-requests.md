# api-slow-requests.md

**Status:** partial

## What

A lot of requests into `tahti-stack-api` (production, vimage) take 0.5s or more. Figure out what causes the slowness and whether parts of it can be cached.

## 2026-09-26 - root cause (Loki + Prometheus evidence)

**The health/status theory below was wrong.** Real data (Loki `192.168.2.105:3100`, Prometheus `192.168.2.105:9090`, 7 days to 2026-09-26):

- 146,755 logged API requests, ~1,500 of them >=500ms. Medians are fine (heartbeat p50 2ms, `/channels` 30ms, `/news` 11ms). It's a tail, with maxima of 47-69s.
- Top slow routes: `POST /internal/discord-bot/heartbeat` (628), `GET /v1/channels` (308), `/v1/addons/homepage` (150), `/v1/news` (148), `/v1/stats` (45). `/health` and `/api/v1/status` aren't in the `http_request` log at all (`QUIET_PATHS`), so they can't be the source of it.
- Slow requests cluster into episodes, not steady load: 09-22 21:15-22:10 and 09-23 ~03:00-12:30 hold most of them. Since 09-23 12:30 there have been **5** slow requests.
- During an episode, the API event loop is **not** blocked ("incoming request" lines keep logging on time), but completions stall and then release in bursts: dozens of requests finish in the same millisecond after 5-55s. The heartbeat handler is a single Redis `HSET` (`apps/api/src/lib/discord-bot-heartbeat.ts:22-33`) and it stalled too. Over the same window the worker logged BullMQ "could not renew lock / Missing lock" (also Redis). **So the shared stalled dependency is Redis.**
- Why Redis stalled: host `vimage` device `sdd` (mounted at `/opt`; SSH later showed it's a Kingston A400, a DRAM-less SATA SSD that collapses under sustained writes, hence ~95% busy at only ~13 MB/s) went from ~140 to ~1,240 writes/s. Utilisation was 0.95, iowait up to 78%, load1 60 (baseline ~3). Redis runs `--appendonly yes` (`infra/docker-compose.stack.yml:176-189`), so its AOF writes/fsyncs block on the saturated disk.
- The extra writes came from **MinIO**: `tahti-stack-minio-1` writes ran at ~3.2 MB/s / ~1,000 IOPS above the other containers, then dropped to ~7 KB/s at 09-23 12:30, the same moment `sdd` writes fell from ~600/s to ~12/s and the slow requests stopped. `sdd` utilisation has been ~0.03 since (it was ~0.2-0.45 for the week before).
- **Unknown:** which MinIO client did the writing. Not `hls-minio-sync`: it runs every 4s but reported `uploaded: 0` throughout. No git/infra change in `../tahti-org` lines up with 09-22 21:15 or 09-23 12:30, so it was probably a one-off job or script (backfill/seed/import). MinIO logs aren't shipped to Loki.

**Why a disk stall turns into a 60s request:** `apps/api/src/lib/redis.ts` relied on the node-redis 5s default command timeout (see the correction under Plan). `json-cache.ts` only falls back to `compute()` when Redis *errors*, not when it's slow. So every cached route (`/channels`, `/news`, `/addons/homepage`, `/stats`) waits on Redis for as long as the disk stays stuck.

## Earlier notes (2026-09-25, still accurate but lower priority)

- `apps/api/src/plugins/request-log.ts:15,30-50` logs `responseTimeMs` per request; `apps/api/src/lib/http-metrics.ts` feeds Prometheus. There's no slow-request alert.
- No Prisma slow-query logging (`packages/db/src/index.ts:11` logs only `['error']` in prod).
- `/api/v1/status` and `/health` (`apps/api/src/lib/health-checks.ts:112-128`) re-probe every dependency on each call without caching, and Icecast `/status-json.xsl` is probed a second time without caching. This is real but it isn't what shows up as slow requests. It's cheap to fix, so do it while in there.

## Plan

All fixes are in `../tahti-org`. The user gave the go-ahead 2026-09-26.

**Correction to the diagnosis above:** node-redis 6 already has a **5s** default command timeout (the heartbeat's max in Loki was exactly 5000ms). The 10-60s requests come from requests making several Redis calls in a row. The rate-limit `preHandler` does `INCR` + `EXPIRE` + `TTL`, then `json-cache` does `GET`, and the response also waited on `SET`. Each call could wait up to 5s, and waiters queued behind in-flight computes.

- [x] Pull real slow-request evidence from Loki.
- [x] Worktree `../tahti-org-redis-timeout`, branch `fix/api-redis-timeout` from `origin/main` `35a00084` (committed and pushed 2026-09-26):
  - `apps/api/src/lib/redis.ts`: shared client gets `commandOptions.timeout` (`REDIS_COMMAND_TIMEOUT_MS`, default 500). New `getOptionalRedisClient()` returns null for `REDIS_SLOW_BYPASS_MS` (default 5000) after `noteRedisFailure()` sees a `TimeoutError`, so only one request pays the timeout during a stall.
  - `json-cache.ts` reads through the optional client, and the cache write is no longer awaited before responding.
  - `plugins/rate-limit.ts` uses the optional client and reports timeouts (it already fails open).
  - `ops/monitoring/vimage6/prometheus-tahti-alerts.yml`: `TahtiApiMeanLatencyHigh` (mean >100ms for 10m; healthy peak is 46ms) and `TahtiVimageDiskSaturated` (device busy >80% for 15m). Both expressions return results against Prometheus at 2026-09-22 21:45. **Prometheus has no Alertmanager attached**, so these only show in the Prometheus UI until one is wired up.
  - Tests: new `redis.test.ts` plus 2 new `json-cache` tests; `tsc` clean. Full API suite: 195 files fail identically on unmodified `origin/main` (they need local Postgres); no new failures.
- [x] Host check (SSH, 2026-09-26): Docker's data root `/opt/docker` (Redis, MinIO and Postgres volumes) is on `sdd` (Kingston A400). Redis held **1.15M keys / 1.77G of 2G**, almost all finished BullMQ job records (`bull:media:completed` 1,095,150 back to 2026-08-12, growing every 4s from `hls-minio-sync`). It also ran RDB snapshots every few minutes on top of a 1G AOF. That write load on a weak SSD is a second, ongoing stall source.
- [x] Second commit on `fix/api-redis-timeout` (`7282ea42`, pushed): Worker-level BullMQ job retention (stored cron ticks lose `removeOnComplete`, and BullMQ then keeps everything); batched `trim-finished-jobs` one-off; Redis `--save ''` + `--no-appendfsync-on-rewrite yes`; 5s cache on dependency probes; Prisma `slow_query` warnings (>=200ms, no params). Worker tests and typecheck match baseline.
- [ ] **Deploy order matters:** trim the backlog in batches *before* the new worker deploys, or BullMQ's count trim deletes ~1.1M records in one Lua call and blocks Redis. Steps are in `../tahti-org/docs/todo/api-redis-stall-resilience.md`. Needs user go-ahead (production data + deploy).
- [ ] Longer term: move Docker's data root off the A400 (vimage's NVMe `/share/models` has 1.2T free), and/or the planned MinIO move to tahti.local.
- [ ] If it recurs: `mc admin trace` on vimage during the episode to name the MinIO writer; consider shipping MinIO logs to Loki.

## Related

- Separately noticed in worker logs on 09-22: constant `lane-mismatch` job failures. `../tahti-org` commit `e6d370b2` (09-22 17:07) targets this; I haven't checked whether it's deployed.
- `stream.tahti.live` HLS egress measured slow (3-9s) from the public internet.
