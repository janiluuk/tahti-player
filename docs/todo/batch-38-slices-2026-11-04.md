# Batch 38 UX slices 2026-11-04

**Status:** open

Next 30 UX slices after batch 37 (#1823). Branch
`feat/batch-38-slices-2026-11-04`. Bump tahti-web to **0.0.328**.

## Slices

### Finnish

1. **done** — Settings Account Devices + 2FA + API tokens + password rules i18n
2. **done** — Settings Artist pronouns/roles + sign-in hint
3. **done** — Settings Channel Designer/Discovery/Chat/Moderators tabs + sign-in hint
4. **done** — Toast subset (API token create/revoke, visibility/notify prefs, share revoke, image updated, left group, media removed)
5. **done** — Library Sounds dialogs (stats/delete/bulk placeholder/selection aria/track order)
6. **done** — Library Collections create Title/Genres/description + edit/play named
7. **done** — Library Upload recording play/pause named aria (recorded broadcast already i18n)
8. **done** — Studio Releases type labels + Title field + public/distribution aria
9. **done** — Studio release detail chrome (tabs, publish/delete/artwork, credits/export/fingerprint empties)
10. **done** — Admin content-reports filters/status/actions subset
11. **done** — Radio title/tagline/relay/browse/live-now leftovers
12. **done** — Channel blocks programming/shows/stats/pinned (non-schedule Next-up format Kept)
13. **done** — Track detail loading/error/unavailable + BPM/Key/Credits + name-your-price
14. **done** — Smart-link public release chrome (load/empty/tracks/listen-on/locked/credits)
15. **done** — share/edit leftovers → `web.actions` (editNamed, editMotion, shareWith)

### Dates / Kept

16. **done** — AdminDashboardView audit confirmed Kept in date-format-sweep
17. **done** — HistoryStatsSection range/chart helpers documented Kept (range already numericDate)
18. **done** — desktop-library / LocalLibrary count formatters → Kept note
19. **done** — SaveQueueLocalDialog / BackupRestoreDialog → Kept
20. **done** — WriteTagsDialog / SmartPlaylistDialog → Kept
21. **done** — ObsPresetButton / CatalogTable / ShareList → Kept
22. **done** — Leftover toLocale* Left list updated in date-format-sweep

### Polish

23. **skipped** — No ConfirmDialog destructive miss among delete/revoke dialogs (already marked)
24. **done** — Channel shows empty-state i18n (`channelBlocks.noShows*`)
25. **done** — DevicesSessionsPanel Storybook story (toBeInTheDocument play)
26. **done** — finnish-localization + date-format-sweep Done/Left updated
27. **done** — Fold batch-37 into HISTORY; INDEX row for batch-38
28. **done** — WORKPLAN had no matching finished noise to strip
29. **done** — passwordRules tests updated for i18n messages
30. **done** — Version bump 0.0.328 + UI-REDESIGN-WORKLOG

## Skip (batch-wide)

- Radio widget redesign (finish-wip)
- Performance audit SPA
- pageTour / keyboardNavigation full rewrite
- Admin hub card per-page English descriptions
