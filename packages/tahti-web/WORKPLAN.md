# WORKPLAN — tahti-web (epics only)

**Rule:** Epics and themes live here. Leaf tasks live in [`docs/todo/INDEX.md`](../../docs/todo/INDEX.md). When an epic’s last leaf ships, remove the epic row and fold a one-liner into [`docs/todo/HISTORY.md`](../../docs/todo/HISTORY.md). No `[x]` rows.

Sibling API: **`../tahti-org`**. Product matrix: [`FEATURES.md`](FEATURES.md) Remaining. Cutover: [`CUTOVER.md`](CUTOVER.md).

## Now

- [ ] **Pro desktop music player** — phased delivery: native catalog → durable import/play → catalog search/sort/filter → local playlists → metadata editing → analysis/smart playlists → folder automation and profiling. Soulseek follows the core library. Leaf: [desktop-pro-library.md](../../docs/todo/desktop-pro-library.md).
- [ ] **Production cutover** — GAP-MAPPING no-drop ledger before official client switch. See [GAP-MAPPING.md](GAP-MAPPING.md) / [CUTOVER.md](CUTOVER.md).
- [ ] **Player release workflow: end-to-end check** — root cause fixed 2026-09-07; both signing secrets set 2026-09-21. Only a real tag-push release run remains, which needs the user's go-ahead because it builds a real release. Leaf: [release-player-workflow-broken.md](../../docs/todo/release-player-workflow-broken.md).

## Next (queued after today's cycles)

- [ ] **Listen-studio UX & visual sweep (2026-10-19)** — open items (liveliness, view modes + sort, shared profile/collection surfaces, Studio release lifecycle, remaining empty states) are in [ux-backlog](../../docs/todo/ux-backlog.md); beta → main-site findings in [beta-launch-findings](../../docs/todo/beta-launch-findings.md).
- [ ] **Stay signed in on every client (JWT + refresh tokens)** — short-lived JWT access tokens with rotating, reuse-detected refresh tokens; per-device sessions instead of "every login signs out all other devices"; one self-contained client package (`@tahti-player/auth-session`) shared by web, desktop and CLI, plus one token module in `../tahti-org`. Leaf: [auth-refresh-tokens.md](../../docs/todo/auth-refresh-tokens.md).

## Reference

Storybook cheat sheet: [`STORYBOOK-SURFACES.md`](STORYBOOK-SURFACES.md).

## Verify

```bash
pnpm --filter @tahti-player/tahti-web type-check
VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev
```
