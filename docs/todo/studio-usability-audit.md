# Studio Usability Audit — no homebaked elements, shared-comprehensive

**Status:** open — findings (0 blocker + 3 actionable)

2026-10-20 sweep. 91 component stories + 315 tahti-web stories reviewed across `packages/storybook/`; ~40 studio view and component files reviewed for homebaked UI patterns.

---

## Verdict: Strong — The app is usable

The studio side is built on shared components. Zero CSS-in-JS engines, zero custom `@keyframes`, no homebaked modals/inputs/buttons/dialogs from scratch. All dialogs compose primitives from `@tahti-player/ui` (`Dialog.Root`, `Dialog.Title`, `Dialog.Close`). Every major UI primitive (buttons, inputs, selects, toggles, sliders, badges, tooltips, file pickers) comes from the shared library. ~70 unique imports of `@tahti-player/ui` across studio code.

---

## Findings

| # | Finding | Severity | File(s) |
|---|---------|----------|---------|
| 1 | **ConfirmDialog homebaked** — wraps `<Dialog.Root>` + `<Button>`, not in `@tahti-player/ui` | Medium | `packages/tahti-web/src/components/ConfirmDialog.tsx`; used by stream-manager's `PlaylistDialog` |
| 2 | **DownloadGatesPanel raw `<table>`** — custom schema (Tracks/Gate/Downloads/Blocked/Reposts) doesn't fit `CatalogTable` or `TrackTable` | Low | `views/studio/stats/DownloadGatesPanel.tsx:65-113` |
| 3 | **StatChip no click handler** — callers must add `role="button" + tabIndex={0} + onKeyDown` manually | Low | `components/stream-manager/StatsGrid.tsx:86-100` |
| 4 | **No inline styles or keyframes** (except dynamic data-driven values) | Pass | 7 files, all legitimate |

---

## Coverage Gaps — UI Components Without Storybook Stories

| Component | Location | Notes |
|-----------|----------|-------|
| PlayerShell | `packages/ui/src/components/PlayerShell.tsx` | Tested, no story |
| SectionShell | `packages/ui/src/components/SectionShell/` | Tested, no story |
| RouteTransition | `packages/ui/src/components/RouteTransition.tsx` | Transition wrapper, arguably shouldn't need one |

---

## Summary

| Check | Status | Notes |
|-------|--------|-------|
| Studio uses shared components? | Pass | ~70 unique `@tahti-player/ui` imports; all major primitives sourced |
| Homebaked custom widgets? | Pass | No custom modals, inputs, buttons, form controls. Local shared components (StudioNav/StudioPanel/PageStates) properly factored. |
| Storybook coverage for studio? | Pass | 315 tahti-web stories covering all major surfaces |
| Keyboard accessible? | Mostly pass | StatChip edge-case noted above |

---

## Action Items (priority order)

1. [x] Upstream `ConfirmDialog` to `@tahti-player/ui` (batch 79; tahti-web re-exports)
2. [x] `StatChip` optional `onClick` with button semantics (batch 79)
3. Download gates panel: loading/empty via PageLoading/PageEmpty (batch 79); extract `StatsTable` only if the pattern repeats
