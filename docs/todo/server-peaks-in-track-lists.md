# Server waveform peaks in every track list

**Status:** partial

Goal: every track list row gets `peaks` (0..255 buckets, 600 per sound) from the API, so `AmbientTrackRow` never downloads and decodes audio in the browser to draw its waveform.

Paired API PR: tahti-org `feat/peaks-in-track-lists` (search, Tahti Selects gallery and New to you items now carry `peaks`; the backfill sweep no longer stalls on embed-only sounds).

## Map: list -> mapper -> endpoint

| List                                | Mapper                                              | Endpoint                                                            | Peaks                  |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------- | ---------------------- |
| Channel tracks                      | `soundItemToPlayable` (`api/mock.ts`)               | `GET /api/channels/:slug/items`                                     | yes                    |
| Artist profile tracks               | `profileTrackToPlayable` (`lib/artistProfile.ts`)   | `GET /api/v1/u/:username/profile`                                   | yes                    |
| Feed fallback, directory cards      | `fetchArtistPlayables` (`api/client.ts`)            | same                                                                | yes (this PR)          |
| Collections, channel playlist block | `collectionSoundToPlayable`, `ChannelPlaylistBlock` | `GET /api/v1/collections/:slug`                                     | yes                    |
| Smart link / release page           | `smartLinkPlayables`                                | `GET /api/v1/r/:slug`                                               | yes                    |
| Likes (own, artist)                 | `likedTrackToPlayable` (`api/likes.ts`)             | `GET /api/me/likes`, `GET /api/v1/u/:username/likes`                | yes                    |
| Listen new tracks, Discover latest  | `galleryItemToTrack` + `discoverTrackPlayable`      | `GET /api/discover/latest-tracks`                                   | yes                    |
| Discover Tahti Selects, New to you  | same                                                | `GET /api/v1/tahti-selects/gallery`, `GET /api/discover/new-to-you` | yes (API PR)           |
| Discover top / loved widgets        | `useDiscoverTrackPlayback` fallback                 | `GET /api/tracks/:id` on play                                       | yes (this PR)          |
| Search, tag search                  | `searchTrackPlayable`                               | `GET /api/v1/search`                                                | yes (this PR + API PR) |
| Studio sounds                       | `SoundsAmbientList`                                 | `GET /api/me/sound`                                                 | yes                    |

## Left

- [x] Studio collection editor playables (`GET /api/me/collections/:slug`): peaks + banner on collection items (API `collectionItemInclude` + studio playables).
- [ ] Radio "Just played" (`GET /api/v1/radio/recently-played`) and Feed track cards (`GET /api/me/feed`): no peaks; not waveform rows.
- [ ] Production: count READY sounds with audio and `peaks IS NULL` after the next 03:00 UTC sweep (24 per run).
