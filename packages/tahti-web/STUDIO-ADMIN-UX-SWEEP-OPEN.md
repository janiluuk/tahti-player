# Studio/Admin UX sweep — open punch list

**Status:** all five themes closed 2026-09-25; re-verified and actioned 2026-09-15 (see `docs/todo/HISTORY.md`
for the full breakdown). Full file-by-file table (archive):
[`STUDIO-ADMIN-UX-SWEEP.md`](STUDIO-ADMIN-UX-SWEEP.md). Do not open the
full table unless you need a specific `file:line`.

## Themes

1. **Missing action icons** — done 2026-09-15 (10 sites fixed).
2. **Inline help → Tooltip** — closed 2026-09-15, zero real remaining instances found.
3. **Missing primitives** — `Alert` already existed. No `SegmentedControl`
   built; the 2 real hand-rolled toggle-group instances found were swapped
   onto `FilterChips` instead (2026-09-15). The Schedule view's icon-only
   card/list toggle (`schedule/ScheduledTimes.tsx`) now uses a new
   `SegmentedControl` (`packages/ui`, radio-group semantics, per-option
   tooltip when `iconOnly`) - done 2026-09-25.
4. **Hand-rolled panels** — `StudioPanel` gained an optional `icon` prop;
   `StudioDistributionView.tsx`'s `GuideDetail` swapped onto it (2026-09-15).
   Two candidates investigated and deliberately left as-is: `StudioScheduleView.tsx`'s
   "Your next broadcasts" (full-bleed content conflicts with `StudioPanel`'s
   fixed padding) and `StudioHomeView.tsx`'s "Have your say" card (the only
   bordered box among that dashboard's otherwise-flat sibling sections —
   swapping it would reduce consistency, not improve it). `OverviewTab.tsx`'s
   3 stat tiles (value+label+sublabel) — **done 2026-09-15**, new `StatTile`
   primitive (`packages/ui`), distinct from `StatChip`'s compact inline
   icon+value+label pill.
5. **Custom actions** — `CopyButton` gained an optional `label` prop and
   clipboard-failure error handling (2026-09-15), for future labeled-copy
   call sites. `TrackDetailView.tsx`'s Share button was checked and left
   alone — already has its own icon/label/toast; forcing it onto
   `CopyButton` would drop the descriptive share icon for a generic one.

## Done (do not re-open)

Empty/error PageEmpty sweeps, toast consolidations on listed Studio files, SaveButton/StatChip/URL-copy conventions, and many moderation-tab icons — folded to `docs/todo/HISTORY.md` / worklog diary.
