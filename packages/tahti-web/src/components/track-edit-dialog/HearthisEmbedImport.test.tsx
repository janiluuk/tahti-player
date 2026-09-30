// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/embed-import';
import { HearthisEmbedImport } from './HearthisEmbedImport';

describe('HearthisEmbedImport', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('starts the import and says the track will switch over', async () => {
    const spy = vi
      .spyOn(api, 'importHearthisEmbedAudio')
      .mockResolvedValue({ ok: true });
    render(<HearthisEmbedImport soundId="s1" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Import audio' }));
    });
    expect(spy).toHaveBeenCalledWith('s1');
    expect(screen.getByTestId('hearthis-import-status').textContent).toContain(
      'Importing',
    );
    expect(
      (
        screen.getByRole('button', {
          name: 'Import audio',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it('shows why the import could not start and allows a retry', async () => {
    vi.spyOn(api, 'importHearthisEmbedAudio').mockResolvedValue({
      ok: false,
      error:
        'The artist has not enabled downloads for this track on hearthis.at',
    });
    render(<HearthisEmbedImport soundId="s1" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Import audio' }));
    });
    expect(screen.getByText(/has not enabled downloads/)).toBeTruthy();
    expect(
      (
        screen.getByRole('button', {
          name: 'Import audio',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });
});
