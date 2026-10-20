# Batch 83 — forty UX / dead-end honesty slices

**Status:** open

Asked for as "continue" after batch 82 (#1437) merged.

## Theme

More views that still map API failures to “not found” / empty lists
(admin governance panels, Collection/Search/Subscribe/embeds, Discover,
studio stats). Plus light de-green and nav leftover.

## Slices

### Entity / listen honesty (~12)

1. [x] `CollectionView` — API fail → PageError (not “Collection not found”)
2. [x] `SearchResultsView` — API fail → PageError (not “No results”)
3. [x] `SubscribeView` — API fail vs artist not found
4. [x] Track detail — API fail → PageError (not “Track unavailable”)
5. [x] `VenueDetailView` — API fail → PageError
6. [x] `EmbedViews` — channel/collection/release embeds API fail
7. [x] `GovernanceMeetingDetailView` — meetings list fail → PageError
8. [x] `StudioEpisodeReviewView` — load fail → PageError
9. [x] `PinnedAnnouncementsPanel` — fetch fail
10. [x] `SoundShareLinksSection` — fetch fail
11. [x] `AddToReleasePanel` — releases fail → PageError
12. [x] `AudioRevisionList` — versions fail → PageError

### Admin governance / admin lists (~10)

13. [x] `AgendaItemsPanel` — error + empty → PageError
14. [x] `MemberRegisterPanel` — same
15. [x] `CorrectionsQueuePanel` — load error
16. [x] `BoardTermsPanel` — load error
17. [x] `ElectionsAdminPanel` — load error
18. [x] `LegalHoldsPanel` / `AuditorsPanel` — load error
19. [x] `AdminUsersView` — fetch fail → PageError
20. [x] `AdminTopListsView` — fetch fail
21. [x] `AdminContentView` / `AdminNewsView` — fetch fail
22. [x] `AdminLogsView` — fetch fail

### Discover / feed / account (~8)

23. [x] Discover widgets — per-widget compact error
24. [x] Discover Artists tab — directory fetch PageError
25. [x] `TransparencyView` — per-endpoint section errors
26. [x] `GovernanceView` — soft error when loadErrors[tab] but sibling data ok
27. [x] `GovernanceView` loadMoreMotions — banner on fail
28. [x] `NewsView` — banner when loadError && entries.length > 0
29. [x] `AccountView` — membership API PageError
30. [x] Artist profile gallery/mentions — fail caption (not silent drop)

### Polish / docs (~10)

31. [x] Studio stats `useStatsData` — loadError strip (not fake zeros)
32. [x] `ReleaseOpsPanel` catalog — inline PageError
33. [x] De-green StudioUpload recordings panel
34. [x] De-green MusicAudienceGrids Upload/Revenue tiles (GoLive on-air green kept)
35. [x] TrackHero back → artist Link when username known
36. [x] Library trio: shared `LibrarySectionToolbar` (Media + SmartLinks)
37. [x] AmbientTrackList Favorites — skipped (too large; leave on ux-backlog)
38. [x] Tick dead-end / ux-backlog / nav for shipped items
39. [x] Fold batch-82 into HISTORY; INDEX; bump tahti-web; worklog
40. [x] Tests: CollectionView / SearchResults / AdminTopLists / ReleaseOps / AgendaItems / useStatsData

## Out of scope

Ops cutover, OAuth, Google Picker, release DELETE, PlayableTrackTable view
modes (full), channel add-on block editor, AudioEngine Try again.
