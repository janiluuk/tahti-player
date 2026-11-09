import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as social from '../../api/social-autopost';
import { renderWithRouter } from '../../test/renderWithRouter';
import { EventShareTargets } from './EventShareTargets';

const off = {
  connected: false,
  accountLabel: null,
  onReleasePublished: false,
  onChannelLive: false,
  postTemplate: '',
};

describe('EventShareTargets', () => {
  it('offers only the connected accounts', async () => {
    vi.spyOn(social, 'fetchSocialAutoPost').mockResolvedValue({
      data: {
        mastodon: {
          ...off,
          connected: true,
          accountLabel: '@demo@mastodon.social',
        },
        bluesky: off,
        twitter: { ...off, configured: false },
        instagram: { ...off, configured: false },
      },
      meta: { source: 'api' },
    });
    const onChange = vi.fn();
    await renderWithRouter(
      <EventShareTargets value={[]} onChange={onChange} />,
    );
    fireEvent.click(
      await screen.findByLabelText('Mastodon (@demo@mastodon.social)'),
    );
    expect(onChange).toHaveBeenCalledWith(['MASTODON']);
    expect(screen.queryByLabelText(/Bluesky/)).not.toBeInTheDocument();
  });

  it('points to Settings when nothing is connected', async () => {
    vi.spyOn(social, 'fetchSocialAutoPost').mockResolvedValue({
      data: {
        mastodon: off,
        bluesky: off,
        twitter: { ...off, configured: false },
        instagram: { ...off, configured: false },
      },
      meta: { source: 'api' },
    });
    await renderWithRouter(<EventShareTargets value={[]} onChange={vi.fn()} />);
    expect(
      await screen.findByRole('link', { name: 'Settings → Artist' }),
    ).toHaveAttribute('href', '/settings/artist');
  });
});
