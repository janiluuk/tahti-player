import { OpsError, requireOrgScript } from '../paths.mjs';
import { runScript } from '../run-script.mjs';

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

export function deployTargets() {
  return Object.keys(TARGETS);
}

async function runOne(target, { dryRun, env, extraArgs }) {
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
