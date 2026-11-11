import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchPublicListeningParties,
  type ListeningPartySummaryDto,
} from '../../api/listening-parties';
import { useAuthStore } from '../../stores/authStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import {
  DiscoverPartiesPanel,
  DiscoverPartiesRow,
} from './DiscoverPartiesPanel';

vi.mock('../../api/listening-parties', () => ({
  fetchPublicListeningParties: vi.fn(),
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
    channel: { slug: `channel-${id}`, name: `Channel ${id}` },
  };
}

function serve(items: ListeningPartySummaryDto[], reason?: string) {
  vi.mocked(fetchPublicListeningParties).mockResolvedValue({
    data: items,
    meta: reason ? { source: 'api', reason } : { source: 'api' },
  });
}

describe('DiscoverPartiesPanel', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('lists parties across channels with join and open links', async () => {
    serve([row('now', 'LIVE'), row('next', 'SCHEDULED')]);
    await renderWithRouter(<DiscoverPartiesPanel />);
    expect(await screen.findByText('Release now')).toBeTruthy();
    expect(
      screen.getByRole('link', {
        name: 'Open the listening party for Release now',
      }),
    ).toHaveAttribute('href', '/party/now');
    expect(screen.getByRole('link', { name: 'Channel next' })).toHaveAttribute(
      'href',
      '/channel/channel-next',
    );
    expect(fetchPublicListeningParties).toHaveBeenCalledWith(50);
    expect(screen.queryByRole('link', { name: 'Start a party' })).toBeNull();
  });

  it('offers artists a way to start their own party', async () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'artist@tahti.live',
        username: 'artist',
        displayName: 'Artist',
        role: 'ARTIST',
        isMember: true,
        channel: { slug: 'artist', state: 'LIVE' },
      } as never,
    });
    serve([]);
    await renderWithRouter(<DiscoverPartiesPanel />);
    expect(
      await screen.findByRole('link', { name: 'Start a party' }),
    ).toHaveAttribute('href', '/studio/listening-parties/new');
    expect(screen.getByText('No listening parties right now')).toBeTruthy();
  });

  it('shows the error when the list fails', async () => {
    serve([], 'Network down');
    await renderWithRouter(<DiscoverPartiesPanel />);
    expect(
      await screen.findByText('Could not load listening parties'),
    ).toBeTruthy();
  });
});

describe('DiscoverPartiesRow', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the next three parties and links to the tab', async () => {
    serve([row('a', 'LIVE')]);
    await renderWithRouter(<DiscoverPartiesRow />);
    expect(await screen.findByText('Release a')).toBeTruthy();
    expect(fetchPublicListeningParties).toHaveBeenCalledWith(3);
    expect(screen.getByRole('link', { name: /See all/ })).toHaveAttribute(
      'href',
      '/discover?tab=parties',
    );
  });

  it('renders nothing when no party is on', async () => {
    serve([]);
    const { container } = await renderWithRouter(<DiscoverPartiesRow />);
    await vi.waitFor(() =>
      expect(fetchPublicListeningParties).toHaveBeenCalled(),
    );
    expect(
      container.querySelector('[data-testid="discover-parties-row"]'),
    ).toBeNull();
  });
});
