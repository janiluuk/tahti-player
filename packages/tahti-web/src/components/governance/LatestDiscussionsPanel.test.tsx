import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as discussions from '../../api/governance-discussions';
import { renderWithRouter } from '../../test/renderWithRouter';
import { LatestDiscussionsPanel } from './LatestDiscussionsPanel';

const TOPIC: discussions.DiscussionTopic = {
  id: 't1',
  title: 'Festival stage 2027',
  body: 'Who plays?',
  status: 'OPEN',
  pinned: true,
  createdBy: 'Mart Saar',
  postCount: 2,
  lastPostAt: '2026-10-20T10:00:00.000Z',
  createdAt: '2026-10-19T10:00:00.000Z',
  following: true,
  muted: false,
  unreadCount: 2,
};

describe('LatestDiscussionsPanel', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lists open topics with new replies and links to all of them', async () => {
    vi.spyOn(discussions, 'fetchDiscussionTopics').mockResolvedValue({
      data: [TOPIC, { ...TOPIC, id: 't2', title: 'Old', status: 'CLOSED' }],
      meta: { source: 'api' },
    });
    await renderWithRouter(<LatestDiscussionsPanel />, {
      paths: ['/governance/discussions', '/governance/discussions/$id'],
    });
    expect(
      await screen.findByRole('link', { name: 'Festival stage 2027' }),
    ).toHaveAttribute('href', '/governance/discussions/t1');
    expect(screen.getByText('2 new')).toBeInTheDocument();
    expect(screen.queryByText('Old')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'All discussions' }),
    ).toHaveAttribute('href', '/governance/discussions');
  });

  it('renders nothing without open topics', async () => {
    vi.spyOn(discussions, 'fetchDiscussionTopics').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'Members only' },
    });
    await renderWithRouter(<LatestDiscussionsPanel />);
    expect(screen.queryByText('Latest discussions')).not.toBeInTheDocument();
  });
});
