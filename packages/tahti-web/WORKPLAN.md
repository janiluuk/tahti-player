# WORKPLAN — tahti-web (epics only)

**Rule:** Epics and themes live here. Leaf tasks live in [`docs/todo/INDEX.md`](../../docs/todo/INDEX.md). When an epic’s last leaf ships, remove the epic row and fold a one-liner into [`docs/todo/HISTORY.md`](../../docs/todo/HISTORY.md). No `[x]` rows.

Sibling API: **`../tahti-org`**. Product matrix: [`FEATURES.md`](FEATURES.md) Remaining. Cutover: [`CUTOVER.md`](CUTOVER.md).

## Now

- [ ] **Independent desktop player** — Library rail, Tahti chrome, Soulseek add-on. Leaf: [desktop-pro-library.md](../../docs/todo/desktop-pro-library.md).
- [ ] **Production cutover** — GAP-MAPPING no-drop ledger before official client switch. See [GAP-MAPPING.md](GAP-MAPPING.md) / [CUTOVER.md](CUTOVER.md).
- [ ] **Storybook / design-system sweeps** — Input sweep, Studio/Admin UX punch list (Studio primitive sweep finished 2026-09-07, see HISTORY). Open punch list: [`STUDIO-ADMIN-UX-SWEEP-OPEN.md`](STUDIO-ADMIN-UX-SWEEP-OPEN.md).
- [ ] **Image slot chrome** — hover delete + preview modal on remaining upload surfaces. Leaf: [image-upload-hover-lightbox.md](../../docs/todo/image-upload-hover-lightbox.md).
- [ ] **Governance / Channel Designer leftovers** — see INDEX (`governance-gap-list`, `channel-designer-*`, …).
- [ ] **Mentions: real source links** — `Mention.sourceId` already exists in `../tahti-org`'s schema and is populated per-surface, but the public mentions route never selects or resolves it, so every mention falls back to the artist-page link. Traced every `recordMentions()` call site and what `sourceId` means per surface — fully scoped, needs a dedicated `tahti-org` worktree (main worktree has another session's uncommitted work). Leaf: [archive-mentions-source-url.md](../../docs/todo/archive-mentions-source-url.md).
- [ ] **Fix player release workflow (secrets pending)** — root cause fixed 2026-09-07 (step-level `if:` comparing a `secrets.*` value broke GitHub's whole-file parse; moved the check into the shell script instead). New signing keypair generated but the two `gh secret set` commands need the user to run them (Claude Code can't set repo secrets). Leaf: [release-player-workflow-broken.md](../../docs/todo/release-player-workflow-broken.md).

## Next (queued after today's cycles)

- [ ] **Tahti theme refactor** — `Select`'s orange-by-default fixed 2026-09-07 (now matches `Input`'s `bg-background-input` token). Still open: `Button`'s default variant hardcodes `bg-primary` (needs a per-callsite audit, not a blanket swap — deliberately not attempted blind). Also: background visualizer barely visible, and its Settings → Themes toggle (`ThemeVisualizationSettings.tsx`, already built) is gated to a 2-theme allow-list that likely excludes the affected theme. Leaf: [tahti-theme-refactor.md](../../docs/todo/tahti-theme-refactor.md).
- [ ] **(Later) Onboarding toast noise** — exempt seeded/mock users, show at most once per session even without explicit dismiss, mark onboarding done before automated screenshots. Leaf: [onboarding-toast-noise.md](../../docs/todo/onboarding-toast-noise.md).
- [ ] **(Later) "Theme is in review" mock toast reappears every reload** — same root cause as the onboarding toast noise item (module-level dedup state, and mock dismiss is a no-op); fix both together. Leaf: [sticky-theme-review-toast.md](../../docs/todo/sticky-theme-review-toast.md).
- [ ] **(Later) Channel Designer: fold bio/CTA/avatar into backdrop toggles; feed/posts widgets** — bio/CTA/avatar stop being separate draggable blocks, become backdrop show-toggles; add configurable feed/posts channel widgets with tracklist/card-row display toggle. Leaf: [channel-designer-backdrop-fold-and-widgets.md](../../docs/todo/channel-designer-backdrop-fold-and-widgets.md).

## Cross-repo work (`../tahti-org` — user-authorized 2026-09-07)

User has explicitly authorized editing `../tahti-org` for cross-repo
blockers found in this backlog, so these don't get silently skipped as
"blocked" forever.

- [x] **Stream Manager now-playing artwork** — turned out to already be resolved on the `../tahti-org` backend; only needed wiring on this side. Shipped 2026-09-07 (workplan cycle 6).
- [ ] **Plugin registry extraction (partial)** — §5.1/§5.2 adapter (`pluginRegistryContract.ts`/`pluginRegistryAdapter.ts`, additive) + a first contract-test suite shipped 2026-09-07 (`packages/player`). Caller migration (§5.4) and the `PluginRegistryHost` half are not started. `../tahti-org` doc updated in PR [#460](https://github.com/janiluuk/tahti-org/pull/460).
- [ ] **Listener purchase flow e2e** — subscription cancel UI shipped 2026-09-07 (backend already existed). Still needs: a Purchases tab (doesn't exist) and a test-mode Stripe Checkout path in `../tahti-org` to actually exercise "subscriber sees gated content" end to end. See `listener-purchase-flow.md`.

## Reference

Storybook cheat sheet: [`STORYBOOK-SURFACES.md`](STORYBOOK-SURFACES.md). Full audit archive: [`STUDIO-ADMIN-UX-SWEEP.md`](STUDIO-ADMIN-UX-SWEEP.md) (do not scan for backlog).

## Verify

```bash
pnpm --filter @tahti-player/tahti-web type-check
VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev
```
