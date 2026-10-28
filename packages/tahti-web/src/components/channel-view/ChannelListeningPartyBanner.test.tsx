import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchChannelListeningParties,
  type ListeningPartySummaryDto,
} from '../../api/listening-parties';
import { renderWithRouter } from '../../test/renderWithRouter';
import { ChannelListeningPartyBanner } from './ChannelListeningPartyBanner';

vi.mock('../../api/listening-parties', () => ({
  fetchChannelListeningParties: vi.fn(),
}));

function row(
  id: string,
  state: ListeningPartySummaryDto['state'],
): ListeningPartySummaryDto {
  return {
    id,
    state,
    startAt: '2026-11-06T20:00:00.000Z',
    endAt: '2026-11-06T21:00:00.000Z',
    release: { id: `rel-${id}`, title: `Release ${id}`, artworkUrl: null },
    channel: { slug: 'night-drive', name: 'Night Drive' },
  };
}

async function renderBanner(items: ListeningPartySummaryDto[]) {
  vi.mocked(fetchChannelListeningParties).mockResolvedValue({
    data: items,
    meta: { source: 'api' },
  });
  return renderWithRouter(<ChannelListeningPartyBanner slug="night-drive" />);
}

describe('ChannelListeningPartyBanner', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('prefers a live party and links to it', async () => {
    await renderBanner([row('next', 'SCHEDULED'), row('now', 'LIVE')]);
    expect(await screen.findByText('Release now')).toBeTruthy();
    expect(screen.getByText('Listening party · live now')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Join now' })).toHaveAttribute(
      'href',
      '/party/now',
    );
  });

  it('shows the next upcoming party with its start time', async () => {
    await renderBanner([row('next', 'SCHEDULED')]);
    expect(
      await screen.findByRole('link', { name: 'Open party' }),
    ).toHaveAttribute('href', '/party/next');
    expect(document.querySelector('time')).toHaveAttribute(
      'dateTime',
      '2026-11-06T20:00:00.000Z',
    );
  });

  it('renders nothing without a party', async () => {
    await renderBanner([]);
    expect(fetchChannelListeningParties).toHaveBeenCalledWith('night-drive');
    expect(
      screen.queryByRole('region', { name: 'Listening party' }),
    ).toBeNull();
  });
});
