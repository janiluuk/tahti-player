import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { runStashList } from './stash-list.mjs';

const PAGE = {
  page: 2,
  limit: 1,
  total: 3,
  files: [
    {
      id: 'st_1',
      filename: 'night-drive-master.wav',
      contentType: 'audio/wav',
      sizeBytes: '52428800',
      format: 'WAV',
      bitDepth: 24,
      sampleRate: 48000,
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z',
      shareCount: 1,
      shares: [{ id: 'sh_1', token: 'secret-share-token' }],
    },
  ],
};

describe('runStashList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists a page of files without share tokens', async () => {
    const fetchMock = mockFetchJson(PAGE);
    const output = await runStashList(TEST_CONFIG, { page: '2', limit: '1' });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/me/stash?page=2&limit=1',
    );
    expect(output).toContain('night-drive-master.wav');
    expect(output).toContain('50.0 MB');
    expect(output).toContain('WAV 24-bit 48 kHz');
    expect(output).not.toContain('secret-share-token');
    expect(output).toMatch(/2-2 of 3\.$/);
  });

  it('says when the stash is empty or the page is past the end', async () => {
    mockFetchJson({ page: 1, limit: 100, total: 0, files: [] });
    expect(await runStashList(TEST_CONFIG)).toContain('Your stash is empty');
    mockFetchJson({ page: 5, limit: 100, total: 3, files: [] });
    expect(await runStashList(TEST_CONFIG, { page: '5' })).toBe(
      'No files on page 5 (3 in total).',
    );
  });

  it('rejects a --limit over 100', async () => {
    await expect(runStashList(TEST_CONFIG, { limit: '101' })).rejects.toThrow(
      'Invalid --limit',
    );
  });
});
