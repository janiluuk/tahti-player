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
    usePlayerStore.setState({ currentId: null, status: 'idle', queue: [] });
  });

  it('pings on play and every three minutes, and stops on pause', () => {
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
    expect(send).toHaveBeenLastCalledWith({ soundId: 's1' }, 'OTHER');
    act(() => {
      vi.advanceTimersByTime(LISTEN_HEARTBEAT_MS);
    });
    expect(send).toHaveBeenCalledTimes(2);
    act(() => {
      usePlayerStore.setState({ status: 'paused' });
    });
    act(() => {
      vi.advanceTimersByTime(LISTEN_HEARTBEAT_MS * 2);
    });
    expect(send).toHaveBeenCalledTimes(2);
  });
});
