# api-slow-requests.md

**Status:** partial

## What

A lot of requests into `tahti-stack-api` (production, vimage) take 0.5s or more. Figure out what causes the slowness and whether parts of it can be cached.

## 2026-09-25 — investigation findings (in `../tahti-org`)

**Timing/logging infra already exists:**
- `apps/api/src/plugins/request-log.ts:15,30-50` logs `{event: 'http_request', responseTimeMs, ...}` via pino on every response except `QUIET_PATHS` (`/health`, `/api/v1/status`, `/metrics`). Also feeds Prometheus metrics (`apps/api/src/lib/http-metrics.ts`).
- No slow-request threshold/alerting exists — finding >=0.5s requests today means grepping Loki JSON logs for `responseTimeMs`. Loki is live infra (`infra/docker-compose.stack.yml:14-28`, host `192.168.2.105:3100`, Grafana has a `loki-main` datasource) but no doc walks through querying it for this.
- No Prisma slow-query logging: `packages/db/src/index.ts:11` only logs `['error']` in prod, no `$on('query', ...)` timing. Can't currently tell which DB call inside a slow request was expensive.

**Caching is already fairly mature** via `apps/api/src/lib/json-cache.ts` (Redis, short TTL, in-flight coalescing, falls back to `compute()` if Redis is down) — used across top-lists, channels, profile, chat, themes, internet-radio presets, session, etc. `apps/api/src/lib/top-lists.ts:1-70` is a good example (one joined `findMany`, no N+1). No obvious N+1 loops found in routes checked (not an exhaustive sweep — see below).

**Strongest candidates, both currently *uncached* fan-outs:**
1. `/api/v1/status` and `/health` (`apps/api/src/lib/health-checks.ts:112-128`) — `runDependencyChecks` re-probes Postgres/Redis/MinIO/Centrifugo/orchestrator/Icecast on *every* call, each with up to a 2.5s timeout, and is excluded from slow-request logging (`QUIET_PATHS`) so it's currently invisible in the standard log. If hit often (uptime monitors, LB health checks), this is a plausible steady source of >=0.5s responses.
2. Icecast `/status-json.xsl` probe (`apps/api/src/lib/ingest-endpoints.ts:110-128`, `PROBE_TIMEOUT_MS = 1500`) — already has a 10s in-proc cache for the ingest-host-ranking use (`ingest-endpoints.ts:4-10,54-82`), but `health-checks.ts` calls it a second time, uncached, inside `runDependencyChecks`.

**Lower priority:** `/me/stream-settings` (`apps/api/src/routes/me/stream-settings.ts:65-77`) does the same external probe per-request, but it's a low-volume authenticated artist endpoint.

## Investigation notes

- [x] Identify the slow bottleneck class: health/status fan-out probes (uncached), not DB or MinIO.
- [ ] Pull real slow-request evidence from Loki (`responseTimeMs >= 500`) to confirm `/api/v1/status`/`/health` volume/frequency before spending effort on the fix.
- [ ] Fix (needs user go-ahead to edit `../tahti-org`): short TTL (few seconds) cache around `runDependencyChecks`' aggregate result, reusing the existing in-proc cache pattern from `ingest-endpoints.ts`.
- [ ] Add Prisma slow-query logging (`$on('query', ...)`, threshold e.g. 200ms, tagged with request context) to get DB-side visibility instead of guessing.
- [ ] Re-check after the above: any remaining >=0.5s requests once probe fan-out is cached.

## Related

- Icecast health probes hit `/status-json.xsl` server-side (config `icecastIngestHealthPath`) — candidate for slow health-scan endpoints (confirmed above).
- `stream.tahti.live` HLS egress measured slow (3–9s) from public internet.