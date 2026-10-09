# Next twenty slices (batch 50 plan)

**Status:** open

Plan date: 2026-10-09. One pull request per slice unless a stack note says
otherwise. Prefer mock-app checks at 1366 and 390 px, plus the usual
type-check / eslint / Prettier / size guard / touched tests.

Shipped just before this plan (fold in HISTORY): editor/rack/viz port (#598),
CI green (#599), Pro multitrack polish + stems→lanes + bounce upload (#613).

## Artist creative (Studio Pro + channel)

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
5. [ ] **Channel-night viz packs** — Preset packs for Advanced/Cymatics modes
    with “this show uses X”; persist per channel like `channelVizPreset`.
6. [ ] **Stem-aware live mix** — Mute/solo stem lanes on archive or live stems
    without a full DJ view (builds on stems→Multitrack from #613).
7. [ ] **Automation lanes** — Vol/pan/FX automation on Multitrack arrange;
    store in OPFS project JSON; round-trip through editor-projects metadata
    where it already syncs.
8. [ ] **MIDI / piano-roll clips** — Sketch hooks with spessasynth clips in
    Multitrack; bounce clip→audio for publish.
9. [ ] **Metamorph between takes** — Granular morph / identity-bleed between
    two versions for revisions (“same song, new skin”).
10. [ ] **Prompt ↔ score bridge (lite)** — “Describe this melody” /
    “MIDI phrase → prompt” helpers for sketching; no full notation UI.

## Storybook parity (from `storybook-parity-and-atlas-refresh.md`)

11. [ ] **Chrome, Player, ui plays** — Plays with assertions for shell chrome,
    player bar, and shared ui primitives (#474 was closed unmerged).
12. [ ] **Channel Designer stories** — Missing panels, plays for tabs /
    presets / reset / layers, missing args filled.
13. [ ] **Channel surface stories** — Blocks, ChatNotice states, radio show,
    schedule, jam, DMs.
14. [ ] **Studio + Settings stories** — Shows, events, playlists, branding,
    Settings panels.
15. [ ] **Admin + auth stories** — Admin tabs/dialogs and auth pages.

## Leftovers from batches 46–47

16. [ ] **Phone drawer scrim** — Replace or name the last hand-rolled control
    (needs a product decision: keep as plain overlay vs `Button` `plain`).
17. [ ] **Tooltip-wrapped links** — Track edit dialog links and purchase-tiers
    link: stop wrapping `Link` in `Tooltip` in a way that drops handlers; fix
    tests that mock `Link` without a router.
18. [ ] **Listener capture pass** — Extend capture / audit scripts so a plain
    listener account is exercised (not only artist).

## Platform / catalog

19. [ ] **Finnish radio scrapers (remaining)** — YleX, Radio Rock, Suomipop
    (see `finnish-radio-now-playing-scrapers.md`); may need tahti-org JSON
    endpoints or a Yle key decision.
20. [ ] **`check:api-routes` in CI** — Fail PRs when tahti-web calls a path
    missing from the OpenAPI export (allow-list Languages until i18n exists).

## Out of scope for this batch

- Full VST3 host, Underfit LoRA UI, Foundry, full DJ/VJ apps, Quest/XR.
- Server-side multitrack mixdown (client bounce → version upload is enough).
- Studio-in-sidebar / artist tools in Library for listeners (needs a decision).
