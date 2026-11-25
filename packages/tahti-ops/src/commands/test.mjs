import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { OpsError, playerRoot } from '../paths.mjs';
import { runProgram, runSteps } from '../run-script.mjs';

/** Test groups: what each runs, from the repo root. */
const GROUPS = {
  web: {
    summary: 'tahti-web unit tests (Vitest, e2e specs excluded)',
    args: ['--filter', '@tahti-player/tahti-web', 'test'],
  },
  ui: {
    summary: '@tahti-player/ui component tests',
    args: ['--filter', '@tahti-player/ui', 'test'],
  },
  player: {
    summary: 'desktop player tests',
    args: ['--filter', '@tahti-player/player', 'test'],
  },
  cli: {
    summary: 'tahti product CLI tests (sibling ../tahti-cli)',
    siblingDir: '../tahti-cli',
    siblingArgs: ['test'],
  },
  ops: {
    summary: 'tahti-ops maintainer CLI tests',
    args: ['--filter', '@tahti-player/tahti-ops', 'test'],
  },
  visualizer: {
    summary: 'visualizer package tests',
    args: ['--filter', '@tahti-player/visualizer', 'test'],
  },
  storybook: {
    summary:
      'Storybook play tests in headless Chromium, 50 story files per browser session',
    args: ['--filter', '@tahti-player/storybook', 'test:plays'],
  },
  types: {
    summary: 'TypeScript checks in every package',
    args: ['type-check'],
  },
  lint: { summary: 'ESLint in every package', args: ['lint'] },
  all: {
    summary: 'every package except Storybook plays (turbo test)',
    args: ['test'],
  },
};

export function testGroups() {
  return GROUPS;
}

export function runTests(groups, { dryRun = false, extraArgs = [] } = {}) {
  const names = groups.length > 0 ? groups : ['all'];
  for (const name of names) {
    if (!GROUPS[name]) {
      throw new OpsError(
        `Unknown test group: ${name} (try: ${Object.keys(GROUPS).join(', ')})`,
      );
    }
  }
  const root = playerRoot();
  return runSteps(
    names.map((name) => {
      const group = GROUPS[name];
      return ({ dryRun: dry }) => {
        if (group.siblingDir) {
          const sibling = resolve(root, group.siblingDir);
          if (!existsSync(sibling) && !dry) {
            throw new OpsError(
              `Sibling CLI checkout missing at ${sibling} (clone janiluuk/tahti-cli)`,
            );
          }
          return runProgram(
            'pnpm',
            [
              ...(group.siblingArgs ?? ['test']),
              ...(extraArgs.length > 0 ? ['--', ...extraArgs] : []),
            ],
            {
              dryRun: dry,
              cwd: dry ? sibling : sibling,
              label: `test ${name}`,
            },
          );
        }
        return runProgram(
          'pnpm',
          [
            ...group.args,
            ...(extraArgs.length > 0 ? ['--', ...extraArgs] : []),
          ],
          { dryRun: dry, cwd: root, label: `test ${name}` },
        );
      };
    }),
    { dryRun },
  );
}
