#!/usr/bin/env node
/**
 * Exit 0 when the core-test job should soft-pass despite a failed Test step:
 * every collected failure is a Vitest snapshot mismatch that already fails on
 * master (digest newCount === 0), and no package reported a non-snapshot fail.
 *
 * Exit 1 otherwise (hard fail). Prints a short reason either way.
 *
 * Usage: node scripts/ci/should-fail-core-tests.mjs
 * Expects snapshot-digest/digest.json and each package's
 * snapshot-digest/run-summary.json under the repo root.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function collectSummaries(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'snapshot-digest') {
        const summaryPath = path.join(full, 'run-summary.json');
        if (existsSync(summaryPath)) {
          try {
            out.push(JSON.parse(readFileSync(summaryPath, 'utf8')));
          } catch {
            // ignore broken summaries
          }
        }
      } else {
        collectSummaries(full, out);
      }
    }
  }
  return out;
}

const digestPath = path.join(ROOT, 'snapshot-digest', 'digest.json');
const summaries = collectSummaries(ROOT);
const otherFailures = summaries.reduce(
  (sum, row) => sum + (Number(row.otherFailures) || 0),
  0,
);
const snapshotFailures = summaries.reduce(
  (sum, row) => sum + (Number(row.snapshotFailures) || 0),
  0,
);

let newCount = null;
let standingCount = 0;
if (existsSync(digestPath)) {
  try {
    const digest = JSON.parse(readFileSync(digestPath, 'utf8'));
    newCount = Number(digest.newCount) || 0;
    standingCount = Number(digest.standingCount) || 0;
  } catch {
    newCount = null;
  }
}

if (otherFailures > 0) {
  console.error(
    `Hard fail: ${otherFailures} non-snapshot test failure(s) across packages.`,
  );
  process.exit(1);
}

if (snapshotFailures === 0 && newCount === null) {
  console.error(
    'Hard fail: Test step failed but no snapshot digest / run summaries were collected.',
  );
  process.exit(1);
}

if (newCount === 0 && (standingCount > 0 || snapshotFailures > 0)) {
  console.log(
    `Soft pass: ${standingCount || snapshotFailures} snapshot mismatch(es) already on master (newCount=0); no other failures.`,
  );
  process.exit(0);
}

if (newCount != null && newCount > 0) {
  console.error(
    `Hard fail: ${newCount} new snapshot mismatch(es) in this PR (see digest).`,
  );
  process.exit(1);
}

console.error('Hard fail: Test step failed without a standing-only snapshot case.');
process.exit(1);
