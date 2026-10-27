import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as discussions from '../api/governance-discussions';
import { useAuthStore } from '../stores/authStore';
import { DiscussionTopicView } from './DiscussionTopicView';

const TOPIC: discussions.DiscussionTopicDetail = {
  id: 't1',
  title: 'Festival stage 2027',
  body: 'Who plays?',
  status: 'OPEN',
  pinned: false,
  createdBy: 'Mart Saar',
  postCount: 1,
  lastPostAt: '2026-10-20T10:00:00.000Z',
  createdAt: '2026-10-19T10:00:00.000Z',
  following: false,
  muted: false,
  posts: [
    {
      id: '1',
      body: 'An ambient set?',
      author: 'Liis Kask',
      createdAt: '2026-10-20T10:00:00.000Z',
    },
  ],
};

function renderView() {
  const rootRoute = createRootRoute();
  const topicRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <DiscussionTopicView id="t1" />,
  });
  const listRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/governance/discussions',
    component: () => <p>list</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([topicRoute, listRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

describe('DiscussionTopicView', () => {
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

  it('shows the topic and its replies, and posts a reply', async () => {
    const fetch = vi
      .spyOn(discussions, 'fetchDiscussionTopic')
      .mockResolvedValue({ data: TOPIC, meta: { source: 'api' } });
    const reply = vi.spyOn(discussions, 'replyToDiscussion').mockResolvedValue({
      ok: true,
      data: {
        id: '2',
        body: 'Count me in',
        author: 'Member',
        createdAt: '2026-10-21T10:00:00.000Z',
      },
    });
    renderView();
    expect(await screen.findByText('Who plays?')).toBeInTheDocument();
    expect(screen.getByText('An ambient set?')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Your reply'), {
      target: { value: 'Count me in' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Post reply' }));
    await waitFor(() =>
      expect(reply).toHaveBeenCalledWith('t1', 'Count me in'),
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("shows the API's reason when a reply is refused", async () => {
    vi.spyOn(discussions, 'fetchDiscussionTopic').mockResolvedValue({
      data: TOPIC,
      meta: { source: 'api' },
    });
    vi.spyOn(discussions, 'replyToDiscussion').mockResolvedValue({
      ok: false,
      error: 'This topic is closed to replies',
    });
    renderView();
    fireEvent.change(await screen.findByLabelText('Your reply'), {
      target: { value: 'Late' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Post reply' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This topic is closed to replies',
    );
  });

  it('a closed topic has no reply form', async () => {
    vi.spyOn(discussions, 'fetchDiscussionTopic').mockResolvedValue({
      data: { ...TOPIC, status: 'CLOSED' },
      meta: { source: 'api' },
    });
    renderView();
    expect(
      await screen.findByText(/it takes no more replies/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Your reply')).not.toBeInTheDocument();
  });

  it('says why a topic could not load', async () => {
    vi.spyOn(discussions, 'fetchDiscussionTopic').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'Topic not found' },
    });
    renderView();
    expect(await screen.findByText('Topic not found')).toBeInTheDocument();
  });
});
