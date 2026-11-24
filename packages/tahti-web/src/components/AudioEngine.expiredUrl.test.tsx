// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { AudioEngine, clearStreamsWithoutCors } from './AudioEngine';

function signedTrack(id: string): TahtiPlayable {
  return {
    id: `sound:${id}`,
    kind: 'sound',
    title: 'Magwump',
    artist: 'Yaniho',
    streamUrl: `https://cdn.example/flac/${id}.flac?X-Amz-Date=20261123T220201Z&X-Amz-Expires=3600&X-Amz-Signature=old${id}`,
    protocol: 'https',
    durationSec: 337,
  };
}

function mount() {
  const { container } = render(<AudioEngine />);
  const audio = () => container.querySelector('audio') as HTMLAudioElement;
  const fire = (name: string) =>
    act(() => void audio().dispatchEvent(new Event(name)));
  return { audio, fire };
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  clearStreamsWithoutCors();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockReturnValue();
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockReturnValue();
  usePlayerStore.getState().clearQueue();
  usePlayerStore.setState({ restoredPending: null, status: 'idle' });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  usePlayerStore.getState().clearQueue();
});

describe('AudioEngine with an expired signed URL', () => {
  it('fetches a fresh URL for the track and plays that instead of failing', async () => {
    const detail = vi.spyOn(client, 'fetchTrackDetail').mockResolvedValue({
      data: { audioUrl: 'https://cdn.example/flac/a.flac?X-Amz-Signature=new' },
      meta: { source: 'api' },
    } as Awaited<ReturnType<typeof client.fetchTrackDetail>>);
    const { audio, fire } = mount();
    act(() => usePlayerStore.getState().play(signedTrack('a')));

    fire('error');
    fire('error');
    await flush();

    expect(detail).toHaveBeenCalledWith('a');
    expect(audio().getAttribute('src')).toBe(
      'https://cdn.example/flac/a.flac?X-Amz-Signature=new',
    );
    expect(usePlayerStore.getState().status).toBe('loading');
  });

  it('reports the error when no fresh URL comes back', async () => {
    vi.spyOn(client, 'fetchTrackDetail').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    } as Awaited<ReturnType<typeof client.fetchTrackDetail>>);
    const { fire } = mount();
    act(() => usePlayerStore.getState().play(signedTrack('b')));

    fire('error');
    fire('error');
    await flush();

    expect(usePlayerStore.getState().status).toBe('error');
  });

  it('does not refresh an unsigned URL', () => {
    const detail = vi.spyOn(client, 'fetchTrackDetail');
    const { fire } = mount();
    act(() =>
      usePlayerStore.getState().play({
        ...signedTrack('c'),
        streamUrl: 'https://cdn.example/c.mp3',
      }),
    );

    fire('error');
    fire('error');

    expect(detail).not.toHaveBeenCalled();
    expect(usePlayerStore.getState().status).toBe('error');
  });
});
