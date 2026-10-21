# SEO / dynamic OG metadata — research notes and plan

**Status (2026-08-24): both parts implemented.** Part 1 (client-side sync
on real data resolve) landed in `src/lib/seo.ts` /
`ChannelView`/`ArtistView`/`SmartLinkView`. Part 2 (bot proxy) landed as
`GET /api/og/{channel,profile,release,collection,track,venue}/:slug` in `tahti/apps/api`
(`apps/api/src/routes/og.ts`) plus the `$og_bot` user-agent `map` and
`/c/*`, `/u/*`, `/r/*`, `/t/*`, `/v/*` → `/og-proxy/` rewrite rules in
[`deploy/nginx.conf`](./deploy/nginx.conf). Remaining: deploy the API route
to production, then do the Phase 7.4 curl-as-crawler QA pass for real.

Written 2026-08-24, ahead of implementing the last open item under
[CUTOVER.md](./CUTOVER.md)'s "SEO minimum (P0)" checklist:

> robots.txt, a static + API-fed sitemap index, canonical tags, and
> route-aware browser metadata for `/c`, `/u`, `/r` are implemented.
> Server-rendered dynamic OG values still require prerendering or an edge
> metadata service.

This file documents what's actually there today (verified by reading the
code, not assumed from the checklist wording) and the plan for closing the
remaining gap, so the next session doesn't have to re-derive it.

## 1. What's already implemented

**Everything today is client-side DOM manipulation. There is no build-time
or edge-side rendering piece anywhere in the SPA.**

- `src/lib/seo.ts`:
  - `metadataForPath(pathname)` (lines 20–64) — regex-matches the pathname
    (`/channel|c/:slug`, `/u/:username`, `/r/:slug`, `/radio`, `/studio`)
    and returns a `{title, description}` pair derived **only from the URL
    slug** (title-cased, e.g. `night-radio` → "Night Radio") — never from
    real API data (no display name, no bio, no artwork).
  - `syncDocumentMetadata(pathname)` (lines 72–85) — sets `document.title`
    and patches `meta[name="description"]`, `og:title`, `og:description`,
    `og:url`, and `link[rel="canonical"]` in the browser. **Never touches
    `og:image`** — that stays whatever static value ships in `index.html`.
  - Tested only for slug-to-title cases (`src/lib/seo.test.ts`), no API
    integration.
- Call site: `src/components/AppShell.tsx` — `syncDocumentMetadata` runs
  from a `useEffect` keyed on pathname (line 161), i.e. **after** the JS
  bundle has loaded and executed. Runs once on route entry, before route
  data has actually loaded (see §2) — even the JS-executing-crawler case
  doesn't get real data today.
- `index.html` (lines 4–23) ships one fixed set of tags — generic title,
  generic description, `og:image = https://tahti.live/og-image.png`,
  canonical `https://app.tahti.live/` — served for **every** route via SPA
  fallback.
- `public/robots.txt` — static, disallows `/admin/`, `/settings/`,
  `/studio/`, points at `/sitemap.xml`.
- `public/sitemap.xml` — a sitemap *index* referencing `sitemap-static.xml`
  (static file) plus `sitemap-profiles.xml` / `sitemap-releases.xml`, which
  don't exist as files — they're nginx-proxied to a real API endpoint (see
  §4). This is the "API-fed" half of the checklist item, and it already
  works end-to-end.

**Net effect today:** a crawler/unfurl bot that doesn't execute JS
(Facebook/Slack/Discord/iMessage/Twitter-card fetchers, most link-preview
bots) gets the single static `index.html` for `/c/*`, `/u/*`, and `/r/*`
alike — identical generic preview for every URL. Only JS-executing bots
(e.g. Googlebot) see the per-route title/description, and even then never a
real `og:image`.

## 2. Route structure (why "sync after data loads" isn't wired up either)

Router is TanStack Router (`src/router.tsx`). No route uses a `loader` —
every view fetches inside a `useEffect` after mount:

| Route | File | Fetch |
|---|---|---|
| Channel | `/channel/$slug` → `ChannelView` | `fetchChannel(slug)` (`ChannelView.tsx:112`) |
| Profile | `/u/$username` → `ArtistView` | `fetchProfile(username)` |
| Collection | `/u/$username/c/$slug` → `CollectionView` | — |
| Track | `/t/$id` → `TrackDetailView` | — |
| Release/smart-link | `/r/$slug` → `SmartLinkView` | `fetchSmartLink(slug)` |

`syncDocumentMetadata` fires once on route entry, before any of these
fetches resolve — so today it's purely a slug-to-title guess, with no
follow-up sync once real data arrives. That's a gap even before getting to
the prerendering question.

## 3. Data available for real OG values

`src/api/client.ts` / `src/api/types.ts`:

- `fetchChannel(slug)` → `PublicChannel`: `user.displayName`, `user.bio`,
  `user.avatarUrl`, `state`, `nowPlaying`.
- `fetchProfile(username)` → `PublicProfile`: `displayName`, `bio`,
  `fullBio`, `avatarUrl`, `followerCount`.
- `fetchSmartLink(slug)` → release `title`, `artworkUrl`, `description`,
  `releaseDate`, `genre`; artist `displayName`, `avatarUrl`.
- `fetchEmbedChannel` / `fetchEmbedRelease` → `ChannelEmbedView` /
  `ReleaseEmbedView` — already a "public, minimal, embeddable" projection,
  arguably the closest existing shape to an OG payload.

