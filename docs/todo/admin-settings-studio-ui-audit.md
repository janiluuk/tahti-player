# Admin/settings/studio UI audit

**Status:** open

Sweep of `packages/tahti-web/src/views/{admin,settings,studio}/` against shared `@tahti-player/ui` components (Button, Input, Select, Toggle, Tabs, FilterChips, Badge, Card, Dialog).

## Findings

### Admin views (28 unique files)
- 27 of 28 admin files already import from `@tahti-player/ui`.
- **1 raw `<button>` element** found: `AdminStorageView.tsx:604` — could use shared `Button` primitive if a `Meter`/`DonutChart` component is added (see below).
- No other hand-rolled DOM primitives (`<input>`, `<select>`, `<textarea>`, raw checkbox/radio patterns).

### Settings views (9 files)
- Only 1 of 9 files imports from `@tahti-player/ui` (`BroadcastPanel.tsx`).
- `ArtistPanel.tsx:405` has a raw `<input type="button">` — minor, not critical.
- No other significant hand-rolled patterns found.

### Studio views (33 files)
- 8 of 33 studio files import from `@tahti-player/ui`.
- Previously audited in Storybook theme unification sweep (`docs/todo/storybook-theme-unification-sweep.md`).

## New-primitive candidates (not yet built, from existing todo file)

- **`Meter`/`DonutChart`** — needed for `AdminStorageView.tsx` progress bar + conic-gradient donut; also `AdminI18nView.tsx:142` translation progress.
- **Shared selectable tile** with icon + label (+ hint/description) — for `OnboardingView.tsx` artist-kind toggles and `StudioDistributionView.tsx`.
- **Shared list-row selection style** — `AdminUsersView.tsx` user picker.
- **Image-thumbnail-grid picker** — `AdminArtworkPresetsView.tsx`, `StudioReleaseDetailView.tsx`.

## Checked, not a candidate (already correct)

~65 other admin/auth/library/help/legal view files swept and confirmed fully on shared primitives with zero duplicates.
