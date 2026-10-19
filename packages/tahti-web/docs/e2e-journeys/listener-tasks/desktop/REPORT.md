# Listener tasks — desktop 1440×900

Target: https://beta.tahti.live

| Task                                                    | Result                                                                                                                                             | Time  | UX notes                                                   | Signals                          |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------- | -------------------------------- |
| Sign in as listener                                     | ok                                                                                                                                                 | 4.1s  |                                                            | api×8 console×20 audit×5         |
| Home: what can I listen to?                             | **FAIL** no playable tracks on home                                                                                                                | 17.3s |                                                            | console×18 api×6 slow×13 audit×5 |
| Play a track from home                                  | **FAIL** locator.getAttribute: Timeout 30000ms exceeded.                                                                                           | 30.0s |                                                            | api×1 console×1 audit×5          |
| Pause and resume with the space bar                     | ok                                                                                                                                                 | 1.7s  | space bar paused but did not resume                        | audit×5                          |
| Add another track to the queue and open the queue       | **FAIL** locator.click: Timeout 30000ms exceeded.                                                                                                  | 31.1s |                                                            | api×1 console×1 audit×7          |
| Favourite the playing track, find it in Favorites, undo | ok                                                                                                                                                 | 8.7s  |                                                            | console×19 api×7 slow×14 audit×2 |
| Search for the track I just played                      | ok                                                                                                                                                 | 4.1s  | no suggestions for "a"; Enter in search went to /favorites | audit×2                          |
| Open an artist channel from a track                     | ok                                                                                                                                                 | 3.6s  |                                                            | audit×2                          |
| Follow / subscribe to the artist                        | **FAIL** no Follow or Subscribe button on the channel                                                                                              | 0.0s  |                                                            | audit×2                          |
| Play a radio station                                    | **FAIL** "Play Radio" did not start: ({"paused":false,"t":0,"src":"blob:https://beta.tahti.live/b4f84f4a-810d-4b77-9535-8f02b1e5029b","err":null}) | 7.1s  |                                                            | console×3 audit×2                |
| Listening history shows what I played                   | ok                                                                                                                                                 | 1.3s  |                                                            | api×6 console×18                 |
| Library and collections                                 | ok                                                                                                                                                 | 2.3s  |                                                            | api×1 console×1                  |
| Messages and notifications                              | ok                                                                                                                                                 | 0.9s  |                                                            | api×3 console×3                  |
| Account settings                                        | ok                                                                                                                                                 | 0.9s  | account settings has no editable fields                    |                                  |
| Sign out                                                | **FAIL** locator.click: Timeout 30000ms exceeded.                                                                                                  | 30.0s |                                                            | api×1 console×1                  |

## Signals

### Sign in as listener

- api: `401 GET /tahti-api/api/auth/me`
- console: `Failed to load resource: the server responded with a status of 401 ()`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiohelsinki.fi%2Fohjelmakartta%2F`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fnrj`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fradio-nova`
- console: `Access to fetch at 'https://icecast.live.yle.fi/radio/YleX/icecast.audio' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Request header field icy-metadata is not allowed by Access-Control-Allow-Headers in preflight response.`
- console: `Failed to load resource: net::ERR_FAILED`
- console: `Access to fetch at 'https://aud-stream-radiorock.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested res`
- console: `Access to fetch at 'https://aud-stream-suomipop.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested reso`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/nrj/nrj_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origi`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/radionova/radionova_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control`
- console: `Access to fetch at 'https://stream.radiohelsinki.fi/stream' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.supla.fi%2Fsuomipop`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiorock.fi%2F`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fareena.yle.fi%2Faudio%2Fohjelmat%2Fyle-x`
- audit: `/: unlabeled field <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" aria-hidden="true">`

### Home: what can I listen to?

- console: `Access to fetch at 'https://icecast.live.yle.fi/radio/YleX/icecast.audio' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Request header field icy-metadata is not allowed by Access-Control-Allow-Headers in preflight response.`
- console: `Failed to load resource: net::ERR_FAILED`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiohelsinki.fi%2Fohjelmakartta%2F`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fnrj`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fradio-nova`
- console: `Access to fetch at 'https://aud-stream-radiorock.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested res`
- console: `Access to fetch at 'https://aud-stream-suomipop.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested reso`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/nrj/nrj_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origi`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/radionova/radionova_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control`
- console: `Access to fetch at 'https://stream.radiohelsinki.fi/stream' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fareena.yle.fi%2Faudio%2Fohjelmat%2Fyle-x`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiorock.fi%2F`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.supla.fi%2Fsuomipop`
- slow: `2580ms GET /tahti-api/api/me/collections?expand=items`
- slow: `2644ms GET /tahti-api/api/me/collections?expand=items`
- slow: `2723ms GET /tahti-api/api/me/collections?expand=items`
- slow: `2812ms GET /tahti-api/api/me/collections?expand=items`
- slow: `2887ms GET /tahti-api/api/me/collections?expand=items`
- slow: `2966ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3040ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3113ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3187ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3269ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3343ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3417ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3491ms GET /tahti-api/api/me/collections?expand=items`
- audit: `/: unlabeled field <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" aria-hidden="true">`

### Play a track from home

- api: `404 GET /tahti-api/api/me/sound/processing`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- audit: `/: unlabeled field <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" aria-hidden="true" style="">`

### Pause and resume with the space bar

