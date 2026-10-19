import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  OpsError,
  packageRoot,
  playerRoot,
  requireOrgScript,
  resolveOrgRoot,
  resolveStackEnvScript,
} from './paths.mjs';

describe('paths', () => {
  const original = process.env.TAHTI_ORG_ROOT;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.TAHTI_ORG_ROOT;
    } else {
      process.env.TAHTI_ORG_ROOT = original;
    }
  });

  it('resolves package and player roots', () => {
    expect(packageRoot()).toMatch(/packages\/tahti-ops$/);
    expect(playerRoot()).toMatch(/tahti-player$/);
  });

  it('uses TAHTI_ORG_ROOT when set', () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-ops-org-'));
    expect(resolveOrgRoot({ TAHTI_ORG_ROOT: root })).toBe(root);
  });

  it('prefers org stack-env when present, else bundled', () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-ops-org-'));
    const scripts = join(root, 'scripts');
    mkdirSync(scripts);
    const bundled = resolveStackEnvScript({ TAHTI_ORG_ROOT: root });
    expect(bundled).toMatch(/packages\/tahti-ops\/scripts\/stack-env\.sh$/);

    writeFileSync(join(scripts, 'stack-env.sh'), '#!/bin/bash\n');
    expect(resolveStackEnvScript({ TAHTI_ORG_ROOT: root })).toBe(
      join(scripts, 'stack-env.sh'),
    );
  });

  it('requireOrgScript throws a clear error when missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-ops-org-'));
    mkdirSync(join(root, 'scripts'));
    expect(() =>
      requireOrgScript('stack-smoke.sh', { TAHTI_ORG_ROOT: root }),
    ).toThrow(OpsError);
    expect(() =>
      requireOrgScript('stack-smoke.sh', { TAHTI_ORG_ROOT: root }),
    ).toThrow(/TAHTI_ORG_ROOT/);
  });
});
