// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { usePlaybackPrefsStore } from '../../../stores/playbackPrefsStore';
import { FullPlayerTitleTransitionSetting } from './FullPlayerTitleTransitionSetting';

const STORAGE_KEY = 'tahti-playback-prefs';
const stored = () =>
  JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
    state?: { fullPlayerTitleTransition?: string };
  };

afterEach(() => {
  cleanup();
  usePlaybackPrefsStore.getState().setFullPlayerTitleTransition('fade');
  localStorage.removeItem(STORAGE_KEY);
});

describe('FullPlayerTitleTransitionSetting', () => {
  it('starts on fade and remembers the picked transition', async () => {
    render(<FullPlayerTitleTransitionSetting />);
    const select = screen.getByRole('button', {
      name: /Full-screen title change/,
    });
    expect(select.textContent).toContain('Fade');

    await userEvent.click(select);
    await userEvent.click(
      await screen.findByRole('option', { name: 'Slide sideways' }),
    );

    expect(usePlaybackPrefsStore.getState().fullPlayerTitleTransition).toBe(
      'slide-side',
    );
    expect(stored().state?.fullPlayerTitleTransition).toBe('slide-side');
  });
});

describe('a saved title transition', () => {
  it('falls back to fade when the saved value is unknown', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { fullPlayerTitleTransition: 'spin', skipSeconds: 10 },
        version: 0,
      }),
    );
    await usePlaybackPrefsStore.persist.rehydrate();
    expect(usePlaybackPrefsStore.getState().fullPlayerTitleTransition).toBe(
      'fade',
    );
    expect(usePlaybackPrefsStore.getState().skipSeconds).toBe(10);
  });

  it('restores a known saved value', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { fullPlayerTitleTransition: 'soft-scale' },
        version: 0,
      }),
    );
    await usePlaybackPrefsStore.persist.rehydrate();
    expect(usePlaybackPrefsStore.getState().fullPlayerTitleTransition).toBe(
      'soft-scale',
    );
  });
});
