# Next twenty slices — batch 65 (UX / UI)

**Status:** open

Plan date: 2026-10-16. One pull request per slice unless a stack note says
otherwise. Prefer mock-app checks at 1366 and 390 px, plus the usual
type-check / eslint / Prettier / touched tests.

Batch 63 (channel offline stage, track toolbar, empties, queue pad, radio /
Discover density, Studio home / Go Live, Settings naming) largely shipped in
the sixty-fourth HISTORY fold (#849–#873). Leftover PRs from that batch
(#881–#884) land first below, then fresh polish from HISTORY leftovers and
listen / channel chrome.

## Land batch-63 leftovers

1. [ ] **Quieter track table headers** — Soften channel TrackTable header
    surface so it does not fight the brand banner (#881).
2. [ ] **Channel hero status row** — Offline / Share / RSS / Report sit in the
    hero identity row, not a floating strip (#882).
3. [ ] **Upcoming shows empty** — Off-air channels with no booked shows get a
    short empty line (#883).
4. [ ] **Player programme titles** — Native `title` on truncated now-playing
    title / artist so hover reveals the full programme (#884).

## Contrast and phone collisions

5. [ ] **Subscribe @handle contrast** — On `/subscribe/<user>` the `@handle`
    is ~1.3:1 on teal; bump to ≥4.5:1 without losing the brand wash.
6. [ ] **Channel designer Show more overlap** — At 390 px the designer’s
    “Edit backdrop design” control must not contain the bio “Show more”
    button (pointer / nesting).
7. [ ] **Phone channel More menu** — At ≤640 px fold Share / RSS / Report
    (and owner Edit when present) into one overflow so the hero stays one
    composition (batch 63 item 5, still open).

## Channel page composition

8. [ ] **Channel blocks breathing room** — Tighten vertical rhythm between
    stage, tracks, comments and upcoming so the page reads as one scroll,
    not stacked cards with equal gaps.
9. [ ] **Channel comments composer focus** — Signed-in empty comments: primary
    field focus ring and “Post” sit on one row; signed-out keeps the single
    sign-in CTA from #851.
10. [ ] **Pinned block label** — When pinned tracks exist, show a quiet
    “Pinned” eyebrow above the table so catalog and pinned are distinct
    without a second toolbar.

## Listen / Discover / Radio

11. [ ] **Listen “Now” badge contrast** — StationCardSubtitle “Now” on live
    cards must meet 4.5:1 on the card surface at both themes.
12. [ ] **Radio directory offline copy** — Offline station cards use one short
    line (“Off air”) instead of a blank now-playing slot.
13. [ ] **Discover section jump** — Keep section anchors; ensure the first
    in-page jump target clears the sticky top nav (scroll-margin).
14. [ ] **Favorites / Feed empty already shipped** — Verify links; if a surface
    still has a bare EmptyState with no CTA, add Discover.

## Library and account chrome

15. [ ] **Library overview listener empty** — Listeners with no tracks see
    Discover (not Upload); artists keep Upload (#852 pattern).
16. [ ] **Settings Channel & chat copy** — One sentence on Moderators tab that
    moderators are chat-only until a channel-edit role exists (closes
    settings-audit decisions in UI).
17. [ ] **Profile self-view quiet chrome** — Own profile already hides
    Follow/Subscribe (#869); drop any leftover Report/Block affordance in the
    overflow if still present.

## Player chrome

18. [ ] **Queue empty CTA** — Empty queue offers Discover / Radio, matching
    search empties.
19. [ ] **Player bar metadata clamp** — Title + artist + programme never push
    transport; single-line clamp with `title` already from #884.
20. [ ] **Workspace sidebar section labels** — Queue / History / Likes headers
    use the same quiet eyebrow weight so the rail is one language.

## Out of scope

- Generation / inpaint / Chimera / live bus FX.
- Full channel art-direction redesign (needs a reference).
- Listener Stash tab decision (needs product call).
- Finnish radio scrapers (API / ops).
- CLI / desktop slices already open as #875–#880.
