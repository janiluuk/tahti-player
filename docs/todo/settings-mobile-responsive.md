# Settings menu mobile responsive

**Status:** open

## Symptom

On mobile, Settings shows only the section nav; content grows off-screen.

## Root cause

`SettingsPanelNav` applied unconditional `flex!`, which beat the list/detail `hidden` class. Nav stayed full-height; content stacked below and overflowed.

## Fix (this branch)

- Nav: `flex` + `sm:flex!` only (no bare `flex!`)
- Dialog: `w-full` + `100dvh` height (no double `100vw-2rem` with overlay padding)
- Content: `min-w-0`, scroll pane, truncate title
- tahti-web modal: tighter mobile padding `p-4 md:p-6 lg:p-8`
- Tests for list/detail class toggle + `flex!` regression
- Storybook `MobileViewport` story

## Responsive audit (whole settings menu)

| Area | Finding | Action |
| --- | --- | --- |
| Shell list/detail | `flex!` blocked hide | Fixed |
| Shell sizing | `100vw-2rem` + overlay `p-4` | Fixed to `w-full` + `dvh` |
| Content overflow | Wide children could expand flex item | `min-w-0` + `overflow-x-hidden` on scroll |
| Section padding | `p-6` cramped on narrow | Softer mobile pad |
| Back header | Long labels | Truncate |
| Desktop | Still side-by-side via `sm:flex!` / `sm:flex-row!` | Unchanged pattern |
| Section bodies (Add-ons, Themes, etc.) | Some grids/tables; rely on pane scroll | No separate mobile nav; watch PluginStore horizontal chips |
| Player desktop SettingsPanel | Same UI package | Inherits fix |

## Remaining watch

- Add-ons / Themes filter chip rows: if any still use non-wrapping horizontal strips, wrap or scroll-x inside the section (not the shell).
- Confirm on a real phone after deploy.
