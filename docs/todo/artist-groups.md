# Artist groups (collectives)

**Status:** partial

## Goal

Artists run or join groups that share one collective playlist. Members submit sounds (optionally approved first), the public can browse groups, and anyone can start a Jam on the group playlist.

## Shipped (tahti-web)

- Tags/Genre/Sets/Groups material cards; Basics + Details + Playlists tabs.
- API client + mocks; unit tests in `groups.test.ts`.
- Studio `/studio/groups`, `/studio/groups/$slug` (settings, join requests, submissions with sound titles).
- Public `/groups`, `/groups/$slug` (join/leave, collective playlist via founder `createdBy`, Listen together → Jam).
- Discover → **Groups** tab (`?tab=groups`) embeds `GroupsDirectory`; `/groups` keeps the same grid under ViewShell.
- Mock seeds five ready public groups (Trance Mixes, Finland DJs, Ambient Lab, Vinyl Crate Diggers, Live Electronics).
- README + VIEW-GUIDE document Groups for listeners and artists.
- Stories: `GroupsDirectory`, `GroupsDirectoryView`, Studio/public detail; DiscoverView GroupsTab play.

## Shipped (tahti-org, local — not committed/pushed)

- Set-membership + ArtistGroup schema/migration/routes/DTOs.
- `collectionSlug` on group-membership; submissions include `sound.title`.
- OpenAPI regenerated (`openapi.json` / `openapi.public.json` include `/api/me/groups*` and `/api/v1/groups*`).

## Open (ops / product)

- Commit, push, migrate, and deploy `tahti-org` when asked.
- Optional: Library sidebar entry; e2e journey for join → submit → approve → Jam.
