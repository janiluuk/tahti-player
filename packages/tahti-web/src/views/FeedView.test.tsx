// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import * as rss from '../api/rss-feed';
import type { AuthUser } from '../stores/authStore';
import { useAuthStore } from '../stores/authStore';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { FeedView } from './FeedView';

async function renderFeed() {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <FeedView embedded /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('FeedView', () => {
  beforeEach(() => {
    useAuthStore.setState({
      hydrated: true,
      user: {
        id: 'u1',
        email: 'listener@example.com',
        username: 'listener',
        displayName: 'Listener',
        role: 'LISTENER',
        roles: ['LISTENER'],
      } as unknown as AuthUser,
    });
    vi.spyOn(client, 'fetchFeed').mockResolvedValue({
      data: {
        followingCount: 1,
        items: [
          {
            kind: 'post',
            id: 'p1',
            date: new Date(Date.now() - 2 * 3_600_000).toISOString(),
            artist: {
              username: 'moon',
              displayName: 'DJ Moonlight',
              avatarUrl: null,
            },
            title: 'Thursday show moved',
            body: 'Starting an hour later.\n\nSee you after midnight.',
            images: ['https://example.com/p.jpg'],
          },
        ],
      },
      meta: { source: 'api' },
    });
    vi.spyOn(rss, 'fetchRssArticles').mockResolvedValue({
      data: [
        {
          id: 'a1',
          title: 'Winter grants open',
          teaser: 'Apply before December.',
          publishedAt: new Date(Date.now() - 86_400_000 * 3).toISOString(),
          paragraphs: ['Apply before December.'],
        },
      ],
      meta: { source: 'api' },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useListenerWidgetsStore.setState({ instances: [] });
    useAuthStore.setState({ user: null });
  });

  it('opens a post with its full text, author and relative date', async () => {
    await renderFeed();
    expect(await screen.findByText('2 hours ago')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Thursday show moved' }),
    );
    const article = await screen.findByTestId('news-article');
    expect(article.textContent).toContain('Starting an hour later.');
    expect(article.textContent).toContain('See you after midnight.');
    expect(article.textContent).toContain('DJ Moonlight');
    expect(screen.getByRole('link', { name: 'Artist page' })).toHaveAttribute(
      'href',
      '/u/moon',
    );
  });

  it('shows the Feed news sources as Latest News and opens an article', async () => {
    useListenerWidgetsStore.setState({
      instances: [
        {
          id: 'n1',
          typeId: 'news',
          input: 'https://example.com/rss.xml',
          label: 'Tahti News',
          addedAt: '2026-11-01T00:00:00.000Z',
          surfaces: ['feed'],
        },
      ],
    });
    await renderFeed();
    expect(
      await screen.findByRole('heading', { name: 'Latest News' }),
    ).toBeTruthy();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Winter grants open' }),
    );
    const article = await screen.findByTestId('news-article');
    expect(article.textContent).toContain('Apply before December.');
    expect(article.textContent).toContain('3 days ago');
  });
});
