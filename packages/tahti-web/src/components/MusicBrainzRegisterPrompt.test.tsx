import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as mbDefault from '../api/musicbrainz-default';
import { MusicBrainzRegisterPrompt } from './MusicBrainzRegisterPrompt';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const props = { title: 'Night Drive', artistName: 'Liis Kask' };

describe('MusicBrainzRegisterPrompt', () => {
  it('asks once and remembers "always offer"', async () => {
    vi.spyOn(mbDefault, 'fetchMusicbrainzDefault').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
    const save = vi
      .spyOn(mbDefault, 'saveMusicbrainzDefault')
      .mockResolvedValue({ ok: true });

    render(<MusicBrainzRegisterPrompt {...props} />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Always offer this' }),
    );
    await waitFor(() => expect(save).toHaveBeenCalledWith(true));
    expect(
      await screen.findByRole('button', { name: 'Stop offering' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Prepare MusicBrainz release' }),
    ).toBeVisible();
  });

  it('hides after "Don’t ask again"', async () => {
    vi.spyOn(mbDefault, 'fetchMusicbrainzDefault').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
    vi.spyOn(mbDefault, 'saveMusicbrainzDefault').mockResolvedValue({
      ok: true,
    });

    render(<MusicBrainzRegisterPrompt {...props} />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Don’t ask again' }),
    );

    await waitFor(() =>
      expect(
        screen.queryByText('Register this release on MusicBrainz'),
      ).toBeNull(),
    );
  });

  it('stays hidden when the artist declined before', async () => {
    const fetch = vi
      .spyOn(mbDefault, 'fetchMusicbrainzDefault')
      .mockResolvedValue({ data: false, meta: { source: 'api' } });

    render(<MusicBrainzRegisterPrompt {...props} />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(
      screen.queryByText('Register this release on MusicBrainz'),
    ).toBeNull();
  });
});
