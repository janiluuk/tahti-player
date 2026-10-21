# Cutover Phase 0 — decisions

Working decisions for replacing production `apps/web` with `@tahti-player/tahti-web`.
Full cutover phases live in [CUTOVER.md](./CUTOVER.md) when present; this file is the **decision log**.

Legend: **Approved** (user stated) · **Proposed** (recommend default) · **Needs user confirm**

---

## Approved

### i18n strategy

**Status: Approved** (user-stated)

Admin panel must support:

1. Creating a **new language**
2. **Importing a CSV** whose base/source column is **English** words/strings

Translate/manage locales from **admin** — not a separate ad-hoc client-only i18n approach.

Implementation may be sequenced after P0/P1; product approach is locked. Stub admin UX later if needed.

---

## Proposed (needs confirm)

| # | Topic | Recommendation | Status |
|---|--------|----------------|--------|
| 1 | Monorepo placement | Move `tahti-web` into `tahti` monorepo as `apps/listen` (or `apps/nuclear-web`); keep `tahti-player` as upstream sync fork short-term | Proposed |
| 2 | Admin host | Keep board `/admin/*` on Next initially **or** port into Nuclear admin shell later; cutover listen/studio first | Proposed |
| 3 | Marketing `website/` | Stay separate static site (already off-limits to agents by default) | Proposed |
| 4 | Route aliases | Serve prod paths via redirects: `/c/:slug`→`/channel/:slug`, `/dashboard/*`→studio map, `/u/:user/subscribe`→`/subscribe/:user`, `/listen`→`/` — **implemented on beta** | Approved (implemented) |
| 5 | Brand chrome | Tahti product brand + Nuclear UI components (not “Nuclear Player” wordmark in prod) | Proposed |
| 6 | SSR/SEO | Vite SPA + CDN prerender or critical route SSR later; accept SPA for cutover v1 with meta tags | Proposed |
| 7 | `beta.tahti.live` after cutover | Keep as canary/preview for 1–2 releases, then redirect to `tahti.live` | Proposed |
| 8 | Freeze date | TBD — set when P0 route aliases + membership/password land | Needs user confirm |

---

## Notes

- Beta already uses live `api.tahti.live` via `/tahti-api` on vimage.
- UI redesign loop (artist + admin Nuclear) tracked in [UI-REDESIGN-WORKLOG.md](./UI-REDESIGN-WORKLOG.md).
