import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { buildSoundPatch, runLibraryEdit } from './library-edit.mjs';

const SOUND = {
  id: 's_1',
  title: 'Night Drive',
  status: 'READY',
  durationSec: 245,
  isPublic: true,
  genre: 'Techno',
  subGenres: [],
  createdAt: '2026-10-01T10:00:00.000Z',
};

describe('buildSoundPatch', () => {
  it('maps flags to the API field names', () => {
    expect(
      buildSoundPatch({
        title: '  Night Drive ',
        description: 'Late set',
        genre: 'Techno',
        tags: 'dark, driving,,',
        bpm: '128',
        key: 'Am',
        public: true,
        downloads: 'off',
      }),
    ).toEqual({
      title: 'Night Drive',
      description: 'Late set',
      genre: 'Techno',
      tags: ['dark', 'driving'],
      bpm: 128,
      musicalKey: 'Am',
      isPublic: true,
      downloadsEnabled: false,
    });
  });

  it('clears fields with empty values or "none"', () => {
    expect(buildSoundPatch({ genre: '', bpm: 'none', key: '' })).toEqual({
      genre: null,
      bpm: null,
      musicalKey: null,
    });
    expect(buildSoundPatch({ private: true })).toEqual({ isPublic: false });
  });

  it('rejects bad values before calling the API', () => {
    expect(() => buildSoundPatch({})).toThrow('Nothing to change');
    expect(() => buildSoundPatch({ title: '  ' })).toThrow('cannot be empty');
    expect(() => buildSoundPatch({ bpm: '20' })).toThrow('Invalid --bpm');
    expect(() => buildSoundPatch({ downloads: 'yes' })).toThrow(
      'Invalid --downloads',
    );
    expect(() => buildSoundPatch({ public: true, private: true })).toThrow(
      'not both',
    );
    expect(() =>
      buildSoundPatch({
        tags: Array.from({ length: 21 }, (_, i) => `t${i}`).join(','),
      }),
    ).toThrow('at most 20');
  });
});

describe('runLibraryEdit', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a PATCH and prints the updated sound', async () => {
    const fetchMock = mockFetchJson(SOUND);
    const output = await runLibraryEdit(TEST_CONFIG, 's_1', {
      title: 'Night Drive',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/sound/s_1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ title: 'Night Drive' }),
      }),
    );
    expect(output).toContain('Night Drive');
    expect(output).toContain('public');
  });

  it('prints the API response with --json', async () => {
    mockFetchJson(SOUND);
    const output = await runLibraryEdit(TEST_CONFIG, 's_1', {
      genre: 'Techno',
      json: true,
    });
    expect(JSON.parse(output)).toEqual(SOUND);
  });

  it('needs an id', async () => {
    await expect(
      runLibraryEdit(TEST_CONFIG, undefined, { title: 'x' }),
    ).rejects.toThrow('Missing sound id');
  });

  it('shows the API error for an unknown id or a read-only token', async () => {
    mockFetchJson({ error: 'Sound item not found' }, 404);
    await expect(
      runLibraryEdit(TEST_CONFIG, 'nope', { title: 'x' }),
    ).rejects.toThrow('Sound item not found');
    mockFetchJson({ error: 'This API token does not have write access' }, 403);
    await expect(
      runLibraryEdit(TEST_CONFIG, 's_1', { title: 'x' }),
    ).rejects.toThrow('Token invalid or missing scope');
  });
});
