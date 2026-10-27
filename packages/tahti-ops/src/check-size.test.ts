import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { main } from './cli.mjs';
import { runCheckSize } from './commands/check-size.mjs';

const LIMIT = 5;

function makeRepo(files: Record<string, number>, baseline?: object) {
  const root = mkdtempSync(join(tmpdir(), 'tahti-ops-size-'));
  for (const [path, lines] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, Array.from({ length: lines }, () => 'x').join('\n'));
  }
  mkdirSync(join(root, 'scripts'));
  if (baseline) {
    writeFileSync(
      join(root, 'scripts/file-size-baseline.json'),
      JSON.stringify(baseline),
    );
  }
  return root;
}

const readBaseline = (root: string) =>
  JSON.parse(
    readFileSync(join(root, 'scripts/file-size-baseline.json'), 'utf8'),
  );

describe('check size', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('is listed in help with its flags', async () => {
    await main(['--help']);
    expect(String(logSpy.mock.calls[0][0])).toContain(
      'tahti-ops check size [--update|--prune]',
    );
    logSpy.mockClear();
    expect(await main(['check', 'size', '--help'])).toBe(0);
    expect(String(logSpy.mock.calls[0][0])).toContain(
      'scripts/file-size-baseline.json',
    );
  });

  it('rejects --update together with --prune', async () => {
    await expect(
      main(['check', 'size', '--update', '--prune']),
    ).rejects.toThrow(/either --update or --prune/);
  });

  it('fails for a new file over the limit', () => {
    const root = makeRepo({ 'packages/player/src/Big.tsx': 9 });
    const result = runCheckSize({ root, limit: LIMIT });
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain(
      '✗ packages/player/src/Big.tsx: 9 lines (limit 5)',
    );
  });

  it('ignores tests, stories and other file types', () => {
    const root = makeRepo({
      'packages/player/src/Big.test.tsx': 9,
      'packages/player/src/Big.stories.tsx': 9,
      'packages/tahti-web/src/notes.md': 9,
    });
    expect(runCheckSize({ root, limit: LIMIT }).exitCode).toBe(0);
  });

  it('allows a pinned file to stay or shrink but not grow', () => {
    const pinned = { 'packages/tahti-web/src/Big.ts': 8 };
    const shrunk = makeRepo({ 'packages/tahti-web/src/Big.ts': 7 }, pinned);
    expect(runCheckSize({ root: shrunk, limit: LIMIT }).exitCode).toBe(0);

    const grown = makeRepo({ 'packages/tahti-web/src/Big.ts': 9 }, pinned);
    const result = runCheckSize({ root: grown, limit: LIMIT });
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('(pinned ≤ 8)');
  });

  it('warns about stale pins and drops them with --prune', () => {
    const root = makeRepo(
      { 'packages/player/src/Small.ts': 2 },
      { 'packages/player/src/Small.ts': 9, 'packages/player/src/Gone.ts': 9 },
    );
    const check = runCheckSize({ root, limit: LIMIT });
    expect(check.exitCode).toBe(0);
    expect(check.output).toContain('Stale baseline pin(s)');

    expect(runCheckSize({ root, limit: LIMIT, mode: 'prune' }).output).toBe(
      'Pruned 2 stale baseline pin(s): packages/player/src/Small.ts, packages/player/src/Gone.ts\n✓ No new or grown source files over 5 lines (0 pinned).',
    );
    expect(readBaseline(root)).toEqual({});
  });

  it('rewrites the baseline with --update', () => {
    const root = makeRepo({
      'packages/player/src-tauri/src/lib.rs': 9,
      'packages/player/src/Ok.ts': 3,
    });
    const result = runCheckSize({ root, limit: LIMIT, mode: 'update' });
    expect(result.output).toBe('Baseline written: 1 files over 5 lines.');
    expect(readBaseline(root)).toEqual({
      'packages/player/src-tauri/src/lib.rs': 9,
    });
  });
});
