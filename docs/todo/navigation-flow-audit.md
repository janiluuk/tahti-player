# Navigation flow audit — inconsistencies, gaps, dead links

**Status:** open

Started 2026-10-19 (180 routes across 13 `routes-*.tsx` files). Shipped
sections (governance back links, admin redirect coverage, ChannelView /
TrackHero back, Studio detail back links, admin breadcrumbs, chrome
`data-testid`s, moved Settings sections, the route e2e sweep, and the
2026-11-03 back-link pass) are in `HISTORY.md`. 2026-11-04 (batch 33): the
Library Media empty state links to `/studio/branding` instead of naming a
menu path.

How to check for dead links: every `<Link to>` is typed by TanStack Router,
so a literal dead link fails `type-check`. `PageBackLink` takes `to: string`
and is not typed; `e2e/use-cases-nav-back-links.spec.ts` clicks each one.

Back-link convention: sub-pages use `PageBackLink` (`components/PageBackLink.tsx`,
a `ButtonLink`) with the parent page's name as the label ("Governance",
"Stats", "All venues"), placed first in the page body. Entity cover headers
use `BackButtonLink` with `aria-label="Back to …"`.

2026-11-04 (batch 33): re-checked the governance meeting detail, admin governance panels and Library Following. Back links are present; the Library Following empty state now links to Discover so the page is not a dead end.

2026-11-06 (#1880): admin pages inside a hub show Admin › Hub › Page
(`AdminHubBreadcrumb`, guarded by `AdminNav.test.ts`); release track insights
opened from a release take `?release=` and go back to that release's Stats tab.

## Open

| Where | Issue | Why not fixed yet |
| --- | --- | --- |
| Cross-section moves (Listen ↔ Studio on phones) | No "Listen › Studio › Releases" trail; the logo is the main way out of Studio on narrow screens | Design call |
