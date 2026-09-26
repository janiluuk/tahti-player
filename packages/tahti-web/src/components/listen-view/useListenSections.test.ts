// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as discoWidgets from '../../api/disco-widgets';
import * as discover from '../../api/discover';
import * as listen from '../../api/listen';
import * as radioPublic from '../../api/radio-public';
import { useListenSections } from './useListenSections';

function never<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

const apiFailure = { source: 'api' as const, reason: 'HTTP 503' };

describe('useListenSections', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
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
});
