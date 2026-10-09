// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { PublicChannel } from '../api/types';
import { usePlaybackPrefsStore } from '../stores/playbackPrefsStore';
import { usePlayerStore } from '../stores/playerStore';
import { useChannelAutoplay } from './useChannelAutoplay';

const channel = (over: Partial<PublicChannel> = {}) =>
  ({
    slug: 'night-drive',
    state: 'LIVE',
    hlsUrl: 'https://cdn.example/night-drive.m3u8',
    autoplayEnabled: true,
    user: { displayName: 'Night Drive', username: 'night-drive' },
    ...over,
  }) as PublicChannel;

const state = () => usePlayerStore.getState();

describe('useChannelAutoplay', () => {
  beforeEach(() => {
    state().clearQueue();
    usePlayerStore.setState({
      muted: false,
      autoplayRestoreMuted: null,
      hasPlayed: false,
    });
    usePlaybackPrefsStore.setState({ channelAutoplay: true });
  });

  afterEach(() => {
    cleanup();
    state().clearQueue();
    usePlayerStore.setState({ muted: false, autoplayRestoreMuted: null });
  });

  it('starts the channel muted once it has loaded', () => {
    const { rerender } = renderHook(
      ({ c }: { c: PublicChannel | null }) => useChannelAutoplay(c, true),
      { initialProps: { c: null as PublicChannel | null } },
    );
    expect(state().currentId).toBeNull();
    rerender({ c: channel() });
    expect(state().currentId).toBe('live:night-drive');
    expect(state().muted).toBe(true);
  });

  it('does it once per visit, not again after the listener stops it', () => {
    const { rerender } = renderHook(
      ({ c }: { c: PublicChannel }) => useChannelAutoplay(c, true),
      { initialProps: { c: channel() } },
    );
    state().clearQueue();
    rerender({ c: channel({ nowPlaying: null }) });
    expect(state().currentId).toBeNull();
  });

  it('stays silent when the artist, the listener or edit mode says no', () => {
    renderHook(() =>
      useChannelAutoplay(channel({ autoplayEnabled: false }), true),
    );
    expect(state().currentId).toBeNull();

    usePlaybackPrefsStore.setState({ channelAutoplay: false });
    renderHook(() => useChannelAutoplay(channel(), true));
    expect(state().currentId).toBeNull();

    usePlaybackPrefsStore.setState({ channelAutoplay: true });
    renderHook(() => useChannelAutoplay(channel(), false));
    expect(state().currentId).toBeNull();
  });
});
