# Archived docs

Finished audits, worklogs and superseded trackers removed from the tree on 2026-10-15 so the live docs are easier to find. Each one is still in git: `git show b4091762a:<path>`.

| Path | What it was | Where its content lives now |
| --- | --- | --- |
| `packages/tahti-web/CONVERSION-QUEUE.md` | Artist and admin conversion queue, archived 2026-09-03 | [`FEATURES.md`](../packages/tahti-web/FEATURES.md), [`WORKPLAN.md`](../packages/tahti-web/WORKPLAN.md) |
| `packages/tahti-web/TAHTI-PORT-CHECKLIST.md` | Prod `apps/web` → tahti-web port checklist, last audited 2026-09-03 | `FEATURES.md` (its three open rows: multitrack editing, channel member email invites, production cutover - the last done 2026-10-28), [`GAP-MAPPING.md`](../packages/tahti-web/GAP-MAPPING.md) |
| `packages/tahti-web/CUTOVER-PHASE0.md` | Cutover decision log, deleted 2026-10-28 after the cutover (`git show 64f00ee95:<path>`) | i18n decision in [`DECISIONS.md`](DECISIONS.md); outcome in [`CUTOVER.md`](../packages/tahti-web/CUTOVER.md) |
| `packages/tahti-web/STUDIO-ADMIN-UX-SWEEP.md`, `STUDIO-ADMIN-UX-SWEEP-OPEN.md` | Studio/Admin design-system audit (2026-09-03) and its punch list, closed 2026-09-25 | [`docs/todo/HISTORY.md`](todo/HISTORY.md) |
| `packages/tahti-web/TAHTI-DARK-THEME-WORKLOG.md` | Phased worklog for the `tahti-dark` theme, status done | `packages/themes/src/basic/tahti-dark.css` |
| `packages/tahti-web/MOBILE-USABILITY-AUDIT.md` | Phone-width snapshot audit, 2026-09-01 | Superseded by the 320-1280 px sweeps of batches 52-59 in `HISTORY.md` (leftovers folded into `HISTORY.md`, 2026-10-17) |
| `docs/port-inventory-thedaw-editor-viz.md` | theDAW port inventory | [`docs/todo/HISTORY.md`](todo/HISTORY.md) (2026-10-18 theDAW v1 fold); PulseForge follow-up in [`docs/todo/track-visualizer-video-editor.md`](todo/track-visualizer-video-editor.md) |
| `docs/todo/thedaw-editor-viz-v1.md` | theDAW editor/viz port tracker (v1 complete) | `HISTORY.md` (2026-10-18) |
| `docs/todo/desktop-integrations.md` | MPD / Discord / Tahti Jam rebuild plan, all shipped (#741-#743) | `HISTORY.md` (2026-10-14), [`FEATURES.md`](../packages/tahti-web/FEATURES.md) §7 |
