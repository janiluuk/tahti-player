# Listening parties on Discover

**Status:** partial

Requested 2026-11-10: move listening parties to the Discover page, as a widget and a tab, where you can make your own party or join someone else's.

## Shipped (2026-11-11)

- tahti-org #1099: `GET /api/v1/listening-parties?limit=` (1–50, default 20) returns `{ items }`, live first then upcoming soonest first, without cancelled parties or suspended hosts.
- Discover → Parties tab (`/discover?tab=parties`, `DiscoverPartiesPanel`, `ListeningPartyList`) with Start a party for channel owners, and a three-row widget on the Discover tab linking to it (plan items 1–2, joining only).

## Left

- Reminders from a party row.
- Plan items 3 (non-artist hosting) and 4 (Studio filter) are product calls.

## Before

- Artists host parties for their own releases: Studio → Broadcast → Schedule → Listening parties (`/studio/schedule?show=parties`, merged there by the Go live nav work), create at `/studio/listening-parties/new` or from a release's party button.
- Listeners join from the party page `/party/<id>`, reached from the artist's link or the banner on their channel page. There is no list of parties across artists.
- Discover tabs: Discover, Feed, Artists, Groups, Venues (`views/DiscoverView.tsx` `DISCOVER_TABS`).
- Contract and v1 scope: [listening-party.md](listening-party.md).

## Plan (to confirm)

1. **Discover → Parties tab** (`/discover?tab=parties`): live now, then upcoming, across all artists; each row joins (`/party/<id>`) or sets a reminder.
2. **Discover widget**: a "Parties" row on the Discover tab with live and soon-starting parties, linking to the tab.
3. **Make your own**: a "Start a party" action on the tab. Artists pick one of their releases (today's flow); decide whether listeners can host parties for a release they own or for a playlist (product call - today only the release's artist can host).
4. Decide whether Studio keeps its Schedule → Listening parties filter for managing your own parties or links to the Discover tab.

## API needed (tahti-org)

- Public list of parties across channels (`GET /api/v1/listening-parties?state=LIVE,SCHEDULED`), paged, soonest first, hiding suspended hosts. Today only `GET /api/channels/:slug/listening-parties` exists.
- If non-artists can host: who may create, on which content, and moderation.
