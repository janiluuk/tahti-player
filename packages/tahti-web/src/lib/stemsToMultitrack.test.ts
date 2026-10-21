import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendStemFilesToMultitrack } from './stemsToMultitrack';

const loadStemsMock = vi.fn(async () => ['t1', 't2']);

vi.mock('@tahti-player/audio-editor', () => ({
  loadStemFilesOntoMultitrack: (...args: unknown[]) => loadStemsMock(...args),
}));

describe('sendStemFilesToMultitrack', () => {
  beforeEach(() => {
    loadStemsMock.mockClear();
    loadStemsMock.mockResolvedValue(['t1', 't2']);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        blob: async () =>
          new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/wav' }),
      })),
    );
  });

  it('returns an error when there are no files', async () => {
    const result = await sendStemFilesToMultitrack([]);
    expect(result).toEqual({ ok: false, error: 'No stem files to load.' });
    expect(loadStemsMock).not.toHaveBeenCalled();
  });

  it('fetches each stem and loads Multitrack lanes', async () => {
    const result = await sendStemFilesToMultitrack([
      { label: 'Vocals', url: 'https://example.test/v.wav' },
      { label: 'Drums', url: 'https://example.test/d.wav' },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.trackIds).toEqual(['t1', 't2']);
    }
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(loadStemsMock).toHaveBeenCalledWith([
      expect.objectContaining({ label: 'Vocals' }),
      expect.objectContaining({ label: 'Drums' }),
    ]);
  });

  it('surfaces download failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 403 })),
    );
    const result = await sendStemFilesToMultitrack([
      { label: 'Vocals', url: 'https://example.test/v.wav' },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/403/);
    }
  });
});
