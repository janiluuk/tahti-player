import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export function packageRoot() {
  return resolve(HERE, '..');
}

export function playerRoot() {
  return resolve(packageRoot(), '../..');
}

export function resolveOrgRoot(env = process.env) {
  if (env.TAHTI_ORG_ROOT) {
    return resolve(env.TAHTI_ORG_ROOT);
  }
  return resolve(playerRoot(), '../tahti-org');
}

export function orgScriptsDir(env = process.env) {
  return resolve(resolveOrgRoot(env), 'scripts');
}

export function resolveOrgScript(name, env = process.env) {
  const path = resolve(orgScriptsDir(env), name);
  if (!existsSync(path)) {
    return null;
  }
  return path;
}

export function resolveStackEnvScript(env = process.env) {
  const fromOrg = resolveOrgScript('stack-env.sh', env);
  if (fromOrg) {
    return fromOrg;
  }
  return resolve(packageRoot(), 'scripts/stack-env.sh');
}

export function requireOrgScript(name, env = process.env) {
  const path = resolveOrgScript(name, env);
  if (!path) {
    const root = resolveOrgRoot(env);
    throw new OpsError(
      `Missing ${name} under ${root}/scripts.\nSet TAHTI_ORG_ROOT to your tahti-org checkout (expected sibling ../tahti-org).`,
    );
  }
  return path;
}

export class OpsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OpsError';
  }
}
