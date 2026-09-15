# Storybook theme unification sweep

**Status:** partial

Full-app research pass done 2026-09-14 (~140/140 views, input/pill/chip
patterns). Fix pass done 2026-09-14: punch list actioned. `Table`/`Card`/
`Dialog`/`Select` categories are still out of scope for both passes.

## Fixed (2026-09-14)

- `tahti-web/src/components/tahti/OnAirBadge.tsx` — now composes `Badge`
  internally (same visual, same exported API)
- `tahti-web/src/components/PlayerSeekBar.tsx` (`PlayerLiveIndicator`,
  `PlayerLiveBadge`) — now compose `Badge`
- `tahti-web/src/views/TrackDetailView.tsx` "Private" pill → `Badge`
- `tahti-web/src/views/MyDiscographyView.tsx` embed-provider tag → `Badge`
- `tahti-web/src/views/TransparencyResolutionsView.tsx` — year toggle →
  `FilterChips`, vote-count pills → `Badge`
- `tahti-web/src/views/RadioScheduleView.tsx` booking-edit dialog show-type
  toggle → `FilterChips` (matches the file's existing booking-creation use)
- `tahti-web/src/views/studio/StudioShowDetailView.tsx` episode-source
  picker → `FilterChips` (icon support added, see below)
- `tahti-web/src/views/studio/StudioScheduleView.tsx` weekday-recurrence
  picker → `FilterChips` (multi-select)
- `tahti-web/src/views/studio/StudioCollectionEditView.tsx` — raw
  `<input type="date">` → `Input type="date"`; "Style" picker → `FilterChips`
- `tahti-web/src/views/studio/StudioCollectionsView.tsx` and
  `StudioReleasesView.tsx` — `StudioToggleChip` usage replaced with
  `FilterChips` directly (icon support made this possible); `StudioToggleChip`
  itself **deleted** from `StudioPanel.tsx` (no remaining usages)
- `tahti-web/src/components/FanTiersEditor.tsx` — `PerkChip` usage replaced
  with `FilterChips` (multi-select); `PerkChip` **deleted**
- `tahti-web/src/views/settings/panels/ArtistPanel.tsx` (moved from the old
  `SettingsPanels.tsx`) role pills → `FilterChips`
- `tahti-web/src/views/GovernanceView.tsx` raw `<textarea>` → `Textarea`
- `player/src/views/Artist/components/ArtistSocialHeader.tsx` location pill
  → `Badge`
- `player/src/views/Artist/components/ArtistBioHeader.tsx` genre/mood tags
  and "on tour" flag → `Badge` (2 sites)
- `player/src/views/Settings/TextField.tsx` — deleted (pure pass-through
  wrapper around `Input`); call sites in `SettingField.tsx` now use `Input`
  directly

### `FilterChips` gained two capabilities to make the above swaps possible without losing behavior

- `disabled?: boolean` prop (whole group) — needed for `RadioScheduleView`'s
  "don't let this change while saving" case
- `FilterChip.icon?: ReactNode` — needed for `StudioShowDetailView`'s
  upload/record icons and the promoted `StudioToggleChip`/`PerkChip` call
  sites
- Both are covered by new tests in `FilterChips.test.tsx` and a "Disabled"
  example in `FilterChips.stories.tsx`; `items` is now `readonly FilterChip[]`
  so `as const` option arrays type-check.

## Corrected findings (looked like duplicates, turned out not to be — left as-is)

- `tahti-web/src/views/ChannelView.tsx:885` and
  `tahti-web/src/components/ChannelBackdropCard.tsx` quick-add chips — these
  are **action buttons** ("+ add"), not selectable chips; `FilterChips` uses
  `role="radio"`/`"checkbox"` semantics that don't fit a momentary action.
  Fixed instead by swapping the raw `<button>` for `Button variant="text"
size="flexible"` (already a shared primitive) — same visual, same
  behavior, no more hand-rolled markup.
- `tahti-web/src/components/HelpLayer.tsx` disclosure trigger — same
  situation: an interactive expand/collapse control, not a status `Badge`.
  Swapped the raw `<button>` for `Button variant="text" size="flexible"`.
- `tahti-web/src/views/studio/StudioProEditorView.tsx:1380-1401` ("Slope"
  selector) — each option renders a `<FilterCurve>` SVG preview per item;
  `FilterChips` has no per-item custom-content slot beyond icon+label, so
  swapping would drop the curve preview. Left hand-rolled.
- `tahti-web/src/views/studio/StudioDistributionView.tsx:412-438` ("Catalog
  methods") and `:795-805` ("Guides") — both are icon+label+description (or
  icon+label in a tall tile) card grids, not pill lists. Confirmed as
  **new-primitive candidates** (a "selectable tile" component), not
  `FilterChips` swaps — see that section below.
- `tahti-web/src/views/studio/StudioStripeView.tsx` → `StatusPill` — this is
  a private, file-local helper used 5 times in one file; inlining it would
  _increase_ duplication (5x repeated ternary), not reduce it. Not a
  no-op wrapper worth deleting.
- `packages/player/src/views/Sources/components/ProviderPill.tsx` — used as
  a `react-i18next` `<Trans components={{ metadata: <ProviderPill .../> }}>`
  target. `Trans` clones the element and injects translated text into its
  `children` prop; `ProviderPill`'s separate `Icon` prop (rendered before
  `{children}`) is what lets a static icon coexist with Trans's dynamic
  text. Bare `Badge` doesn't have an equivalent separate icon slot, so
  inlining would silently drop the icon when Trans overwrites `children`.
  Not a safe no-op to remove.

