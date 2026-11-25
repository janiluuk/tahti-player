import { join } from 'node:path';

import { playerRoot } from '../paths.mjs';
import { runProgram, runSteps } from '../run-script.mjs';

export const CI_WORKFLOW = 'ci.yml';
export const DIGEST_ARTIFACT = 'snapshot-digest';

/**
 * Builds the Vitest snapshot digest from the last local test run, the same
 * scripts CI runs after a failed Test step (scripts/ci/*).
 */
export function runCiDigest({
  baseline = false,
  gate = false,
  publicBaseUrl = '',
  dryRun = false,
  env = process.env,
} = {}) {
  const root = playerRoot();
  const ciScript = (name) => join('scripts', 'ci', name);
  const steps = [];

  if (baseline) {
    steps.push(({ dryRun: dry }) =>
      runProgram(
        'bash',
        [ciScript('fetch-snapshot-baseline.sh'), CI_WORKFLOW, DIGEST_ARTIFACT],
        { dryRun: dry, cwd: root, env, label: 'ci digest baseline' },
      ),
    );
  }

  steps.push(({ dryRun: dry }) =>
    runProgram('node', [ciScript('build-snapshot-digest.mjs')], {
      dryRun: dry,
      cwd: root,
      env: publicBaseUrl
        ? { ...env, SNAPSHOT_DIFF_PUBLIC_BASE_URL: publicBaseUrl }
        : env,
      label: 'ci digest build',
    }),
  );

  if (gate) {
    steps.push(({ dryRun: dry }) =>
      runProgram('node', [ciScript('should-fail-core-tests.mjs')], {
        dryRun: dry,
        cwd: root,
        env,
        label: 'ci digest gate',
      }),
    );
  }

  return runSteps(steps, { dryRun });
}
