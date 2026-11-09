import {
  interpolate,
  modeLrgb,
  modeOklab,
  modeOklch,
  modeRgb,
  parse,
  useMode,
  wcagContrast,
  wcagLuminance,
  type Color,
} from 'culori/fn';

import type { AdvancedTheme } from './schema';
import { parseAdvancedTheme } from './validate';

[modeRgb, modeLrgb, modeOklab, modeOklch].forEach((mode) => useMode(mode));

const escapeValue = (v: string) => v.replace(/\n/g, ' ').trim();

/** Rough perceived lightness 0–1 of an `oklch(…)`, `#rgb(a)`/`#rrggbb(aa)`
 * colour; null for anything else (named colours, var(), gradients). */
export function colourLightness(value: string): number | null {
  const v = value.trim().toLowerCase();
  const oklch = v.match(/^oklch\(\s*([\d.]+)(%?)/);
  if (oklch) {
    const n = Number(oklch[1]);
    return oklch[2] === '%' ? n / 100 : n;
  }
  const hex = v.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    const h = hex[1];
    const full =
      h.length <= 4
        ? h
            .slice(0, 3)
            .split('')
            .map((c) => c + c)
            .join('')
        : h.slice(0, 6);
    const [r, g, b] = [0, 2, 4].map(
      (i) => parseInt(full.slice(i, i + 2), 16) / 255,
    );
    return Math.cbrt(0.2126 * r + 0.7152 * g + 0.0722 * b);
  }
  return null;
}

/** Text on the primary colour: the theme's background or foreground,
 * whichever is further from the primary in lightness. */
function primaryForeground(vars: Record<string, string>): string | null {
  const primary = colourLightness(vars.primary ?? '');
  const background = colourLightness(vars.background ?? '');
  const foreground = colourLightness(vars.foreground ?? '');
  if (primary === null || background === null || foreground === null) {
    return null;
  }
  return Math.abs(primary - background) >= Math.abs(primary - foreground)
    ? 'var(--background)'
    : 'var(--foreground)';
}

/** Tokens a theme may leave out, derived from ones it sets — otherwise they
 * fall through to the stock theme and the theme "doesn't reach" buttons,
 * inputs and secondary surfaces. */
const DERIVED: Array<[token: string, from: string, value: string]> = [
  ['primary-strong', 'primary', 'var(--primary)'],
  ['secondary', 'background-secondary', 'var(--background-secondary)'],
  ['secondary-foreground', 'foreground', 'var(--foreground)'],
  ['background-input', 'background', 'var(--background)'],
  ['foreground-input', 'foreground', 'var(--foreground)'],
  ['border-input', 'border', 'var(--border)'],
  [
    'border-subtle',
    'border',
    'color-mix(in oklch, var(--border) 35%, var(--background))',
  ],
];

/** WCAG 1.4.11 minimum for focus indicators and UI component boundaries.
 * Computed mixes aim a little higher so rounding in the browser's
 * color-mix never lands them under it. */
const NON_TEXT_CONTRAST = 3;
const MIX_TARGET = 3.2;

/** Wcag luminance where black and white text contrast equally; darker
 * backgrounds want dark native controls. */
const DARK_SCHEME_LUMINANCE = 0.179;

function resolveColour(
  vars: Record<string, string>,
  token: string,
): Color | null {
  let value = vars[token];
  for (let depth = 0; value?.startsWith('var(') && depth < 5; depth++) {
    value = vars[value.slice(4, -1).replace(/^--/, '').trim()];
  }
  return value ? (parse(value) ?? null) : null;
}

function surfaces(vars: Record<string, string>): Color[] {
  return ['background', 'background-secondary'].flatMap((token) => {
    const colour = resolveColour(vars, token);
    return colour ? [colour] : [];
  });
}

function standsOut(colour: Color, on: Color[], ratio: number): boolean {
  return on.every((surface) => wcagContrast(colour, surface) >= ratio);
}

/** The first of `tokens` that reaches 3:1 on the page and raised surface. */
function firstLegible(
  vars: Record<string, string>,
  tokens: string[],
): string | null {
  const on = surfaces(vars);
  for (const token of tokens) {
    const colour = resolveColour(vars, token);
    if (colour && standsOut(colour, on, NON_TEXT_CONTRAST)) {
      return `var(--${token})`;
    }
  }
  return null;
}

