// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { STREAM_START_TIMEOUT_MS } from '../lib/streamFailure';
import { usePlayerStore } from '../stores/playerStore';
import { useStationHealthStore } from '../stores/stationHealthStore';
import { AudioEngine } from './AudioEngine';

const STATION: TahtiPlayable = {
  id: 'radio:helsinki',
  kind: 'radio',
  title: 'Radio Helsinki',
  artist: 'Internet radio',
  streamUrl: 'https://stream.example/live.mp3',
  protocol: 'https',
};

function mount(playable: TahtiPlayable = STATION) {
  usePlayerStore.getState().play(playable);
  const { container } = render(<AudioEngine />);
  const audio = container.querySelector('audio') as HTMLAudioElement;
  const fire = (name: string) =>
    act(() => void audio.dispatchEvent(new Event(name)));
  const failWith = (code: number) => {
    Object.defineProperty(audio, 'error', {
      configurable: true,
      value: { code },
    });
    audio.crossOrigin = null;
    fire('error');
  };
  return { fire, failWith };
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockReturnValue();
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockReturnValue();
  useStationHealthStore.getState().reset();
  usePlayerStore.getState().clearQueue();
  usePlayerStore.setState({ restoredPending: null, status: 'idle' });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  usePlayerStore.getState().clearQueue();
});

describe('AudioEngine when a station fails', () => {
  it('names an unsupported format and marks the station unavailable', () => {
    const { failWith } = mount();

    failWith(3);

    const { status, failure } = usePlayerStore.getState();
    expect(status).toBe('error');
    expect(failure).toEqual({ reason: 'unsupported' });
    expect(
      useStationHealthStore.getState().byUrl[STATION.streamUrl],
    ).toMatchObject({
      state: 'unavailable',
      failure: { reason: 'unsupported' },
    });
  });

  it('probes an ambiguous load error to find the HTTP status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404 })),
    );
    const { failWith } = mount();

    failWith(4);
    expect(usePlayerStore.getState().failure).toEqual({
      reason: 'unreachable',
    });

    await vi.waitFor(() =>
      expect(usePlayerStore.getState().failure).toEqual({
        reason: 'http',
        status: 404,
      }),
    );
  });

  it('gives up with a timeout when the station never starts', () => {
    vi.useFakeTimers();
    mount();

    act(() => vi.advanceTimersByTime(STREAM_START_TIMEOUT_MS));

    expect(usePlayerStore.getState().status).toBe('error');
    expect(usePlayerStore.getState().failure).toEqual({ reason: 'timeout' });
  });

  it('marks the station ok once it plays, and no timeout fires after', () => {
    vi.useFakeTimers();
    const { fire } = mount();

    fire('playing');
    act(() => vi.advanceTimersByTime(STREAM_START_TIMEOUT_MS));

    expect(usePlayerStore.getState().status).toBe('playing');
    expect(
      useStationHealthStore.getState().byUrl[STATION.streamUrl],
    ).toMatchObject({ state: 'ok' });
  });

  it('clears the failure on retry', () => {
    const { failWith } = mount();
    failWith(3);

    act(() => usePlayerStore.getState().retry());

    expect(usePlayerStore.getState().failure).toBeNull();
  });
});
