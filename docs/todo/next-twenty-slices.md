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

1. [x] **Quieter track table headers** — Soften channel TrackTable header
    surface so it does not fight the brand banner (#881).
2. [x] **Channel hero status row** — Offline / Share / RSS / Report sit in the
    hero identity row, not a floating strip (#882).
3. [x] **Upcoming shows empty** — Off-air channels with no booked shows get a
    short empty line (#883).
4. [x] **Player programme titles** — Native `title` on truncated now-playing
    title / artist so hover reveals the full programme (#884).

## Contrast and phone collisions

5. [x] **Subscribe @handle contrast** — On `/subscribe/<user>` the `@handle`
    is ~1.3:1 on teal; bump to ≥4.5:1 without losing the brand wash (#886).
6. [x] **Channel designer Show more overlap** — At 390 px the designer’s
    “Edit backdrop design” control must not contain the bio “Show more”
    button (pointer / nesting) (#889).
7. [x] **Phone channel More menu** — At ≤640 px fold Share / RSS / Report
    (and owner Edit when present) into one overflow so the hero stays one
    composition (#890).

## Channel page composition

8. [x] **Channel blocks breathing room** — Tighten vertical rhythm between
    stage, tracks, comments and upcoming so the page reads as one scroll
    (#891).
9. [x] **Channel comments composer focus** — Signed-in empty comments: primary
    field and “Post” sit on one row from `sm` up (#893).
10. [x] **Pinned block label** — Quiet “Pinned” / “Catalog” eyebrows above the
    tables (#891).

## Listen / Discover / Radio

11. [x] **Listen “Now” badge contrast** — Solid foreground weight, no opacity
    trick (#892).
12. [x] **Radio directory offline copy** — Offline station / preset cards use
    “Off air” (#892).
13. [x] **Discover section jump** — Widget cards get `id` + `scroll-mt-20`
    under the sticky top nav (#894).
14. [x] **Favorites / Feed empty** — Already ship Discover CTAs on master
    (batch 63 empties); verified, no new PR.

## Library and account chrome

15. [x] **Library overview listener empty** — Already points listeners at
    Discover (not Upload) on master; no new PR.
16. [x] **Settings Channel & chat copy** — Moderators panel already states
    chat-only / cannot change channel; no new PR.
17. [x] **Profile self-view quiet chrome** — Report/Block already gated by
    `!isSelf` in ArtistProfileSections; no new PR.

## Player chrome

18. [x] **Queue empty CTA** — Empty queue offers Discover / Radio (#895).
19. [x] **Player bar metadata clamp / titles** — Truncation on master;
    native `title` tooltips in #884.
20. [x] **Workspace sidebar section labels** — Quiet Queue / override eyebrows
    (#896).

## Out of scope

- Generation / inpaint / Chimera / live bus FX.
- Full channel art-direction redesign (needs a reference).
- Listener Stash tab decision (needs product call).
- Finnish radio scrapers (API / ops).
- CLI / desktop slices already open as #875–#880.
