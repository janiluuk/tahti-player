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
  storybook: {
    summary: 'Storybook play tests in headless Chromium',
    args: ['--filter', '@tahti-player/storybook', 'test'],
  },
  types: {
    summary: 'TypeScript checks in every package',
    args: ['type-check'],
  },
  lint: { summary: 'ESLint in every package', args: ['lint'] },
  all: { summary: 'every package (turbo test)', args: ['test'] },
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
    names.map(
      (name) =>
        ({ dryRun: dry }) =>
          runProgram(
            'pnpm',
            [
              ...GROUPS[name].args,
              ...(extraArgs.length > 0 ? ['--', ...extraArgs] : []),
            ],
            { dryRun: dry, cwd: root, label: `test ${name}` },
          ),
    ),
    { dryRun },
  );
}
