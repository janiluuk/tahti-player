# Batch 81 — forty UX / dead-end honesty slices

**Status:** open

Asked for as "continue with next 40 slices" after batch 80 (#1433) merged.

## Theme

Surfaces that still treat API failures as empty/hidden (dead-end leftovers
part 2), plus small library/nav/de-green polish from `ux-backlog.md` and
`navigation-flow-audit.md`.

## Slices

### Dead-end honesty — Studio home + pickers (~12)

1. [x] `useStudioHome` — per-fetch api error flags (broadcasts, schedule, stats, governance)
2. [x] `StudioHomeView` — Recent broadcasts: `PageError` vs “No broadcasts yet”
3. [x] `UpcomingShowsSection` — inline error when schedule fetch failed
4. [x] `GovernanceSection` — inline `PageError` when motions/requests failed
5. [x] `SummaryStatsSection` — don’t show zeros as truth on stats API fail
6. [x] `PlayableTrackContextMenu` — playlist submenu load error
7. [x] `ChannelPlaylistPicker` — `PageError` when collections fetch fails
8. [x] `CollectionOrderButton` / `ProfileOrderDialog` — load error + retry
9. [x] `HearthisCard` — library load `PageError` (not empty toast only)
10. [x] `StashFilesPanel` — files / sounds / collections meta → `PageError`
11. [x] `ReleaseOpsPanel` + `DeliveryTab` — royalties `PageError`
12. [x] `RecordedAtVenuePicker` — venue fetch error caption

### Dead-end honesty — Listen / artist / governance (~14)

13. [x] `MeetingAgendaItems` — non-404 api error (404 keeps legacy fallback)
14. [x] `RadioShowView` — distinguish missing show vs api error; poll soft error
15. [x] `ArtistLikes` — compact `PageError` on api fail (not hide)
16. [x] `SubscribedCollections` — `PageError` when signed-in load fails
17. [x] `NotificationsVisibilityPanel` — profile load `PageError` (not eternal Loading)
18. [x] `ArtistPanel` Connections — social fetch `PageError`
19. [x] `StudioCollectionsView` Play — toast “Could not load” on api fail
20. [x] Stream manager Apply — rotationMsg when collection refetch fails
21. [x] `ArtistUpcomingEvents` — show error vs hide
22. [x] `ArtistReposts` — show error vs hide
23. [x] `ArtistNews` — show error vs hide
24. [x] `CurrentBoardPanel` / `ElectionsPanel` — pass `description={reason}`
25. [x] `AnnualReportsPanel` / `AssociationPanel` — align error pattern
26. [x] `ChannelRadioPlaylistPanel` — api fail vs empty (`ChannelAnnouncementsPanel` already OK)

### Library / UX polish (~10)

27. [x] `LibraryMediaView` — FilterChips (image/video/all) + filtered-empty clear
28. [x] `LibrarySmartLinksView` — `PageError` on releases fail + DSP FilterChips
29. [x] `StudioUploadView` — recent recordings strip respects broadcast meta
30. [x] De-green: `GovernanceView` panel → secondary
31. [x] De-green: `PlaylistDialog` selected row neutral
32. [x] `AdminGrantCycleView` — breadcrumb Admin › Governance › Grants › year
33. [x] Admin layout `data-testid="admin-page-layout"`
34. [x] Listen shell / top nav `data-testid` for layout-stability
35. [x] Tick dead-end leftovers list + navigation audit notes for shipped items
36. [x] Docs: INDEX, fold batch-79/80, bump `tahti-web` patch, worklog

### Fill / verify (~4)

37. [x] `MulticastSection` — already had `PageError` (verified)
38. [x] `MotionDiscussion` — already had `PageError` (verified)
39. [x] `DeliveryTab` platform modes — surface status fetch fail
40. [x] Tests: ChannelPlaylistPicker / MeetingAgendaItems / SubscribedCollections (+ artist views, DeliveryTab, ProfileOrderDialog, LibraryMedia)

## Also fixed

- Embedded Feature Requests “Open full page” → `/governance/feature-requests` (type-check)

## Out of scope

Ops cutover, Tahti Radio HLS, OAuth credentials, Google Picker, release DELETE,
auth refresh, MeetingConflicts member route (org), sign-in → Studio product call,
PlayableTrackTable view modes (larger backlog item).
