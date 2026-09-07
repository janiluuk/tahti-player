# Move Perform into Studio -> Broadcast; sweep Studio nav-tab coverage

**Status:** blocked
audit (part 2) is done — see findings below. Both remaining pieces
(what to do about the submenu-less pages, and the Perform→Broadcast
move itself) are IA/design decisions, not implementation gaps.

Reported 2026-09-07:

1. Move the "Perform" top-level nav item into a new Studio second-level "Broadcast" section instead of its own primary nav entry, and update the navigation tree accordingly.
2. Sweep every Studio page for missing/incorrect nav-tab active-state at both the 1st-level (primary: Studio/Perform/etc.) and 2nd-level (submenu) — flag any page that doesn't light up the right tab at either level, or has no matching tab at all.

## Starting points (found this pass, not yet acted on)

- `packages/tahti-web/src/components/StudioNav.tsx`: `PRIMARY` (~line 41) has `{ to: '/studio/go-live', label: 'Perform', description: 'Go live, schedule broadcasts, and manage performances.' }` as its own top-level item — this is what needs folding into Studio's submenu instead.
- `SUBMENUS['/studio']` and `SUBMENUS['/studio/go-live']` (~lines 104, 168) are the two submenu arrays involved — the go-live submenu's items would need to move under `SUBMENUS['/studio']` as a new "Broadcast" entry (or become a `/studio/broadcast` section with its own sub-items, unclear which yet — go-live currently has its own primary section with sub-items of its own, e.g. `/studio/info`; check `isActive`'s `/studio/go-live` special-case at ~line 228 too, since it's hardcoded to treat `/studio/go-live`/`/studio/info` as one section).
- No existing "Broadcast" label anywhere in `StudioNav.tsx` — this is a new section, not a rename.
- Precedent for this exact kind of nav-tab coverage audit already exists and shipped: `StudioNav.test.ts`'s `getStudioPrimaryRoute`/`litStudioSubmenuDestinations` tests (see `docs/todo/HISTORY.md`, 2026-09-07 entries) — the sweep item should probably produce the same shape of regression test (a table of `[route, expectedPrimaryTab, expectedSubmenuTab]` checked against every real Studio route in `router.tsx`), not just a one-off manual pass.

## Scope note

This is two related but separable pieces of work — the Perform→Broadcast move changes real navigation structure (a design/IA decision with its own blast radius: bookmarks, deep links, `getStudioPrimaryRoute` special-casing), while the coverage sweep is an audit that should probably happen first (it may turn up the Perform/go-live section's own inconsistencies as part of the same investigation). Sequence: audit first, then decide the exact shape of the Broadcast move informed by what the audit finds.

## Audit findings (2026-09-08)

Ran every real (non-redirect) `/studio/*` route from `router.tsx` through
`getStudioPrimaryRoute` / `litStudioSubmenuDestinations` directly (a
throwaway coverage-table test, not committed — the permanent version of
this table belongs in `StudioNav.test.ts` once the fix shape is picked,
per the starting-points note above). Perform/go-live's own section came
back clean: every go-live route (`/studio/go-live`, `/studio/schedule`,
`/studio/channel`, `/studio/shows(/…)`, `/studio/events(/new)`) lights
both the Perform primary tab and its matching submenu tab correctly.

The real gap is on the Studio side — five routes light the **Studio**
primary tab (via `SECTION_PREFIXES['/studio']`) but **no submenu tab**
at all, because they were never added to `SUBMENUS['/studio']`:

| Route | Primary | Submenu |
| --- | --- | --- |
| `/studio/sounds`, `/studio/sounds/$id`, `/studio/sounds/$id/editor` | `/studio` | none |
| `/studio/recordings` | `/studio` | none |
| `/studio/collections`, `/studio/collections/$slug` | `/studio` | none |
| `/studio/stash` | `/studio` | none |
| `/studio/playlists/$slug` (the editor; bare `/studio/playlists` redirects to `/studio/collections`) | `/studio` | none |

Landing on any of these highlights "Studio" at the top level with no
submenu tab lit underneath — same class of bug the existing
`StudioNav.test.ts` header comment already flags for `/studio/branding`
having once shipped unregistered, just the inverse (primary lit,
submenu missing, instead of neither lit).

**Why this isn't a one-line fix:** `isSubmenuActive`'s fallback branches
already contain special-casing for exactly these routes (mapping
`/studio/sounds`/`/studio/archive` → a `to` of `'/library/sounds'`, and
`/studio/collections`/`/studio/playlists`/`/studio/stash`/
`/studio/recordings` → a `to` of `'/library/collections'`) — but neither
`'/library/sounds'` nor `'/library/collections'` is ever a member of
`SUBMENUS['/studio']`, and `isSubmenuActive` is a private, only-called-
from-`litStudioSubmenuDestinations` function, so those branches are
currently **dead code**. That strongly suggests these five routes used
to be lit via a Library submenu tab that got removed when Library moved
to its own primary nav item (see the `StudioNav.test.ts` test titled
"keeps Library out of the crowded Studio submenu"), and the "no submenu
tab" state was accepted as a side effect rather than deliberately
chosen for these specific pages.

**Decision needed, not mine to make:** should these five keep the
Studio top-level tab lit with genuinely no submenu selection (arguably
correct if they're considered legacy/Library-adjacent pages reachable
by URL but not part of the curated Studio tab bar), or should
`SUBMENUS['/studio']` grow tabs for them? Picking this should happen
together with the Perform→Broadcast move below, since both are the same
kind of "what does the Studio tab bar actually contain" call, and the
Broadcast move already touches `SUBMENUS['/studio']`'s shape.

`/studio/stripe` was also flagged by the raw coverage table (primary
`/studio`, submenu none) but that's expected, already covered by
`StudioNav.test.ts`'s "keeps Stripe out of Studio nav unless Stripe is
configured" test — not a new finding.
