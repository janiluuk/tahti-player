import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { interpolate, parse, wcagContrast, type Color } from 'culori';
import { describe, expect, it } from 'vitest';

import * as presetModule from '../../../tahti-web/src/plugins/themes/presets';
import { deriveThemeBlocks } from '../advanced/generator';
import type { AdvancedTheme } from '../advanced/schema';

const GLOBAL_CSS = resolve(__dirname, '../../../tailwind-config/global.css');
const THEMES = ['aurora', 'ember', 'lagoon', 'arctic-moss', 'tahti-dark'];

type Tokens = Record<string, string>;

function blocks(css: string): Array<{ selector: string; tokens: Tokens }> {
  const found: Array<{ selector: string; tokens: Tokens }> = [];
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of cleaned.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const tokens: Tokens = {};
    for (const decl of match[2]!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      tokens[decl[1]!] = decl[2]!.trim();
    }
    found.push({ selector: match[1]!.trim(), tokens });
  }
  return found;
}

function pick(css: string, selector: string): Tokens {
  return Object.assign(
    {},
    ...blocks(css)
      .filter((block) => block.selector === selector)
      .map((block) => block.tokens),
  );
}

function colourValue(tokens: Tokens, value: string, depth = 0): Color {
  const trimmed = value.trim();
  if (depth > 6) {
    throw new Error(`${value} does not resolve`);
  }
  if (trimmed.startsWith('var(')) {
    return colour(tokens, trimmed.slice(4, -1).trim(), depth + 1);
  }
  const mix = trimmed.match(
    /^color-mix\(in oklch,\s*(var\([^)]+\)|[^,]+?)\s+([\d.]+)%,\s*(.+)\)$/,
  );
  if (mix) {
    const weight = Number(mix[2]) / 100;
    const from = colourValue(tokens, mix[3]!, depth + 1);
    const to = colourValue(tokens, mix[1]!, depth + 1);
    return interpolate([from, to], 'oklch')(weight);
  }
  const parsed = parse(trimmed);
  if (!parsed) {
    throw new Error(`${value} is not a colour`);
  }
  return parsed;
}

function colour(tokens: Tokens, name: string, depth = 0): Color {
  const value = tokens[name];
  if (!value) {
    throw new Error(`${name} is not defined`);
  }
  return colourValue(tokens, value, depth);
}

const globalCss = readFileSync(GLOBAL_CSS, 'utf8');
const base = pick(globalCss, ':root');
const baseDark = pick(globalCss, "[data-theme='dark']");

function variants(): Array<[string, Tokens]> {
  const list: Array<[string, Tokens]> = [
    ['default light', base],
    ['default dark', { ...base, ...baseDark }],
  ];
  for (const theme of THEMES) {
    const css = readFileSync(
      resolve(__dirname, `../basic/${theme}.css`),
      'utf8',
    );
    const light = pick(css, `:root[data-theme-id='nuclear:${theme}']`);
    const dark = pick(
      css,
      `:root[data-theme-id='nuclear:${theme}'][data-theme='dark']`,
    );
    list.push([`${theme} light`, { ...base, ...light }]);
    list.push([`${theme} dark`, { ...base, ...baseDark, ...light, ...dark }]);
  }
  return list;
}

/** Text token → the surfaces it is drawn on. AA body text needs 4.5:1. */
const TEXT_PAIRS: Array<[string, string]> = [
  ['--foreground', '--background'],
  ['--foreground', '--background-secondary'],
  ['--foreground-secondary', '--background'],
  ['--foreground-secondary', '--background-secondary'],
  ['--foreground-input', '--background-input'],
  ['--primary-foreground', '--primary'],
  ['--secondary-foreground', '--secondary'],
  ...[
    '--accent-green',
    '--accent-yellow',
    '--accent-purple',
    '--accent-blue',
    '--accent-orange',
    '--accent-cyan',
    '--accent-red',
  ].map((accent): [string, string] => ['--accent-foreground', accent]),
  ...['red', 'green', 'yellow', 'purple', 'blue', 'orange', 'cyan'].flatMap(
    (name): Array<[string, string]> => [
      [`--accent-${name}-strong`, '--background'],
      [`--accent-${name}-strong`, '--background-secondary'],
    ],
  ),
];

