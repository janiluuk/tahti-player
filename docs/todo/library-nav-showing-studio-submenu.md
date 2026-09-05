# Library page showed Studio's submenu instead of its own tabs

**Status:** done (2026-09-05).

## Root cause

Earlier today (commit `83163e200`, "Favorites: drop redundant Listen
tab; Library: back to main sidebar" — from an earlier session on this
same branch), Library was deliberately moved back to being its own
top-level sidebar destination, and its entries (`/library`,
`/library/sounds`, `/library/collections`, `/library/upload`) were
removed from `StudioNav.tsx`'s `SUBMENUS['/studio']` array — the commit
message explains "LibraryView already has its own internal tab strip
..., same shape as Listen or Studio, so it doesn't need to live inside
Studio's nav."

That refactor updated `StudioNav.tsx` correctly but missed a leftover
caller: `LibraryView.tsx` still rendered `<StudioNav
current={libraryNavRoute(tab)} />` above its own `Tabs.Root`
(`LIBRARY_SECTION_TABS`: Sounds/Collections/Recordings/etc.). Since
`/library/*` routes still match `SECTION_PREFIXES['/studio']` (that
list was never trimmed), `StudioNav` kept resolving Library routes to
the `/studio` primary section and rendering *Studio's* submenu
(Overview/Branding/Stats/Governance/Updates/Audience/Releases/Editor)
directly above Library's own correct tabs — exactly the reported "the
navigation menu is broken in library, it should show library items."

## Fix

Removed the stale `<StudioNav current={libraryNavRoute(tab)} />` call
from `LibraryView.tsx`, matching `ListenView.tsx`'s own pattern (no
`StudioNav`, just its own `Tabs.Root`). Also removed the now-dead
`libraryNavRoute` helper, `LIBRARY_ROUTE_BY_TAB` map, and the unused
`StudioNav` import — none of them were referenced anywhere else in the
file.

Left `StudioNav.tsx` itself untouched — its `SECTION_PREFIXES['/studio']`
still listing `/library/*` paths is technically now dead code for the
Library page's own nav decision (since Library no longer renders
`StudioNav` at all), but it doesn't cause any visible bug either, and a
Studio page navigated to *from* a library-adjacent context could
plausibly still want that section matched. Not touched to keep this fix
minimal and reversible; worth a follow-up cleanup pass if that dead
prefix list bothers anyone.

## Verification

`tsc --noEmit`, `eslint`, and `pnpm --filter @tahti-player/tahti-web
build` all pass. No existing test file for `LibraryView.tsx`; none
added. Not manually verified in a running browser.
