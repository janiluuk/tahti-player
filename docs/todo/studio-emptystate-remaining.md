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

## Still open

- Inline form hints that are not full empties (e.g. Distribution
  "No credits yet" above an editable credits list)
- `StudioCollectionEditView` track empty copy
- Settings panels with `SettingsHint` empties (out of Studio scope)

`tsc --noEmit` clean for `@tahti-player/tahti-web`.