function contrastReport() {
  return variants().flatMap(([variant, tokens]) =>
    TEXT_PAIRS.map(([text, surface]) => ({
      variant,
      text,
      surface,
      ratio: wcagContrast(colour(tokens, text), colour(tokens, surface)),
    })),
  );
}

describe('theme text contrast (WCAG AA, 4.5:1)', () => {
  for (const row of contrastReport()) {
    it(`${row.variant}: ${row.text} on ${row.surface}`, () => {
      expect(row.ratio).toBeGreaterThanOrEqual(4.5);
    });
  }
});

/** Non-text UI (WCAG 1.4.11) and disabled labels: 3:1 against what they
 * sit on. Disabled text is exempt from 1.4.3 but stays legible. */
const NON_TEXT_PAIRS: Array<[string, string]> = [
  ['--focus-ring', '--background'],
  ['--focus-ring', '--background-secondary'],
  ['--status-offline', '--background'],
  ['--status-offline', '--background-secondary'],
  ['--border-input', '--background-input'],
  ['--foreground-disabled', '--background'],
  ['--foreground-disabled', '--background-secondary'],
];

function prefixed(vars: Record<string, string>): Tokens {
  return Object.fromEntries(
    Object.entries(vars).map(([key, value]) => [`--${key}`, value]),
  );
}

const presets = Object.entries(presetModule).filter(
  (entry): entry is [string, AdvancedTheme] =>
    typeof entry[1] === 'object' &&
    entry[1] !== null &&
    (entry[1] as AdvancedTheme).version === 1,
);

/** Preset custom themes as the generator emits them, layered over the stock
 * theme the way the cascade applies them. */
function presetVariants(): Array<[string, Tokens]> {
  return presets.flatMap(([, theme]): Array<[string, Tokens]> => {
    const blocks = deriveThemeBlocks(theme);
    const light = prefixed(blocks.light);
    return [
      [`${theme.name} light`, { ...base, ...light }],
      [
        `${theme.name} dark`,
        { ...base, ...baseDark, ...light, ...prefixed(blocks.dark) },
      ],
    ];
  });
}

describe('theme non-text contrast (WCAG 1.4.11, 3:1)', () => {
  it('covers every preset custom theme', () => {
    expect(presets.length).toBeGreaterThanOrEqual(22);
  });

  for (const [variant, tokens] of [...variants(), ...presetVariants()]) {
    for (const [token, surface] of NON_TEXT_PAIRS) {
      it(`${variant}: ${token} on ${surface}`, () => {
        expect(
          wcagContrast(colour(tokens, token), colour(tokens, surface)),
        ).toBeGreaterThanOrEqual(3);
      });
    }
  }
});

/** Graphics where the text colour matches a fill of the same accent. */
const PLAIN_ACCENT_TEXT_ALLOWED = [
  /fill-accent-red text-accent-red\b/,
  /ListenerWorldMap\.tsx$/,
  /WaveformSeekbar\.tsx$/,
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' || entry.name === '__snapshots__'
        ? []
        : sourceFiles(path);
    }
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe('accent colours used as text', () => {
  it('use the -strong tokens, which are readable on light themes', () => {
    const offenders = ['tahti-web', 'ui', 'player', 'storybook']
      .flatMap((pkg) => sourceFiles(resolve(__dirname, `../../../${pkg}/src`)))
      .filter((file) => !PLAIN_ACCENT_TEXT_ALLOWED.some((re) => re.test(file)))
      .flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .map((line, index) => ({ file, line, index }))
          .filter(
            ({ line }) =>
              /\btext-accent-(red|green|blue|yellow|orange|cyan|purple)\b(?!-)/.test(
                line,
              ) && !PLAIN_ACCENT_TEXT_ALLOWED.some((re) => re.test(line)),
          )
          .map(({ file, index }) => `${file}:${index + 1}`),
      );
    expect(offenders).toEqual([]);
  });
});
