import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import type { NativeAnalysisDetail } from '../lib/nativeLibrary';
import { usePlaybackPrefsStore } from '../stores/playbackPrefsStore';
import { usePlayerStore } from '../stores/playerStore';
import { AudioEngine } from './AudioEngine';

const gains = vi.hoisted(() => [] as Array<{ gain: { value: number } }>);

class FakeAudioContext {
  state = 'running';
  destination = {};
  createMediaElementSource = () => ({ connect: vi.fn() });
  createGain = () => {
    const node = { connect: vi.fn(), gain: { value: 1 } };
    gains.push(node);
    return node;
  };
  createAnalyser = () => ({
    connect: vi.fn(),
    fftSize: 0,
    smoothingTimeConstant: 0,
  });
  resume = () => Promise.resolve();
}

const local: TahtiPlayable = {
  id: 'local:t1',
  kind: 'sound',
  title: 'Loud one',
  artist: 'Artist',
  streamUrl: 'asset://localhost/t1.flac',
  protocol: 'https',
  sourceProvider: 'local',
};

const detail = vi.fn<(id: string) => Promise<Partial<NativeAnalysisDetail>>>();

function renderAndPlay(playable: TahtiPlayable) {
  const { container } = render(<AudioEngine />);
  const audio = container.querySelector('audio') as HTMLAudioElement;
  act(() => usePlayerStore.getState().play(playable));
  act(() => {
    audio.dispatchEvent(new Event('play'));
  });
  return audio;
}

describe('AudioEngine volume normalization', () => {
  beforeEach(() => {
    gains.length = 0;
    detail.mockReset();
    detail.mockResolvedValue({
      replaygainTrackGain: -6,
      replaygainTrackPeak: 0.9,
    });
    vi.stubGlobal('AudioContext', FakeAudioContext);
    globalThis.__TAHTI_NATIVE_LIBRARY__ = {
      analysis: { detail },
    } as unknown as typeof globalThis.__TAHTI_NATIVE_LIBRARY__;
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockReturnValue();
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockReturnValue();
    usePlayerStore.getState().clearQueue();
    usePlayerStore.setState({
      restoredPending: null,
      status: 'idle',
      volume: 1,
    });
  });

  afterEach(() => {
    cleanup();
    globalThis.__TAHTI_NATIVE_LIBRARY__ = undefined;
    usePlaybackPrefsStore.setState({ normalization: 'off' });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('applies the track gain to a local file when normalization is on', async () => {
    usePlaybackPrefsStore.setState({ normalization: 'track' });
    renderAndPlay(local);

    expect(detail).toHaveBeenCalledWith('t1');
    await waitFor(() =>
      expect(gains[0]?.gain.value).toBeCloseTo(10 ** (-6 / 20)),
    );
  });

  it('does nothing when off, and never for streams', async () => {
    renderAndPlay(local);
    act(() => usePlaybackPrefsStore.setState({ normalization: 'track' }));
    act(() =>
      usePlayerStore.getState().play({
        ...local,
        id: 'sound:x',
        sourceProvider: 'tahti',
      }),
    );
    await waitFor(() => expect(detail).toHaveBeenCalledTimes(1));
    expect(gains[0]?.gain.value).toBe(1);
  });

  it('resets the gain when normalization is switched off', async () => {
    usePlaybackPrefsStore.setState({ normalization: 'track' });
    renderAndPlay(local);
    await waitFor(() => expect(gains[0]?.gain.value).toBeLessThan(1));

    act(() => usePlaybackPrefsStore.setState({ normalization: 'off' }));

    expect(gains[0]?.gain.value).toBe(1);
  });
});
