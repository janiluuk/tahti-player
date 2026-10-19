# Artist tasks — phone 390×844

Target: https://beta.tahti.live

| Task                       | Result                                              | Time  | UX notes | Signals           |
| -------------------------- | --------------------------------------------------- | ----- | -------- | ----------------- |
| Phone: sign in             | **FAIL** locator.waitFor: Timeout 20000ms exceeded. | 21.7s |          | console×22 api×9  |
| Phone: /studio             | ok                                                  | 0.8s  |          | api×3 console×3   |
| Phone: /studio/upload      | ok                                                  | 0.8s  |          | api×3 console×3   |
| Phone: /studio/sounds      | ok                                                  | 0.7s  |          | api×3 console×3   |
| Phone: /studio/collections | ok                                                  | 0.7s  |          | api×3 console×3   |
| Phone: /studio/go-live     | ok                                                  | 0.8s  |          | api×9 console×9   |
| Phone: /studio/stats       | ok                                                  | 0.8s  |          | api×11 console×11 |
| Phone: /studio/channel     | ok                                                  | 0.7s  |          | api×2 console×2   |

## Signals

### Phone: sign in

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`
- api: `401 GET /tahti-api/api/auth/me`
- console: `Failed to load resource: the server responded with a status of 401 ()`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiohelsinki.fi%2Fohjelmakartta%2F`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fnrj`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.supla.fi%2Fsuomipop`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fradio-nova`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiorock.fi%2F`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fareena.yle.fi%2Faudio%2Fohjelmat%2Fyle-x`
- console: `Access to fetch at 'https://aud-stream-suomipop.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested reso`
- console: `Failed to load resource: net::ERR_FAILED`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/nrj/nrj_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origi`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/radionova/radionova_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control`
- console: `Access to fetch at 'https://aud-stream-radiorock.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested res`
- api: `429 POST /tahti-api/api/auth/login`
- console: `Failed to load resource: the server responded with a status of 429 ()`
- console: `Access to fetch at 'https://icecast.live.yle.fi/radio/YleX/icecast.audio' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Request header field icy-metadata is not allowed by Access-Control-Allow-Headers in preflight response.`
- console: `Access to fetch at 'https://stream.radiohelsinki.fi/stream' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`

### Phone: /studio

- api: `401 GET /tahti-api/api/auth/me`
- console: `Failed to load resource: the server responded with a status of 401 ()`
- api: `401 GET /tahti-api/api/me/fan-subs/connect`

### Phone: /studio/upload

- api: `401 GET /tahti-api/api/auth/me`
- console: `Failed to load resource: the server responded with a status of 401 ()`
- api: `401 GET /tahti-api/api/me/broadcasts/recent?limit=5`

### Phone: /studio/sounds

- api: `401 GET /tahti-api/api/auth/me`
- console: `Failed to load resource: the server responded with a status of 401 ()`
- api: `401 GET /tahti-api/api/me/sound`

### Phone: /studio/collections

- api: `401 GET /tahti-api/api/auth/me`
- console: `Failed to load resource: the server responded with a status of 401 ()`
- api: `401 GET /tahti-api/api/me/collections?expand=items`

### Phone: /studio/go-live

- api: `401 GET /tahti-api/api/auth/me`
- console: `Failed to load resource: the server responded with a status of 401 ()`
- api: `401 GET /tahti-api/api/me/channel/preflight`
- api: `401 GET /tahti-api/api/me/stream-settings/status`
- api: `401 GET /tahti-api/api/me/stream-settings`
- api: `401 GET /tahti-api/api/me/broadcast-usage`
- api: `401 GET /tahti-api/api/me/channel/recording`
- api: `401 GET /tahti-api/api/me/rtmp-targets`

### Phone: /studio/stats

- api: `401 GET /tahti-api/api/auth/me`
- console: `Failed to load resource: the server responded with a status of 401 ()`
- api: `401 GET /tahti-api/api/me/stats/top-tracks?range=30`
- api: `401 GET /tahti-api/api/me/stats/top-countries?range=30`
- api: `401 GET /tahti-api/api/me/channel-egress`
- api: `401 GET /tahti-api/api/me/stats/top-lists?period=month&dimension=type&sort=desc`
- api: `401 GET /tahti-api/api/me/listener-geo?period=30d`
- api: `401 GET /tahti-api/api/me/stats/summary`
- api: `401 GET /tahti-api/api/me/stats/plays?range=30`
- api: `401 GET /tahti-api/api/me/grants/estimate`
- api: `401 GET /tahti-api/api/me/channel-live-stats`

### Phone: /studio/channel

- api: `401 GET /tahti-api/api/auth/me`
- console: `Failed to load resource: the server responded with a status of 401 ()`
