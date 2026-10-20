import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { OpsError, playerRoot } from '../paths.mjs';
import { runProgram, runSteps } from '../run-script.mjs';

/** Snapshot groups: Vitest snapshot packages, plus the generated indexes. */
const GROUPS = {
  ui: { kind: 'vitest', dir: 'packages/ui' },
  player: { kind: 'vitest', dir: 'packages/player' },
  hifi: { kind: 'vitest', dir: 'packages/hifi' },
  surfaces: {
    kind: 'script',
    summary: 'STORYBOOK-SURFACES.md (story ↔ surface index)',
    args: ['scripts/generate-storybook-surfaces.mjs'],
  },
};

const VITEST_GROUPS = Object.keys(GROUPS).filter(
  (name) => GROUPS[name].kind === 'vitest',
);

export function snapshotGroups() {
  return GROUPS;
}

function findSnapFiles(dir) {
  const found = [];
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      if (entry === 'node_modules' || entry === 'dist') {
        continue;
      }
      const path = join(current, entry);
      const stats = statSync(path);
      if (stats.isDirectory()) {
        walk(path);
      } else if (entry.endsWith('.snap')) {
        found.push(path);
      }
    }
  };
  walk(dir);
  return found;
}

export function listSnapshots() {
  const root = playerRoot();
  const lines = ['Snapshot groups:'];
  for (const [name, group] of Object.entries(GROUPS)) {
    if (group.kind === 'vitest') {
      const files = findSnapFiles(resolve(root, group.dir));
      lines.push(
        `  ${name.padEnd(9)} ${String(files.length).padStart(3)} snapshot files in ${group.dir}`,
      );
    } else {
      lines.push(`  ${name.padEnd(9)} ${group.summary}`);
    }
  }
  lines.push(
    '',
    'Update: tahti-ops snapshots update <group…|all> [--only <test path>]',
  );
  return { exitCode: 0, output: lines.join('\n') };
}

/** Re-records snapshots for the chosen groups, then shows what changed. */
export function updateSnapshots(groups, { dryRun = false, only = null } = {}) {
  const root = playerRoot();
  const names =
    groups.length === 0 || groups.includes('all')
      ? Object.keys(GROUPS)
      : groups;
  for (const name of names) {
    if (!GROUPS[name]) {
      throw new OpsError(
        `Unknown snapshot group: ${name} (try: all, ${Object.keys(GROUPS).join(', ')})`,
      );
    }
  }
  if (only && names.length !== 1) {
    throw new OpsError('--only needs exactly one snapshot group');
  }
  const steps = names.map((name) => {
    const group = GROUPS[name];
    if (group.kind === 'script') {
      return ({ dryRun: dry }) =>
        runProgram('node', group.args, {
          dryRun: dry,
          cwd: root,
          label: `snapshots ${name}`,
        });
    }
    const target = only
      ? [relative(resolve(root, group.dir), resolve(root, only))]
      : [];
    return ({ dryRun: dry }) =>
      runProgram('pnpm', ['exec', 'vitest', 'run', '-u', ...target], {
        dryRun: dry,
        cwd: resolve(root, group.dir),
        label: `snapshots ${name}${only ? ` (${only})` : ''}`,
      });
  });
  steps.push(({ dryRun: dry }) =>
    runProgram(
      'git',
      [
        'diff',
        '--stat',
        '--',
        ...names
          .filter((name) => GROUPS[name].kind === 'vitest')
          .map((name) => `:(glob)${GROUPS[name].dir}/**/*.snap`),
        ...(names.includes('surfaces')
          ? ['packages/tahti-web/STORYBOOK-SURFACES.md']
          : []),
      ],
      { dryRun: dry, cwd: root, label: 'changed snapshot files' },
    ),
  );
  return runSteps(steps, { dryRun });
}

export { VITEST_GROUPS };
