import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { OpsError, playerRoot } from '../paths.mjs';
import { runProgram, runScript } from '../run-script.mjs';

const JOURNEYS = ['anonymous', 'listener', 'artist', 'admin'];
const TASKS = ['listener', 'artist'];

/** KEY=value lines (comments and blanks skipped), for `--env-file`. */
export function readEnvFile(path) {
  if (!existsSync(path)) {
    throw new OpsError(`No env file at ${path}`);
  }
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) {
      env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

export function runE2e(kind, names, options = {}) {
  const { dryRun = false, envFile = null, extraArgs = [] } = options;
  const web = resolve(playerRoot(), 'packages/tahti-web');
  const env = envFile
    ? { ...process.env, ...readEnvFile(resolve(envFile)) }
    : process.env;
  if (kind === 'journeys') {
    for (const name of names) {
      if (!JOURNEYS.includes(name)) {
        throw new OpsError(
          `Unknown journey: ${name} (try: ${JOURNEYS.join(', ')})`,
        );
      }
    }
    return runScript(resolve(web, 'scripts/run-e2e-journeys.sh'), names, {
      dryRun,
      env,
      label: `e2e journeys ${names.join(' ') || 'all'} (mock app)`,
    });
  }
  if (kind === 'tasks') {
    const name = names[0];
    if (!TASKS.includes(name)) {
      throw new OpsError(
        `e2e tasks needs one of: ${TASKS.join(', ')} (real backend; credentials via --env-file)`,
      );
    }
    return runProgram(
      'node',
      [`scripts/journeys/${name}-tasks-journey.mjs`, ...extraArgs],
      {
        dryRun,
        cwd: web,
        env,
        label: `e2e tasks ${name} (${env.JOURNEY_BASE_URL ?? 'https://beta.tahti.live'})`,
      },
    );
  }
  if (kind === 'playwright') {
    return runProgram('pnpm', ['test:e2e', ...names, ...extraArgs], {
      dryRun,
      cwd: web,
      env,
      label: `e2e playwright ${names.join(' ') || 'all specs'} (${env.PLAYWRIGHT_BASE_URL ?? 'https://beta.tahti.live'})`,
    });
  }
  throw new OpsError(
    `Unknown e2e kind: ${kind ?? '(none)'} (try: journeys, tasks, playwright)`,
  );
}
