// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_DECODE_SEC, useWaveformData } from './useWaveformData';

const peaks = { sampleRate: 8000, durationSec: 60, levels: [[10, 200, 30]] };

describe('useWaveformData', () => {
  const fetchMock = vi.fn();
  const revoke = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array(64), {
        headers: { 'content-type': 'audio/wav' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    URL.createObjectURL = vi.fn(() => 'blob:local');
    URL.revokeObjectURL = revoke;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    revoke.mockClear();
  });

  it('shows the server peaks at once and keeps the download for playback', async () => {
    const { result, unmount } = renderHook(() =>
      useWaveformData('https://cdn/track.wav', peaks, 60, () => undefined),
    );
    expect(result.current.data?.exact).toBe(false);
    await waitFor(() => expect(result.current.localUrl).toBe('blob:local'));
    await waitFor(() => expect(result.current.status).toBe('overview-only'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:local');
  });

  it('skips the download for sources too long to decode', () => {
    const { result } = renderHook(() =>
      useWaveformData(
        'https://cdn/set.mp3',
        peaks,
        MAX_DECODE_SEC + 1,
        () => undefined,
      ),
    );
    expect(result.current.status).toBe('overview-only');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
