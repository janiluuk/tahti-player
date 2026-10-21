#!/usr/bin/env node
// Size guard: source files (not tests/stories/data) over LIMIT lines may not
// appear or grow. Existing offenders are pinned in scripts/file-size-baseline.json
// and should only ever shrink — lower the number (or delete the entry) when you
// split one.
//
//   node scripts/check-file-size.mjs           # CI check
//   node scripts/check-file-size.mjs --update  # rewrite baseline to files > LIMIT
//   node scripts/check-file-size.mjs --prune   # drop stale pins (≤ LIMIT / missing)
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const LIMIT = 800;
const ROOTS = [
  'packages/tahti-web/src',
  'packages/player/src',
  'packages/player/src-tauri/src',
];
const EXT = /\.(tsx?|rs)$/;
const SKIP =
  /(\.test\.|\.stories\.|\/tests\.rs$|\/tests\/|\/mock\.ts$|\/content\/|\/generated\/|bindings)/;
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
  console.log(
    `Baseline written: ${Object.keys(sizes).length} files over ${LIMIT} lines.`,
  );
  process.exit(0);
}

let baseline = {};
try {
  baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
} catch {}

const stale = Object.keys(baseline).filter((f) => !(f in sizes));
if (stale.length) {
  if (process.argv.includes('--prune')) {
    for (const f of stale) delete baseline[f];
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
    console.log(
      `Pruned ${stale.length} stale baseline pin(s): ${stale.join(', ')}`,
    );
  } else {
    console.warn(
      `Stale baseline pin(s) (file ≤ ${LIMIT} or gone — run with --prune): ${stale.join(', ')}`,
    );
  }
}

const problems = Object.entries(sizes).filter(
  ([f, n]) => n > (baseline[f] ?? LIMIT),
);
for (const [file, lines] of problems) {
  const pinned = baseline[file];
  console.error(
    pinned != null
      ? `${file}: ${lines} lines (pinned ≤ ${pinned}). Split it and lower/remove the pin in scripts/file-size-baseline.json — do not raise the pin.`
      : `${file}: ${lines} lines (limit ${LIMIT}). Split it under ${LIMIT}, or pin once via: node scripts/check-file-size.mjs --update`,
  );
}
process.exit(problems.length ? 1 : 0);
