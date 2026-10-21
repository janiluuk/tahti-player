import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse, wcagContrast } from 'culori';
import { describe, expect, it } from 'vitest';

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

function colour(tokens: Tokens, name: string): string {
  let value = tokens[name];
  for (let depth = 0; value?.startsWith('var(') && depth < 5; depth++) {
    value = tokens[value.slice(4, -1).trim()];
  }
  if (!value) {
    throw new Error(`${name} is not defined`);
  }
  return value;
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
      ratio: wcagContrast(
        parse(colour(tokens, text))!,
        parse(colour(tokens, surface))!,
      ),
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
