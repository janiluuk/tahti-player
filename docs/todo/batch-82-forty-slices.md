# Batch 82 — forty UX / dead-end / nav slices

**Status:** open

Asked for as "continue with the work for 40 slices and open pr" after batch 81 (#1436).

## Theme

More surfaces that still treat API failures as empty/hidden, plus nav
breadcrumbs and settings revenue redirect polish.

## Slices

### Dead-end honesty (~20)

1. [x] `useShowDetail` — show / episodes / bookings load error state
2. [x] `StudioShowDetailView` — PageError vs “Show not found”
3. [x] `EpisodesTab` — PageError when episodes failed
4. [x] `RecordingsTab` — PageError + bookings soft caption
5. [x] `StudioUpdatesView` — PageError when posts/newsletter load fails empty
6. [x] `ChannelPlaylistBlock` — PageError + retry (not PageEmpty-only)
7. [x] `SmartLinkView` — PageError on fetch fail vs empty
8. [x] `FeedView` — PageError when feed meta is api error + empty
9. [x] `StudioMasteringView` — PageError when editor source api fails
10. [x] `MultistreamPanel` + `useGoLiveState` — destinations load PageError
11. [x] `ArtistView` — profile load PageError vs not found
12. [x] `LibraryEmbedsView` — show PageError even when partial embeds exist
13. [x] Settings `$section` money/fan-* → `/studio/revenue` (nav audit #9)
14. [x] `RssFeedButton` — already toasts on copy fail (verified)
15. [x] `ConfirmDialog` / DownloadGates — prior batches (verified tick)
16. [x] Feature Requests route — prior (verified)
17. [x] HelpView clear-search — already present (verified)
18. [x] Favorites signed-out CTA secondary — already (verified)
19. [x] Studio show detail `data-testid="studio-page-layout"`
20. [x] StudioUpdates `data-testid="studio-page-layout"`

### Nav / polish (~12)

21. [x] `AdminModerationView` breadcrumb Admin → Moderation
22. [x] `AdminOrphanPagesView` breadcrumb Admin → Orphan pages
23. [x] Orphan pages `data-testid="admin-page-layout"`
24. [x] `StudioNav` `data-testid="studio-navigation"`
25. [x] ChannelPlaylistBlock test for PageError + retry
26. [x] Tick navigation-flow-audit for breadcrumbs / settings redirect
27. [x] Tick dead-end leftovers show-detail note
28. [x] Tick ux-backlog partials where applicable
29. [x] Docs: INDEX + this file
30. [x] Bump tahti-web patch + worklog
31. [x] Prettier + type-check
32. [x] Open PR

### Fill / verify (~8)

33. [x] Multicast destinations empty vs error distinction
34. [x] Smart link not-found path retained when no throw reason
35. [x] Feed soft profile failures remain silent (playables only)
36. [x] Bookings error does not block recordings list when episodes ok
37. [x] Mastering: api fallback reason surfaces as PageError
38. [x] Revenue redirect preserves audience-only for `/settings/audience`
39. [x] studio-page-layout testid on show detail
40. [x] Commit + push + `gh pr create`

## Out of scope

Ops cutover, OAuth credentials, Google Picker, release DELETE, auth cookie
cutover, PlayableTrackTable view modes, AmbientTrackRow expansion, Themes
catalog load (store-driven), MeetingConflicts member route (org).
