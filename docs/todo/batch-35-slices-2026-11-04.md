# Batch 35 UX slices 2026-11-04

**Status:** partial

Next 30 UX slices after batches 32–34. Branch
`feat/batch-35-slices-2026-11-04`. Bump tahti-web to **0.0.325** (master was
0.0.323; #1809 merged at 0.0.324).

## Slices (target)

### ListingDate / dates

1. [x] Remaining `toLocaleDateString` in Studio stats helpers — skipped: chart/heatmap labels (kept in date-format-sweep); converted Studio editor list `Updated` → `ListingDate` instead
2. [x] `DesktopLibraryPanel` / desktop-library listing dates — skipped: counts only / desktop-native, no listing dates
3. [x] `LocalLibrary*` listing dates — skipped: counts only, no listing dates
4. [x] `BackupRestoreDialog` / `SaveQueueLocalDialog` — skipped: counts only
5. [x] `ObsPresetButton` leftover — skipped: sample-rate number format, not a date (already in Kept)
6. [x] Admin Catalog (`AdminContentView`) + Admin Radio featured/history → `ListingDate`; dashboard audit events stay exact
7. [x] `FanSubscriptionStats` already ListingDate; `fanSubscriptionStatusLabel` → i18n `web.fanSubscription.endsOn`
8. [x] `channelRenameNote` → i18n + `numericDate` for redirect expiry
9. [x] `artistProfile.ts` "Joined" → i18n `web.artistProfile.joined` (month/year kept)
10. [x] ui `CatalogTable` / `ShareList` — skipped: format counts/percentages, not dates (callers unchanged)

### Finnish

11. [x] Settings → Logs chrome (App group beside Language/Themes)
12. [x] Studio hub empty discography + governance/recent section titles/empties
13. [x] Admin moderation Inbox tabs + breadcrumbs via `labelKey`
14. [x] Discover Community stories empty/loading/error
15. [x] Radio station page chrome
16. [x] Collection public page Play / add-to-queue / Start a Jam → `web.actions`
17. [x] Green room / Broadcast leftover pool labels + tab/session chrome
18. [x] Support tickets member UI labels/empties (reply times stay exact)
19. [x] Transparency ledger empty + public governance history empties/labels
20. [x] Studio sounds/releases toast strings → `web.toasts.*`

### Polish

21. [x] `date-format-sweep` Done/Left updated for this batch
22. [x] `finnish-localization` Done/Left updated for this batch
23. [x] `ux-backlog` note OrganizeFiles destructive
24. [x] INDEX: batch-35 row; folded batch-33/34 after merge
25. [x] WORKPLAN / VIEW-CATALOG notes only where this batch touched (no new routes)
26. [x] Folded batch-33 (#1817), batch-34 (#1820) and studio-updates (#1809) into HISTORY; deleted their todos
27. [x] `OrganizeFilesDialog` move ConfirmDialog → `destructive`
28. [x] Studio hub empty discography i18n (also slice 12)
29. [x] Storybook: `ListingDate` Recent / Absolute / DateOnly
30. [x] Version `0.0.325` + UI-REDESIGN-WORKLOG line

## Skip

- Radio widget redesign + performance audit (finish-wip / perf todos)
- #1809 merged while this branch was open; folded its todo
- Schedule exact times, pageTour rewrite
