# Studio/Admin UX sweep — open punch list

**Status:** open extract from the 2026-09-03 audit — largely stale, see 2026-09-06 note.
Full file-by-file table (archive): [`STUDIO-ADMIN-UX-SWEEP.md`](STUDIO-ADMIN-UX-SWEEP.md).  
Do not open the full table unless you need a specific `file:line`.

**2026-09-06:** spot-checked several of this list's own named reference
examples against current code — all already fixed: `ChannelLayersMenu`'s
Hide/Remove actions already use `Button size="icon-sm" variant="text"`,
`StudioTrackInsightsView` no longer hand-copies `StudioPageHeader`
markup, `StudioGoLiveView` already uses `Badge` for channel-state
coloring, ChannelDesigner's "About this preview" is already a `Tooltip`,
and `StudioStatsView`'s range picker already uses `FilterChips` (no
second/duplicate range-picker implementation found anywhere in
`views/`). This list was evidently mostly closed out in later passes
that never folded their results back into this file. The themes below
are left as a coarse pointer in case any instances remain, but treat
every item as needing a fresh grep-and-verify before acting — do not
assume any of it is still actually open.

## Themes (unverified — re-check before acting on any of these)

1. **Missing action icons** — remaining Studio/Admin text-only action buttons (many Admin moderation + Studio views already fixed; finish the rest from the archive table `missing-icon` rows).
2. **Inline help → Tooltip** — static body explainers that may still need moving behind `Tooltip` "?" (the doc's own reference example is already fixed — re-verify before assuming others remain).
3. **Missing primitives** — shared inline Alert/Banner; SegmentedControl for button-group toggles.
4. **Hand-rolled panels** — remaining safe `StudioPanel`/`Card` swaps (see archive carve-outs: Agm details, toolbars, dropzones).
5. **Custom actions** — remaining gallery/layer/collection/radio actions → `Button` / `FavoriteButton` / `CopyButton` / `SaveButton`.

## Done (do not re-open)

Empty/error PageEmpty sweeps, toast consolidations on listed Studio files, SaveButton/StatChip/URL-copy conventions, and many moderation-tab icons — folded to `docs/todo/HISTORY.md` / worklog diary.
