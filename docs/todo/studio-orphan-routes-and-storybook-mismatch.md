# Studio orphan routes + Storybook retired-route stories

**Status:** open

Created 2026-09-07: navigation audit found 5 studio routes with no submenu
entry in `StudioNav.tsx`, plus 2 Storybook stories testing routes that are
now redirects.

## Orphan studio routes (no nav entry)

These routes exist but have no submenu item in `StudioNav.tsx` PRIMARY or
SUBMENUS. They rely on `SECTION_PREFIXES` or Library sidebar highlighting
instead of a dedicated nav entry.

| Route | Severity | Notes |
|---|---|---|
| `/studio/sounds` | Medium | Core artist surface; no submenu entry, relies on Library sidebar highlight |
| `/studio/recordings` | Low | Same pattern as sounds |
| `/studio/collections` | Medium | Core artist surface; only reachable via Library |
| `/studio/stash` | Low | Documented orphan; reachable via collections tab |
| `/studio/distribution` | Low | Documented orphan; reachable via Releases row links |

## Storybook stories for retired routes

These stories test routes that the router now redirects:

| Story | Old route | Redirects to |
|---|---|---|
| `AdminActivityView.stories.tsx` | `/admin/activity` | `/admin/logs` |
| `AdminMissedShowsView.stories.tsx` | `/admin/missed-shows` | `/admin/moderation/$tab` (missed-shows) |

The stories use `withTahtiRouter('/admin/...')` decorators pointing at
dead routes. They still render the component in isolation but the route
decorator is misleading.

## Fix

1. Decide for each orphan: add a submenu entry, document as intentionally
   navigation-less, or fold into another section.
2. Update Storybook story route decorators to match current redirects.
3. Cross-check against `NAVIGATION-SITEMAP.md` and `NAVIGATION-GAPS.md`.
