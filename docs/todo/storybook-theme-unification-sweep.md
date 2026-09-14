# Storybook theme unification sweep

**Status:** partial

Research complete 2026-09-14: full app swept for input/pill/filter-chip
patterns — all ~140 views across `packages/player` and `packages/tahti-web`
(pass 1, 2026-09-12, covered ~25 views + the `Input`/`Badge`/`FilterChips`
primitive inventory; pass 2, 2026-09-14, covered the remaining ~115).
Findings folded into `docs/VIEW-CATALOG.md` ("Confirmed Duplicates /
No-Ops" section). **None of the swaps below have been applied yet** — this
is still open until the punch list is actioned. Other primitive categories
(`Table`, `Card`, `Dialog`, `Select`) were out of scope for this sweep.

## Punch list — real duplicates, should swap to the Storybook primitive

### `Badge` duplicates

- `tahti-web/src/components/tahti/OnAirBadge.tsx` (used by `RadioView.tsx:47,225`) → `Badge variant="pill" color="red" animated`
- `tahti-web/src/components/PlayerSeekBar.tsx` (`PlayerLiveIndicator`/`PlayerLiveBadge`) → `Badge`
- `tahti-web/src/views/TrackDetailView.tsx:~509` ("Private" pill) → `Badge`
- `tahti-web/src/components/HelpLayer.tsx`, `ChannelBackdropCard.tsx` → `Badge`
- `tahti-web/src/views/ChannelView.tsx:885` (quick-add stage chip) → `FilterChips`/`StudioToggleChip` shape
- `tahti-web/src/views/MyDiscographyView.tsx:338` (embed-provider tag) → `Badge` (needs a size tweak: px-1.5/text-[10px] vs `Badge`'s px-2/text-xs)
- `player/src/views/Artist/components/ArtistSocialHeader.tsx:135-138` (location pill) → `Badge` color orange
- `player/src/views/Artist/components/ArtistBioHeader.tsx:88-94` (genre/mood tags), `:97-101` ("on tour" flag) → `Badge`
- `tahti-web/src/views/TransparencyResolutionsView.tsx:106-114` (3 vote-count pills) → `Badge`

### `FilterChips` duplicates

- `tahti-web/src/views/settings/SettingsPanels.tsx:~1041` (role pills) → `FilterChips`
- `tahti-web/src/components/FanTiersEditor.tsx` → `PerkChip` — 4th reimplementation of the toggle-chip pattern, should use `StudioToggleChip` (or the promoted primitive below)
- `tahti-web/src/views/RadioScheduleView.tsx:697-726` (booking-edit dialog) → `FilterChips` (same file already uses it correctly at `:553-561`)
- `tahti-web/src/views/TransparencyResolutionsView.tsx:62-75` (year-toggle) → `FilterChips`
- `tahti-web/src/views/studio/StudioShowDetailView.tsx:736-761` (episode source) → `FilterChips`
- `tahti-web/src/views/studio/StudioDistributionView.tsx:412-438` ("Catalog methods") and `:795-805` ("Guides") → `FilterChips`
- `tahti-web/src/views/studio/StudioCollectionEditView.tsx:647-663` ("Style" picker) → `FilterChips`
- `tahti-web/src/views/studio/StudioProEditorView.tsx:1380-1401` ("Slope" selector) → `FilterChips` (same file uses it correctly at `:1320`)
- `tahti-web/src/views/studio/StudioScheduleView.tsx:993-1004` (weekday recurrence) and `:160-194` (card/list toggle) → `FilterChips` (soft/lower priority — already `Button`-built, not raw JSX)

### `Input` duplicates

- `tahti-web/src/views/studio/StudioCollectionEditView.tsx:629-634` — raw `<input type="date">` → `Input type="date"` (same file uses `Input` correctly elsewhere)

### Other

- `tahti-web/src/views/GovernanceView.tsx:~475` raw `<textarea>` → `Textarea`

## Promote to `@tahti-player/ui` (already locally de-duped, not a violation to "fix" again)

- `tahti-web/src/components/StudioPanel.tsx` → `StudioToggleChip` — already consolidated from `StudioCollectionsView`/`StudioReleasesView` per its own code comment; still in active use (`StudioCollectionsView.tsx:37,225-232`, `StudioReleasesView.tsx`). Worth graduating into the shared library so `FanTiersEditor`'s `PerkChip` and any future toggle-chip use can consume it directly instead of re-copying.

## No-op wrappers — candidates to delete (use the primitive directly)

- `packages/player/src/views/Settings/TextField.tsx` (wraps `Input`, pure pass-through)
- `tahti-web/src/views/studio/StudioStripeView.tsx` → `StatusPill` (wraps `Badge variant="pill"` + glyph)
- `packages/player/src/views/Sources/components/ProviderPill.tsx` (wraps `Badge variant="pill"` + icon)

## New-primitive candidates (not swaps — nothing to reuse yet)

- Selectable tile w/ label+hint (`OnboardingView.tsx` artist-kind + appearance toggle groups)
- `Meter`/`DonutChart` (`AdminStorageView.tsx` progress bar + conic-gradient donut; `AdminI18nView.tsx:142` translation-progress bar)
- Shared list-row selection style (`AdminUsersView.tsx` user picker)
- Shared image-thumbnail-grid picker (`AdminArtworkPresetsView.tsx`, `StudioReleaseDetailView.tsx` library-picker rows — low priority; `StudioReleaseDetailView.tsx:1077` "Added" span is a soft `Badge` candidate on its own)

## Checked, not a candidate

`SearchBox.tsx` (player), `ChannelView.tsx:1027` social-link pill, `SubgenreTagInput.tsx` (removable tags — different interaction, revisit later), `StudioPanel.tsx` outer shell vs `Box` (low-risk future unification, not a pure duplicate), `AdminUsersView.tsx` selectable list rows (no shared list-row primitive exists yet — legit gap), `JamView.tsx` participant chips (avatar+name, richer than plain `Badge`), `AgmTab.tsx:436` raw file input (hidden-input upload trigger, not a text-input duplicate), `SubscribeView.tsx` text-link buttons (minor, not pill/input), `SignupPaymentView.tsx` status block (full sentence, not a pill), `TransparencyGrantYearView.tsx` stat tile (could reuse `Box` for consistency but not a pill/badge issue). ~65 Admin/Auth/Library/Help/Legal/Utility/Embed views were swept and found already fully on shared primitives with zero duplicates.

## Remaining scope

- Sweep is complete for input/pill/filter-chip patterns across the whole app.
- Not yet swept: `Table`/`Card`/`Dialog`/`Select` primitive categories (out of scope for this pass).
- Next step: decide whether to action the punch list above now (small, mechanical swaps, ~20 call sites) vs. batch with a future pass, then flip this todo to `done` and fold into `HISTORY.md` once applied.
