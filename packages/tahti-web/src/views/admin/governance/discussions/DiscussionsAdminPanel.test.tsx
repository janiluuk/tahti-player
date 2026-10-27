import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as discussions from '../../../../api/governance-discussions';
import { renderWithRouter } from '../../../../test/renderWithRouter';
import { DiscussionsAdminPanel } from './DiscussionsAdminPanel';

const TOPIC: discussions.DiscussionTopic = {
  id: 't1',
  title: 'Festival stage 2027',
  body: 'Who plays?',
  status: 'OPEN',
  pinned: false,
  createdBy: 'Mart Saar',
  postCount: 3,
  lastPostAt: '2026-10-20T10:00:00.000Z',
  createdAt: '2026-10-19T10:00:00.000Z',
  following: true,
  muted: false,
};

describe('DiscussionsAdminPanel', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens a topic with title, body and pin', async () => {
    vi.spyOn(discussions, 'fetchDiscussionTopics').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    const create = vi
      .spyOn(discussions, 'createDiscussionTopic')
      .mockResolvedValue({ ok: true, data: TOPIC });
    await renderWithRouter(<DiscussionsAdminPanel />, {
      paths: ['/governance/discussions/$id'],
    });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Open a topic' }),
    );
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Festival stage 2027' },
    });
    fireEvent.change(screen.getByLabelText('What should members talk about?'), {
      target: { value: 'Who plays?' },
    });
    fireEvent.click(screen.getByRole('switch', { name: 'Pin to the top' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open topic' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        title: 'Festival stage 2027',
        body: 'Who plays?',
        pinned: true,
      }),
    );
  });

  it('pins and closes a topic', async () => {
    vi.spyOn(discussions, 'fetchDiscussionTopics').mockResolvedValue({
      data: [TOPIC],
      meta: { source: 'api' },
    });
    const update = vi
      .spyOn(discussions, 'updateDiscussionTopic')
      .mockResolvedValue({ ok: true, data: TOPIC });
    await renderWithRouter(<DiscussionsAdminPanel />, {
      paths: ['/governance/discussions/$id'],
    });
    expect(
      await screen.findByRole('link', { name: 'Festival stage 2027' }),
    ).toHaveAttribute('href', '/governance/discussions/t1');
    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('t1', { pinned: true }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('t1', { status: 'CLOSED' }),
    );
  });

  it('shows why the topics could not load', async () => {
    vi.spyOn(discussions, 'fetchDiscussionTopics').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'Board only' },
    });
    await renderWithRouter(<DiscussionsAdminPanel />);
    expect(await screen.findByText('Board only')).toBeInTheDocument();
  });
});
