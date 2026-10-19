import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from './cli.mjs';

describe('main', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('prints help listing day-1 commands', async () => {
    const code = await main(['--help']);
    expect(code).toBe(0);
    const help = String(logSpy.mock.calls[0][0]);
    expect(help).toContain('tahti-ops');
    expect(help).toContain('tahti-ops env');
    expect(help).toContain('tahti-ops stack smoke');
    expect(help).toContain('tahti-ops backup status');
    expect(help).toContain('tahti-ops deploy');
    expect(help).toContain('@tahti-player/tahti-cli');
  });

  it('exits 1 for unknown commands', async () => {
    const code = await main(['bogus']);
    expect(code).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown command: bogus'),
    );
  });

  it('dry-runs stack smoke with a short label', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-ops-org-'));
    mkdirSync(join(root, 'scripts'));
    writeFileSync(
      join(root, 'scripts/stack-smoke.sh'),
      '#!/bin/bash\necho smoke\n',
    );
    vi.stubEnv('TAHTI_ORG_ROOT', root);

    const code = await main(['stack', 'smoke', '--dry-run']);
    expect(code).toBe(0);
    expect(String(logSpy.mock.calls[0][0])).toBe('dry-run: stack smoke');
  });

  it('dry-runs backup status with a short label', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-ops-org-'));
    mkdirSync(join(root, 'scripts'));
    writeFileSync(join(root, 'scripts/backup.sh'), '#!/bin/bash\necho "$1"\n');
    vi.stubEnv('TAHTI_ORG_ROOT', root);

    const code = await main(['backup', 'status', '--dry-run']);
    expect(code).toBe(0);
    expect(String(logSpy.mock.calls[0][0])).toBe('dry-run: backup status');
  });

  it('dry-runs env against the bundled stack-env script', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-ops-org-'));
    mkdirSync(join(root, 'scripts'));
    vi.stubEnv('TAHTI_ORG_ROOT', root);

    const code = await main(['env', 'list', '--dry-run']);
    expect(code).toBe(0);
    expect(String(logSpy.mock.calls[0][0])).toBe('dry-run: env list');
  });

  it('dry-runs deploy all in order', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-ops-org-'));
    mkdirSync(join(root, 'scripts'));
    for (const name of [
      'deploy_prod.sh',
      'deploy_worker_remote.sh',
      'deploy_minio_remote.sh',
    ]) {
      writeFileSync(join(root, 'scripts', name), '#!/bin/bash\n');
    }
    vi.stubEnv('TAHTI_ORG_ROOT', root);

    const code = await main(['deploy', 'all', '--dry-run']);
    expect(code).toBe(0);
    expect(String(logSpy.mock.calls[0][0])).toBe(
      [
        'dry-run: deploy stack',
        'dry-run: deploy worker',
        'dry-run: deploy minio',
      ].join('\n'),
    );
  });

  it('runs a local stub script for backup status (not dry-run)', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tahti-ops-org-'));
    mkdirSync(join(root, 'scripts'));
    writeFileSync(
      join(root, 'scripts/backup.sh'),
      '#!/usr/bin/env bash\necho "backup-$1-ok"\n',
    );
    vi.stubEnv('TAHTI_ORG_ROOT', root);

    const code = await main(['backup', 'status']);
    expect(code).toBe(0);
    expect(errorSpy.mock.calls.map((call) => String(call[0]))).toEqual([
      '→ backup status',
      '✓ backup status',
    ]);
  });
});
