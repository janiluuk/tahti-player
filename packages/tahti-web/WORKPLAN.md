# WORKPLAN — tahti-web (epics only)

**Rule:** Epics and themes live here. Leaf tasks live in [`docs/todo/INDEX.md`](../../docs/todo/INDEX.md). When an epic’s last leaf ships, remove the epic row and fold a one-liner into [`docs/todo/HISTORY.md`](../../docs/todo/HISTORY.md). No `[x]` rows.

Sibling API: **`../tahti-org`**. Product matrix: [`FEATURES.md`](FEATURES.md) Remaining. Cutover: [`CUTOVER.md`](CUTOVER.md).

## Now

- [ ] **Pro desktop music player** — phased delivery: native catalog → durable import/play → catalog search/sort/filter → local playlists → metadata editing → analysis/smart playlists → folder automation and profiling. Soulseek follows the core library. Leaf: [desktop-pro-library.md](../../docs/todo/desktop-pro-library.md).
- [ ] **Production cutover** — GAP-MAPPING no-drop ledger before official client switch. See [GAP-MAPPING.md](GAP-MAPPING.md) / [CUTOVER.md](CUTOVER.md).
- [ ] **Player release workflow: end-to-end check** — root cause fixed 2026-09-07; both signing secrets set 2026-09-21. Only a real tag-push release run remains, which needs the user's go-ahead because it builds a real release. Leaf: [release-player-workflow-broken.md](../../docs/todo/release-player-workflow-broken.md).

## Next (queued after today's cycles)

- [ ] **Listen-studio UX & visual sweep (2026-10-19)** — lively multi-hue themes + depth on flat surfaces, list/grid view modes + sort across track tables/library lists, artist usability (per-release stats, bulk selection, search, release lifecycle), unified profile/collection surfaces, and catalog component + EmptyState parity. Leaves: [listen-ui-liveliness](../../docs/todo/listen-ui-liveliness.md), [view-modes-track-tables](../../docs/todo/view-modes-track-tables.md), [studio-artist-usability](../../docs/todo/studio-artist-usability.md), [profile-surfaces-unification](../../docs/todo/profile-surfaces-unification.md), [catalog-components-empty-states](../../docs/todo/catalog-components-empty-states.md).
- [ ] **(Later) Discussion topics, not just feature requests** — `admin/moderation/tabs/FeatureRequestsTab.tsx` currently only handles feature-request tickets. Add admin-creatable discussion topics as a distinct concept (not a feature request). Participants get notified on new updates to a topic they're in; users can mute a specific topic.

## Reference

Storybook cheat sheet: [`STORYBOOK-SURFACES.md`](STORYBOOK-SURFACES.md).

## Verify

```bash
pnpm --filter @tahti-player/tahti-web type-check
VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev
```
