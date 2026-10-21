// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../../api/client';
import * as discoWidgets from '../../api/disco-widgets';
import { RequestJsonError } from '../../api/request-json';
import * as shows from '../../api/shows';
import { useChannelData } from './useChannelData';

function never<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

describe('useChannelData', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('refetches in the background without showing the loading state', async () => {
    const { result, rerender } = renderHook(
      ({ key }) => useChannelData('tahti-radio', key),
      { initialProps: { key: 0 } },
    );
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.channel).not.toBeNull();

    await act(async () => {
      rerender({ key: 1 });
      // Let the background refetch settle inside act().
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.channel).not.toBeNull();
  });

  it('publishes the channel while secondary sections are still pending', async () => {
    vi.spyOn(client, 'fetchChannelSound').mockImplementation(never);
    vi.spyOn(discoWidgets, 'fetchChannelDiscoWidgets').mockImplementation(
      never,
    );
    vi.spyOn(shows, 'fetchPublicRadioShow').mockImplementation(never);

    const { result } = renderHook(() => useChannelData('northern-lights', 0));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.channel?.slug).toBe('northern-lights');
    expect(result.current.sectionStatus).toEqual({
      sounds: 'loading',
      widgets: 'loading',
      shows: 'loading',
    });
  });

  it('marks only the failed section as errored and retries it alone', async () => {
    const widgetsSpy = vi
      .spyOn(discoWidgets, 'fetchChannelDiscoWidgets')
      .mockResolvedValue({
        data: [],
        meta: { source: 'api', reason: 'HTTP 503' },
      });
    vi.spyOn(shows, 'fetchPublicRadioShow').mockRejectedValue(
      new Error('network'),
    );
    const soundSpy = vi.spyOn(client, 'fetchChannelSound');

    const { result } = renderHook(() => useChannelData('northern-lights', 0));
    await waitFor(() =>
      expect(result.current.sectionStatus).toEqual({
        sounds: 'ready',
        widgets: 'error',
        shows: 'error',
      }),
    );
    expect(result.current.channel).not.toBeNull();
    expect(result.current.sounds.length).toBeGreaterThan(0);

    widgetsSpy.mockResolvedValue({ data: [], meta: { source: 'api' } });
    act(() => result.current.retrySection('widgets'));
    await waitFor(() =>
      expect(result.current.sectionStatus.widgets).toBe('ready'),
    );
    expect(widgetsSpy).toHaveBeenCalledTimes(2);
    expect(soundSpy).toHaveBeenCalledTimes(1);
    expect(result.current.sectionStatus.shows).toBe('error');
  });

  it('refetches only the channel on a refresh', async () => {
    const channelSpy = vi.spyOn(client, 'fetchChannel');
    const soundSpy = vi.spyOn(client, 'fetchChannelSound');
    const widgetsSpy = vi.spyOn(discoWidgets, 'fetchChannelDiscoWidgets');
    const showsSpy = vi.spyOn(shows, 'fetchPublicRadioShow');

    const { result, rerender } = renderHook(
      ({ key }) => useChannelData('northern-lights', key),
      { initialProps: { key: 0 } },
    );
    await waitFor(() =>
      expect(result.current.sectionStatus.sounds).toBe('ready'),
    );
    await act(async () => {
      rerender({ key: 1 });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(channelSpy).toHaveBeenCalledTimes(2);
    expect(soundSpy).toHaveBeenCalledTimes(1);
    expect(widgetsSpy).toHaveBeenCalledTimes(1);
    expect(showsSpy).toHaveBeenCalledTimes(1);
  });

  it('treats a 404 as not found, not as a failed load', async () => {
    vi.spyOn(client, 'fetchChannel').mockRejectedValue(
      new RequestJsonError('Not found', 404),
    );
    const { result } = renderHook(() => useChannelData('gone', 0));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.channel).toBeNull();
    expect(result.current.channelFailed).toBe(false);
  });

  it('reports a network failure and retries the channel', async () => {
    const fetchSpy = vi
      .spyOn(client, 'fetchChannel')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useChannelData('tahti-radio', 0));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.channel).toBeNull();
    expect(result.current.channelFailed).toBe(true);

    act(() => result.current.retryChannel());
    await waitFor(() => expect(result.current.channel).not.toBeNull());
    expect(result.current.channelFailed).toBe(false);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
