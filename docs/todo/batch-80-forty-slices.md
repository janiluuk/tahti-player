# Batch 80 — forty UX / dead-end / nav slices

**Status:** open

Asked for as "make pr and continue with 40 slices". PR for batch 79:
https://github.com/janiluuk/tahti-player/pull/1432

## Theme

API failures mislabeled as `source: 'mock'` (dead-end leftovers) so views that
check `meta.source === 'api'` treat errors as empty. Plus navigation-audit /
ux-backlog leftovers that do not need org or product go-ahead.

## Slices

### failMeta → honest api/mock meta (~25)

1. [x] `failMeta` returns `source: 'api'` (same as `apiErrorMeta`)
2. [x] `mockFallbackMeta` for intentional mock-on-error fixture returns
3. [x] `withMockFallback` uses `mockFallbackMeta`
4–25. [x] Every EMPTY `failMeta` site inherits api source; MOCK fixture sites
      switched to `mockFallbackMeta` (one mechanical pass = many leaf slices)

### Navigation / UX / Studio (~15)

26. [x] AdminNav: document tab-only route map (navigation audit #2)
27. [x] `PublicGovernanceHistoryView` already → `/governance` (batch 79); tick nav audit 1a
28. [x] FeatureRequests embedded: visible exit / back affordance
29. [x] Settings Money → Revenue leftover copy (`mapScreens` / features)
30. [x] `HeaderStyleTabs` → catalog `Tabs` where practical
31. [x] Optional `DiscoverGatewayBackground` on Listen home
32. [x] StudioShowsView: search / clear-empty
33. [x] MyVenuesView: search / clear-empty
34. [x] LibraryMediaView FilterChips + empty clear
35. [x] LibraryEmbedsView FilterChips + empty clear
36. [x] LibrarySmartLinksView FilterChips + empty clear
37. [x] HelpView bare empty → PageEmpty if needed
38. [x] Studio nav: keep Library/Sounds highlighted when editing a track
39. [x] Player bar: "Try again" after stream error (reload current)
40. [x] Docs: INDEX, tick dead-end leftovers failMeta note, bump versions

## Out of scope

Ops cutover, Tahti Radio HLS, OAuth credentials, Google Picker, release DELETE,
auth refresh tokens, desktop library, sign-in → Studio product call.
