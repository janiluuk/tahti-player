# WORKPLAN — tahti-web (epics only)

**Rule:** Epics and themes live here. Leaf tasks live in [`docs/todo/INDEX.md`](../../docs/todo/INDEX.md). When an epic’s last leaf ships, remove the epic row and fold a one-liner into [`docs/todo/HISTORY.md`](../../docs/todo/HISTORY.md). No `[x]` rows.

Sibling API: **`../tahti-org`**. Product matrix: [`FEATURES.md`](FEATURES.md) Remaining. Cutover: [`CUTOVER.md`](CUTOVER.md).

## Now

- [ ] **Pro desktop music player** — phased delivery: native catalog → durable import/play → catalog search/sort/filter → local playlists → metadata editing → analysis/smart playlists → folder automation and profiling. Soulseek follows the core library. Leaf: [desktop-pro-library.md](../../docs/todo/desktop-pro-library.md).
- [ ] **Production cutover** — GAP-MAPPING no-drop ledger before official client switch. See [GAP-MAPPING.md](GAP-MAPPING.md) / [CUTOVER.md](CUTOVER.md).
- [ ] **Storybook / design-system sweeps** — Input sweep, Studio/Admin UX punch list (Studio primitive sweep finished 2026-09-07, see HISTORY). Open punch list: [`STUDIO-ADMIN-UX-SWEEP-OPEN.md`](STUDIO-ADMIN-UX-SWEEP-OPEN.md).
- [ ] **Image slot chrome** — hover delete + preview modal on remaining upload surfaces. Leaf: [image-upload-hover-lightbox.md](../../docs/todo/image-upload-hover-lightbox.md).
- [ ] **Governance / Channel Designer leftovers** — see INDEX (`governance-gap-list`, `channel-designer-*`, …).
- [ ] **Fix player release workflow (secrets pending)** — root cause fixed 2026-09-07 (step-level `if:` comparing a `secrets.*` value broke GitHub's whole-file parse; moved the check into the shell script instead). New signing keypair generated but the two `gh secret set` commands need the user to run them (Claude Code can't set repo secrets). Leaf: [release-player-workflow-broken.md](../../docs/todo/release-player-workflow-broken.md).

## Next (queued after today's cycles)

- [ ] **(Later) Player performance** — baseline CPU and native memory on the release desktop build, then optimize startup, queue scaling, playback updates, visualizers and section loading; require before/after profiling. Leaf: [player-performance-optimizations.md](../../docs/todo/player-performance-optimizations.md).
- [ ] **(Later) Channel Designer: fold bio/CTA/avatar into backdrop toggles; feed/posts widgets** — bio/CTA/avatar stop being separate draggable blocks, become backdrop show-toggles; add configurable feed/posts channel widgets with tracklist/card-row display toggle. Leaf: [channel-designer-backdrop-fold-and-widgets.md](../../docs/todo/channel-designer-backdrop-fold-and-widgets.md).
- [ ] **(Later) Restyle /governance page** — `views/GovernanceView.tsx` (public/member-facing, route `/governance`, distinct from `AdminGovernanceView`/`StudioGovernanceView`). Rebuild with proper Storybook `@tahti-player/ui` components, a real visual grid layout, and add some color — currently plain/flat.
- [ ] **(Later) Desktop status bar: local track count/size** — web icons + cloud storage shipped 2026-09-08; desktop app should still show local library totals beside cloud.
- [ ] **(Later) Discussion topics, not just feature requests** — `admin/moderation/tabs/FeatureRequestsTab.tsx` currently only handles feature-request tickets. Add admin-creatable discussion topics as a distinct concept (not a feature request). Participants get notified on new updates to a topic they're in; users can mute a specific topic.

- [ ] **(Later) Codebase refactor hotspots** — god modules / mega-files backlog. First slice (`api/http.ts`) shipped 2026-09-10. Leaf: [codebase-refactor-hotspots.md](../../docs/todo/codebase-refactor-hotspots.md).

## Cross-repo work (`../tahti-org` — user-authorized 2026-09-07)

User has explicitly authorized editing `../tahti-org` for cross-repo
blockers found in this backlog, so these don't get silently skipped as
"blocked" forever.

- [x] **Stream Manager now-playing artwork** — turned out to already be resolved on the `../tahti-org` backend; only needed wiring on this side. Shipped 2026-09-07 (workplan cycle 6).
- [x] **Meeting minutes upload** — added the missing presigned-upload route (`POST /api/admin/governance/meetings/:id/minutes/prepare-upload`, mirroring the addon bundle-upload pattern) plus a presigned `minutesUrl` on meeting responses (was raw, unfetchable keys before). Shipped 2026-09-08, `../tahti-org` changes verified via `pnpm vitest run` there (6/6 governance-records tests, 289/289 shared-package tests). See `governance-gap-list.md` #10.
- [x] **Admin Add-ons: found the real backend, fixed the frontend contract** — the disco-widgets→Add-ons rename (2026-09-08) assumed no backend existed for this category; it did, under a different name (`Addon`/`AddonVersion`/`AddonInstall` in `../tahti-org`, full bundle-publish + moderation lifecycle, already had `enabledByDefault`/`defaultConfigJson`). No `../tahti-org` changes needed — rewrote this repo's `admin.ts`/`AdminAddonsView.tsx` to match the real contract (was silently broken against real prod: wrong response key, PATCH/DELETE endpoints that don't exist). See `admin-plugin-management-panel.md`.
- [ ] **Listener purchase flow e2e** — subscription cancel UI shipped 2026-09-07; Purchases tab shipped 2026-09-08 (new `GET /api/me/purchases` in `../tahti-org`, PR [#483](https://github.com/janiluuk/tahti-org/pull/483), not merged by this session). Still needs: a test-mode Stripe Checkout path in `../tahti-org` to actually exercise "subscriber sees gated content" end to end. See `listener-purchase-flow.md`.

## Reference

Storybook cheat sheet: [`STORYBOOK-SURFACES.md`](STORYBOOK-SURFACES.md). Full audit archive: [`STUDIO-ADMIN-UX-SWEEP.md`](STUDIO-ADMIN-UX-SWEEP.md) (do not scan for backlog).

## Verify

```bash
pnpm --filter @tahti-player/tahti-web type-check
VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev
```
