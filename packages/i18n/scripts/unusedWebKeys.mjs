import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const SOURCE_EXTENSIONS = /\.(ts|tsx|mts|mjs|js|jsx)$/;
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.turbo',
  'locales',
]);

/**
 * Key prefixes built at runtime from data (e.g. `t(\`helpHub.groups.${id}\`)`)
 * that the template-literal scan cannot see, or that it sees under a different
 * spelling. Every key under one of these counts as used.
 */
export const DYNAMIC_KEY_ALLOWLIST = [
  // lib/seo.ts childTitle(): `${childNamespace}.${camel}` page titles.
  'studio.',
  'adminPages.',
];

/**
 * @param {unknown} value
 * @param {string} [prefix]
 * @returns {string[]}
 */
export function collectKeys(value, prefix = '') {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, nested]) =>
      collectKeys(nested, prefix ? `${prefix}.${key}` : key),
    );
  }
  return prefix ? [prefix] : [];
}

/**
 * Prefixes of keys built from template literals: `` `sortSounds.mode.${m}` ``
 * yields `sortSounds.mode.` and `` `library.tab${name}` `` yields `library.tab`.
 *
 * @param {string} source
 * @returns {string[]}
 */
export function findDynamicPrefixes(source) {
  const prefixes = new Set();
  for (const match of source.matchAll(
    /`(?:web:)?([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]*)+)\$\{/g,
  )) {
    prefixes.add(match[1]);
  }
  return [...prefixes];
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {{ keys: string[]; source: string; allowlist?: string[] }} input
 * @returns {string[]} `web` keys (without the `web.` prefix) that no source references.
 */
export function findUnusedWebKeys({
  keys,
  source,
  allowlist = DYNAMIC_KEY_ALLOWLIST,
}) {
  const dynamic = [...findDynamicPrefixes(source), ...allowlist];
  const quotedTokens = new Set();
  for (const match of source.matchAll(
    /['"`](?:web:)?([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)['"`]/g,
  )) {
    quotedTokens.add(match[1]);
  }
  return keys.filter((key) => {
    const base = key.replace(PLURAL_SUFFIX, '');
    if (quotedTokens.has(key) || quotedTokens.has(base)) {
      return false;
    }
    if (dynamic.some((prefix) => base.startsWith(prefix))) {
      return false;
    }
    return !new RegExp(`['"\`:]${escapeRegExp(base)}['"\`]`).test(source);
  });
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
export function listSourceFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) {
      continue;
    }
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...listSourceFiles(path));
    } else if (SOURCE_EXTENSIONS.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

/**
 * @param {string} repoRoot
 * @returns {string[]}
 */
export function reportUnusedWebKeys(repoRoot) {
  const packagesDir = join(repoRoot, 'packages');
  const sourceDirs = readdirSync(packagesDir)
    .map((name) => join(packagesDir, name, 'src'))
    .filter((dir) => {
      try {
        return statSync(dir).isDirectory();
      } catch {
        return false;
      }
    });
  const source = sourceDirs
    .flatMap(listSourceFiles)
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
  const english = JSON.parse(
    readFileSync(join(packagesDir, 'i18n/src/locales/en_US.json'), 'utf8'),
  );
  return findUnusedWebKeys({ keys: collectKeys(english.web), source });
}
