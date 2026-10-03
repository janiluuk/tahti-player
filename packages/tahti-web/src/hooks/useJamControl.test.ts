// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JamSession, JamTrack } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { useJamCoControl, useJamHostSync } from './useJamControl';

const { pushJamState } = vi.hoisted(() => ({ pushJamState: vi.fn() }));
vi.mock('../api/jam', () => ({ pushJamState }));

const T0 = Date.parse('2026-10-01T12:00:00.000Z');

const track: JamTrack = {
  id: 'sound:abc',
  title: 'Song',
  artistName: 'Artist',
  coverUrl: null,
  streamUrl: 'https://cdn.example.com/abc.mp3',
  protocol: 'https',
  channelSlug: null,
  durationSec: 200,
};

function session(overrides: Partial<JamSession> = {}): JamSession {
  return {
    id: 's1',
    code: 'ABCDEF',
    hostUserId: 'host',
    collectionId: null,
    isPlaying: true,
    currentTrack: track,
    positionSec: 0,
    positionUpdatedAt: new Date(T0).toISOString(),
    createdAt: new Date(T0).toISOString(),
    endedAt: null,
    participants: [],
    ...overrides,
  };
}

function playLocally(id: string) {
  act(() => {
    usePlayerStore.getState().play({
      id,
      kind: 'sound',
      title: 'Song',
      artist: 'Artist',
      streamUrl: `https://cdn.example.com/${id}.mp3`,
      protocol: 'https',
    });
    usePlayerStore.getState().setStatus('playing');
  });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  pushJamState.mockReset();
  pushJamState.mockResolvedValue(session());
  usePlayerStore.setState({ queue: [], currentId: null, status: 'idle' });
});

describe('useJamHostSync', () => {
  it("follows a co-controller's pause instead of pushing the old state back", async () => {
    playLocally('sound:abc');
    const { rerender } = renderHook(({ s }) => useJamHostSync(s, true), {
      initialProps: { s: session() },
    });
    await flush();
    expect(pushJamState).toHaveBeenCalledTimes(1);

    rerender({
      s: session({
        isPlaying: false,
        positionUpdatedAt: new Date(T0 + 2000).toISOString(),
      }),
    });
    await flush();

    expect(usePlayerStore.getState().status).toBe('paused');
    expect(pushJamState).toHaveBeenCalledTimes(1);
  });

  it('ignores a snapshot older than its own latest push', async () => {
    playLocally('sound:abc');
    const { rerender } = renderHook(({ s }) => useJamHostSync(s, true), {
      initialProps: { s: session() },
    });
    await flush();

    rerender({
      s: session({
        isPlaying: false,
        positionUpdatedAt: new Date(T0 - 2000).toISOString(),
      }),
    });
    await flush();

    expect(usePlayerStore.getState().status).toBe('playing');
  });

  it("doesn't follow anything before its own first push has landed", async () => {
    pushJamState.mockReturnValue(new Promise(() => {}));
    playLocally('sound:abc');
    const { rerender } = renderHook(({ s }) => useJamHostSync(s, true), {
      initialProps: { s: session({ isPlaying: false }) },
    });
    rerender({
      s: session({
        isPlaying: false,
        positionUpdatedAt: new Date(T0 + 1000).toISOString(),
      }),
    });
    await flush();

    expect(usePlayerStore.getState().status).toBe('playing');
  });
});

describe('useJamCoControl', () => {
  it("sends a guest's own pause of the jam track to everyone", () => {
    playLocally('sound:abc');
    renderHook(() => useJamCoControl(session(), true));

    act(() => usePlayerStore.getState().setStatus('paused'));

    expect(pushJamState).toHaveBeenCalledTimes(1);
    expect(pushJamState).toHaveBeenCalledWith(
      's1',
      expect.objectContaining({ isPlaying: false, currentTrack: track }),
    );
  });

  it('sends nothing when the player is just following the jam', () => {
    playLocally('sound:abc');
    const { rerender } = renderHook(({ s }) => useJamCoControl(s, true), {
      initialProps: { s: session() },
    });

    rerender({ s: session({ isPlaying: false }) });
    act(() => usePlayerStore.getState().setStatus('paused'));

    expect(pushJamState).not.toHaveBeenCalled();
  });

  it('never lets a different track take over the jam', () => {
    playLocally('sound:abc');
    renderHook(() => useJamCoControl(session(), true));

    playLocally('radio:other');
    act(() => usePlayerStore.getState().setStatus('paused'));

    expect(pushJamState).not.toHaveBeenCalled();
  });

  it('sends nothing without control', () => {
    playLocally('sound:abc');
    renderHook(() => useJamCoControl(session(), false));

    act(() => usePlayerStore.getState().setStatus('paused'));

    expect(pushJamState).not.toHaveBeenCalled();
  });
});
