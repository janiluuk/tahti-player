# Next slices (left from the batch 50 plan)

**Status:** open

Plan date: 2026-10-09. One pull request per slice unless a stack note says
otherwise. Prefer mock-app checks at 1366 and 390 px, plus the usual
type-check / eslint / Prettier / size guard / touched tests.

Slices 5-15 and 17-20 shipped in batch 51 (see HISTORY, 2026-10-10). Five
are left. 1-4 were skipped in batch 51 because they may depend on
generation or broadcast-bus work that isn't wired yet (not verified); 16
needs a product decision.

## Artist creative

1. [ ] **Region inpaint on trim** — Select a time range on a Pro draft and
    regenerate only that bar; write a new sound version (or edit-list render)
    without replacing the whole track.
2. [ ] **Init / reference audio on generate** — Upload or pick a library track
    as conditioning (A2A) when generation is wired; fail closed when the API
    rejects the payload.
3. [ ] **Chimera fuse** — Combine 2–N takes/demos into one init blob for the
    next render; keep provenance on the resulting version.
4. [ ] **Live bus FX subset** — Run a small psychoacoustic rack (or Owl-style
    spatial + one chop/grain) on the Go Live / channel broadcast bus, kill-
    switched per channel.

## Leftovers

16. [ ] **Phone drawer scrim** — Replace or name the last hand-rolled control
    (needs a product decision: keep as plain overlay vs `Button` `plain`).

## Out of scope for this batch

- Full VST3 host, Underfit LoRA UI, Foundry, full DJ/VJ apps, Quest/XR.
- Server-side multitrack mixdown (client bounce → version upload is enough).
- Studio-in-sidebar / artist tools in Library for listeners (needs a decision).
