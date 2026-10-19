import { requireOrgScript } from '../paths.mjs';
import { runScript } from '../run-script.mjs';

export async function runStackSmoke(options = {}) {
  const { dryRun = false, env = process.env, extraArgs = [] } = options;
  const scriptPath = requireOrgScript('stack-smoke.sh', env);
  return runScript(scriptPath, extraArgs, {
    dryRun,
    env,
    label: 'stack smoke',
  });
}
