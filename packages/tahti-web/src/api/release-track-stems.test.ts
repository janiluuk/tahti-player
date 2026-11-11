import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteReleaseTrackStem,
  fetchReleaseTrackStems,
  resetMockReleaseTrackStems,
  uploadReleaseTrackStem,
} from './release-track-stems';

describe('release track stems mock API', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    resetMockReleaseTrackStems();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetMockReleaseTrackStems();
  });

  it('uploads, lists, replaces and removes a stem', async () => {
    const empty = await fetchReleaseTrackStems('rel-mock-1', 't1');
    expect(empty.data).toEqual([]);

    const file = new File([new Uint8Array([1, 2, 3])], 'vocals.wav', {
      type: 'audio/wav',
    });
    const uploaded = await uploadReleaseTrackStem(
      'rel-mock-1',
      't1',
      'vocals',
      file,
    );
    expect(uploaded.ok).toBe(true);
    if (!uploaded.ok) {
      return;
    }
    expect(uploaded.data.role).toBe('vocals');
    expect(uploaded.data.audioUrl).toBeTruthy();

    const listed = await fetchReleaseTrackStems('rel-mock-1', 't1');
    expect(listed.data).toHaveLength(1);

    const replaced = await uploadReleaseTrackStem(
      'rel-mock-1',
      't1',
      'vocals',
      file,
    );
    expect(replaced.ok).toBe(true);
    if (replaced.ok) {
      expect(replaced.data.id).toBe(uploaded.data.id);
    }

    const removed = await deleteReleaseTrackStem(
      'rel-mock-1',
      't1',
      uploaded.data.id,
    );
    expect(removed).toEqual({ ok: true });
    expect((await fetchReleaseTrackStems('rel-mock-1', 't1')).data).toEqual([]);
  });
});
