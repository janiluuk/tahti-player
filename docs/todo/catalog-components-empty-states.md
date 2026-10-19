# Replace hand-rolled chips/tabs and bare empty-state text

**Status:** partial

2026-10-19 sweep. Catalog components (`Badge`, `FilterChips`, `Tabs`, `EmptyState`,
`PageEmpty`, `PageError`) exist and are used broadly. The chip/tab/badge swaps and the
bare-text empties landed in the UX sweep (see HISTORY); batch 75 gave the raw tables on
Status, Transparency, the grant year page, the admin grant cycle and the port inventory
their loading / error-with-Retry / empty states.

## Left

Raw `<table>` surfaces still without a loading / empty / filtered state:

- `HelpView.tsx` (static content table — check whether it needs anything).
- `components/ReleasesPanel.tsx`.
- `components/FanSubscriptionStats.tsx` — another session's open #1221 gives its
  payout table a `PageEmpty`; recheck after it lands.

List-like ones should move to a catalog table; statistic ones can stay raw.

## Verify

- `pnpm --filter @tahti-player/tahti-web type-check && lint && test`.
