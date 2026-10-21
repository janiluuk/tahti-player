// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchStationNowPlaying } from '../api/radio-now-playing';
import { usePlayerStore } from '../stores/playerStore';
import {
  usePlayerStationNowPlaying,
  useStationNowPlaying,
} from './useStationNowPlaying';

vi.mock('../api/radio-now-playing', () => ({
  fetchStationNowPlaying: vi.fn(),
}));

const fetchMock = vi.mocked(fetchStationNowPlaying);

const nrj = {
  id: 'radio-widget:nrj-fi',
  title: 'NRJ',
  artist: 'Finnish · Pop / Hits',
  streamUrl: 'https://example.test/nrj',
};

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('usePlayerStationNowPlaying', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue('Usa · Viivi');
    setVisibility('visible');
    usePlayerStore.setState({ status: 'playing' });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    usePlayerStore.setState({ status: 'idle' });
  });

  it("shows the station's now-playing with its name second", async () => {
    const { result } = renderHook(() => usePlayerStationNowPlaying(nrj));
    await flush();
    expect(result.current).toEqual({ title: 'Usa · Viivi', artist: 'NRJ' });
    expect(fetchMock).toHaveBeenCalledWith({
      programmingUrl: 'https://www.radioplay.fi/nrj',
      streamUrl: 'https://example.test/nrj',
    });
  });

  it('keeps the playable lines when the station says nothing', async () => {
    fetchMock.mockResolvedValue(null);
    const { result } = renderHook(() => usePlayerStationNowPlaying(nrj));
    await flush();
    expect(result.current).toBeNull();
  });

  it('asks nothing for a playable that is not a catalog station', async () => {
    const { result } = renderHook(() =>
      usePlayerStationNowPlaying({
        id: 'track:1',
        title: 'Song',
        artist: 'Artist',
      }),
    );
    await flush(60_000);
    expect(result.current).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshes every 30 seconds only while the station plays', async () => {
    const { result } = renderHook(() => usePlayerStationNowPlaying(nrj));
    await flush();
    await flush(30_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    act(() => usePlayerStore.setState({ status: 'paused' }));
    await flush(90_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current?.title).toBe('Usa · Viivi');

    act(() => usePlayerStore.setState({ status: 'playing' }));
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('stops refreshing while the tab is hidden', async () => {
    renderHook(() => usePlayerStationNowPlaying(nrj));
    await flush();
    act(() => setVisibility('hidden'));
    await flush(90_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('useStationNowPlaying', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    setVisibility('visible');
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('drops a slow answer for a station the caller has left', async () => {
    let answerFirst: (value: string) => void = () => {};
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            answerFirst = resolve;
          }),
      )
      .mockResolvedValueOnce('Second station');
    const { result, rerender } = renderHook(
      ({ url }) => useStationNowPlaying(null, url),
      { initialProps: { url: 'https://example.test/a' } },
    );
    rerender({ url: 'https://example.test/b' });
    await flush();
    expect(result.current).toBe('Second station');

    await act(async () => answerFirst('First station'));
    expect(result.current).toBe('Second station');
  });

  it('forgets the previous station on change', async () => {
    fetchMock.mockResolvedValueOnce('First station');
    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    const { result, rerender } = renderHook(
      ({ url }) => useStationNowPlaying(null, url),
      { initialProps: { url: 'https://example.test/a' } },
    );
    await flush();
    expect(result.current).toBe('First station');
    rerender({ url: 'https://example.test/b' });
    expect(result.current).toBeNull();
  });
});
