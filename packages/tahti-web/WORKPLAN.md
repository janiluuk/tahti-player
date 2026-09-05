# WORKPLAN — tahti-web (epics only)

**Rule:** Epics and themes live here. Leaf tasks live in [`docs/todo/INDEX.md`](../../docs/todo/INDEX.md). When an epic’s last leaf ships, remove the epic row and fold a one-liner into [`docs/todo/HISTORY.md`](../../docs/todo/HISTORY.md). No `[x]` rows.

Sibling API: **`../tahti-org`**. Product matrix: [`FEATURES.md`](FEATURES.md) Remaining. Cutover: [`CUTOVER.md`](CUTOVER.md).

## Now

- [ ] **Independent desktop player** — Library rail, Tahti chrome, Soulseek add-on. Leaf: [desktop-pro-library.md](../../docs/todo/desktop-pro-library.md).
- [ ] **Production cutover** — GAP-MAPPING no-drop ledger before official client switch. See [GAP-MAPPING.md](GAP-MAPPING.md) / [CUTOVER.md](CUTOVER.md).
- [ ] **Registry runtime parity (remaining dashboards)** — bandcamp/deezer/listenbrainz dashboards, omnisource, youtube-liked-songs-sync (or mark out-of-scope).
- [ ] **Storybook / design-system sweeps** — Studio primitives, Input sweep, Studio/Admin UX punch list. Leaves: INDEX rows `studio-storybook-sweep`, `storybook-ui-sweep`; open punch list [`STUDIO-ADMIN-UX-SWEEP-OPEN.md`](STUDIO-ADMIN-UX-SWEEP-OPEN.md).
- [ ] **Image slot chrome** — hover delete + preview modal on remaining upload surfaces. Leaf: [image-upload-hover-lightbox.md](../../docs/todo/image-upload-hover-lightbox.md).
- [ ] **Governance / Channel Designer / overlay leftovers** — see INDEX (`governance-motion-parity`, `channel-designer-*`, `stream-overlay-*`, `queued-ux-fixes-*`, …).
- [ ] **Sibling archive mentions API** — extend `../tahti-org` metadata, then remove artist-page fallback.

## Later / blocked

- [ ] Map screenshot signed-in recapture — [map-screenshot-refresh.md](../../docs/todo/map-screenshot-refresh.md) (`blocked`).

## Reference

Storybook cheat sheet: [`STORYBOOK-SURFACES.md`](STORYBOOK-SURFACES.md). Full audit archive: [`STUDIO-ADMIN-UX-SWEEP.md`](STUDIO-ADMIN-UX-SWEEP.md) (do not scan for backlog).

## Verify

```bash
pnpm --filter @tahti-player/tahti-web type-check
VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev
```
