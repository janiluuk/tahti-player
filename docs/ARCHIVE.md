# Archived docs

Finished audits, worklogs and superseded trackers removed from the tree on 2026-10-15 so the live docs are easier to find. Each one is still in git: `git show b4091762a:<path>`.

| Path | What it was | Where its content lives now |
| --- | --- | --- |
| `packages/tahti-web/CONVERSION-QUEUE.md` | Artist and admin conversion queue, archived 2026-09-03 | [`FEATURES.md`](../packages/tahti-web/FEATURES.md), [`WORKPLAN.md`](../packages/tahti-web/WORKPLAN.md) |
| `packages/tahti-web/TAHTI-PORT-CHECKLIST.md` | Port checklist toward tahti-web, last audited 2026-09-03 | [`FEATURES.md`](../packages/tahti-web/FEATURES.md) |
| `packages/tahti-web/STUDIO-ADMIN-UX-SWEEP.md`, `STUDIO-ADMIN-UX-SWEEP-OPEN.md` | Studio/Admin design-system audit (2026-09-03) and its punch list, closed 2026-09-25 | [`docs/todo/HISTORY.md`](todo/HISTORY.md) |
| `packages/tahti-web/TAHTI-DARK-THEME-WORKLOG.md` | Phased worklog for the `tahti-dark` theme, status done | `packages/themes/src/basic/tahti-dark.css` |
| `packages/tahti-web/MOBILE-USABILITY-AUDIT.md` | Phone-width snapshot audit, 2026-09-01 | Superseded by the 320-1280 px sweeps of batches 52-59 in `HISTORY.md` (leftovers folded into `HISTORY.md`, 2026-10-17) |
| `docs/port-inventory-thedaw-editor-viz.md` | theDAW port inventory | [`docs/todo/HISTORY.md`](todo/HISTORY.md) (2026-10-18 theDAW v1 fold); PulseForge follow-up in [`docs/todo/track-visualizer-video-editor.md`](todo/track-visualizer-video-editor.md) |
| `docs/todo/thedaw-editor-viz-v1.md` | theDAW editor/viz port tracker (v1 complete) | `HISTORY.md` (2026-10-18) |
| `docs/todo/desktop-integrations.md` | MPD / Discord / Tahti Jam rebuild plan, all shipped (#741-#743) | `HISTORY.md` (2026-10-14), [`FEATURES.md`](../packages/tahti-web/FEATURES.md) §7 |

Cutover-era docs, archived after every public host moved to tahti-web (2026-10-21) and the Next client was removed (2026-10-28). `CUTOVER-PHASE0.md` was deleted 2026-10-28 (`git show 64f00ee95:<path>`); the others on 2026-11-05 (last version: `git show 5d783c45b:<path>`). Their open hosting items moved to `final-season-hardening.md`.

| Path | What it was | Where its content lives now |
| --- | --- | --- |
| `packages/tahti-web/CUTOVER.md`, `CUTOVER-PHASE0.md` | Cutover checklist and decision log for moving the production client to tahti-web | [`docs/todo/final-season-hardening.md`](todo/final-season-hardening.md) (what is still open), `HISTORY.md` |
| `packages/tahti-web/GAP-MAPPING.md` | Feature parity ledger kept until the switch | [`FEATURES.md`](../packages/tahti-web/FEATURES.md) |
| `packages/tahti-web/docs/SCREEN-ATLAS.md` | Screen inventory used while porting | Capture and listener-pass steps: [`packages/tahti-web/README.md`](../packages/tahti-web/README.md); current routes: [`NAVIGATION-SITEMAP.md`](../packages/tahti-web/NAVIGATION-SITEMAP.md) |
