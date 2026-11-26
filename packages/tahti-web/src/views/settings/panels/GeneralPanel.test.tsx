// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { usePlaybackPrefsStore } from '../../../stores/playbackPrefsStore';
import { GeneralPanel } from './GeneralPanel';

describe('GeneralPanel', () => {
  afterEach(() => {
    cleanup();
    usePlaybackPrefsStore.setState({ fullPlayerTitleTransition: 'fade' });
  });

  it('changes the full-screen player title transition', async () => {
    render(<GeneralPanel />);
    await userEvent.click(
      screen.getByRole('button', { name: /Full-screen title change/ }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: 'Slide sideways' }),
    );
    expect(usePlaybackPrefsStore.getState().fullPlayerTitleTransition).toBe(
      'slide-side',
    );
  });
});
