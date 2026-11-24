# SEO: canonical host, OG image, crawl hygiene

**Status:** partial

## Findings (2026-11-18 live audit)

- Default `og:image` (`https://tahti.live/og-image.png`) **404** — share previews had no site image.
- Static `robots.txt` / `sitemap*.xml` / `index.html` still pointed at `app.tahti.live` or `beta.tahti.live` while the live host is `tahti.live`.
- API sitemaps (`APP_URL=https://app.tahti.live`) emit track/release/collection URLs on the old host → duplicate origins.
- `app.tahti.live` served the SPA without redirecting to the apex (beta already 301s).
- Client SEO never synced `twitter:*` or `robots` noindex for private areas; `/t/:id` had no path metadata before data load.
- Bot OG proxy works for `/c`, `/u`, `/r`, `/t` (verified).

## Shipped in this pass (tahti-web)

- [x] Ship `public/og-image.png` (1280×720 from marketing website asset)
- [x] Point robots, sitemap index/static, and `index.html` canonical/OG/Twitter at `https://tahti.live`
- [x] WebSite JSON-LD + SearchAction in `index.html`
- [x] nginx 301 `app.tahti.live` → `tahti.live` (also `$http_x_forwarded_host`)
- [x] `seo.ts`: track path titles, twitter tags, default OG image, noindex for admin/settings/studio/messages/notifications/library/moderate/jam
- [x] Broader `robots.txt` Disallow for private prefixes; richer static sitemap (venues, governance guide/docs, newsletter; drop favourites)
- [x] Hot-patched live web container (static SEO files + nginx) and production `APP_URL`/`NEXT_PUBLIC_APP_URL` → `https://tahti.live` (api recreate); dynamic sitemaps now emit apex URLs

## Left

- [ ] Commit/merge `../tahti-org` `infra/docker-stack.yml` APP_URL so the next stack deploy does not revert to `app.tahti.live`
- [ ] tahti-org `/api/og/collection/*` puts a presigned CDN URL (`X-Amz-Expires=3600`) in `og:image`; link previews cached by Facebook/Slack/X go blank after an hour. Use a stable public URL or an image proxy route.
- [ ] tahti-org `/api/og/release/*`: SVG covers need a raster rendition (or `og-image.png`) for `og:image`.
- [ ] tahti-org `/api/og/channel|profile|track/*` uses the avatar `.webp` as `og:image`; some crawlers (LinkedIn, older Slack/iMessage) skip WebP. Prefer a JPEG/PNG rendition, with the channel banner or `og-image.png` as fallback.

## Crawler QA (2026-11-24, bot user agents against production)

- `/channel/yaniho`, `/c/yaniho`, `/u/yaniho`: bot OG proxy answers with channel title, `og:url` on the artist subdomain and avatar image.
- `/u/yaniho/c/<slug>` collections: title, canonical and `og:url` correct; image is the presigned URL above.
- `/r/<slug>` releases: title and `og:url` correct; image is a presigned **SVG** cover (`cover.svg?X-Amz-…`), which most crawlers reject and which also expires.
- `/t/<id>` tracks: title and `og:url` correct; image is a WebP artwork preset (`/artwork-presets/artwork-14.webp`).
- `/v/<slug>`: no venue URLs in any sitemap yet, nothing to check.
- Static SPA routes (`/venues`, `/governance/guide`, …) served `canonical` and `og:url` of the home page to non-JS crawlers. Fixed in nginx (0.0.474): `location = /index.html` rewrites both to `https://tahti.live<path>` (query dropped) via the `$tahti_page_url` map; verified against `nginx:1.27-alpine`.
