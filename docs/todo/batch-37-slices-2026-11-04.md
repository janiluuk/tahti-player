# Batch 37 UX slices 2026-11-04

**Status:** open

Next 30 UX slices after batch 36 (#1822). Branch
`feat/batch-37-slices-2026-11-04`. Bump tahti-web to **0.0.327**.

## Slices

### Finnish

1. **done** — Settings Account password/email/privacy (+ storage) copy
2. **done** — Settings Artist story/people/connections/branding save labels
3. **done** — Settings Channel rename confirm / slug + domain toasts
4. **done** — Toast subset: history clear, none playable, stash revoke, artist/collection saves, share button
5. **done** — Library Sounds filters (`SoundFilters`)
6. **done** — Library Collections create dialog / search / types
7. **done** — Library Upload picker + upload/busy/loading labels
8. **done** — History Stats chart-adjacent chrome (day/calendar/empty range/legend)
9. **done** — Studio sounds Load more
10. **done** — Studio collections create dialog + Studio Releases chrome
11. **done** — Admin missed-shows filters / queue / action tooltips
12. **done** — Radio below-tabs chrome (errors, offline, off-air, play/pause, member sets)
13. **done** — Channel blocks leftover (embeds / tracks / chat; schedule left Kept)
14. **done** — Release page chrome (`StudioReleasesView`)
15. **done** — share/edit/follow subset: `editDetails`, `editInStudio`, `editFullBio` → `web.actions`

### Dates / Kept

16. **done** — Document AdminDashboardView audit as Kept (already listed; Left text updated)
17. **done** — StudioBroadcastView agenda → `formatScheduleWindow`
18. **done** — StudioEventsView / StudioEventView → `formatScheduleWindow`
19. **done** — StudioListeningPartiesView → `formatScheduleWindow`
20. **done** — AgmTab meetings → `formatScheduleWindow`; voting windows → `numericDay`
21. **done** — HistoryStatsSection range → `numericDate`
22. **done** — date-format-sweep Done/Left updated for toLocale leftovers

### Polish

23. **skipped** — No remaining destructive ConfirmDialog miss (delete/remove already red)
24. **done** — Empty-state i18n (`studioReleases.empty*` + radio unavailable/off-air + history stats empty range)
25. **done** — Storybook `FormatScheduleWindow` stories
26. **done** — finnish-localization + date-format-sweep Done/Left
27. **done** — Fold batch-36 into HISTORY; INDEX row for batch-37
28. **skipped** — WORKPLAN had no batch-37 noise to strip
29. **done** — `scheduleTime.test.ts` for `formatScheduleWindow`
30. **done** — Version bump 0.0.327 + UI-REDESIGN-WORKLOG

## Skip (batch scope)

- Radio widget redesign (finish-wip)
- Performance audit SPA
- pageTour / keyboardNavigation full rewrite
- Admin hub card per-page English descriptions
- Schedule exact wall-clock times (use schedule helpers only)
