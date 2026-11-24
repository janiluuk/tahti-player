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
- [ ] Full crawler QA checklist in `final-season-hardening.md` (venues/collections remaining)
- [ ] Prefer raster (not SVG) for channel OG images that bots reject
