# Listener tasks — phone 390×844

Target: https://beta.tahti.live

| Task                                              | Result                                              | Time  | UX notes | Signals                  |
| ------------------------------------------------- | --------------------------------------------------- | ----- | -------- | ------------------------ |
| Phone: sign in                                    | ok                                                  | 8.2s  |          | api×8 console×20 audit×5 |
| Phone: /                                          | ok                                                  | 2.7s  |          | console×18 api×6 audit×5 |
| Phone: /discover                                  | ok                                                  | 1.2s  |          |                          |
| Phone: /radio                                     | ok                                                  | 0.9s  |          |                          |
| Phone: /library                                   | ok                                                  | 0.8s  |          |                          |
| Phone: /favorites                                 | ok                                                  | 0.8s  |          | api×1 console×1          |
| Phone: /history                                   | ok                                                  | 0.9s  |          | api×6 console×18         |
| Phone: /channel/liis-kask-ee                      | ok                                                  | 1.6s  |          | api×1 console×1          |
| Phone: play from home and open full-screen player | **FAIL** locator.waitFor: Timeout 12000ms exceeded. | 15.4s |          | console×18 api×6 audit×5 |

## Signals

### Phone: sign in

- api: `401 GET /tahti-api/api/auth/me`
- console: `Failed to load resource: the server responded with a status of 401 ()`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiohelsinki.fi%2Fohjelmakartta%2F`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fradio-nova`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fnrj`
- console: `Access to fetch at 'https://aud-stream-suomipop.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested reso`
- console: `Failed to load resource: net::ERR_FAILED`
- console: `Access to fetch at 'https://aud-stream-radiorock.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested res`
- console: `Access to fetch at 'https://stream.radiohelsinki.fi/stream' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/radionova/radionova_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/nrj/nrj_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origi`
- console: `Access to fetch at 'https://icecast.live.yle.fi/radio/YleX/icecast.audio' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Request header field icy-metadata is not allowed by Access-Control-Allow-Headers in preflight response.`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.supla.fi%2Fsuomipop`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fareena.yle.fi%2Faudio%2Fohjelmat%2Fyle-x`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiorock.fi%2F`
- audit: `/: unlabeled field <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" aria-hidden="true">`

### Phone: /

- console: `Access to fetch at 'https://icecast.live.yle.fi/radio/YleX/icecast.audio' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Request header field icy-metadata is not allowed by Access-Control-Allow-Headers in preflight response.`
- console: `Failed to load resource: net::ERR_FAILED`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiohelsinki.fi%2Fohjelmakartta%2F`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- console: `Access to fetch at 'https://aud-stream-radiorock.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested res`
- console: `Access to fetch at 'https://aud-stream-suomipop.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested reso`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fradio-nova`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fnrj`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/radionova/radionova_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/nrj/nrj_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origi`
- console: `Access to fetch at 'https://stream.radiohelsinki.fi/stream' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.supla.fi%2Fsuomipop`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fareena.yle.fi%2Faudio%2Fohjelmat%2Fyle-x`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiorock.fi%2F`
- audit: `/: unlabeled field <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" aria-hidden="true">`

### Phone: /favorites

- api: `404 GET /tahti-api/api/me/likes?limit=100`
- console: `Failed to load resource: the server responded with a status of 404 ()`

### Phone: /history

- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fnrj`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.supla.fi%2Fsuomipop`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiorock.fi%2F`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiohelsinki.fi%2Fohjelmakartta%2F`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fareena.yle.fi%2Faudio%2Fohjelmat%2Fyle-x`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fradio-nova`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/nrj/nrj_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origi`
- console: `Failed to load resource: net::ERR_FAILED`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/radionova/radionova_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control`
- console: `Access to fetch at 'https://stream.radiohelsinki.fi/stream' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- console: `Access to fetch at 'https://icecast.live.yle.fi/radio/YleX/icecast.audio' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Request header field icy-metadata is not allowed by Access-Control-Allow-Headers in preflight response.`
- console: `Access to fetch at 'https://aud-stream-radiorock.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested res`
- console: `Access to fetch at 'https://aud-stream-suomipop.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested reso`

### Phone: /channel/liis-kask-ee

- api: `404 GET /tahti-api/api/channels/liis-kask-ee/schedule`
- console: `Failed to load resource: the server responded with a status of 404 ()`

### Phone: play from home and open full-screen player

- console: `Access to fetch at 'https://icecast.live.yle.fi/radio/YleX/icecast.audio' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Request header field icy-metadata is not allowed by Access-Control-Allow-Headers in preflight response.`
- console: `Failed to load resource: net::ERR_FAILED`
- console: `Access to fetch at 'https://aud-stream-radiorock.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested res`
- console: `Access to fetch at 'https://aud-stream-suomipop.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested reso`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fnrj`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiohelsinki.fi%2Fohjelmakartta%2F`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fradio-nova`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/nrj/nrj_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origi`
- console: `Access to fetch at 'https://stream.radiohelsinki.fi/stream' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/radionova/radionova_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.supla.fi%2Fsuomipop`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiorock.fi%2F`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fareena.yle.fi%2Faudio%2Fohjelmat%2Fyle-x`
- audit: `/: unlabeled field <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" aria-hidden="true">`
