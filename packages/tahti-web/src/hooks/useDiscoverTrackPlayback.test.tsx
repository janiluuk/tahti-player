// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePlayerStore } from '../stores/playerStore';
import { useDiscoverTrackPlayback } from './useDiscoverTrackPlayback';

const { fetchTrackDetail } = vi.hoisted(() => ({ fetchTrackDetail: vi.fn() }));
vi.mock('../api/client', () => ({ fetchTrackDetail }));

describe('useDiscoverTrackPlayback', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps the track detail peaks when a top-list row has no stream yet', async () => {
    fetchTrackDetail.mockResolvedValue({
      data: {
        title: 'Polar Static',
        artistName: 'Aino',
        bannerUrl: null,
        audioUrl: 'https://cdn.example/s1.mp3',
        channelSlug: 'aino',
        durationSec: 240,
        peaks: [7, 210, 64],
      },
    });
    const play = vi.fn();
    usePlayerStore.setState({ play, currentId: null });
    const { result } = renderHook(() =>
      useDiscoverTrackPlayback({
        id: 'sound:s1',
        title: 'Polar Static',
        artist: 'Aino',
        channelSlug: 'aino',
      }),
    );
    await act(() => result.current.togglePlay());
    expect(play).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sound:s1', peaks: [7, 210, 64] }),
    );
  });
});
