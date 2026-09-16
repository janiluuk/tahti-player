# WORKPLAN — tahti-web (epics only)

**Rule:** Epics and themes live here. Leaf tasks live in [`docs/todo/INDEX.md`](../../docs/todo/INDEX.md). When an epic’s last leaf ships, remove the epic row and fold a one-liner into [`docs/todo/HISTORY.md`](../../docs/todo/HISTORY.md). No `[x]` rows.

Sibling API: **`../tahti-org`**. Product matrix: [`FEATURES.md`](FEATURES.md) Remaining. Cutover: [`CUTOVER.md`](CUTOVER.md).

## Now

- [ ] **Pro desktop music player** — phased delivery: native catalog → durable import/play → catalog search/sort/filter → local playlists → metadata editing → analysis/smart playlists → folder automation and profiling. Soulseek follows the core library. Leaf: [desktop-pro-library.md](../../docs/todo/desktop-pro-library.md).
- [ ] **Production cutover** — GAP-MAPPING no-drop ledger before official client switch. See [GAP-MAPPING.md](GAP-MAPPING.md) / [CUTOVER.md](CUTOVER.md).
- [ ] **Storybook / design-system sweeps** — Input sweep, Studio/Admin UX punch list (Studio primitive sweep finished 2026-09-07, see HISTORY). Open punch list: [`STUDIO-ADMIN-UX-SWEEP-OPEN.md`](STUDIO-ADMIN-UX-SWEEP-OPEN.md).
- [ ] **Channel Designer leftovers** — see INDEX (`channel-designer-*`, …).
- [ ] **Fix player release workflow (secrets pending)** — root cause fixed 2026-09-07 (step-level `if:` comparing a `secrets.*` value broke GitHub's whole-file parse; moved the check into the shell script instead). New signing keypair generated but the two `gh secret set` commands need the user to run them (Claude Code can't set repo secrets). Leaf: [release-player-workflow-broken.md](../../docs/todo/release-player-workflow-broken.md).

## Next (queued after today's cycles)

- [ ] **(Later) Player performance** — baseline CPU and native memory on the release desktop build, then optimize startup, queue scaling, playback updates, visualizers and section loading; require before/after profiling. Leaf: [player-performance-optimizations.md](../../docs/todo/player-performance-optimizations.md).
- [ ] **(Later) Discussion topics, not just feature requests** — `admin/moderation/tabs/FeatureRequestsTab.tsx` currently only handles feature-request tickets. Add admin-creatable discussion topics as a distinct concept (not a feature request). Participants get notified on new updates to a topic they're in; users can mute a specific topic.

- [ ] **(Later) Codebase refactor hotspots** — god modules / mega-files backlog. First slice (`api/http.ts`) shipped 2026-09-10. Leaf: [codebase-refactor-hotspots.md](../../docs/todo/codebase-refactor-hotspots.md).

## Reference

Storybook cheat sheet: [`STORYBOOK-SURFACES.md`](STORYBOOK-SURFACES.md). Full audit archive: [`STUDIO-ADMIN-UX-SWEEP.md`](STUDIO-ADMIN-UX-SWEEP.md) (do not scan for backlog).

## Verify

```bash
pnpm --filter @tahti-player/tahti-web type-check
VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev
```
