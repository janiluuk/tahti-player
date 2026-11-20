import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runHearthisCollection } from './hearthis-collection.mjs';
import { runHearthisImportEmbeds } from './hearthis-import-embeds.mjs';
import { runHearthisImportSets } from './hearthis-import-sets.mjs';
import { fetchHearthisUserSets } from './hearthis-user-sets.mjs';

vi.mock('./hearthis-user-sets.mjs', () => ({
  fetchHearthisUserSets: vi.fn(),
  filterSetsByTitle: (sets: unknown[], match: string | null) => {
    if (!match) {
      return sets;
    }
    const re = new RegExp(match, 'i');
    return (sets as { title: string }[]).filter((set) => re.test(set.title));
  },
}));

vi.mock('./hearthis-import-embeds.mjs', () => ({
  runHearthisImportEmbeds: vi.fn().mockResolvedValue('0 embeds'),
}));

vi.mock('./hearthis-collection.mjs', () => ({
  runHearthisCollection: vi.fn(),
}));

const config = { apiUrl: 'https://api.example.test', token: 'tahti_test' };

describe('runHearthisImportSets', () => {
  let outDir: string;

  afterEach(() => {
    vi.clearAllMocks();
    if (outDir) {
      rmSync(outDir, { recursive: true, force: true });
    }
  });

  it('requires --from-user', async () => {
    await expect(runHearthisImportSets(config, {})).rejects.toThrow(
      /--from-user/,
    );
  });

  it('imports each Set as a collection and records state', async () => {
    outDir = mkdtempSync(join(tmpdir(), 'tahti-import-sets-'));
    vi.mocked(fetchHearthisUserSets).mockResolvedValue({
      sets: [
        {
          permalink: 'big-set',
          title: 'Big Set',
          trackCount: 10,
        },
        {
          permalink: 'small-set',
          title: 'Small Set',
          trackCount: 2,
        },
        {
          permalink: 'empty',
          title: 'Empty',
          trackCount: 0,
        },
      ],
    });
    vi.mocked(runHearthisCollection).mockResolvedValue({
      output: 'ok',
      exitCode: 0,
      collectionUrl: 'https://beta.tahti.live/studio/collections/x',
    });

    const result = await runHearthisImportSets(config, {
      fromUser: 'yaniho',
      outDir,
      convertEmbeds: false,
      wait: 30,
      log: () => {},
    });

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('2 Set(s) processed');
    expect(runHearthisImportEmbeds).not.toHaveBeenCalled();
    expect(runHearthisCollection).toHaveBeenCalledTimes(2);
    // Smaller Sets first.
    expect(vi.mocked(runHearthisCollection).mock.calls[0]![1]).toContain(
      'small-set',
    );
    expect(vi.mocked(runHearthisCollection).mock.calls[1]![1]).toContain(
      'big-set',
    );

    const state = JSON.parse(
      readFileSync(join(outDir, '.tahti-hearthis-import-sets.json'), 'utf8'),
    );
    expect(Object.keys(state.done).sort()).toEqual(['big-set', 'small-set']);
  });

  it('skips Sets already marked done unless --force', async () => {
    outDir = mkdtempSync(join(tmpdir(), 'tahti-import-sets-'));
    writeFileSync(
      join(outDir, '.tahti-hearthis-import-sets.json'),
      JSON.stringify({
        done: { 'small-set': { title: 'Small Set', at: '2026-01-01' } },
        failed: {},
      }),
    );
    vi.mocked(fetchHearthisUserSets).mockResolvedValue({
      sets: [
        { permalink: 'small-set', title: 'Small Set', trackCount: 2 },
        { permalink: 'other', title: 'Other', trackCount: 1 },
      ],
    });
    vi.mocked(runHearthisCollection).mockResolvedValue({
      output: 'ok',
      exitCode: 0,
    });

    await runHearthisImportSets(config, {
      fromUser: 'yaniho',
      outDir,
      convertEmbeds: false,
      log: () => {},
    });

    expect(runHearthisCollection).toHaveBeenCalledTimes(1);
    expect(vi.mocked(runHearthisCollection).mock.calls[0]![1]).toContain(
      'other',
    );
  });

  it('dry-run does not write state or call embed convert', async () => {
    outDir = mkdtempSync(join(tmpdir(), 'tahti-import-sets-'));
    vi.mocked(fetchHearthisUserSets).mockResolvedValue({
      sets: [{ permalink: 'a', title: 'A', trackCount: 1 }],
    });
    vi.mocked(runHearthisCollection).mockResolvedValue({
      output: 'plan',
      exitCode: 0,
    });

    const result = await runHearthisImportSets(config, {
      fromUser: '@yaniho',
      outDir,
      dryRun: true,
      convertEmbeds: true,
      json: true,
      log: () => {},
    });

    expect(runHearthisImportEmbeds).not.toHaveBeenCalled();
    expect(JSON.parse(result.output).results[0].status).toBe('would import');
    expect(() =>
      readFileSync(join(outDir, '.tahti-hearthis-import-sets.json')),
    ).toThrow();
  });
});
