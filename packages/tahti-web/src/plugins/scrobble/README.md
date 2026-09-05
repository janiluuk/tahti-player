# Scrobble — ListenBrainz + Last.fm

Settings → Add-ons → **Scrobbling**. Submit-listens / track.scrobble only —
not charts or dashboards (those stay out of scope / constitutionally blocked).

## Contract

Sibling API owns credentials and outbound scrobble calls:

| Provider | Connect | Scrobble |
| --- | --- | --- |
| ListenBrainz | `POST /api/me/integrations/listenbrainz/install` `{ userToken }` (validate-token) | `submit-listens` after recorded listen-events |
| Last.fm | `GET /api/me/integrations/lastfm/oauth/start?returnTo=` → Last.fm auth → callback stores `sessionKey` | `track.scrobble` after recorded listen-events |
| Disconnect | `DELETE /api/me/integrations/:slug` | — |

Full API note: `../tahti-org/docs/technical/scrobble-plugin-contracts.md` and
`integration-credential-lifecycle.md`.

Last.fm needs server env `LASTFM_API_KEY` + `LASTFM_API_SECRET`.

## Nuclear files

| Path | Role |
| --- | --- |
| `src/api/integrations.ts` | List / install / uninstall + Last.fm OAuth start URL |
| `ListenBrainzAddonCard.tsx` | Token configure dialog |
| `LastFmAddonCard.tsx` | Connect redirect + Disconnect |
| `pluginStoreCategories.ts` | `scrobbling` category |
| `PluginStorePanel.tsx` | Mounts both cards under Scrobbling |

Listen pulse already goes through `postListenEvent` in `AudioEngine` —
no client-side ListenBrainz/Last.fm HTTP for plays. Secrets never return
from list.

## Out of scope

- `listenbrainz-dashboard` / Last.fm charts
- OmniSource / Bandcamp–Deezer discovery dashboards
