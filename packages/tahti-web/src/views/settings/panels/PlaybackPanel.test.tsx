// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { usePlaybackPrefsStore } from '../../../stores/playbackPrefsStore';
import { PlaybackPanel } from './PlaybackPanel';

describe('PlaybackPanel volume normalization', () => {
  afterEach(() => {
    cleanup();
    globalThis.__TAHTI_NATIVE_LIBRARY__ = undefined;
    usePlaybackPrefsStore.setState({ normalization: 'off' });
  });

  it('is hidden without the desktop library', () => {
    render(<PlaybackPanel />);
    expect(screen.queryByText('Volume normalization')).toBeNull();
  });

  it('switches the mode in the desktop app', () => {
    globalThis.__TAHTI_NATIVE_LIBRARY__ = {
      analysis: {},
    } as unknown as typeof globalThis.__TAHTI_NATIVE_LIBRARY__;
    render(<PlaybackPanel />);

    fireEvent.click(screen.getByRole('radio', { name: 'Album' }));

    expect(usePlaybackPrefsStore.getState().normalization).toBe('album');
  });
});
