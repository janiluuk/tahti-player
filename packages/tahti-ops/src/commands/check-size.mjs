import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { playerRoot } from '../paths.mjs';

export const LINE_LIMIT = 800;
export const BASELINE_FILE = 'scripts/file-size-baseline.json';

const ROOTS = [
  'packages/tahti-web/src',
  'packages/player/src',
  'packages/player/src-tauri/src',
];
const EXT = /\.(tsx?|rs)$/;
const SKIP =
  /(\.test\.|\.stories\.|\/tests\.rs$|\/tests\/|\/mock\.ts$|\/content\/|\/generated\/|bindings)/;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') {
      continue;
    }
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else if (EXT.test(name) && !SKIP.test(path)) {
      yield path;
    }
  }
}

/** Line counts of source files over the limit, keyed by repo-relative path. */
export function measureOversized(root, limit = LINE_LIMIT) {
  const sizes = {};
  for (const dir of ROOTS) {
    const absolute = resolve(root, dir);
    if (!existsSync(absolute)) {
      continue;
    }
    for (const file of walk(absolute)) {
      const lines = readFileSync(file, 'utf8').split('\n').length;
      if (lines > limit) {
        sizes[relative(root, file)] = lines;
      }
    }
  }
  return sizes;
}

function readBaseline(path) {
  if (!existsSync(path)) {
    return {};
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeBaseline(path, baseline) {
  writeFileSync(path, JSON.stringify(baseline, null, 2) + '\n');
}

/**
 * Size guard: source files (not tests/stories/data) over the limit may not
 * appear or grow. Existing offenders are pinned in the baseline and should
 * only ever shrink.
 */
export function runCheckSize({
  mode = 'check',
  root = playerRoot(),
  limit = LINE_LIMIT,
} = {}) {
  const baselinePath = resolve(root, BASELINE_FILE);
  const sizes = measureOversized(root, limit);

  if (mode === 'update') {
    writeBaseline(baselinePath, sizes);
    return {
      exitCode: 0,
      output: `Baseline written: ${Object.keys(sizes).length} files over ${limit} lines.`,
    };
  }

  const baseline = readBaseline(baselinePath);
  const lines = [];
  const stale = Object.keys(baseline).filter((file) => !(file in sizes));
  if (stale.length > 0) {
    if (mode === 'prune') {
      for (const file of stale) {
        delete baseline[file];
      }
      writeBaseline(baselinePath, baseline);
      lines.push(
        `Pruned ${stale.length} stale baseline pin(s): ${stale.join(', ')}`,
      );
    } else {
      lines.push(
        `Stale baseline pin(s) (file ≤ ${limit} or gone - run tahti-ops check size --prune): ${stale.join(', ')}`,
      );
    }
  }

  const problems = Object.entries(sizes).filter(
    ([file, count]) => count > (baseline[file] ?? limit),
  );
  for (const [file, count] of problems) {
    const pinned = baseline[file];
    lines.push(
      pinned == null
        ? `✗ ${file}: ${count} lines (limit ${limit}). Split it under ${limit}, or pin once via: pnpm tahti-ops check size --update`
        : `✗ ${file}: ${count} lines (pinned ≤ ${pinned}). Split it and lower/remove the pin in ${BASELINE_FILE} - do not raise the pin.`,
    );
  }
  if (problems.length === 0) {
    lines.push(
      `✓ No new or grown source files over ${limit} lines (${Object.keys(sizes).length} pinned).`,
    );
  }
  return { exitCode: problems.length > 0 ? 1 : 0, output: lines.join('\n') };
}
