// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/listen-heartbeat';
import { usePlayerStore } from '../stores/playerStore';
import {
  LISTEN_HEARTBEAT_MS,
  ListenHeartbeat,
  listenTargetFor,
} from './ListenHeartbeat';

describe('listenTargetFor', () => {
  it('tracks Tahti sounds and channels only', () => {
    expect(listenTargetFor('sound:s1', 'tahti')).toEqual({ soundId: 's1' });
    expect(listenTargetFor('live:night-drive', 'tahti')).toEqual({
      channelSlug: 'night-drive',
    });
    expect(listenTargetFor('radio:tahti-radio', 'tahti')).toEqual({
      channelSlug: 'tahti-radio',
    });
    expect(listenTargetFor('radio:my-r1', 'internet-radio')).toBeNull();
    expect(listenTargetFor('hearthis:123', 'hearthis')).toBeNull();
    expect(listenTargetFor(null, undefined)).toBeNull();
  });
});

describe('ListenHeartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    usePlayerStore.setState({
      currentId: null,
      status: 'idle',
      queue: [],
      currentTime: 0,
      duration: 0,
    });
  });

  it('pings on play and every three minutes, once more on pause, then stops', () => {
    const send = vi
      .spyOn(api, 'sendListenHeartbeat')
      .mockImplementation(() => {});
    usePlayerStore.setState({
      currentId: 'sound:s1',
      status: 'playing',
      queue: [],
    });
    render(<ListenHeartbeat />);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenLastCalledWith(
      { soundId: 's1' },
      'OTHER',
      undefined,
    );
    act(() => {
      vi.advanceTimersByTime(LISTEN_HEARTBEAT_MS);
    });
    expect(send).toHaveBeenCalledTimes(2);
    act(() => {
      usePlayerStore.setState({ status: 'paused' });
    });
    expect(send).toHaveBeenCalledTimes(3);
    act(() => {
      vi.advanceTimersByTime(LISTEN_HEARTBEAT_MS * 2);
    });
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('reports how far a track has played, including where it stopped', () => {
    const send = vi
      .spyOn(api, 'sendListenHeartbeat')
      .mockImplementation(() => {});
    usePlayerStore.setState({
      currentId: 'sound:s1',
      status: 'playing',
      queue: [],
      currentTime: 12,
      duration: 240,
    });
    render(<ListenHeartbeat />);
    expect(send).toHaveBeenLastCalledWith({ soundId: 's1' }, 'OTHER', {
      positionSec: 12,
      durationSec: 240,
    });
    act(() => {
      usePlayerStore.setState({ currentTime: 240 });
      usePlayerStore.setState({ status: 'paused' });
    });
    expect(send).toHaveBeenLastCalledWith({ soundId: 's1' }, 'OTHER', {
      positionSec: 240,
      durationSec: 240,
    });
  });

  it('sends no position or final ping for a live channel', () => {
    const send = vi
      .spyOn(api, 'sendListenHeartbeat')
      .mockImplementation(() => {});
    usePlayerStore.setState({
      currentId: 'live:night-drive',
      status: 'playing',
      queue: [],
      currentTime: 50,
      duration: 100,
    });
    render(<ListenHeartbeat />);
    act(() => {
      usePlayerStore.setState({ status: 'paused' });
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenLastCalledWith(
      { channelSlug: 'night-drive' },
      'OTHER',
      undefined,
    );
  });
});
