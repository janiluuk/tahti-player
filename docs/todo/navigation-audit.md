# Navigation audit

**Status:** partial

## Findings (2026-09-12)

Read-only audit pass over `src/router.tsx` (~140 routes), `AppShell.tsx`,
`StudioNav.tsx`, `lib/navigationActive.ts` (+ its test), `InPageNav.tsx`,
`RouteTransition.tsx`, and `docs/VIEW-CATALOG.md`, against the 5 scope
bullets below. The app's navigation turns out to already be in good shape —
most of the scope was already handled by prior passes. Two small doc
inaccuracies were fixed; one product question is flagged, not decided.

### 1. Parent/back links — no dead ends found in sampled audit

Spot-checked ~20 detail/leaf pages reached from a list (Track/Venue/
Artist/Channel/Collection detail, Governance meeting/motion detail,
Transparency grant year, Admin storage user, Studio show/release/sound
detail, mastering, pro editor, editor project). Every one already links
back to its parent (either a styled "← Back" control with `ArrowLeftIcon`,
or a plain contextual link to the parent list/hub). No missing-parent dead
end found. `MessagesView`'s thread route (`/messages/$id`) is a
master-detail split view where the inbox list stays visible alongside the
open thread rather than needing a separate back link — not a dead end.

### 2. Duplicate/out-of-context pages — one flagged, two docs fixed

- **Flagged, not resolved:** `/studio/collections` (`StudioCollectionsView`)
  and `/library/collections` (`MyCollectionsView`) are two different
  components that both manage "collections" for the signed-in artist. It's
  unclear from the code alone whether these serve genuinely different
  purposes (e.g. release-oriented vs. personal-library-oriented) or should
  be merged/repointed — needs a product decision, not guessed here.
- **Fixed:** `docs/VIEW-CATALOG.md` had two stale rows from before recent
  route changes — "Studio Venues *(orphan)*" pointed at
  `src/views/studio/StudioVenuesView.tsx`, which no longer exists on disk
  (the route `/studio/venues` now redirects to `/admin/venues`); removed
  the row and adjusted the studio views summary count (33→32). "Recordings"
  and "Stash" rows still listed their old `/studio/recordings` /
  `/studio/stash` routes, which now redirect to `/library/recordings` /
  `/library/stash` — updated both rows to the real routes.

### 3. Active-tab consistency — no bug found

`StudioNav.tsx`'s `isActive`/`isSubmenuActive`/`isBroadcastSubnavActive`/
`isAudienceSubnavActive` already carefully keep the sidebar Studio item,
the Studio submenu tab, and nested Broadcast/Audience sub-tabs all lit
together per page (e.g. every Broadcast-group page — go-live/schedule/
events/shows/channel — lights both the "Broadcast" Studio submenu tab and
the correct nested tab). `lib/navigationActive.ts`'s existing test suite
(7 tests) passes unchanged. No page found in the sampled routes where only
one nav level highlighted.

### 4. Stable content region — already handled

`RouteTransition`'s `fast` mode (opacity-only, no `AnimatePresence`
remount) is already applied via `AppShell`'s `fastNavigationRoute` regex to
Studio/Admin/Library and the Listen/Favorites tabs specifically so that
their shared chrome (StudioGate/StudioNav, AdminGate, Listen's tab bar)
reconciles in place instead of unmounting/remounting per click — this is
exactly the mechanism the scope bullet asks for, already built and wired.
Governance/Transparency pages intentionally use the full slide transition
(infrequently revisited, per existing code comments) — not a regression.

### 5. Transition animations — already implemented

`RouteTransition` (`@tahti-player/ui`) already provides a slide+scale+fade
transition (`slideVariants`, 0.16s) for normal navigation and a fast
fade-only variant (0.1s) for the high-frequency sections above, with
`useReducedMotion` support. It's wired into all three `AppShell` layout
branches (mobile, artist-page, desktop workspace). Nothing to add here.

## Remaining

- Product decision: is `/studio/collections` vs `/library/collections`
  intentional (two different concepts) or should one absorb the other?
  Once decided, fold this file into HISTORY and drop the INDEX row.

## Verification

`pnpm --filter @tahti-player/tahti-web` `type-check` / `lint` clean.
`vitest run src/lib/navigationActive.test.ts` — 7/7 passing (unchanged).
Only `docs/VIEW-CATALOG.md` was edited (doc-only, no behavior change) —
no new tests needed.
