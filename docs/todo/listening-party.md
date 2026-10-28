# Listening Party

**Status:** partial

Artists celebrate a release with fans at a scheduled Listening Party: the album plays once, start to finish, with the tracklist, liner notes, live chat and the artist's purchase options on one page.

Digital-only v1 is built on both sides against one contract:

- API: tahti-org#1029 (`feat/listening-party`) - model, routes, shared timeline, chat "Now playing" worker.
- Web: the tahti-player `feat/listening-party-web` PR - built against the contract with an offline mock store, so it works in dev (`VITE_FORCE_MOCK=1`) and Storybook before the API ships.

## Contract (v1)

- Own `ListeningParty` model (`releaseId`, `channelId`, `hostUserId`, `startAt`, `hostNote` Markdown ≤ 2000, `canceledAt`). State is derived, never stored: canceled → CANCELED; before `startAt` → SCHEDULED; before `startAt` + sum of track durations → LIVE; else ENDED.
- No server playout. The server owns the timeline (`computeListeningPartyTimeline` in `@tahti/shared`, mirrored in `packages/tahti-web/src/lib/listeningPartyTimeline.ts`): tracks in `position` order, no gaps, half-open intervals (at a boundary the next track plays at offset 0; at `endAt` the party is ENDED). Each client plays the tracks itself and seeks to the offset, ticking on the server clock (`serverNow`).
- Endpoints: `GET /api/v1/listening-parties/:id` (DTO with release, liner notes = `release.commentary`, credits, tracks, `nowPlaying`, `serverNow`, `purchaseTiers`); `GET /api/v1/listening-parties/:id/tracks/:trackId/stream` (302 to a short-lived signed URL; 403 unless LIVE and track ≤ current, for pre-release parties); `GET /api/channels/:slug/listening-parties` (SCHEDULED + LIVE, soonest first, max 10); artist `POST/GET /api/me/listening-parties`, `PATCH /api/me/listening-parties/:id` (409 once started), `POST /api/me/listening-parties/:id/cancel` (409 once ended, idempotent when already canceled).
- API deviations the web side follows: `release.smartLinkSlug` is null until PUBLISHED; `purchaseTiers` is empty while the store is off or Stripe is not connected (currency always EUR); email-like credit names are dropped server-side; public routes 404 for a suspended/deleted host.
- Commerce reuses the host's `PurchaseTier`s and the existing `/api/v1/u/:username/purchase-tiers/:tierId/checkout`. Chat reuses the host channel's chat.

## Web slices

- [x] 16. API types + fetchers (`src/api/listening-parties.ts`)
- [x] 17. Mock store with SCHEDULED / LIVE / ENDED / CANCELED fixtures (`src/api/listening-parties-mock.ts`; `mockData` keys `listeningParty`, `channelListeningParties`, `myListeningParties`)
- [x] 18. Client timeline mirror + server-clock tick hook (`useListeningPartyTimeline`)
- [x] 19. `/party/:id` route + view shell (`ListeningPartyView`)
- [x] 20. Countdown hero
- [x] 21. Tracklist with current-track highlight
- [x] 22. Liner notes + credits
- [x] 23. Shared playback: Join, late join at offset, auto-advance, drift re-seek > 2 s (`useListeningPartyPlayback`, `lib/listeningPartyPlayback.ts`)
- [x] 24. Host channel chat (`ChannelChatPanel`)
- [x] 25. Buy panel (`ArtistStoreSection` + existing checkout)
- [x] 26. Studio: schedule from a release (`/studio/listening-parties/new?releaseId=`)
- [x] 27. Studio: my parties with reschedule / cancel (`/studio/listening-parties`, Broadcast sub-nav)
- [x] 28. Channel page banner (`ChannelListeningPartyBanner`)
- [x] 29. Storybook stories, STORYBOOK-SURFACES, VIEW-CATALOG
- [x] 30. Unit tests, user docs (`packages/docs/user-manual/listening/listening-parties.md`)

No Playwright e2e spec: the e2e suite runs against beta's real API, not mocks; the Storybook plays cover the page on mocks.

## What remains

- [ ] Merge and deploy tahti-org#1029, then verify against the real API (party page in every state, a real late join through the signed stream redirect, Studio create/reschedule/cancel errors) and drop the five `api-routes-allowlist.json` entries once the OpenAPI release has the routes.
- [ ] Party listening is not reported to listen heartbeats/stats (`ListenHeartbeat` ignores `party:` player ids); decide whether it should count.
- [ ] Liquidsoap playout into the channel HLS output (same path as Tahti Selects) instead of client-side playback.
- [ ] Formats, pre-orders and physical goods (`ReleaseOffer` or `PurchaseTier.releaseId` + format; shipping/fulfilment is a product decision).
- [ ] Optional: party-only chat slow mode.
