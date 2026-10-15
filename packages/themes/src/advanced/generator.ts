import type { AdvancedTheme } from './schema';
import { parseAdvancedTheme } from './validate';

const escapeValue = (v: string) => v.replace(/\n/g, ' ').trim();

const toDecls = (vars?: Record<string, string>) => {
  if (!vars || Object.keys(vars).length === 0) {
    return '';
  }
  const withStrong =
    vars.primary && !vars['primary-strong']
      ? { ...vars, 'primary-strong': 'var(--primary)' }
      : vars;
  return Object.entries(withStrong)
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
