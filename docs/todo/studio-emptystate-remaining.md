# Studio EmptyState remaining surfaces

**Status:** open

Continue `studio-storybook-sweep.md`: swap hand-rolled empty `<p>` /
centered divs to Storybook `EmptyState` without dropping actions or live
data.

## Done this pass

- `StudioEventsView` — "No events listed yet"
- `StudioReleasesView` — empty releases + create action
- `StudioUpdatesView` — posts / newsletter drafts empties + create actions
- `StudioModerationView` — "No moderators yet"
- `StudioHomeView` — recent broadcasts empty
- `StudioRevenueView` — fan-subs empty + disbursements empty
- `StudioUploadView` — last recordings empty + go-live link
- `StudioDistributionView` — releases empty + royalty reports empty

- `StudioCollectionEditView` — "No tracks yet — add archive items below."
  (2026-09-07; the filtered-search "No tracks match…" row stays inline
  text inside the list, not a full `EmptyState` — it's a zero-results
  message for an existing list, not an actually-empty list)

## Still open

- Inline form hints that are not full empties (e.g. Distribution
  "No credits yet" above an editable credits list)
- Settings panels with `SettingsHint` empties (out of Studio scope)

`tsc --noEmit` clean for `@tahti-player/tahti-web`.