- audit: `/: unlabeled field <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" aria-hidden="true" style="">`

### Add another track to the queue and open the queue

- api: `404 GET /tahti-api/api/me/sound/processing`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- audit: `/: unnamed control <div data-queue-item-id="sound:cmsysdsoo00ezsg6bt6bhmn78" class="" role="button" tabindex="0" aria-disabled="true" aria-`
- audit: `/: unnamed control <div class="border-border rounded-md border-(length:--border-width) bg-background-secondary text-foreground shadow-none `
- audit: `/: unlabeled field <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" aria-hidden="true" style="">`

### Favourite the playing track, find it in Favorites, undo

- console: `Access to fetch at 'https://icecast.live.yle.fi/radio/YleX/icecast.audio' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Request header field icy-metadata is not allowed by Access-Control-Allow-Headers in preflight response.`
- console: `Failed to load resource: net::ERR_FAILED`
- console: `Access to fetch at 'https://aud-stream-suomipop.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested reso`
- console: `Access to fetch at 'https://aud-stream-radiorock.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested res`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fradio-nova`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fnrj`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiohelsinki.fi%2Fohjelmakartta%2F`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/radionova/radionova_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/nrj/nrj_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origi`
- console: `Access to fetch at 'https://stream.radiohelsinki.fi/stream' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.supla.fi%2Fsuomipop`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fareena.yle.fi%2Faudio%2Fohjelmat%2Fyle-x`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiorock.fi%2F`
- slow: `2544ms GET /tahti-api/api/me/collections?expand=items`
- slow: `2616ms GET /tahti-api/api/me/collections?expand=items`
- slow: `2691ms GET /tahti-api/api/me/collections?expand=items`
- slow: `2762ms GET /tahti-api/api/me/collections?expand=items`
- slow: `2839ms GET /tahti-api/api/me/collections?expand=items`
- slow: `2911ms GET /tahti-api/api/me/collections?expand=items`
- slow: `2986ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3064ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3135ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3209ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3290ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3365ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3435ms GET /tahti-api/api/me/collections?expand=items`
- slow: `3508ms GET /tahti-api/api/me/collections?expand=items`
- api: `404 GET /tahti-api/api/me/likes?limit=100`
- audit: `/favorites: unnamed control <div data-queue-item-id="sound:cmsysdsoo00ezsg6bt6bhmn78" class="" role="button" tabindex="0" aria-disabled="true" aria-`
- audit: `/favorites: unnamed control <div class="border-border rounded-md border-(length:--border-width) bg-background-secondary text-foreground shadow-none `

### Search for the track I just played

- audit: `/favorites: unnamed control <div data-queue-item-id="sound:cmsysdsoo00ezsg6bt6bhmn78" class="" role="button" tabindex="0" aria-disabled="true" aria-`
- audit: `/favorites: unnamed control <div class="border-border rounded-md border-(length:--border-width) bg-background-secondary text-foreground shadow-none `

### Open an artist channel from a track

- audit: `/discover: unnamed control <div data-queue-item-id="sound:cmsysdryo00b7sg6b6o2vx328" class="" role="button" tabindex="0" aria-disabled="true" aria-`
- audit: `/discover: unnamed control <div class="border-border rounded-md border-(length:--border-width) text-foreground shadow-none group relative flex item`

### Follow / subscribe to the artist

- audit: `/discover: unnamed control <div data-queue-item-id="sound:cmsysdryo00b7sg6b6o2vx328" class="" role="button" tabindex="0" aria-disabled="true" aria-`
- audit: `/discover: unnamed control <div class="border-border rounded-md border-(length:--border-width) text-foreground shadow-none group relative flex item`

### Play a radio station

- console: `Failed to load resource: the server responded with a status of 404 ()`
- audit: `/radio: unnamed control <div data-queue-item-id="radio:tahti-radio" class="" role="button" tabindex="0" aria-disabled="true" aria-roledescriptio`
- audit: `/radio: unnamed control <div class="border-border rounded-md border-(length:--border-width) text-foreground shadow-none group relative flex item`

### Listening history shows what I played

- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fnrj`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.supla.fi%2Fsuomipop`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fareena.yle.fi%2Faudio%2Fohjelmat%2Fyle-x`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiohelsinki.fi%2Fohjelmakartta%2F`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiorock.fi%2F`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fradio-nova`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/nrj/nrj_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origi`
- console: `Failed to load resource: net::ERR_FAILED`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/radionova/radionova_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control`
- console: `Access to fetch at 'https://icecast.live.yle.fi/radio/YleX/icecast.audio' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Request header field icy-metadata is not allowed by Access-Control-Allow-Headers in preflight response.`
- console: `Access to fetch at 'https://stream.radiohelsinki.fi/stream' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- console: `Access to fetch at 'https://aud-stream-suomipop.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested reso`
- console: `Access to fetch at 'https://aud-stream-radiorock.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested res`

### Library and collections

- api: `404 GET /tahti-api/api/me/collection-subscriptions`
- console: `Failed to load resource: the server responded with a status of 404 ()`

### Messages and notifications

- api: `404 GET /tahti-api/api/me/blocks`
- console: `Failed to load resource: the server responded with a status of 404 ()`

### Sign out

- api: `404 GET /tahti-api/api/me/sound/processing`
- console: `Failed to load resource: the server responded with a status of 404 ()`
