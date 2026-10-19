import { OpsError, resolveStackEnvScript } from '../paths.mjs';
import { runScript } from '../run-script.mjs';

export async function runEnv(args, options = {}) {
  const { dryRun = false, env = process.env } = options;
  const scriptPath = resolveStackEnvScript(env);
  if (!scriptPath) {
    throw new OpsError('stack-env.sh not found in package or TAHTI_ORG_ROOT');
  }
  const summary = args[0] ? `env ${args[0]}` : 'env';
  return runScript(scriptPath, args, {
    dryRun,
    env,
    label: summary,
  });
}
