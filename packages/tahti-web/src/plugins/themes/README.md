# Themes

Theme selection, persistence, and custom-theme import. The simplest
plugin in this directory — a single self-contained Zustand store, no
registry or interface needed because there's only one implementation.

## Contract

`useThemeStore` (from `./store.ts`) is the entire public surface:

| Field | What it's for |
|---|---|
| `themes` | Basic themes from `@tahti-player/themes` (`listBasicThemes()`) |
| `customThemes` | User-imported JSON themes, keyed by a generated `custom:...` id |
| `themeId` / `dark` / `colorMode` | Current selection — `colorMode` is `'light' \| 'dark' \| 'dynamic'`; `dynamic` re-resolves `dark` against the local clock (19:00–06:59 = dark) on a 5-minute interval |
| `init()` | Call once at app boot (see `src/main.tsx`) — resolves and applies the persisted theme; first run defaults to Nuclear Green (`custom:nuclear-green`) in dark mode |
| `setTheme(id)` / `setColorMode(mode)` | User-facing actions |
| `importCustomTheme(json)` / `removeCustomTheme(id)` | Custom theme lifecycle — `importCustomTheme` validates against `@tahti-player/themes`' `AdvancedThemeSchema` and returns `{ ok, id }` or `{ ok: false, error }` |

Persisted to `localStorage` under `tahti-web-theme` (zustand `persist`
middleware); a `merge()` step migrates from older standalone
`tahti-nuclear-theme-id`/`tahti-nuclear-dark` keys if present.

## Consumers

7 call sites as of the last extraction — `main.tsx` (boot), `ThemesPanel`
in `SettingsPanels.tsx` (the actual settings UI), `PluginStorePanel.tsx`,
`OnboardingView.tsx`, `EmbedViews.tsx`, `HistoryStatsSection.tsx` (reads
`dark` for chart theming). All import from `../plugins/themes` (or
`../../plugins/themes`), never `./store` directly.

## Extending

A new *basic* theme is added upstream in `@tahti-player/themes`, not
here. A new *custom* theme is user-imported JSON — nothing to code. The
one thing that would touch this directory: a second theme *source*
(fetched from an API, say) — there's no interface for that yet because
there's only ever been one.

See [`../../../PLUGIN-STORE-PLAN.md`](../../../PLUGIN-STORE-PLAN.md) §1
and [`../../../docs/PLUGINS.md`](../../../docs/PLUGINS.md) for the
general pattern.
