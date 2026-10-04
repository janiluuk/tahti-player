// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { usePlayerStore } from '../stores/playerStore';
import { useWarnBeforeLeavingWhilePlaying } from './useWarnBeforeLeavingWhilePlaying';

function leavePage(): boolean {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe('useWarnBeforeLeavingWhilePlaying', () => {
  afterEach(() => {
    cleanup();
    act(() => usePlayerStore.setState({ status: 'idle' }));
  });

  it('asks for confirmation only while audio is playing', () => {
    act(() => usePlayerStore.setState({ status: 'idle' }));
    renderHook(() => useWarnBeforeLeavingWhilePlaying());
    expect(leavePage()).toBe(false);

    act(() => usePlayerStore.setState({ status: 'playing' }));
    expect(leavePage()).toBe(true);

    act(() => usePlayerStore.setState({ status: 'paused' }));
    expect(leavePage()).toBe(false);
  });

  it('stops asking once the app is unmounted', () => {
    act(() => usePlayerStore.setState({ status: 'playing' }));
    const { unmount } = renderHook(() => useWarnBeforeLeavingWhilePlaying());
    expect(leavePage()).toBe(true);
    unmount();
    expect(leavePage()).toBe(false);
  });
});
