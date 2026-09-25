import type { AdvancedTheme } from '@tahti-player/themes';

/** Stable id so seeding is idempotent across reloads (unlike
 * `importCustomTheme`'s generated `custom:<slug>-<timestamp>` ids). */
export const TAHTI_BLUE_THEME_ID = 'custom:tahti-blue';

/** The tahti.live pitch palette, re-expressed as an installable custom
 * theme (see `packages/themes/src/basic/tahti-dark.css` for the built-in
 * chrome theme this mirrors — same OKLCH values, exact colour match).
 * Ships pre-installed in the theme store's "Your imported themes" list;
 * `vars` and `dark` are identical since the pitch has a single fixed-dark
 * identity, not a separate light variant. */
// The pitch has one fixed-dark identity, not a separate light variant, so
// the same values are used for both `vars` (light) and `dark` overrides —
// the theme looks identical whichever appearance mode is active.
const TAHTI_BLUE_VARS: Record<string, string> = {
  background: 'oklch(0.1663 0.0402 274.37)',
  'background-secondary': 'oklch(0.2264 0.0552 275.84)',
  'background-input': 'oklch(0.187 0.0486 275.27)',
  foreground: 'oklch(0.976 0.007 268.55)',
  'foreground-secondary': 'oklch(0.7359 0.055 275.54)',
  'foreground-input': 'oklch(0.976 0.007 268.55)',
  primary: 'oklch(0.68 0.16 55)',
  'primary-foreground': 'oklch(0.1663 0.0262 269.37)',
  secondary: 'oklch(0.39 0.105 183.63)',
  'secondary-foreground': 'oklch(0.96 0.025 183.63)',
  border: 'oklch(0.3482 0.0705 275.74)',
  'border-input': 'oklch(0.3482 0.0705 275.74)',
  ring: 'oklch(0.8131 0.165 75.04)',
  'accent-green': 'oklch(0.7923 0.13 183.63)',
  'accent-yellow': 'oklch(0.7334 0.1584 68.72)',
  'accent-purple': 'oklch(0.7289 0.1402 272.62)',
  'accent-blue': 'oklch(0.7289 0.1402 272.62)',
  'accent-orange': 'oklch(0.8131 0.165 75.04)',
  'accent-cyan': 'oklch(0.7923 0.13 183.63)',
  'accent-red': 'oklch(0.7088 0.1839 29.06)',
  'accent-foreground': 'oklch(0.1663 0.0262 269.37)',
  'radius-card': '16px',
  'radius-control': '10px',
  'radius-input': '8px',
  'radius-pill': '20px',
  'font-family': "'Inter', system-ui, -apple-system, sans-serif",
  'default-font-family': "'Inter', system-ui, -apple-system, sans-serif",
  'font-family-heading': "'Space Grotesk', var(--default-font-family)",
  'font-family-mono':
    "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

export const TAHTI_BLUE_THEME: AdvancedTheme = {
  version: 1,
  name: 'Tahti Blue',
  author: 'Tahti',
  description:
    'Deep ink-blue background with an amber signal and teal accent — the tahti.live pitch palette.',
  tags: ['dark', 'tahti'],
  palette: [
    'oklch(0.68 0.16 55)',
    'oklch(0.7923 0.13 183.63)',
    'oklch(0.2264 0.0552 275.84)',
    'oklch(0.1663 0.0402 274.37)',
  ],
  vars: TAHTI_BLUE_VARS,
  dark: TAHTI_BLUE_VARS,
};

export const NUCLEAR_GREEN_THEME_ID = 'custom:nuclear-green';

/** Colours sampled directly from the user's `nuclear.png` reference
 * screenshot (the original Nuclear player's dark teal look) — not
 * hand-picked. One fixed-dark identity, like Tahti Blue: the reference has
 * no light variant. Deliberately doesn't touch `--shadow-x/y`,
 * `--border-width`, or radius — those are the shared neobrutalist depth
 * tokens (Button/Card in @tahti-player/ui already read them), and inherit
 * root's 2px offset-shadow/border treatment so this theme automatically
 * gets the same chunky depth as every other theme once applied. */
const NUCLEAR_GREEN_VARS: Record<string, string> = {
  background: '#0c1915',
  'background-secondary': '#142621',
  'background-input': '#0a1512',
  foreground: '#dadfde',
  'foreground-secondary': '#8fa39d',
  'foreground-input': '#dadfde',
  primary: '#338c77',
  'primary-foreground': '#dadfde',
  secondary: '#2b6357',
  'secondary-foreground': '#dadfde',
  border: '#435c55',
  'border-input': '#435c55',
  ring: '#338c77',
};

export const NUCLEAR_GREEN_THEME: AdvancedTheme = {
  version: 1,
  name: 'Nuclear Green',
  author: 'Tahti',
  description:
    "Deep green-black background with a teal signal — the original Nuclear player's dark look.",
  tags: ['dark', 'nuclear'],
  palette: ['#338c77', '#2b6357', '#142621', '#0c1915'],
  vars: NUCLEAR_GREEN_VARS,
  dark: NUCLEAR_GREEN_VARS,
};

/** Themes imported verbatim from the official Nuclear community theme store
 * (github.com/NuclearPlayer/theme-registry) — same shape as the hand-authored
 * presets above, just sourced from the registry's `themes/*.json` instead of
 * written by hand. Palette/vars/dark values are copied as published; only the
 * `custom:<slug>` ids and TS identifier names are derived locally. */
export const SPOTIFY_DARK_THEME_ID = 'custom:spotify-dark-theme';

const SPOTIFY_DARK_THEME_VARS: Record<string, string> = {
  background: '#000000',
  'background-secondary': '#121212',
  'background-input': '#242424',
  foreground: '#ffffff',
  'foreground-secondary': '#b3b3b3',
  'foreground-input': '#ffffff',
  primary: '#1db954',
  border: '#282828',
  'border-input': '#333333',
  ring: '#1db954',
  'accent-green': '#1db954',
  'accent-yellow': '#f59e0b',
  'accent-purple': '#a855f7',
  'accent-blue': '#3b82f6',
  'accent-orange': '#f97316',
  'accent-cyan': '#06b6d4',
  'accent-red': '#e91429',
  'border-width': '1px',
  'shadow-color': '#000000',
  'shadow-x': '0px',
  'shadow-y': '4px',
  'shadow-blur': '12px',
  'font-family': "'Circular', 'DM Sans', system-ui, -apple-system, sans-serif",
  'font-family-heading': "'Circular', 'Bricolage Grotesque', sans-serif",
  'font-family-mono': "'Space Mono', monospace",
  'font-weight-normal': '400',
  'font-weight-bold': '700',
  'font-weight-extra-bold': '800',
  'radius-sm': '4px',
  'radius-md': '8px',
  'radius-lg': '12px',
};

const SPOTIFY_DARK_THEME_DARK: Record<string, string> = {
  background: '#000000',
  'background-secondary': '#121212',
  'background-input': '#242424',
  foreground: '#ffffff',
  'foreground-secondary': '#b3b3b3',
  'foreground-input': '#ffffff',
  primary: '#1db954',
  border: '#282828',
  'border-width': '1px',
  'shadow-x': '0px',
  'shadow-y': '0px',
};

/** Not part of the registry theme, which only ships a dark palette: a
 * Spotify-style light palette so Light mode is not identical to Dark. Keys it
 * doesn't set (fonts, radii, accents) come from the published values. */
const SPOTIFY_LIGHT_THEME_VARS: Record<string, string> = {
  ...SPOTIFY_DARK_THEME_VARS,
  background: '#ffffff',
  'background-secondary': '#f6f6f6',
  'background-input': '#eeeeee',
  foreground: '#121212',
  'foreground-secondary': '#6a6a6a',
  'foreground-input': '#121212',
  primary: '#1db954',
  'primary-foreground': '#000000',
  border: '#e2e2e2',
  'border-input': '#d4d4d4',
  ring: '#1db954',
  'shadow-color': '#b3b3b3',
  secondary: '#e8e8e8',
  'secondary-foreground': '#121212',
};

/** The registry theme sets no `secondary`, so it would inherit the stock base
 * theme's maroon; a neutral Spotify grey keeps secondary buttons on-palette. */
const SPOTIFY_DARK_SECONDARY: Record<string, string> = {
  secondary: '#2a2a2a',
  'secondary-foreground': '#ffffff',
};

export const SPOTIFY_DARK_THEME: AdvancedTheme = {
  version: 1,
  name: 'Spotify Dark Theme',
  author: 'visa',
  description: "amoled/black theme based around spotify's colours.",
  tags: ['amoled', 'black', 'spotify'],
  palette: ['#000000', '#121212', '#1db954', '#ffffff'] as [
    string,
    string,
    string,
    string,
  ],
  vars: SPOTIFY_LIGHT_THEME_VARS,
  dark: {
    ...SPOTIFY_DARK_THEME_VARS,
    ...SPOTIFY_DARK_THEME_DARK,
    ...SPOTIFY_DARK_SECONDARY,
  },
};

export * from './presets-community-claude-to-neon';
export * from './presets-community-nord-to-yorha';
