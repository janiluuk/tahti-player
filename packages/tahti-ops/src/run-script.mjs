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

/** Runs a program (pnpm, node, gh…) directly, from `cwd`, with the same
 * dry-run and → / ✓ / ✗ labels as `runScript`. */
export async function runProgram(program, args, options = {}) {
  const {
    dryRun = false,
    env = process.env,
    cwd = process.cwd(),
    label = null,
    log = console.error,
  } = options;
  const display = label ?? formatCommand(program, args);
  if (dryRun) {
    return {
      exitCode: 0,
      output: label
        ? `dry-run: ${label} — ${formatCommand(program, args)}`
        : `dry-run: ${formatCommand(program, args)}`,
      label: display,
    };
  }
  log(`→ ${display}`);
  const result = await new Promise((resolvePromise, reject) => {
    const child = spawn(program, args, { env, cwd, stdio: 'inherit' });
    child.on('error', (error) => {
      reject(new OpsError(`Failed to run ${program}: ${error.message}`));
    });
    child.on('close', (code, signal) => {
      resolvePromise({ exitCode: signal ? 1 : (code ?? 1), output: '' });
    });
  });
  log(
    result.exitCode === 0
      ? `✓ ${display}`
      : `✗ ${display} (exit ${result.exitCode})`,
  );
  return { ...result, label: display };
}

/** Runs steps in order and stops at the first failure. */
export async function runSteps(steps, { dryRun = false } = {}) {
  const lines = [];
  for (const step of steps) {
    const result = await step({ dryRun });
    if (result.output) {
      lines.push(result.output);
    }
    if (result.exitCode !== 0) {
      return { exitCode: result.exitCode, output: lines.join('\n') };
    }
  }
  return { exitCode: 0, output: lines.join('\n') };
}
