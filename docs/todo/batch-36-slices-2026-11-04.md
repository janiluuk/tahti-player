# Batch 36 UX slices 2026-11-04

**Status:** partial

Next 30 UX slices after batch 35 (#1821). Branch
`feat/batch-36-slices-2026-11-04`. Bump tahti-web to **0.0.326**.

## Slices (target)

### Finnish (from finnish-localization Left)

1. [x] Settings Account form field labels / save / toasts subset — cancel subscription dialog, storage loading/unlimited/aria, governance loading
2. [x] Settings Artist form field labels subset — identity: display name, roles chrome, country/city/tip jar, save identity, avatar toasts
3. [x] Settings Channel form field labels subset — directory hint, Username & domain tab, slug field, check/rename
4. [x] Settings Broadcast form field labels leftover — skipped: already fully on `settingsBody.broadcast` / toggles from batches 33–35
5. [x] Notification item text / remaining toast subset — Notifications page chrome (API title/body stay server strings)
6. [x] Library Sounds page chrome / empty
7. [x] Library Collections page chrome / empty
8. [x] Library Upload page chrome
9. [x] Library History Stats tab / Across devices leftover
10. [x] Studio page body subset (sounds list chrome beyond toasts) — covered with Sounds (slice 6)
11. [x] Admin page body subset (not hub card English descriptions) — missed-shows empty
12. [x] Channel page leftover chrome below hero — page tabs + upcoming empty/load error
13. [x] Track detail below-hero leftover labels — comments empty + genre/tag/licence/recorded-at
14. [x] StashFilesPanel / MembershipInvoices / StemMixer download → web.actions
15. [x] Discover plugin-store DISCOVER_WIDGET_LABELS → WIDGET_LABEL_KEYS + add-ons chrome

### Dates

16. [x] AdminGrantCycleView listing dates → Kept (money/count `toLocaleString` only)
17. [x] MotionMeetingLinkControl option label → `numericDay`
18. [x] StudioChannelView listing dates → Kept (play/download counts only)
19. [x] PlayHistoryDialog listing dates → `ListingDate`
20. [x] DuplicatesDialog — Kept (counts)
21. [x] OrganizeFilesDialog leftover date → Kept (counts via `n()`)
22. [x] Remaining toLocale* documented in date-format-sweep Left/Kept

### Polish

23. [x] Channel rename ConfirmDialog → `destructive`
24. [x] Empty-state i18n (Sounds/Collections/Notifications/missed shows/upcoming/track comments)
25. [x] Storybook: ChannelUpcomingShows `NothingBooked` already covers empty chrome (kept)
26. [x] Update finnish-localization + date-format-sweep Done/Left
27. [x] INDEX + fold batch-35 (deleted after #1821)
28. [x] WORKPLAN — no finished batch-36 noise to strip
29. [x] Tests: PlayHistoryDialog ListingDate; MotionMeetingLinkControl numericDay
30. [x] Version `0.0.326` + UI-REDESIGN-WORKLOG

## Skip

- Radio widget redesign (finish-wip)
- Performance audit SPA
- pageTour / keyboardNavigation full rewrite
- Admin hub card per-page English descriptions (kept)
- Schedule exact times
- Settings Broadcast leftover (already i18n)
