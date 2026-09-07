# WORKPLAN — tahti-web (epics only)

**Rule:** Epics and themes live here. Leaf tasks live in [`docs/todo/INDEX.md`](../../docs/todo/INDEX.md). When an epic’s last leaf ships, remove the epic row and fold a one-liner into [`docs/todo/HISTORY.md`](../../docs/todo/HISTORY.md). No `[x]` rows.

Sibling API: **`../tahti-org`**. Product matrix: [`FEATURES.md`](FEATURES.md) Remaining. Cutover: [`CUTOVER.md`](CUTOVER.md).

## Now

- [ ] **Independent desktop player** — Library rail, Tahti chrome, Soulseek add-on. Leaf: [desktop-pro-library.md](../../docs/todo/desktop-pro-library.md).
- [ ] **Production cutover** — GAP-MAPPING no-drop ledger before official client switch. See [GAP-MAPPING.md](GAP-MAPPING.md) / [CUTOVER.md](CUTOVER.md).
- [ ] **Registry runtime parity (remaining dashboards)** — bandcamp/deezer/listenbrainz dashboards, omnisource, youtube-liked-songs-sync (or mark out-of-scope).
- [ ] **Storybook / design-system sweeps** — Input sweep, Studio/Admin UX punch list (Studio primitive sweep finished 2026-09-07, see HISTORY). Open punch list: [`STUDIO-ADMIN-UX-SWEEP-OPEN.md`](STUDIO-ADMIN-UX-SWEEP-OPEN.md).
- [ ] **Image slot chrome** — hover delete + preview modal on remaining upload surfaces. Leaf: [image-upload-hover-lightbox.md](../../docs/todo/image-upload-hover-lightbox.md).
- [ ] **Governance / Channel Designer / overlay leftovers** — see INDEX (`governance-motion-parity`, `channel-designer-*`, `stream-overlay-*`, `queued-ux-fixes-*`, …).
- [ ] **Sibling archive mentions API** — extend `../tahti-org` metadata, then remove artist-page fallback.

## Next (queued after today's cycles)

- [ ] **Tahti theme refactor** — `Select`'s orange-by-default fixed 2026-09-07 (now matches `Input`'s `bg-background-input` token). Still open: `Button`'s default variant hardcodes `bg-primary` (needs a per-callsite audit, not a blanket swap — deliberately not attempted blind). Also: background visualizer barely visible, and its Settings → Themes toggle (`ThemeVisualizationSettings.tsx`, already built) is gated to a 2-theme allow-list that likely excludes the affected theme. Leaf: [tahti-theme-refactor.md](../../docs/todo/tahti-theme-refactor.md).

## Cross-repo work (`../tahti-org` — user-authorized 2026-09-07)

User has explicitly authorized editing `../tahti-org` for cross-repo
blockers found in this backlog, so these don't get silently skipped as
"blocked" forever. Not started — pick these up once the tahti-web-only
workplan cycles are done. Each needs its own backend slice in
`../tahti-org` (schema/route/DTO) before the frontend half can ship:

- [ ] **Stream Manager now-playing artwork** — `ProgrammeItem`/rotation-status has no artwork field; frontend (`MediaArtwork`'s `onPlay`/`isPlaying` hover pattern) is ready and waiting. See `queued-ux-fixes-2026-09-05.md`.
- [ ] **Stream overlay opacity/scrim toggle** — needs a real semi-transparent layer added to `buildRtmpMirrorOutput`'s Liquidsoap script (no scrim exists in the actual broadcast output today, only in the frontend preview CSS). See `stream-overlay-text-color.md`.
- [ ] **Pay-what-you-want pricing** — needs `pricingModel`/`minimumPrice` fields on the subscription/tier schema plus API validation before any frontend UI. See `pay-what-you-want-pricing.md`.
- [ ] **Listener purchase flow e2e** — needs a test-mode Stripe Checkout path in `../tahti-org` to actually exercise "subscriber sees gated content" end to end. See `listener-purchase-flow.md`.
- [ ] **Plugin registry extraction** — gated on `../tahti-org/docs/todo/plugin-registry-extraction.md`'s own adapter + contract-test checklist being accepted first; do not migrate runtime registry keys before that lands. See `plugin-registry-extraction.md`.

## Reference

Storybook cheat sheet: [`STORYBOOK-SURFACES.md`](STORYBOOK-SURFACES.md). Full audit archive: [`STUDIO-ADMIN-UX-SWEEP.md`](STUDIO-ADMIN-UX-SWEEP.md) (do not scan for backlog).

## Verify

```bash
pnpm --filter @tahti-player/tahti-web type-check
VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev
```
