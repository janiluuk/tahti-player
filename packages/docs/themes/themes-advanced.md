---
description: Create and use custom JSON-based themes.
---

# Advanced themes

An advanced theme is a JSON file that sets the app's colour and shape variables, separately for light and dark mode.

## Using a theme file

In **Settings → Themes → Import JSON**, paste the JSON and add it. The theme then appears under **Your imported themes** in the Browse tab. Click it to apply it; it stays until you pick another.

The **Editor** tab builds the same JSON for you with a live preview, if you would rather not write it by hand.

Here's the basic structure:
```json
{
  "version": 1,
  "name": "My Theme",
  "vars": { /* light mode overrides */ },
  "dark": { /* dark mode overrides */ }
}
```

Both `vars` and `dark` are optional. You only need to include the properties you want to change.

## What you can customize

**Colors**
- background, background-secondary, background-input
- foreground, foreground-secondary, foreground-input
- primary
- border, border-input, ring
- accent-green, accent-yellow, accent-purple, accent-blue, accent-orange, accent-cyan, accent-red

**Typography**
- font-family, font-family-heading, font-family-mono
- font-weight-normal, font-weight-bold, font-weight-extra-bold

Custom fonts must be installed on the user's system.

**Borders**
- border-width (default: `2px` light, `1px` dark)

**Corner radii**
- radius-sm, radius-md, radius-lg

**Shadows**
- shadow-color, shadow-x, shadow-y, shadow-blur

## Notes
- `version` must always be `1`
- Put light mode values in `vars` and dark mode values in `dark`
- Variable names don't need the `--` prefix
- You can use hex colors (`#ff0000`), OKLCH (`oklch(70% 0.15 30)`), or any valid CSS color value
- `primary` is used for buttons and for coloured text (links, labels). If your light-mode `primary` is pale, also set `primary-strong`, a darker version used for text; otherwise text uses `primary`
- To go back, apply any other theme in the Browse tab (Nuclear Green is the default)

## Template
A complete template with Tahti Player's default values. Copy this and change what you want.

```json
{
  "version": 1,
  "name": "My Custom Theme",
  "vars": {
    "background": "oklch(0.9491 0.023 341.75)",
    "background-secondary": "oklch(100% 0 0)",
    "background-input": "oklch(100% 0 0)",

    "foreground": "oklch(0% 0 0)",
    "foreground-secondary": "oklch(0.42 0.1 342)",
    "foreground-input": "oklch(0% 0 0)",

    "primary": "oklch(76.91% 0.173 341.75)",

    "border": "oklch(0% 0 0)",
    "ring": "oklch(100% 0 0)",

    "accent-green": "oklch(79.05% 0.209 147.58)",
    "accent-yellow": "oklch(95.53% 0.134 112.76)",
    "accent-purple": "oklch(74.2% 0.149 301.88)",
    "accent-blue": "oklch(55.98% 0.08 270.09)",
    "accent-orange": "oklch(83.39% 0.124 66.56)",
    "accent-cyan": "oklch(88.26% 0.093 212.85)",
    "accent-red": "oklch(68.22% 0.206 24.43)",

    "border-width": "2px",

    "shadow-color": "oklch(0% 0 0)",
    "shadow-x": "2px",
    "shadow-y": "2px",
    "shadow-blur": "0px",

    "font-family": "'DM Sans', system-ui, -apple-system, sans-serif",
    "font-family-heading": "'Bricolage Grotesque', var(--default-font-family)",
    "font-family-mono": "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    "font-weight-normal": "400",
    "font-weight-bold": "700",
    "font-weight-extra-bold": "800",

    "radius-sm": "4px",
    "radius-md": "8px",
    "radius-lg": "12px"
  },
  "dark": {
    "background": "oklch(0.22 0.03 342)",
    "background-secondary": "oklch(0.27 0.035 342)",
    "background-input": "oklch(0.15 0.02 342)",

    "foreground": "oklch(0.90 0.008 342)",
    "foreground-secondary": "oklch(0.78 0.1 342)",
    "foreground-input": "oklch(0.93 0 0)",

    "primary": "oklch(0.65 0.13 342)",

    "border": "oklch(0.48 0.04 342)",

    "border-width": "1px",

    "shadow-x": "0px",
    "shadow-y": "0px"
  }
}
```
