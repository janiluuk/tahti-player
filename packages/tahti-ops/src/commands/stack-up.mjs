import { requireOrgScript } from '../paths.mjs';
import { runScript } from '../run-script.mjs';

export async function runStackUp(extraArgs = [], options = {}) {
  const { dryRun = false, env = process.env } = options;
  const scriptPath = requireOrgScript('stack-up.sh', env);
  return runScript(scriptPath, extraArgs, {
    dryRun,
    env,
    label: 'stack up',
  });
}

export async function runStackDown(options = {}) {
  const { dryRun = false, env = process.env } = options;
  const scriptPath = requireOrgScript('stack-up.sh', env);
  return runScript(scriptPath, ['--down'], {
    dryRun,
    env,
    label: 'stack down',
  });
}
