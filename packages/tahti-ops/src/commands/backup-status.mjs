import { requireOrgScript } from '../paths.mjs';
import { runScript } from '../run-script.mjs';

export async function runBackupStatus(options = {}) {
  const { dryRun = false, env = process.env } = options;
  const scriptPath = requireOrgScript('backup.sh', env);
  return runScript(scriptPath, ['status'], {
    dryRun,
    env,
    label: 'backup status',
  });
}
