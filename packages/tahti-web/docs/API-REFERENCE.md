---
description: Local API contract guide for the Tahti Nuclear client.
---

# Tahti API reference

This client is maintained in the
[Tahti Player repository](https://github.com/janiluuk/tahti-player) and uses
the API served by the sibling `../tahti-org` repository. The
authoritative interactive documentation is available at
[`https://api.tahti.live/api`](https://api.tahti.live/api), with the machine
readable contract at [`../tahti-org/openapi.json`](../../../tahti-org/openapi.json)
when both repositories are checked out together.

This page records the contract areas used by the Nuclear client and the
permission boundaries that must be checked before adding a new view. It is
not a replacement for the generated OpenAPI document. For sibling-repo naming,
route aliases, and governance context, see [CROSS-REPO-SYNC.md](./CROSS-REPO-SYNC.md).

<!-- API_PATHS_SHA256: d0576b2e811464e2876647a5e9cef177a661b8b13f6835e9be8fe913bbdfc0a3 -->

## Authentication

The API accepts the `tahti_session` session cookie for browser requests. A
personal bearer token is also supported for scripts and integrations. Tokens
are created and revoked through `/api/me/api-tokens`; read-only tokens are
restricted to safe methods.

Login is `POST /api/auth/login`, TOTP login is
`POST /api/auth/login/totp`, the current session is checked with
`GET /api/auth/me`, and logout is `POST /api/auth/logout`.

## Contract areas used by this client

| Area | Representative API operations | Client surfaces |
| --- | --- | --- |
| Public discovery | `GET /api/v1/search`, `GET /api/v1/channels/directory`, `GET /api/channels/{slug}`, `GET /api/channels/{slug}/items` | Listen, Discover, public artist/channel pages |
| Playback and engagement | `POST/DELETE/GET /api/v1/c/{slug}/archive/{itemId}/like`, `POST/DELETE/GET .../repost`, `GET .../download`, `GET .../download-gates` | Player, sounds, releases, favourites. Public download tries `?format=source` then the default gate. |
| Artist channel | `GET/PATCH /api/me/channel/slug`, `GET/PATCH /api/me/stream-settings`, `GET/PATCH /api/me/channel/publish-defaults` | Studio → Manage → Channel |
| Broadcast controls | `POST /api/channels/{slug}/skip`, `/pause`, `/resume`, `/previous`; `GET /api/channels/{slug}/rtmp-status` | Go Live, Radio, stream manager |
| Rotation and programming | `GET/PATCH /api/channels/{slug}/fallback-collections`, `GET /api/channels/{slug}/programme`, `PATCH /api/channels/{slug}/fallback-collection` | 24/7 rotation and radio management |
| Multicast | `GET/POST /api/me/rtmp-targets`, `PATCH/DELETE /api/me/rtmp-targets/{id}`, `GET /api/me/rtmp-targets/{id}/stream-key` | Studio → Manage → Multicast and Go Live |
| Archive and editing | `/api/me/sound`, `/api/me/sound/{id}`, `/api/me/sound/{id}/editor/draft`, `/api/me/sound/{id}/fingerprint` | Sounds, upload, stash, track editor, audio editor |
| Collections and releases | `/api/me/collections`, `/api/me/releases`, `/api/me/releases/{id}`, release export and royalty routes | Collections, releases, distribution, smartlinks |
| Shows and schedule | `/api/me/channel/show-series`, `/api/me/radio-slot-bookings`, `/api/me/channel/.../live-show-episodes` | Shows, calendar, Studio Broadcast (`/studio/schedule`), recordings |
| Profile and audience | `/api/me/profile`, `/api/me/notification-preferences`, `/api/me/fan-tiers`, `/api/me/fan-sub-payouts`, `/api/me/fan-sub-payouts/summary`, `/api/me/fan-subs/connect`, `/api/me/revelator/royalties`, `/api/me/fan-subscriptions`, `/api/me/grants` | Settings, Studio → Audience, subscriptions |
| Chat and mentions | `/api/channels/{slug}/presence`, `/api/me/chat/settings`, `/api/me/chat/announcements`, `/api/me/channel/moderators`, `/api/me/mentions` | Chat rail, moderation, tagged-in profile sections |
| Governance | `GET/POST /api/v1/governance/motions`, `PATCH /api/v1/governance/motions/{id}`, `POST .../vote`, comments and reports | Artist and public Governance |
| Admin operations | `/api/admin/users`, `/api/admin/streams`, `/api/admin/files`, `/api/admin/logs`, `/api/admin/audit`, `/api/admin/storage` | Admin overview, users, streams, logs, storage |
| Admin moderation | `/api/admin/support/tickets`, `/api/admin/content-reports`, `/api/admin/radio-submissions`, `/api/admin/missed-live-shows`, `/api/admin/feature-requests` | Admin → Moderation queues |
| Admin governance and finance | `/api/admin/ledger`, `/api/admin/resolutions`, `/api/admin/grants`, `/api/admin/fansubs`, `/api/admin/reports` | Admin governance, financial, grants, AGM |
| Widgets and announcements | `/api/me/addons/installs`, `/api/me/channel/addons/installs`, `/api/admin/announcements` | Add-ons, channel widgets, announcements |
| Sound private shares | `POST/GET /api/me/sound/{id}/share(s)`, `DELETE /api/me/sound/shares/{shareId}`; public `GET /api/tracks/{id}?key=` | Track Edit → Sharing |
| Jam control | `PATCH /api/v1/jam/{id}/participants/{userId}` | Jam host “allow control” |
| Import / export catalogs | `GET /api/me/import-plugins`, `GET /api/me/export-plugins` | Settings → Add-ons |

## Permission boundaries

- Public read routes must work without a session and must not leak private
  archive, stash, audience, or moderation data.
- `/api/me/*` routes require the signed-in user and must enforce ownership on
  archive, channel, collection, show, audience, and RTMP resources.
- Moderator routes are limited to assigned channel moderation scope.
- `/api/admin/*` routes are board/admin-only. A client-side hidden menu is not
  authorization; the API must reject lower-role requests.
- Download gates, stash access, fan tiers, and private audience content must
  be checked server-side for every request, including direct URLs.

## Sound share links (shipped in tahti-org #568)

PRIVATE/non-public sounds → keyed access. Client:
`createSoundShare` / `revokeSoundShare` / `fetchSoundShares` and
`SoundShareLinksSection` on Track Edit → Sharing.

- `POST /api/me/sound/:id/share` — body `{ granteeUsername?: string,
  permission: 'READ' | 'DOWNLOAD', expiresInDays?: number }` → `{ id,
  token, permission, expiresAt }`.
- `DELETE /api/me/sound/shares/:shareId`.
- `GET /api/me/sound/:id/shares` → `{ shares: SoundShare[] }`.
- Public read: `GET /api/tracks/:id?key=`, comments with the same `?key=`
  (share grants access when `isPublic` is false).

Bandcamp album **import** remains unavailable (`import: false` on
`GET /api/me/import-plugins`); albums list may return an empty stub message.

## Adding or changing an API call

1. Find the route, Zod/shared DTO, permission check, and mock fixture in
   `../tahti-org` before changing the client.
2. Put the request in a focused `src/api/*.ts` wrapper using the existing
   response and error conventions; views should not call `fetch` directly.
3. Match method, path, query/body names, enum values, nullable fields, and
   error states exactly.
4. Add a client test for the response shape and a user-facing test for
   loading, empty, error, and success states.
5. Update `UI-REDESIGN-WORKLOG.md` and run the freshness check below.

## Freshness check

Run this from the Nuclear repository root:

```bash
pnpm --filter @tahti-player/tahti-web check:api-docs
```

The check hashes the sibling OpenAPI `paths` object and compares it with the
marker in this page. If the check fails, review new and removed paths in
`../tahti-org/openapi.json`, update this reference, and re-audit affected client
wrappers before committing.
