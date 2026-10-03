// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, fireEvent, screen } from '@testing-library/react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ArtistPost } from '../../api/studio-extras';
import { useAuthStore } from '../../stores/authStore';
import { StudioUpdatesView } from './StudioUpdatesView';

const sendNewsletterDraft = vi.fn();
let artistPosts: ArtistPost[] = [];

vi.mock('../../api/studio-extras', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../api/studio-extras')>();
  return {
    ...actual,
    fetchArtistPosts: async () => ({
      data: artistPosts,
      meta: { source: 'mock' as const },
    }),
    fetchNewsletterDrafts: async () => ({
      data: [
        {
          id: 'draft-1',
          subject: 'September update',
          bodyMd: 'Hello!',
          subscribersOnly: false,
          state: 'DRAFT',
          sentAt: null,
        },
      ],
      meta: { source: 'mock' as const },
    }),
    fetchNewsletterSubscriberStats: async () => ({
      data: {
        total: 50,
        confirmed: 44,
        newLast30Days: 7,
        fanSubscriberCount: 5,
      },
      meta: { source: 'mock' as const },
    }),
    sendNewsletterDraft: (...args: unknown[]) => sendNewsletterDraft(...args),
  };
});

function createRouterFor() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/updates',
    component: StudioUpdatesView,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ['/studio/updates'] }),
  });
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubEnv('VITE_FORCE_MOCK', '1');
  sendNewsletterDraft.mockResolvedValue({ ok: true, queued: 42 });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  artistPosts = [];
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

async function renderView() {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      email: 'artist@tahti.live',
      username: 'artist',
      displayName: 'An Artist',
      role: 'ARTIST',
      isBoard: false,
      isMember: true,
      channel: { slug: 'artist', state: 'OFFLINE' },
    },
    hydrated: true,
    loading: false,
  });
  const router = createRouterFor();
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('StudioUpdatesView newsletter send confirmation', () => {
  it('asks for confirmation before mailing every subscriber', async () => {
    await renderView();

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Newsletter' }));
    });

    const sendButton = screen.getByRole('button', { name: /Send/ });
    await act(async () => fireEvent.click(sendButton));

    expect(sendNewsletterDraft).not.toHaveBeenCalled();
    expect(screen.getByText('Send “September update”?')).toBeInTheDocument();

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Send newsletter' })),
    );

    expect(sendNewsletterDraft).toHaveBeenCalledWith('draft-1', 'all');
  });

  it('sends nothing when the confirmation is cancelled', async () => {
    await renderView();

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Newsletter' }));
    });
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: /Send/ })),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' })),
    );

    expect(sendNewsletterDraft).not.toHaveBeenCalled();
  });
});

describe('StudioUpdatesView newsletter subscribers', () => {
  it('shows confirmed, new and fan-only subscriber counts on the Newsletter tab', async () => {
    await renderView();
    expect(screen.queryByTestId('newsletter-subscriber-stats')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Newsletter' }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const stats = screen.getByTestId('newsletter-subscriber-stats');
    expect(stats.textContent).toContain('44');
    expect(stats.textContent).toContain('6 unconfirmed or unsubscribed');
    expect(stats.textContent).toContain('7');
    expect(stats.textContent).toContain('5');
  });
});

describe('StudioUpdatesView posts', () => {
  const post = (id: string, publishAt: string): ArtistPost => ({
    id,
    title: `Post ${id}`,
    body: 'Body',
    linkUrl: null,
    linkLabel: null,
    images: [],
    publishAt,
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  it('marks scheduled posts and lets the artist edit a post', async () => {
    const scheduledAt = '2099-06-01T09:00:00.000Z';
    artistPosts = [
      post('scheduled', scheduledAt),
      post('live', '2026-01-01T00:00:00.000Z'),
    ];
    await renderView();

    const scheduledLabels = screen.getAllByText(/Scheduled for/);
    expect(scheduledLabels).toHaveLength(1);
    expect(scheduledLabels[0]!.textContent).toContain(
      new Date(scheduledAt).toLocaleString(),
    );

    await act(async () =>
      fireEvent.click(screen.getAllByRole('button', { name: 'Edit post' })[0]!),
    );
    expect(screen.getByText('Edit post')).toBeInTheDocument();
    expect(screen.getByLabelText('Title (optional)')).toHaveValue(
      'Post scheduled',
    );
  });
});
