# Listening Party

**Status:** open

Logged 2026-09-19 from a user request. Feature backlog; implementation not yet scoped.

## Feature

Artists can celebrate an album release with their fans at a scheduled Listening Party, sharing the story behind the music as everyone listens together.

## Requirements

- [ ] Fans can pre-order or purchase the album in all available formats directly from the Listening Party.
- [ ] At showtime, the album plays once from start to finish.
- [ ] The party features the full tracklist and liner notes.
- [ ] Live chat lets artists share the story behind the music and celebrate the release with their most loyal fans.

## Scoping before implementation

- [ ] Define scheduling, shared playback timing, and late-join behavior.
- [ ] Confirm album format availability and pre-order/purchase integration.
- [ ] Define artist hosting and live-chat moderation controls.

## What `../tahti-org` already has (surveyed 2026-09-27, read-only)

From `packages/db/prisma/schema.prisma`, `openapi.json` (629 paths) and the route sources. Nothing here was changed.

| Need | Existing contract | Fit |
| --- | --- | --- |
| Album, tracklist | `Release` (`type` ALBUM/EP/…, `releaseDate`, `state` DRAFT/PUBLISHED/ARCHIVED) with ordered `ReleaseTrack`s (`position`, `durationSec`, `streamKey` Opus, `flacKey`). Public via `/api/v1/r/{smartLinkSlug}` (smart link payload). | Good. No "announced but not out yet" state: a party before release day needs the tracks playable while `state` is not PUBLISHED. |
| Liner notes | `Release.description`, `Release.commentary` (Markdown, "artist notes on the release"), `Release.credits` and per-track `ReleaseTrack.credits` (`[{ role, name, artistUsername? }]`), `pLine`/`cLine`/`labelImprint`. | Good: `commentary` is the liner notes. |
| Scheduling | `ScheduledLiveShow` (`startAt`/`endAt`, `title`, `tagline`, `artworkUrl`, `showType` LIVE_SET/talk, `visibility`, `autoPublish`, `canceledAt`, linked `Broadcast`) under a `LiveShowSeries`; `RadioSlotBooking` for Tahti Radio slots; `/api/channels/{slug}/events` are off-platform gigs (place/location/URL). | Partial: a scheduled show has no link to a release and nothing plays a playlist at `startAt`. |
| Everyone hears the same thing | Server-side playout exists: Tahti Selects turns a curated rotation into an HLS/Icecast stream by spawning a Liquidsoap container (`POST /api/admin/tahti-selects/stream/start`, `services/orchestrator`), and Tahti Radio drives Liquidsoap over telnet (`services/tahti-radio`). Artist channels go live through `/api/me/channel/go-live` (their own encoder). | Reusable: playing the release's tracks once, in order, through the channel's HLS output gives shared timing and a natural late join (you join where the stream is). Board-only today. |
| Live chat | Per-channel chat: `ChatMessage` (`fanOnly` sub-channel for subscribers), `/api/chat/{slug}/token` (returns `channelRole` owner/moderator, `supporter`), history, reactions, pinned `announcements` (`/api/me/chat/announcements`), bans (`/api/me/chat/ban`, moderator bans via `/api/me/moderate/{slug}/chat/ban`). | Good as is: the party uses the host channel's chat; the artist is `owner`, and announcements carry "the story behind this track". |
| Buy / pre-order | `PurchaseTier` (artist-level: name, description, `priceCents`, `priceOptional` pay-what-you-want, linked `sounds`) + `Purchase` (Stripe checkout session, `state`), `/api/v1/u/{username}/purchase-tiers/{tierId}/checkout`. Track downloads via `/api/v1/releases/{smartLinkSlug}/tracks/{trackId}/download`. Revelator handles DSP distribution. | Missing: no tie from a tier to a `Release`, no formats (digital/vinyl/CD/cassette), no pre-order (charge now, deliver on `releaseDate`), no shipping. |

## Additions needed in `../tahti-org` (proposal, needs the user's go-ahead)

1. **Party record.** Either a `ListeningParty` model (`releaseId`, `channelId`, `startAt`, `state` SCHEDULED/LIVE/ENDED/CANCELED, `hostNote`, optional `replayUntil`) or `ScheduledLiveShow` + `releaseId` + a `LISTENING_PARTY` show type. The second reuses the schedule UI, reminders and missed-show handling; recommended.
2. **Playout.** A worker job that at `startAt` plays the release's tracks once, in `position` order, into the host channel's HLS output (same Liquidsoap path as Tahti Selects, opened to artists for their own release), then sets the party ENDED. Pre-release tracks play only inside the party stream, not as downloads.
3. **Public party endpoint.** `GET /api/v1/listening-parties/{id}`: release (title, artwork, `commentary`, credits), tracklist with durations, `startAt`, `state`, the server's clock and the current track + offset, so the page can show a countdown, highlight the playing track and join late without drift.
4. **Commerce.** A `ReleaseOffer` (or `PurchaseTier.releaseId` + `format`): format DIGITAL/VINYL/CD/CASSETTE/BUNDLE, price, `preorder` (charged now, digital delivered on `releaseDate`), stock for physical items, shipping. Digital-only first is the smallest useful slice; physical needs addresses and fulfilment and is a product decision.
5. **Chat touches (optional).** System messages when a track starts ("Now playing 3/10 · Title"), and a party-only slow mode.

## Proposed order

Digital-only first: (1) + (2) + (3) with the existing chat and the existing artist purchase tiers linked from the page. Formats, pre-orders and physical goods (4) follow as their own project. The web side (a `/party/{id}` page: countdown, tracklist with the current track, liner notes, chat, buy panel) can start against mock data once (3) is agreed.

