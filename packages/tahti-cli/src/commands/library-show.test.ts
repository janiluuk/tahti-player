import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { formatSoundDetails, runLibraryShow } from './library-show.mjs';

const SOUND = {
  id: 'snd_1',
  title: 'Night Drive',
  status: 'READY',
  durationSec: 245,
  isPublic: true,
  contentType: 'TRACK',
  genre: 'Techno',
  subGenres: ['Dub'],
  effectiveBpm: 128,
  effectiveKey: 'Am',
  sourceFormat: 'flac',
  sourceBitrateKbps: null,
  sourceSampleRateHz: 44100,
  sourceBitDepth: 24,
  releasedAt: '2026-09-01T00:00:00.000Z',
  createdAt: '2026-08-30T10:00:00.000Z',
};

describe('formatSoundDetails', () => {
  it('renders a key/value view of the sound', () => {
    const output = formatSoundDetails(SOUND);
    expect(output).toContain('TITLE       Night Drive');
    expect(output).toContain('DURATION    4:05');
    expect(output).toContain('VISIBILITY  public');
    expect(output).toContain('GENRE       Techno, Dub');
    expect(output).toContain('FORMAT      flac, 44100 Hz, 24-bit');
    expect(output).toContain('RELEASED    2026-09-01');
  });

  it('shows dashes for missing metadata', () => {
    const output = formatSoundDetails({
      id: 'snd_2',
      title: 'Draft',
      status: 'PROCESSING',
    });
    expect(output).toContain('BPM         -');
    expect(output).toContain('DURATION    --:--');
  });
});

describe('runLibraryShow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls GET /api/me/sound/:id with an encoded id', async () => {
    const fetchMock = mockFetchJson(SOUND);
    await runLibraryShow(TEST_CONFIG, 'a/b');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/sound/a%2Fb',
      expect.anything(),
    );
  });

  it('prints the API response unchanged with --json', async () => {
    mockFetchJson(SOUND);
    const output = await runLibraryShow(TEST_CONFIG, 'snd_1', { json: true });
    expect(JSON.parse(output)).toEqual(SOUND);
  });

  it('requires an id', async () => {
    const fetchMock = mockFetchJson(SOUND);
    await expect(runLibraryShow(TEST_CONFIG, undefined)).rejects.toThrow(
      /Missing sound id/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces the API 404 message', async () => {
    mockFetchJson({ error: 'Sound item not found' }, 404);
    await expect(runLibraryShow(TEST_CONFIG, 'nope')).rejects.toThrow(
      'Sound item not found',
    );
  });

  it('reports an invalid token on 401', async () => {
    mockFetchJson({ error: 'Invalid or expired API token' }, 401);
    await expect(runLibraryShow(TEST_CONFIG, 'snd_1')).rejects.toThrow(
      /Token invalid or missing scope/,
    );
  });
});
