// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { usePlayerStore } from '../stores/playerStore';
import { AutoplayUnmuteNotice } from './AutoplayUnmuteNotice';

describe('AutoplayUnmuteNotice', () => {
  afterEach(() => {
    cleanup();
    usePlayerStore.setState({ muted: false, autoplayRestoreMuted: null });
  });

  it('offers Unmute while a channel that started on its own is muted', () => {
    usePlayerStore.setState({ muted: true, autoplayRestoreMuted: false });
    render(<AutoplayUnmuteNotice />);
    expect(screen.getByRole('status').textContent).toContain(
      'This channel is playing muted.',
    );
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Unmute' }));
    });
    expect(usePlayerStore.getState().muted).toBe(false);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it("is not drawn for the listener's own mute", () => {
    usePlayerStore.setState({ muted: true, autoplayRestoreMuted: null });
    render(<AutoplayUnmuteNotice />);
    expect(screen.queryByRole('button', { name: 'Unmute' })).toBeNull();
  });
});
