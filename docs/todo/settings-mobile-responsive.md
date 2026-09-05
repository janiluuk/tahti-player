# Settings menu mobile responsive

**Status:** open

## Symptom

On mobile, Settings shows only the section nav; content grows off-screen (or sits below the fold). Cannot use settings.

## Root cause (confirmed)

`SettingsPanelNav` always applies `flex!` (`display: flex !important`). The list/detail toggle passes `hidden` when a section is open, but `flex!` wins — both panes stay in the column layout, nav keeps `h-full`, content overflows the viewport.

Desktop relies on `sm:flex!` to re-show the nav after the same `hidden` class — that must stay.

## Scope

- Fix `@tahti-player/ui` `SettingsPanel` shell (nav/content/dialog sizing)
- Audit padding / `min-w-0` so section bodies scroll inside the pane
- Tests for mobile list ↔ detail visibility
- Storybook mobile viewport note
