# Next twenty slices — batch 63 (UX / UI)

**Status:** open

Plan date: 2026-10-16. One pull request per slice unless a stack note says
otherwise. Prefer mock-app checks at 1366 and 390 px, plus the usual
type-check / eslint / Prettier / touched tests.

The batch 50 leftovers (region inpaint, reference audio, Chimera, live bus FX)
stay deferred — they need generation / broadcast wiring. Phone drawer scrim
already shipped as a library `Button` (#780). This batch concentrates on
listener-facing polish found on the channel page and empty / chrome surfaces.

## Channel page (redesign leftovers)

1. [ ] **Offline stage is content, not a void** — When a channel is offline and
    has no now-playing, replace the large dim `WifiOff` block with a short
    EmptyState (“Off air” + one line) and a “Browse tracks” jump to `#channel-block-sound`.
2. [ ] **One track toolbar on the channel** — Pinned + catalog each render a
    full Filter / Play-all bar. Keep the toolbar on catalog only; pinned rows
    stay a plain table (`filterable`/`playAll`/`addAllToQueue` off).
3. [ ] **Quieter track table headers on channel colour schemes** — Channel
    track headers should not fight the brand banner (softer header surface /
    contrast) while keeping sortable columns readable.
4. [ ] **Status row sits with the channel** — Move Offline / Share / RSS /
    Report into the hero identity row so they are not a floating strip above
    the banner.
5. [ ] **Phone channel actions overflow** — At ≤640 px, fold Share / RSS /
    Report (and owner Edit when present) into one “More” menu so the hero
    stays one composition.
6. [ ] **Channel comments quieter empty** — Empty comments use `EmptyState`
    with a clear “Be the first” prompt (signed-out → sign-in).
7. [ ] **Upcoming shows empty** — Off-air channels with no booked shows get a
    short empty line, not a blank gap.

## Empty states and findability

8. [ ] **Search empty → somewhere useful** — “No results” offers Discover and
    Radio links (and clears the query).
9. [ ] **Favorites empty CTA** — Point to Discover when the list is empty.
10. [ ] **Feed empty CTA** — Point to Discover / artists to follow.
11. [ ] **Messages empty CTA** — Point to start a conversation or Discover.
12. [ ] **Library overview empty** — When tracks/collections are empty, one
    clear next step (Upload for artists, Discover for listeners).
13. [ ] **Jam join empty / error copy** — Friendlier empty and bad-code states
    on `/jam`.

## Player chrome and listen surfaces

14. [ ] **Queue collapse overlap** — Pad the queue scroll area under the
    shared “Collapse panel” control in `PlayerWorkspaceSidebar` so the first
    row never sits under the button (covers desktop + web rails).
15. [ ] **Bottom player radio programme** — Ensure the secondary programme
    line truncates with a `title` and does not shove transport controls.
16. [ ] **Radio directory cards** — Clearer now-playing / offline hierarchy on
    `/radio` cards at phone width.
17. [ ] **Discover phone density** — Slightly tighter card gaps and one-line
    titles on 390 px so more of the page is music, not chrome.

## Studio / settings polish

18. [ ] **Studio home next actions** — First viewport: one primary CTA group
    (Upload / Go Live / Edit channel) instead of equal-weight tiles.
19. [ ] **Go Live prep checklist** — Prep tab shows a short ready/not-ready
    list with links into the missing steps.
20. [ ] **Settings naming call** — Keep “Channel & chat”; document that
    moderators remain chat-only until tahti-org adds a channel-edit role.
    Close the two open questions in `settings-audit.md`.

## Out of scope

- Generation / inpaint / Chimera / live bus FX (batch 50 leftovers).
- Full channel visual redesign with a new art direction (needs a reference).
- Finnish radio scrapers (API / ops).
