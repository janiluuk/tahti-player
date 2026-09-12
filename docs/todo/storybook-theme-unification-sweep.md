# Storybook theme unification sweep

**Status:** partial

First pass done 2026-09-12 (input areas / pills / filter chips only, ~25 of
~140 views). Findings folded into `docs/VIEW-CATALOG.md` ("Confirmed
Duplicates / No-Ops" section). Remaining views + other primitive
categories (Table, Card, Dialog, Select, etc.) still unaudited.

## Punch list (confirmed 2026-09-12)

### Real duplicates — should swap to the Storybook primitive

- `tahti-web/src/components/tahti/OnAirBadge.tsx` → `Badge`
- `tahti-web/src/components/PlayerSeekBar.tsx` (`PlayerLiveIndicator`/`PlayerLiveBadge`) → `Badge`
- `tahti-web/src/views/TrackDetailView.tsx:~509` ("Private" pill) → `Badge`
- `tahti-web/src/components/HelpLayer.tsx`, `ChannelBackdropCard.tsx` → `Badge`
- `tahti-web/src/views/ChannelView.tsx:885` (quick-add stage chip) → `FilterChips`/`StudioToggleChip` shape
- `tahti-web/src/views/MyDiscographyView.tsx:338` (embed-provider tag) → `Badge` (needs a size tweak: px-1.5/text-[10px] vs `Badge`'s px-2/text-xs)
- `tahti-web/src/views/settings/SettingsPanels.tsx:~1041` (role pills) → `FilterChips`
- `tahti-web/src/components/FanTiersEditor.tsx` → `PerkChip` — 4th reimplementation of the toggle-chip pattern, should use `StudioToggleChip` (or the promoted primitive below)
- `tahti-web/src/views/GovernanceView.tsx:~475` raw `<textarea>` → `Textarea`

### Promote to `@tahti-player/ui` (already locally de-duped, not a violation to "fix" again)

- `tahti-web/src/components/StudioPanel.tsx` → `StudioToggleChip` — already consolidated from `StudioCollectionsView`/`StudioReleasesView` per its own code comment; worth graduating into the shared library so `FanTiersEditor`'s `PerkChip` and any future toggle-chip use can consume it directly instead of re-copying.

### No-op wrappers — candidates to delete (use the primitive directly)

- `packages/player/src/views/Settings/TextField.tsx` (wraps `Input`, pure pass-through)
- `tahti-web/src/views/studio/StudioStripeView.tsx` → `StatusPill` (wraps `Badge variant="pill"` + glyph)
- `packages/player/src/views/Sources/components/ProviderPill.tsx` (wraps `Badge variant="pill"` + icon)

### New-primitive candidates (not swaps — nothing to reuse yet)

- Selectable tile w/ label+hint (`OnboardingView.tsx` artist-kind + appearance toggle groups)
- `Meter`/`DonutChart` (`AdminStorageView.tsx` progress bar + conic-gradient donut)
- Shared list-row selection style (`AdminUsersView.tsx` user picker)

### Checked, not a candidate

`SearchBox.tsx` (player), `ChannelView.tsx:1027` social-link pill, `SubgenreTagInput.tsx` (removable tags — different interaction, revisit later), `StudioPanel.tsx` outer shell vs `Box` (low-risk future unification, not a pure duplicate).

## Remaining scope

- Views not yet swept: everything outside the ~25 views covered (see
  `docs/VIEW-CATALOG.md` coverage note) — in particular `packages/player`
  desktop views, and `Table`/`Card`/`Dialog`/`Select` primitive categories
  across all views (this pass only covered input/pill/chip).
- Decide whether to action the punch list above now (small, mechanical
  swaps) vs. batch with the next sweep pass.
