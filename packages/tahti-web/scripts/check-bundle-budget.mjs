#!/usr/bin/env node
/**
 * Reports the JavaScript a first visit to `/` downloads and checks it against
 * a gzip budget. Reads the Vite manifest, so build with `vite build --manifest`.
 *
 * Usage: node scripts/check-bundle-budget.mjs [dist] [--budget-kb=<gzip KB>]
 *
 * Exits 1 when the initial JS is over budget, 2 when the manifest is missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const scriptDirectory = path.dirname(new URL(import.meta.url).pathname);

export const DEFAULT_BUDGET_KB = 600;

/**
 * Chunks loaded before the first paint of `/`: the HTML entry, the modules
 * `main.tsx` imports dynamically at boot (the app shell and the language
 * store, both awaited before mounting), and everything they import statically.
 *
 * @param {Record<string, {file: string, isEntry?: boolean, imports?: string[], dynamicImports?: string[]}>} manifest
 * @returns {string[]} manifest keys
 */
export function initialChunkKeys(manifest) {
  const entry = manifest['index.html'];
  if (!entry) {
    throw new Error('manifest has no index.html entry');
  }
  const roots = ['index.html', ...(entry.dynamicImports ?? [])];
  const seen = new Set();
  const stack = [...roots];
  while (stack.length > 0) {
    const key = stack.pop();
    if (seen.has(key) || !manifest[key]) {
      continue;
    }
    seen.add(key);
    stack.push(...(manifest[key].imports ?? []));
  }
  return [...seen];
}

export function gzipSize(buffer) {
  return zlib.gzipSync(buffer, { level: 6 }).length;
}

function parseArgs(argv) {
  let dist = path.resolve(scriptDirectory, '..', 'dist');
  let budgetKb = DEFAULT_BUDGET_KB;
  for (const arg of argv) {
    if (arg.startsWith('--budget-kb=')) {
      budgetKb = Number(arg.slice('--budget-kb='.length));
    } else {
      dist = path.resolve(arg);
    }
  }
  return { dist, budgetKb };
}

function kb(bytes) {
  return (bytes / 1024).toFixed(1);
}

function main() {
  const { dist, budgetKb } = parseArgs(process.argv.slice(2));
  const manifestPath = path.join(dist, '.vite', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(
      `${manifestPath} is missing; build with \`vite build --manifest\`.`,
    );
    process.exit(2);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const rows = initialChunkKeys(manifest)
    .map((key) => manifest[key].file)
    .filter((file) => file.endsWith('.js'))
    .map((file) => {
      const buffer = fs.readFileSync(path.join(dist, file));
      return { file, raw: buffer.length, gzip: gzipSize(buffer) };
    })
    .sort((a, b) => b.gzip - a.gzip);
  const raw = rows.reduce((sum, row) => sum + row.raw, 0);
  const gzip = rows.reduce((sum, row) => sum + row.gzip, 0);
  const over = gzip > budgetKb * 1024;

  const lines = [
    `Initial JS for /: ${rows.length} chunks, ${kb(raw)} KB raw, ${kb(gzip)} KB gzip (budget ${budgetKb} KB gzip).`,
    ...rows.map(
      (row) => `  ${row.file}  ${kb(row.raw)} KB / ${kb(row.gzip)} KB gzip`,
    ),
  ];
  console.log(lines.join('\n'));

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      [
        '### tahti-web initial JS for /',
        '',
        `${kb(gzip)} KB gzip (${kb(raw)} KB raw) in ${rows.length} chunks; budget ${budgetKb} KB gzip.`,
        '',
        '| Chunk | Raw KB | Gzip KB |',
        '| ----- | ------ | ------- |',
        ...rows.map(
          (row) => `| ${row.file} | ${kb(row.raw)} | ${kb(row.gzip)} |`,
        ),
        '',
      ].join('\n'),
    );
  }
  if (over) {
    const message = `Initial JS for / is ${kb(gzip)} KB gzip, over the ${budgetKb} KB budget. Move what Listen does not need on first paint behind a dynamic import, or raise DEFAULT_BUDGET_KB in packages/tahti-web/scripts/check-bundle-budget.mjs with a reason.`;
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::warning title=Bundle budget::${message}`);
    }
    console.error(message);
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}
