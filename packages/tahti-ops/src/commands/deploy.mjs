import { resolve } from 'node:path';

import { OpsError, playerRoot, requireOrgScript } from '../paths.mjs';
import { runProgram, runScript } from '../run-script.mjs';

const TARGETS = {
  stack: {
    script: 'deploy_prod.sh',
    label: 'deploy stack',
    allowArgs: ['--no-cache', '--down'],
  },
  worker: {
    script: 'deploy_worker_remote.sh',
    label: 'deploy worker',
    allowArgs: ['--bootstrap-env'],
  },
  minio: {
    script: 'deploy_minio_remote.sh',
    label: 'deploy minio',
    allowArgs: ['--bootstrap-env'],
  },
};

/** Targets built and shipped from this repo (not tahti-org scripts). */
const LOCAL_TARGETS = {
  web: {
    script: 'packages/tahti-web/deploy/deploy-vimage.sh',
    label: 'deploy web (beta.tahti.live)',
    workflow: 'deploy-tahti-web-selfhosted.yml',
  },
  storybook: {
    script: 'packages/storybook/deploy/deploy-vimage.sh',
    label: 'deploy storybook',
  },
};

export function deployTargets() {
  return [...Object.keys(TARGETS), ...Object.keys(LOCAL_TARGETS)];
}

function runLocal(target, { dryRun, env, extraArgs }) {
  const spec = LOCAL_TARGETS[target];
  const ci = extraArgs.includes('--ci');
  const rest = extraArgs.filter((arg) => arg !== '--ci');
  if (rest.length > 0) {
    throw new OpsError(`Unknown option for deploy ${target}: ${rest[0]}`);
  }
  if (ci) {
    if (!spec.workflow) {
      throw new OpsError(`deploy ${target} has no CI workflow; drop --ci`);
    }
    return runProgram(
      'gh',
      ['workflow', 'run', spec.workflow, '--ref', 'master'],
      { dryRun, env, cwd: playerRoot(), label: `${spec.label} via CI` },
    );
  }
  return runScript(resolve(playerRoot(), spec.script), [], {
    dryRun,
    env,
    label: spec.label,
  });
}

async function runOne(target, { dryRun, env, extraArgs }) {
  if (LOCAL_TARGETS[target]) {
    return runLocal(target, { dryRun, env, extraArgs });
  }
  const spec = TARGETS[target];
  if (!spec) {
    throw new OpsError(
      `Unknown deploy target: ${target} (try: all, ${deployTargets().join(', ')})`,
    );
  }

  for (const arg of extraArgs) {
    if (!spec.allowArgs.includes(arg)) {
      throw new OpsError(
        `Unknown option for deploy ${target}: ${arg}\nAllowed: ${spec.allowArgs.join(' ') || '(none)'}`,
      );
    }
  }

  const scriptPath = requireOrgScript(spec.script, env);
  return runScript(scriptPath, extraArgs, {
    dryRun,
    env,
    label: spec.label,
  });
}

export async function runDeploy(target, options = {}) {
  const { dryRun = false, env = process.env, extraArgs = [] } = options;

  if (target === 'all') {
    const lines = [];
    for (const name of ['stack', 'worker', 'minio']) {
      const result = await runOne(name, {
        dryRun,
        env,
        extraArgs: [],
      });
      if (dryRun && result.output) {
        lines.push(result.output);
      }
      if (result.exitCode !== 0) {
        return {
          exitCode: result.exitCode,
          output: lines.join('\n'),
        };
      }
    }
    return { exitCode: 0, output: lines.join('\n') };
  }

  return runOne(target, { dryRun, env, extraArgs });
}
