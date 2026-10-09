// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePlayerStore } from '../stores/playerStore';
import { AudioEngine } from './AudioEngine';

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
  usePlayerStore.getState().clearQueue();
  usePlayerStore.setState({ volume: 0.8, fadeLevel: 1, muted: false });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  usePlayerStore.setState({ volume: 0.85, fadeLevel: 1 });
});

describe('AudioEngine fade level', () => {
  it('scales the element volume by the fade level without changing the volume setting', () => {
    const { container } = render(<AudioEngine />);
    const audio = container.querySelector('audio') as HTMLAudioElement;
    expect(audio.volume).toBeCloseTo(0.8);

    act(() => usePlayerStore.setState({ fadeLevel: 0.5 }));
    expect(audio.volume).toBeCloseTo(0.4);
    act(() => usePlayerStore.setState({ fadeLevel: 0 }));
    expect(audio.volume).toBe(0);

    act(() => usePlayerStore.setState({ fadeLevel: 1 }));
    expect(audio.volume).toBeCloseTo(0.8);
    expect(usePlayerStore.getState().volume).toBe(0.8);
  });
});