**No dedicated OG/unfurl endpoint exists in the API** (`tahti-org`
`apps/api` grepped for `opengraph`/`og:image`/`unfurl` — zero hits). The
only server-side-rendered precedent is the sitemap API
(`apps/api/src/routes/sitemap.ts:31-59`), which nginx already proxies to
(see §4) — useful as a `proxy_pass` template, not as a data source.

## 4. Deploy topology — the actual constraint

`packages/tahti-web` is a **pure static SPA, zero server-side compute**:

- `vite.config.ts` — plain `react()` + `tailwindcss()` + `svgr()`, no
  SSR/prerender plugin or adapter.
- `deploy/Dockerfile` — `FROM nginx:1.27-alpine`, copies `dist/` in. No
  Node runtime in the image.
- `deploy/nginx.conf` — stock nginx, no `njs`/Lua, no bot detection.
  `location / { try_files $uri $uri/ /index.html; }` — same `index.html`
  for every path. The one server-side piece that exists:
  `/sitemap-profiles.xml` / `/sitemap-releases.xml` are `proxy_pass`'d to
  `https://api.tahti.live/api/sitemap/{profiles,releases}.xml` (lines
  38–48) — a working, reusable pattern for a *future* OG proxy route.
- No Cloudflare Workers, Vercel/Netlify edge functions, or any serverless
  config anywhere in the repo. `tahti-org/docs/cdn-strategy.md` explicitly
  rules out Cloudflare (jurisdiction) and treats edge-VCL logic as a
  later-stage aspiration, not something available now.

**So: "prerendering" means introducing a genuinely new build-time step**
(crawl known slugs, emit static HTML per route into `dist/`, or run a small
Node SSR/prerender pass before the nginx image is built) — nothing like
this exists today. **"Edge metadata service" means introducing a new
component** — an `njs`/Lua nginx module (not currently loaded) or a small
bot-detecting sidecar in front of/beside nginx. Neither exists; both are
greenfield, not "wire up something already there."

## 5. Existing prerender tooling: none

Grepped root and `packages/tahti-web` `package.json` for
`vite-plugin-ssr`/`vite-react-ssg`/`prerender`/`puppeteer`/`vike`/`astro`/
`ssr`. Only hits: `prettier-plugin-astro` (unrelated formatting plugin) and
`@playwright/test` (e2e testing only, not rendering). Nothing installed
addresses this today.

## 6. Next.js (`apps/web`) parity baseline — partial, not full, parity exists

- `apps/web/src/app/u/[username]/page.tsx:84-121` has real
  `generateMetadata`: title `` `${displayName} (@${username})` ``,
  description = bio (160 chars, with fallback), canonical via
  `resolveChannelUrl`, `openGraph.images` from `avatarUrl` when present.
  **This is the only concrete spec to generalize from.**
- `apps/web/src/app/c/[slug]/page.tsx` and `.../r/[slug]/page.tsx` — **no
  `generateMetadata` at all** in either. Channel and release pages
  currently just inherit the static root-layout metadata (title "Tahti —
  your channel, always on", no `openGraph` block at all).

**Implication:** this isn't "port Next.js's channel/release OG behavior
into the SPA" — that behavior doesn't exist in production today either.
It's "define it for the first time," generalizing the `/u/[username]`
pattern and using `SmartLinkView`/embed-view shapes as the data source.

## Recommended approach

Given §4, a full prerender pipeline or a new edge service is a
disproportionate build for what's actually a P0 blocker for link-preview
correctness, not full-blown SEO indexing depth. Two-part plan:

1. **Close the client-side gap first (cheap, real user-agent-executing
   value):** re-run `syncDocumentMetadata` (extended to also set
   `og:image`) once each view's real fetch resolves, not just once on
   route entry from the slug guess. Low-risk, no infra change, fixes the
   Googlebot/JS-executing-crawler case and makes in-app tab titles/browser
   metadata correct once data loads.
2. **Add a minimal proxy-based OG shim for non-JS bots**, following the
   exact pattern nginx already uses for the sitemap proxy: a **new, small
   API endpoint** (e.g. `GET /api/og/channel/:slug`,
   `/api/og/profile/:username`, `/api/og/release/:slug` in `tahti-org`
   `apps/api`) that returns a tiny static HTML document with just the
   `<meta>`/`<title>` tags (reusing the existing public fetch logic those
   routes already have — no new data-fetching, just a different response
   shape), then an nginx `map`-based user-agent match
   (`facebookexternalhit|Twitterbot|Slackbot|Discordbot|...`) that
   proxies **only those bots**, only for `/c/*`, `/u/*`, `/r/*`, to that
   endpoint instead of falling through to `index.html`. Real browsers and
   JS-executing crawlers are completely unaffected — they still get the
   SPA and the item-1 client-side fix.

This avoids introducing prerendering, SSR, or a new edge runtime, reuses
the existing proxy-to-API pattern already proven in `nginx.conf`, and
scopes new backend work to three small, read-only, cacheable endpoints.
Full static prerendering remains a fallback option if this proves
insufficient, but should not be the first attempt given the infra cost.

## Open decisions before implementing

- Confirm the bot user-agent allowlist (start narrow: Facebook, Twitter/X,
  Slack, Discord, iMessage/Apple, LinkedIn — expand only if a real preview
  fails).
- Confirm response caching policy for the new `/api/og/*` endpoints
  (these are public, slug-keyed, and safe to cache aggressively — align
  with `sitemap.ts`'s existing cache headers if any).
- Decide whether `/api/og/*` lives in `tahti-org/apps/api` (matches the
  sitemap precedent, single source of truth for public metadata) rather
  than being duplicated in this repo — recommend `tahti-org`.
