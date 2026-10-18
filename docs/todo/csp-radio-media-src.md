# CSP blocks external radio streams on beta

**Status:** open

## Root cause

#1078 (2026-10-18) added a starter CSP on `packages/tahti-web/deploy/nginx.conf` with:

`media-src 'self' blob: https://cdn.tahti.live https://stream.tahti.live`

That allows tahti-radio / CDN audio but blocks curated Finnish stations, Radio Browser, and user internet-radio HTTPS streams (Bauer, Yle, Radio Helsinki, Nelonen HLS, etc.). Confirmed live on `https://beta.tahti.live/`.

`connect-src` is similarly allowlisted to Tahti hosts — hls.js XHR and ICY metadata `fetch` to external radio hosts need `https:` too.

## Fix

- `media-src 'self' blob: https:` (mirror `img-src`)
- `connect-src` … add `https:` for radio HLS/ICY
- Redeploy beta so the nginx header takes effect
