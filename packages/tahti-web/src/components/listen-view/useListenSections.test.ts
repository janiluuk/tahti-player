// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as discoWidgets from '../../api/disco-widgets';
import * as discover from '../../api/discover';
import * as listen from '../../api/listen';
import * as radioPublic from '../../api/radio-public';
import {
  clearListenSectionCache,
  LISTEN_CACHE_TTL_MS,
  useListenSections,
} from './useListenSections';

function never<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

const apiFailure = { source: 'api' as const, reason: 'HTTP 503' };

describe('useListenSections', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    clearListenSectionCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('publishes each section as it resolves while slower ones stay loading', async () => {
    vi.spyOn(listen, 'fetchOnAirChannels').mockImplementation(never);
    vi.spyOn(discover, 'fetchLatestTracks').mockImplementation(never);

    const { result } = renderHook(() => useListenSections(false));
    await waitFor(() => {
      expect(result.current.radio.status).toBe('ready');
      expect(result.current.presets.status).toBe('ready');
      expect(result.current.discoWidgets.status).toBe('ready');
    });
    expect(result.current.radio.data?.slug).toBe('tahti-radio');
    expect(result.current.onAir.status).toBe('loading');
    expect(result.current.latestTracks.status).toBe('loading');
  });

  it('marks only the failed sections as errored', async () => {
    vi.spyOn(listen, 'fetchOnAirChannels').mockResolvedValue({
      data: { live: [], replaying: [], recent: [] },
      meta: apiFailure,
    });
    vi.spyOn(discover, 'fetchLatestTracks').mockResolvedValue({
      data: [],
      meta: apiFailure,
    });
    vi.spyOn(radioPublic, 'fetchRadioStation').mockRejectedValue(
      new Error('network'),
    );

    const { result } = renderHook(() => useListenSections(false));
    await waitFor(() => {
      expect(result.current.onAir.status).toBe('error');
      expect(result.current.latestTracks.status).toBe('error');
      expect(result.current.radio.status).toBe('error');
    });
    expect(result.current.presets.status).toBe('ready');
    expect(result.current.presets.data.length).toBeGreaterThan(0);
    expect(result.current.discoWidgets.status).toBe('ready');
  });

  it('keeps an empty result distinct from an error', async () => {
    vi.spyOn(listen, 'fetchOnAirChannels').mockResolvedValue({
      data: { live: [], replaying: [], recent: [] },
      meta: { source: 'api' },
    });

    const { result } = renderHook(() => useListenSections(false));
    await waitFor(() => expect(result.current.onAir.status).toBe('ready'));
    expect(result.current.onAir.data).toEqual([]);
  });

  it('retries one section alone, showing loading again while it refetches', async () => {
    const onAirSpy = vi
      .spyOn(listen, 'fetchOnAirChannels')
      .mockResolvedValueOnce({
        data: { live: [], replaying: [], recent: [] },
        meta: apiFailure,
      })
      .mockImplementationOnce(never);
    const tracksSpy = vi.spyOn(discover, 'fetchLatestTracks');

    const { result } = renderHook(() => useListenSections(false));
    await waitFor(() => expect(result.current.onAir.status).toBe('error'));

    act(() => result.current.retry('onAir'));
    await waitFor(() => expect(result.current.onAir.status).toBe('loading'));
    expect(onAirSpy).toHaveBeenCalledTimes(2);
    expect(tracksSpy).toHaveBeenCalledTimes(1);
    expect(result.current.latestTracks.status).toBe('ready');
  });

  it('shows signed-in widgets when the homepage request fails', async () => {
    const mine = {
      installId: 'mine-1',
      widgetSlug: 'live-status',
      name: 'Live status',
      sandboxUrl: 'about:blank',
      version: '1.0.0',
      position: 0,
      config: {},
      context: {},
    };
    vi.spyOn(discoWidgets, 'fetchHomepageDiscoWidgets').mockResolvedValue({
      data: [],
      meta: apiFailure,
    });
    vi.spyOn(discoWidgets, 'fetchDiscoverDiscoWidgets').mockResolvedValue({
      data: [mine],
      meta: { source: 'api' },
    });

    const { result } = renderHook(() => useListenSections(true));
    await waitFor(() =>
      expect(result.current.discoWidgets.status).toBe('ready'),
    );
    expect(result.current.discoWidgets.data).toEqual([mine]);
  });

  it('errors the widgets section when every widget request fails', async () => {
    vi.spyOn(discoWidgets, 'fetchHomepageDiscoWidgets').mockResolvedValue({
      data: [],
      meta: apiFailure,
    });

    const { result } = renderHook(() => useListenSections(false));
    await waitFor(() =>
      expect(result.current.discoWidgets.status).toBe('error'),
    );
  });

  describe('read cache', () => {
    const onAirOnce = (slug: string) => ({
      data: {
        live: [{ slug, user: { displayName: slug } }],
        replaying: [],
        recent: [],
      },
      meta: { source: 'api' as const },
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows the last result without a request when coming back soon', async () => {
      const spy = vi
        .spyOn(listen, 'fetchOnAirChannels')
        .mockResolvedValue(onAirOnce('first') as never);
      const first = renderHook(() => useListenSections(false));
      await waitFor(() =>
        expect(first.result.current.onAir.status).toBe('ready'),
      );
      first.unmount();

      const second = renderHook(() => useListenSections(false));
      expect(second.result.current.onAir.status).toBe('ready');
      expect(second.result.current.onAir.data[0]?.slug).toBe('first');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('shows stale data while refreshing, and keeps it if the refresh fails', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const spy = vi
        .spyOn(listen, 'fetchOnAirChannels')
        .mockResolvedValueOnce(onAirOnce('first') as never)
        .mockResolvedValueOnce(onAirOnce('second') as never)
        .mockRejectedValueOnce(new Error('offline'));
      const first = renderHook(() => useListenSections(false));
      await waitFor(() =>
        expect(first.result.current.onAir.status).toBe('ready'),
      );
      first.unmount();

      vi.advanceTimersByTime(LISTEN_CACHE_TTL_MS + 1);
      const second = renderHook(() => useListenSections(false));
      expect(second.result.current.onAir.data[0]?.slug).toBe('first');
      await waitFor(() =>
        expect(second.result.current.onAir.data[0]?.slug).toBe('second'),
      );
      second.unmount();

      vi.advanceTimersByTime(LISTEN_CACHE_TTL_MS + 1);
      const third = renderHook(() => useListenSections(false));
      await waitFor(() => expect(spy).toHaveBeenCalledTimes(3));
      expect(third.result.current.onAir.status).toBe('ready');
      expect(third.result.current.onAir.data[0]?.slug).toBe('second');
    });

    it('asks the API again on retry even when the cache is fresh', async () => {
      const spy = vi
        .spyOn(listen, 'fetchOnAirChannels')
        .mockResolvedValueOnce(onAirOnce('first') as never)
        .mockResolvedValueOnce(onAirOnce('second') as never);
      const { result } = renderHook(() => useListenSections(false));
      await waitFor(() => expect(result.current.onAir.status).toBe('ready'));
      act(() => result.current.retry('onAir'));
      await waitFor(() =>
        expect(result.current.onAir.data[0]?.slug).toBe('second'),
      );
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("keeps each listener's own widgets apart", async () => {
      const mine = vi
        .spyOn(discoWidgets, 'fetchDiscoverDiscoWidgets')
        .mockResolvedValue({ data: [], meta: { source: 'api' } } as never);
      const a = renderHook(() => useListenSections(true, 'user-a'));
      await waitFor(() =>
        expect(a.result.current.discoWidgets.status).toBe('ready'),
      );
      a.unmount();
      const b = renderHook(() => useListenSections(true, 'user-b'));
      expect(b.result.current.discoWidgets.status).toBe('loading');
      await waitFor(() =>
        expect(b.result.current.discoWidgets.status).toBe('ready'),
      );
      expect(mine).toHaveBeenCalledTimes(2);
    });
  });
});
