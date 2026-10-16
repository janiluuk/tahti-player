# Next twenty slices — batch 63 (UX / UI)

**Status:** partial

Plan date: 2026-10-16. One pull request per slice unless a stack note says
otherwise. Prefer mock-app checks at 1366 and 390 px, plus the usual
type-check / eslint / Prettier / touched tests.

The batch 50 leftovers (region inpaint, reference audio, Chimera, live bus FX)
stay deferred — they need generation / broadcast wiring. Phone drawer scrim
already shipped as a library `Button` (#780). This batch concentrates on
listener-facing polish found on the channel page and empty / chrome surfaces.

## Channel page (redesign leftovers)

1. [x] **Offline stage is content, not a void** — EmptyState + Browse tracks (`ChannelStagePlayer`).
2. [x] **One track toolbar on the channel** — Pinned `filterable`/`playAll`/`addAllToQueue` off; catalog keeps the toolbar.
3. [x] **Quieter track table headers on channel colour schemes** — #881 (`classes.header` / `quietHeader`).
4. [x] **Status row sits with the channel** — #882 (identity row via `ChannelPageActions`).
5. [x] **Phone channel actions overflow** — #882 (More menu at ≤640 px; stacked with 4).
6. [x] **Channel comments quieter empty** — EmptyState + signed-out Log in (`ChannelComments`).
7. [x] **Upcoming shows empty** — #883 (always “No upcoming shows booked.” when schedule is empty).

## Empty states and findability

8. [x] **Search empty → somewhere useful** — #853 (Discover + Radio).
9. [x] **Favorites empty CTA** — Discover links on empty channels/tracks.
10. [x] **Feed empty CTA** — Discover artists when feed is empty.
11. [x] **Messages empty CTA** — Browse artists on empty inbox.
12. [x] **Library overview empty** — Upload / Discover on empty catalog.
13. [x] **Jam join empty / error copy** — Friendlier empty / bad-code states on `/jam/$code`.

## Player chrome and listen surfaces

14. [x] **Queue collapse overlap** — #850 (`PlayerWorkspaceSidebar` pad). Visual check left on desktop player if it still reproduces.
15. [x] **Bottom player radio programme** — #884 (`title` on truncated programme/artist lines).
16. [x] **Radio directory cards** — #856 (phone now-playing / offline hierarchy on Listen catalog cards).
17. [x] **Discover phone density** — #856 (tighter gaps + one-line titles).

## Studio / settings polish

18. [x] **Studio home next actions** — #855 (Upload / Go Live / Edit channel CTA group).
19. [x] **Go Live prep checklist** — #855 (Prep tab ready/not-ready list).
20. [x] **Settings naming call** — #855 (keep “Channel & chat”; moderators stay chat-only).

## Out of scope

- Generation / inpaint / Chimera / live bus FX (batch 50 leftovers).
- Full channel visual redesign with a new art direction (needs a reference).
- Finnish radio scrapers (API / ops).

## Left before fold

- Merge open PRs #881–#884.
- Optional visual check of queue collapse on the desktop player (`queue-collapse-button-overlap.md`).
