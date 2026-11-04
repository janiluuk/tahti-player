# Artist groups (collectives)

**Status:** partial

## Goal

Artists run or join groups that share one collective playlist. Members submit sounds (optionally approved first), the public can browse groups, and anyone can start a Jam on the group playlist.

## Shipped (tahti-web)

- Tags/Genre/Sets/Groups material cards; Basics + Details + Playlists tabs.
- API client + mocks; unit tests in `groups.test.ts`.
- Studio `/studio/groups`, `/studio/groups/$slug` (settings, join requests, submissions with sound titles).
- Public `/groups`, `/groups/$slug` (join/leave, collective playlist via founder `createdBy`, Listen together → Jam).
- Discover header **Groups** button → `/groups`.
- Stories + VIEW-CATALOG rows. tahti-web `0.0.312`.

## Shipped (tahti-org, local — not committed/pushed)

- Set-membership + ArtistGroup schema/migration/routes/DTOs.
- `collectionSlug` on group-membership; submissions include `sound.title`.
- OpenAPI regenerated (`openapi.json` / `openapi.public.json` include `/api/me/groups*` and `/api/v1/groups*`).

## Open (ops / product)

- Commit, push, migrate, and deploy `tahti-org` when asked.
- Optional: Library sidebar entry; e2e journey for join → submit → approve → Jam.
