# Batch 39 UX slices 2026-11-04

**Status:** open

Next 30 UX slices after batch 38 (#1824). Branch
`feat/batch-39-slices-2026-11-04`. Bump tahti-web to **0.0.329**.

## Slices

### Finnish

1. [x] Settings Notifications sample preference lines
2. [x] Settings Account Mentions panel (privacy already done in 37–38)
3. [x] Settings Artist branding/people — already i18n; social network labels Kept as proper nouns
4. [x] Auth reset/setup password leftover strings (AuthDialog already done)
5. [x] Library Media leftover chrome
6. [x] Studio sounds selection bar / bulk edit leftover
7. [x] Studio releases toolbar leftover
8. [x] Studio release detail leftover chrome
9. [x] Admin ContentReportsTab leftover
10. [x] Radio view leftover chrome (just-played aria / play-queue labels)
11. [x] Channel view blocks leftover (navigation + links)
12. [x] Group detail leftover (smart-link MusicBrainz/Discogs Kept as brands)
13. [x] Track detail remaining labels (buy / PWYW)
14. [x] ApiTokens / SecurityTotp / Devices — already done in batch 38
15. [x] Remaining web.actions call sites subset (Stash share/play; selection bar edit/delete/clear; release Play)

### Dates / Kept

16–22. [x] Document remaining chart/stats `toLocale*` and channel next-up schedule as Kept (no new ListingDate converts; Left list was already chart-only after batch 38)

### Polish

23. [x] ConfirmDialog — Library Media remove uses `actions.remove`
24. [x] Empty-state i18n — Library Media empty
25. [x] MentionsPanel Storybook story
26. [x] Update finnish-localization + date-format-sweep Done/Left
27. [x] Fold batch-38; INDEX for batch-39
28. [x] WORKPLAN — nothing to strip
29. [x] MentionsPanel tests still cover helpers + panel; GroupDetailView story play uses toBeInTheDocument
30. [x] Version 0.0.329 + UI-REDESIGN-WORKLOG

## Skip

- Radio widget redesign (finish-wip)
- Performance audit SPA
- pageTour / keyboardNavigation full rewrite
- Admin hub card English descriptions
