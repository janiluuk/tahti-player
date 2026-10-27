import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as discussions from '../api/governance-discussions';
import { useAuthStore } from '../stores/authStore';
import { DiscussionsView } from './DiscussionsView';

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
  muted: true,
  unreadCount: 3,
};

function renderView() {
  const rootRoute = createRootRoute();
  const listRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: DiscussionsView,
  });
  const topicRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/governance/discussions/$id',
    component: () => <p>topic page</p>,
  });
  const governanceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/governance',
    component: () => <p>governance</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([listRoute, topicRoute, governanceRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

describe('DiscussionsView', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'member@tahti.live',
        username: 'member',
        displayName: 'Member',
        role: 'LISTENER',
        isBoard: false,
        isMember: true,
      },
      hydrated: true,
      loading: false,
    });
  });
  afterEach(() => {
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
    vi.restoreAllMocks();
  });

  it('lists topics with their state and links to each', async () => {
    vi.spyOn(discussions, 'fetchDiscussionTopics').mockResolvedValue({
      data: [TOPIC],
      meta: { source: 'api' },
    });
    renderView();
    const link = await screen.findByRole('link', {
      name: /Festival stage 2027/,
    });
    expect(link).toHaveAttribute('href', '/governance/discussions/t1');
    expect(screen.getByLabelText('Pinned')).toBeInTheDocument();
    expect(screen.getByText('Muted')).toBeInTheDocument();
    expect(screen.getByText(/2 replies/)).toBeInTheDocument();
    expect(screen.getByText('3 new replies')).toBeInTheDocument();
  });

  it('shows the API reason with a retry when the list fails', async () => {
    const fetch = vi
      .spyOn(discussions, 'fetchDiscussionTopics')
      .mockResolvedValueOnce({
        data: [],
        meta: { source: 'api', reason: 'Members only' },
      })
      .mockResolvedValueOnce({ data: [TOPIC], meta: { source: 'api' } });
    renderView();
    expect(await screen.findByText('Members only')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByRole('link', { name: /Festival stage 2027/ }),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('says when there are no topics yet', async () => {
    vi.spyOn(discussions, 'fetchDiscussionTopics').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    renderView();
    expect(await screen.findByText('No discussions yet')).toBeInTheDocument();
  });
});
