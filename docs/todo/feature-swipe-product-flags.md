# Feature swipe — remaining product flags

**Status:** blocked

**Blocker:** Product call required for Distribution StudioNav sibling, `/chat` chrome entry, and mobile More vs primary bar — do not invent chrome.

Easy reachability/docs from the 2026-10-17 feature swipe (#994–#996) shipped
and were folded in HISTORY. These leftovers still need a product call (do not
invent StudioNav / mobile chrome without one):

| Gap | Recommendation | Status |
| --- | --- | --- |
| `/studio/distribution` as StudioNav sibling | Keep Releases-adjacent: home tile when releases exist + Releases header link (#1071). Full StudioNav item only if artists without releases still need status. | Discoverability improved; nav sibling still flagged |
| `/chat` hub in chrome | Keep channel-scoped. Documented in Help + GitBook (#1071). Messages-adjacent entry only if product wants a second chat entry point. | Docs done; chrome entry flagged |
| Mobile bottom nav Favorites / Library / Help | Keep under More unless research shows primary-bar growth is worth the density cost. | Flagged |

Do not invent API. Prefer small PRs when a product decision lands.
