#!/usr/bin/env node
// Size guard: source files (not tests/stories/data) over LIMIT lines may not
// appear or grow. Existing offenders are pinned in scripts/file-size-baseline.json
// and should only ever shrink — lower the number (or delete the entry) when you
// split one. Run with --update to rewrite the baseline after a split.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const LIMIT = 800;
const ROOTS = ['packages/tahti-web/src', 'packages/player/src', 'packages/player/src-tauri/src'];
const EXT = /\.(tsx?|rs)$/;
const SKIP = /(\.test\.|\.stories\.|\/tests\.rs$|\/tests\/|\/mock\.ts$|\/content\/|\/generated\/|bindings)/;
const baselinePath = new URL('./file-size-baseline.json', import.meta.url);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === 'node_modules') continue;
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (EXT.test(name) && !SKIP.test(path)) yield path;
  }
}

const sizes = {};
for (const root of ROOTS) {
  try {
    for (const file of walk(root)) {
      const lines = readFileSync(file, 'utf8').split('\n').length;
      if (lines > LIMIT) sizes[relative('.', file)] = lines;
    }
  } catch {}
}

if (process.argv.includes('--update')) {
  writeFileSync(baselinePath, JSON.stringify(sizes, null, 2) + '\n');
  console.log(`Baseline written: ${Object.keys(sizes).length} files over ${LIMIT} lines.`);
  process.exit(0);
}

let baseline = {};
try { baseline = JSON.parse(readFileSync(baselinePath, 'utf8')); } catch {}
const problems = Object.entries(sizes).filter(([f, n]) => n > (baseline[f] ?? LIMIT));
for (const [file, lines] of problems) {
  console.error(`${file}: ${lines} lines (limit ${baseline[file] ?? LIMIT}). Split it, or see scripts/check-file-size.mjs.`);
}
process.exit(problems.length ? 1 : 0);
