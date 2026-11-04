# Batch 40 UX slices 2026-11-04

**Status:** open

Next 30 UX slices after batch 39 (#1825). Branch
`feat/batch-40-slices-2026-11-04`. Bump tahti-web to **0.0.330**.

## Done

### Finnish

1. `AddToPlaylistButton` → `web.actions.addToPlaylist`
2. `TrackInfoDialog` add-to-playlist tooltip/aria
3. `PlayableAmbientTrackList` edit / remove / add-to-playlist + empty/filter
4. `trackTableLabels` playAll / addToQueue / inQueue via `web.actions`
5. Library Upload still-processing + editNamed (`StudioUploadView`)
6. Sounds processing / processing-failed / uploaded-on lines
7. Studio Events chrome + empty + ConfirmDialog
8. Studio Groups title/empty/loading/error/open
9. ThemesTab moderation copy
10. Admin Radio member-relay prose
11. Collection page empty/stats/load/not-found + Jam toast
12. Collaborative playlist section chrome
13. Studio Updates toast subset
14. Now Playing action sheet copy/link toasts
15. Stash empty + delete ConfirmDialog

### Dates

16. `formatUploadDate` → `dateLocaleTag`
17. SoundRow shares `formatUploadDate`
18. Studio home `RecentActivitySection` listing dates → `dateLocaleTag`
19–22. Kept notes / Left: chart-stats stay chart-locale (documented)

### Polish

23. ConfirmDialog: SoundShare revoke, PlayHistory clear, Stash delete
24. Empty-state i18n: Studio Events (+ Groups / Collection / Stash / share)
25. AddToPlaylistButton Storybook play (`toBeInTheDocument`)
26. finnish + date-format Done/Left updated
27. Fold batch-39; INDEX for batch-40
28. WORKPLAN: no matching punch-list lines
29. `formatUploadDate` unit test
30. Version 0.0.330 + UI-REDESIGN-WORKLOG

## Skip

- Radio widget redesign (finish-wip)
- Performance audit SPA
- pageTour / keyboardNavigation full rewrite
- Admin hub card English descriptions
