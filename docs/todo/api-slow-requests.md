# api-slow-requests.md

Status: open

## What

A lot of requests into `tahti-stack-api` (production, vimage) take 0.5s or more. Figure out what causes the slowness and whether parts of it can be cached.

## Investigation notes (to fill in)

- [ ] Pull slow-request evidence (Fastify timing logs / Dozzle / loki).
- [ ] Identify the slow bottleneck: DB query, MinIO/S3 round-trip, Icecast/Liquidsoap probe, Centrifugo, thumbnails, etc.
- [ ] Decide caching strategy per endpoint (Redis, HTTP cache headers, minio object caching, DB index).

## Related

- Icecast health probes hit `/status-json.xsl` server-side (config `icecastIngestHealthPath`) — candidate for slow health-scan endpoints.
- `stream.tahti.live` HLS egress measured slow (3–9s) from public internet.