import { spawn } from 'node:child_process';

import { OpsError } from './paths.mjs';

export function formatCommand(scriptPath, args) {
  const quoted = [scriptPath, ...args].map((part) =>
    /[\s"$\\]/.test(part) ? JSON.stringify(part) : part,
  );
  return quoted.join(' ');
}

export async function runScript(scriptPath, args, options = {}) {
  const {
    dryRun = false,
    env = process.env,
    stdin = 'inherit',
    stdout = 'inherit',
    stderr = 'inherit',
    quietDeprecation = true,
    label = null,
    log = console.error,
  } = options;

  const display = label ?? formatCommand(scriptPath, args);

  if (dryRun) {
    return {
      exitCode: 0,
      output: `dry-run: ${display}`,
      label: display,
    };
  }

  if (label) {
    log(`→ ${label}`);
  }

  const childEnv = { ...env };
  if (quietDeprecation) {
    childEnv.TAHTI_OPS_QUIET = '1';
  }

  const result = await new Promise((resolvePromise, reject) => {
    const child = spawn('bash', [scriptPath, ...args], {
      env: childEnv,
      stdio: [stdin, stdout, stderr],
    });
    child.on('error', (error) => {
      reject(new OpsError(`Failed to run ${scriptPath}: ${error.message}`));
    });
    child.on('close', (code, signal) => {
      if (signal) {
        resolvePromise({ exitCode: 1, output: '' });
        return;
      }
      resolvePromise({ exitCode: code ?? 1, output: '' });
    });
  });

  if (label) {
    if (result.exitCode === 0) {
      log(`✓ ${label}`);
    } else {
      log(`✗ ${label} (exit ${result.exitCode})`);
    }
  }

  return { ...result, label: display };
}
