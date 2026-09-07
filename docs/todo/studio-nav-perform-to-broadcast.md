# Move Perform into Studio -> Broadcast; sweep Studio nav-tab coverage

**Status:** open

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