/** The faintest foreground-into-background mix that still reads at 3:1. */
function quietestLegibleMix(vars: Record<string, string>): string | null {
  const background = resolveColour(vars, 'background');
  const foreground = resolveColour(vars, 'foreground');
  if (!background || !foreground) {
    return null;
  }
  const on = surfaces(vars);
  const mix = interpolate([background, foreground], 'oklch');
  for (let percent = 40; percent < 100; percent += 5) {
    if (standsOut(mix(percent / 100), on, MIX_TARGET)) {
      return `color-mix(in oklch, var(--foreground) ${percent}%, var(--background))`;
    }
  }
  return 'var(--foreground)';
}

function blackOrWhite(vars: Record<string, string>): string | null {
  const background = resolveColour(vars, 'background');
  if (!background) {
    return null;
  }
  return wcagLuminance(background) < DARK_SCHEME_LUMINANCE
    ? 'oklch(1 0 0)'
    : 'oklch(0 0 0)';
}

const COMPUTED_INPUTS = [
  'primary',
  'foreground',
  'foreground-secondary',
  'background',
  'background-secondary',
];

/** Tokens that must stay legible on the theme's surfaces, so they are picked
 * by contrast rather than mapped one-to-one. */
const COMPUTED: Array<
  [token: string, derive: (vars: Record<string, string>) => string | null]
> = [
  [
    'focus-ring',
    (vars) =>
      firstLegible(vars, ['primary', 'foreground']) ?? blackOrWhite(vars),
  ],
  [
    'status-offline',
    (vars) =>
      firstLegible(vars, ['foreground-secondary']) ?? quietestLegibleMix(vars),
  ],
  ['foreground-disabled', quietestLegibleMix],
];

/** `color-scheme` for a block that sets its own background, so native
 * selects, scrollbars and form controls follow the theme, not the mode. */
export function colourScheme(
  vars: Record<string, string>,
  inherited: Record<string, string> = {},
): 'light' | 'dark' | null {
  if (!vars.background) {
    return null;
  }
  const background = resolveColour({ ...inherited, ...vars }, 'background');
  if (!background) {
    return null;
  }
  return wcagLuminance(background) < DARK_SCHEME_LUMINANCE ? 'dark' : 'light';
}

/** `inherited` are the tokens already in effect underneath (the light block
 * for a dark block); they inform computed choices but are not emitted. */
export function withDerivedTokens(
  vars: Record<string, string>,
  inherited: Record<string, string> = {},
): Record<string, string> {
  const out = { ...vars };
  for (const [token, from, value] of DERIVED) {
    if (!out[token] && out[from]) {
      out[token] = value;
    }
  }
  if (!out['primary-foreground'] && out.primary) {
    const derived = primaryForeground(out);
    if (derived) {
      out['primary-foreground'] = derived;
    }
  }
  if (COMPUTED_INPUTS.some((token) => vars[token] !== undefined)) {
    const context = { ...inherited, ...out };
    for (const [token, derive] of COMPUTED) {
      if (!out[token]) {
        const derived = derive(context);
        if (derived) {
          out[token] = derived;
        }
      }
    }
  }
  return out;
}

/** The tokens each block of a theme emits, derived ones included. */
export function deriveThemeBlocks(theme: AdvancedTheme): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const light =
    theme.vars && Object.keys(theme.vars).length > 0
      ? withDerivedTokens(theme.vars)
      : {};
  const dark =
    theme.dark && Object.keys(theme.dark).length > 0
      ? withDerivedTokens(theme.dark, light)
      : {};
  return { light, dark };
}

const toDecls = (
  vars: Record<string, string>,
  inherited: Record<string, string> = {},
) => {
  if (Object.keys(vars).length === 0) {
    return '';
  }
  const decls = Object.entries(vars).map(
    ([k, v]) => `--${k}: ${escapeValue(v)};`,
  );
  const scheme = colourScheme(vars, inherited);
  if (scheme) {
    decls.push(`color-scheme: ${scheme};`);
  }
  return decls.join(' ');
};

export function generateAdvancedThemeCSS(theme: AdvancedTheme): string {
  const blocks = deriveThemeBlocks(theme);
  const light = toDecls(blocks.light);
  const dark = toDecls(blocks.dark, blocks.light);

  const parts: string[] = [];
  if (light) {
    parts.push(`html:root{${light}}`);
  }
  if (dark) {
    parts.push(`html[data-theme='dark']{${dark}}`);
  }
  return parts.join('\n');
}

export function generateAdvancedThemeCSSFromJSON(input: unknown): string {
  const parsed = parseAdvancedTheme(input);
  return generateAdvancedThemeCSS(parsed);
}
