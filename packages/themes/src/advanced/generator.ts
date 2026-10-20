import type { AdvancedTheme } from './schema';
import { parseAdvancedTheme } from './validate';

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
];

export function withDerivedTokens(
  vars: Record<string, string>,
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
  return out;
}

const toDecls = (vars?: Record<string, string>) => {
  if (!vars || Object.keys(vars).length === 0) {
    return '';
  }
  return Object.entries(withDerivedTokens(vars))
    .map(([k, v]) => `--${k}: ${escapeValue(v)};`)
    .join(' ');
};

export function generateAdvancedThemeCSS(theme: AdvancedTheme): string {
  const light = toDecls(theme.vars);
  const dark = toDecls(theme.dark);

  const parts: string[] = [];
  if (light) {
    parts.push(`:root{${light}}`);
  }
  if (dark) {
    parts.push(`[data-theme='dark']{${dark}}`);
  }
  return parts.join('\n');
}

export function generateAdvancedThemeCSSFromJSON(input: unknown): string {
  const parsed = parseAdvancedTheme(input);
  return generateAdvancedThemeCSS(parsed);
}
