# Studio/Admin UX sweep — open punch list

**Status:** open extract from the 2026-09-03 audit.  
Full file-by-file table (archive): [`STUDIO-ADMIN-UX-SWEEP.md`](STUDIO-ADMIN-UX-SWEEP.md).  
Do not open the full table unless you need a specific `file:line`.

## Still open (themes)

1. **Missing action icons** — remaining Studio/Admin text-only action buttons (many Admin moderation + Studio views already fixed; finish the rest from the archive table `missing-icon` rows).
2. **Inline help → Tooltip** — ~14 static body explainers still to move behind `Tooltip` “?” (reference: ChannelDesigner “About this preview”).
3. **Tab / segmented drift** — four implementations; need canonical `Tabs` or a new SegmentedControl for chip-groups (Stats range pickers are the worst duplicates).
4. **Missing primitives** — shared inline Alert/Banner; SegmentedControl for button-group toggles.
5. **Hand-rolled panels** — remaining safe `StudioPanel`/`Card` swaps (see archive carve-outs: Agm details, toolbars, dropzones).
6. **Custom actions** — remaining gallery/layer/collection/radio actions → `Button` / `FavoriteButton` / `CopyButton` / `SaveButton`.

## Done (do not re-open)

Empty/error PageEmpty sweeps, toast consolidations on listed Studio files, SaveButton/StatChip/URL-copy conventions, and many moderation-tab icons — folded to `docs/todo/HISTORY.md` / worklog diary.
