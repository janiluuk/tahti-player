# Artist tasks — desktop 1440×900

Target: https://beta.tahti.live

| Task                                     | Result                                                | Time  | UX notes                                                                                                                                                   | Signals                  |
| ---------------------------------------- | ----------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Sign in as artist                        | ok                                                    | 4.5s  | an artist lands on /, not Studio                                                                                                                           | console×23 api×8 audit×5 |
| Studio dashboard: what should I do next? | ok                                                    | 1.0s  |                                                                                                                                                            | console×1                |
| Upload a track                           | ok                                                    | 64.5s | no Title field before uploading; the file name becomes the title; Upload page never finished (Validation error); retried via the Tracks page Upload dialog | console×8 api×6          |
| Edit the track title and description     | ok                                                    | 5.6s  |                                                                                                                                                            | console×4 api×2          |
| Find the track in my Sounds list         | ok                                                    | 2.5s  |                                                                                                                                                            | console×1                |
| Create a release and add the track       | **FAIL** track not listed in the release after adding | 8.8s  |                                                                                                                                                            | console×3 api×2          |
| Channel designer and public channel      | ok                                                    | 4.0s  | no link from the channel designer to the public channel page                                                                                               | console×3 api×1          |
| Go-live setup (no broadcast)             | ok                                                    | 2.8s  | an empty "Queue" side panel stays open across Studio, taking ~25% of the width; go-live sits under 2 rows of tabs (Studio sections + Broadcast sub-tabs)   | console×1                |
| Stats page                               | ok                                                    | 0.9s  |                                                                                                                                                            | console×1                |
| Insights page                            | ok                                                    | 0.9s  |                                                                                                                                                            | console×1                |
| Fans & revenue page                      | ok                                                    | 0.9s  |                                                                                                                                                            | console×1                |
| Schedule page                            | ok                                                    | 1.0s  |                                                                                                                                                            | console×1                |
| New event form page                      | ok                                                    | 0.8s  |                                                                                                                                                            | console×1                |
| Distribution page                        | ok                                                    | 0.9s  |                                                                                                                                                            | console×1                |
| Artist settings page                     | ok                                                    | 0.9s  |                                                                                                                                                            | console×1                |
| Cleanup: delete the test release         | ok                                                    | 11.8s | collections list rows have no delete/more menu; delete is only on the release page; deleting a release from Studio lands on /library/collections           | console×7 api×4          |
| Cleanup: delete the test track           | ok                                                    | 6.2s  |                                                                                                                                                            | console×2                |

## Signals

### Sign in as artist

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`
- api: `401 GET /tahti-api/api/auth/me`
- console: `Failed to load resource: the server responded with a status of 401 ()`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fareena.yle.fi%2Faudio%2Fohjelmat%2Fyle-x`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiohelsinki.fi%2Fohjelmakartta%2F`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radiorock.fi%2F`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.supla.fi%2Fsuomipop`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fradio-nova`
- api: `404 GET /tahti-api/api/v1/internet-radio/now-playing?url=https%3A%2F%2Fwww.radioplay.fi%2Fnrj`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/radionova/radionova_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control`
- console: `Failed to load resource: net::ERR_FAILED`
- console: `Access to fetch at 'https://stream-redirect.bauermedia.fi/nrj/nrj_64.aac?aw_0_1st.bauer_loggedin=false&aw_0_1st.playerid=BMUK_tunein' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origi`
- console: `Access to fetch at 'https://stream.radiohelsinki.fi/stream' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
- console: `Access to fetch at 'https://icecast.live.yle.fi/radio/YleX/icecast.audio' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Request header field icy-metadata is not allowed by Access-Control-Allow-Headers in preflight response.`
- console: `Access to fetch at 'https://aud-stream-suomipop.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested reso`
- console: `Access to fetch at 'https://aud-stream-radiorock.nm-elemental.nelonenmedia.fi/playlist.m3u8' from origin 'https://beta.tahti.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested res`
- audit: `/: unlabeled field <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" tabindex="-1" aria-hidden="true">`

### Studio dashboard: what should I do next?

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`

### Upload a track

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`
- api: `404 GET /tahti-api/api/me/mixcloud-embed`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- api: `400 POST /tahti-api/api/uploads/prepare`
- console: `Failed to load resource: the server responded with a status of 400 ()`
- api: `404 GET /tahti-api/api/me/sound/processing`
- api: `409 GET /tahti-api/api/me/sound/cmvfpeusk0003u7ik37t0xqb8/editor/draft`
- console: `Failed to load resource: the server responded with a status of 409 ()`

### Edit the track title and description

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`
- api: `409 GET /tahti-api/api/me/sound/cmvfpeusk0003u7ik37t0xqb8/editor/draft`
- console: `Failed to load resource: the server responded with a status of 409 ()`

### Find the track in my Sounds list

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`

### Create a release and add the track

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`
- api: `404 GET /tahti-api/api/me/collection-subscriptions`
- console: `Failed to load resource: the server responded with a status of 404 ()`
- api: `400 POST /tahti-api/api/me/collections/yaniho-e2e-test-release-202610192024/items`
- console: `Failed to load resource: the server responded with a status of 400 ()`

### Channel designer and public channel

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`
- api: `404 GET /tahti-api/api/channels/yaniho/schedule`
- console: `Failed to load resource: the server responded with a status of 404 ()`

### Go-live setup (no broadcast)

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`

### Stats page

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`

### Insights page

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`

### Fans & revenue page

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`

### Schedule page

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`

### New event form page

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`

### Distribution page

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`

### Artist settings page

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`

### Cleanup: delete the test release

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`
- api: `404 GET /tahti-api/api/me/collection-subscriptions`
- console: `Failed to load resource: the server responded with a status of 404 ()`

### Cleanup: delete the test track

- console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://js.hcaptcha.com https://newassets.hcaptcha.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-044kngVhpVG3YnQFq9RC9S8kpYAowexz8fxOhaqJhtg='), or a nonce ('nonce-...') is required to ena`
