# Batch 32 slices 2026-11-04

**Status:** partial

Thirty slices from the open backlog (date-format sweep, Finnish localization,
hardening and doc hygiene). Branch `feat/batch-32-slices-2026-11-04`, cut from
`origin/master`. #1814 (`0.0.317`) and #1815 (`0.0.318`) merged while this was
in flight, so the batch ships `0.0.319` after the final rebase. `ListingDate`
only on listings, never on schedule or booking times.

## Slices

1. [x] Date: `ElectionsPanel` (decided / nominations close) → `ListingDate`
2. [x] Date: `CorrectionsPanel` ("Sent") → `ListingDate`
3. [x] Date: `AnnualReportsPanel` (approved / filed / corrected) → `ListingDate`
4. [x] Date: `GovernanceView` meetings list → `ListingDate`
5. [x] Date: `MotionCertificatePanel` (closed / corrected) → `ListingDate`
6. [x] Date: `RestrictionNotice` until-date → `ListingDate`
7. [x] Date: `FanSubscriptionStats` payout history → `ListingDate`
8. [ ] Date: `ChangeEmailForm` — skipped, see below
9. [x] Date: `FeatureRequestsView` comment times → `ListingDate`
10. [x] Date: `AdminPageCommentsPanel` → `ListingDate`
11. [x] Date: `SavedMapComments` row date → `ListingDate`
12. [ ] Date: `TrackInsightsPanel` — skipped, see below
13. [x] Favorite labels → `web.actions` (`MediaIconActions`, `TrackHero`, `CollectionView`, `RadioView`, track context menu, now-playing sheet, `trackTableLabels`, history list, channel stage)
14. [x] Download labels → `web.actions.download*` (`TrackHero`, `ReleaseTrackRow`, `SoundRow`, `SoundsAmbientList`, `PlayableAmbientTrackList`)
15. [x] Settings → Playback body i18n (`web.settingsPlayback`)
16. [x] Settings → Themes body i18n (`web.settingsThemes`)
17. [x] Listen Radio row title / badge / empty / error i18n
18. [x] Listen Coming up row i18n (title, badge, filter, error, locale-aware event start)
19. [ ] Keyboard shortcuts help — skipped, see below
20. [x] `seo.ts` non-Library page titles (`web.seo.*`)
21. [x] `admin-users.ts` role-filter `total` mismatch — noted in `view-first-and-test-hardening-leftovers.md` with the one-line fix once the API contract is confirmed
22. [x] Deleted dead export `importSoundBanner`
23. [x] VIEW-CATALOG: Release Detail, Venue Detail, Admin Grant Cycle, Admin Map, Admin Venues flagged Has Story
24. [x] Stripped finished `[x]` lines from `ui-requests-2026-11-03.md` and the view-first leftovers todo (WORKPLAN has none)
25. [x] Folded batch-30 (#1813 merged) into HISTORY, deleted its todo, removed its INDEX row
26. [x] `date-format-sweep` and `finnish-localization` Done / Left lists updated
27. [x] `ux-backlog` de-green left list and INDEX row synced (only plugin-store categories left)
28. [x] `navigation-flow-audit`: cleared the fixed `/listen/*` aliases row (ChatView already fixed; INDEX row synced)
29. [x] Storybook story `HomeComingUp` (converted surface without a story)
30. [x] tahti-web `0.0.319` + UI-REDESIGN-WORKLOG line

## Skipped

- 8 `ChangeEmailForm`: the only date is the confirmation-link expiry, a deadline with a time of day the member acts on. Exact time stays.
- 12 `TrackInsightsPanel`: the only date is the calendar heatmap tooltip (a chart label, `dateStyle: 'full'`), not a listing.
- 19 Keyboard shortcuts help: the copy lives in the large `content/keyboardNavigation.ts` table, not a small component; needs its own pass.

## Not changed on purpose

- `SavedMapComments` copy/CSV export text keeps full timestamps.
- Event start times in the Coming up row stay exact (schedule), but are now locale-aware.
- `StudioSoundView` back link, `CurrentBoardPanel` dates and the `SetupPasswordView` catalog flag landed in #1815.

## Follow-up (tahti-web `0.0.320`)

A second run of the same batch was cut while #1816 merged, so it kept only the
slices #1816 missed. Everything else in that run duplicated #1816 and was dropped.

1. [x] Date: `GovernanceMeetingDetailView` notice published and minutes approved → `ListingDate` (meeting date and time stay exact)
2. [x] Date: `MotionSeconders` → `ListingDate`
3. [x] Date: `MotionCirculateControl` → `ListingDate`
4. [x] Date: `MotionMeetingNote` meeting date → `ListingDate`
5. [x] Date: `AdminUserEditPanel` member since → `ListingDate`
6. [x] Date: `DeliveryTab` distribution fee paid date → `ListingDate`
7. [x] Download labels: `ReleaseTrackDownloads` (eyebrow, per-track label, preparing) → `web.actions`
8. [x] Favorite: `TrackInfoDialog` Love / Loved → `web.actions.love` / `loved`
9. [x] Fold batch-31 (#1815 merged) into HISTORY, delete its todo and INDEX row
10. [x] Dead code: `fetchExportPlugins` documented keep; stale `lib/locale.ts` item removed (`applyLocale` is used by `languageStore`, `detectLocale` no longer exists)
11. [x] `date-format-sweep` and `finnish-localization` lists synced
12. [x] Version `0.0.320` + UI-REDESIGN-WORKLOG