## Not yet actioned (soft/lower priority)

- `tahti-web/src/views/studio/StudioScheduleView.tsx:160-194` (card/list
  view toggle) — icon-only buttons each wrapped in their own `Tooltip`;
  `FilterChips` has no per-item tooltip slot. Left as `Button`-built
  (already a shared primitive, just not `FilterChips`).

## Promote to `@tahti-player/ui`

Superseded — `StudioToggleChip` was deleted rather than promoted, since
`FilterChips` (with the new icon slot) now directly covers everything it
did.

## New-primitive candidates (not swaps — nothing to reuse yet)

- ~~Selectable tile w/ icon + label (+ optional hint/description)~~ —
  **Done (2026-09-15):** `SelectableTiles` (`packages/ui`), reuses
  `useFilterChips`'s single/multi-select logic. Swapped onto
  `OnboardingView.tsx` artist-kind + appearance toggle groups and
  `StudioDistributionView.tsx` "Catalog methods" (multi-select, row
  layout) and "Guides" (single-select, centered layout).
- ~~`Meter`/`DonutChart`~~ — **Done (2026-09-15):** both added to
  `packages/ui`. Swapped onto `AdminStorageView.tsx`'s disk-space bar,
  per-user usage bars, and storage-by-file-type donut; `AdminI18nView.tsx`'s
  translation-progress bar.
- Shared list-row selection style (`AdminUsersView.tsx` user picker)
- Shared image-thumbnail-grid picker (`AdminArtworkPresetsView.tsx`,
  `StudioReleaseDetailView.tsx` library-picker rows — low priority;
  `StudioReleaseDetailView.tsx:1077` "Added" span is a soft `Badge`
  candidate on its own)
- `OverviewTab.tsx` (admin governance) 3 value+label+sublabel stat tiles —
  **Done (2026-09-15):** `StatTile` (`packages/ui`), distinct from
  `StatChip`'s compact inline icon+value+label pill. Flagged separately in
  `packages/tahti-web/STUDIO-ADMIN-UX-SWEEP-OPEN.md` theme 3, folded here
  since it's the same "new stat shape" class of gap.

## Checked, not a candidate

`SearchBox.tsx` (player), `ChannelView.tsx:1027` social-link pill,
`SubgenreTagInput.tsx` (removable tags — different interaction, revisit
later), `AdminUsersView.tsx` selectable list rows (no shared list-row
primitive exists yet — legit gap), `JamView.tsx` participant chips
(avatar+name, richer than plain `Badge`), `AgmTab.tsx:436` raw file input
(hidden-input upload trigger, not a text-input duplicate),
`SubscribeView.tsx` text-link buttons (minor, not pill/input),
`SignupPaymentView.tsx` status block (full sentence, not a pill),
`TransparencyGrantYearView.tsx` stat tile (could reuse `Box` for
consistency but not a pill/badge issue). ~65 Admin/Auth/Library/Help/
Legal/Utility/Embed views were swept and found already fully on shared
primitives with zero duplicates.

## Remaining scope

- `Table`/`Card`/`Dialog`/`Select` primitive categories were never in
  scope for this sweep (input/pill/chip only) — a future pass.
- The "new-primitive candidates" above are real product/design decisions
  (what should a selectable tile or a donut chart look like in this design
  system?) — not mechanical swaps, so left for a deliberate follow-up
  rather than actioned here.
- Verified: type-check + lint clean across `tahti-web`, `player`, `ui`.
  `ui` package tests pass (287/287, with `FilterChips`/`LogViewer` snapshot
  updates for the new `disabled`/icon classes). `tahti-web` and `player`
  test suites currently fail widely (~40 and ~324 tests respectively) on a
  **pre-existing, unrelated** `localStorage`/zustand-persist environment
  issue that also fails on files this sweep never touched — a peer session
  in this environment is already tracking it ("CI failure on master").
