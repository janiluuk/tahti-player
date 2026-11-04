# Navigation flow audit — inconsistencies, gaps, dead links

**Status:** open

Started 2026-10-19 (180 routes across 13 `routes-*.tsx` files). Shipped
sections (governance back links, admin redirect coverage, ChannelView /
TrackHero back, Studio detail back links, admin breadcrumbs, chrome
`data-testid`s, moved Settings sections, the route e2e sweep, and the
2026-11-03 back-link pass) are in `HISTORY.md`.

How to check for dead links: every `<Link to>` is typed by TanStack Router,
so a literal dead link fails `type-check`. `PageBackLink` takes `to: string`
and is not typed; `e2e/use-cases-nav-back-links.spec.ts` clicks each one.

Back-link convention: sub-pages use `PageBackLink` (`components/PageBackLink.tsx`,
a `ButtonLink`) with the parent page's name as the label ("Governance",
"Stats", "All venues"), placed first in the page body. Entity cover headers
use `BackButtonLink` with `aria-label="Back to …"`.

## Open

| Where | Issue | Why not fixed yet |
| --- | --- | --- |
| Admin pages inside a hub (Announcements, Artwork presets, News, …) | The breadcrumb reads Admin › Page while the back link above it names the hub (Content); the trail skips a level | 23 views; drop the breadcrumb or add the hub level is a design call |
| `/studio/insights/release-tracks/$id` | Back link goes to the Releases list, not the release's Stats tab; the route only has the release track id | Needs `StudioReleaseDetailView` to pass the release id (release page is being reworked) |
| Cross-section moves (Listen ↔ Studio on phones) | No "Listen › Studio › Releases" trail; the logo is the main way out of Studio on narrow screens | Design call |
