import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { AudioEngine } from './AudioEngine';

vi.mock('hls.js', () => {
  throw new Error('chunk load failed');
});

const hlsRadio: TahtiPlayable = {
  id: 'radio:tahti',
  kind: 'radio',
  title: 'Tahti Radio',
  artist: 'Tahti',
  streamUrl: 'https://stream.example/live/index.m3u8',
  protocol: 'hls',
};

function renderAndPlay(playable: TahtiPlayable) {
  const { container } = render(<AudioEngine />);
  const audio = container.querySelector('audio') as HTMLAudioElement;
  act(() => usePlayerStore.getState().play(playable));
  return audio;
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() =>
    Promise.resolve(),
  );
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(
    () => undefined,
  );
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(
    () => undefined,
  );
  vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('');
  usePlayerStore.getState().clearQueue();
  usePlayerStore.setState({ restoredPending: null, status: 'idle' });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AudioEngine when the hls.js chunk fails to load', () => {
  it('falls back to native playback when the browser can play HLS', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockImplementation(
      (type: string) =>
        type === 'application/vnd.apple.mpegurl' ? 'maybe' : '',
    );
    const audio = renderAndPlay(hlsRadio);
    await vi.waitFor(() =>
      expect(audio.getAttribute('src')).toBe(hlsRadio.streamUrl),
    );
    expect(usePlayerStore.getState().status).not.toBe('error');
  });

  it('reports an error when nothing can play the stream', async () => {
    const audio = renderAndPlay(hlsRadio);
    await vi.waitFor(() =>
      expect(usePlayerStore.getState().status).toBe('error'),
    );
    expect(audio.getAttribute('src')).toBeNull();
  });
});
