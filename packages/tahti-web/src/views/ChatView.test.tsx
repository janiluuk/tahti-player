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
  within,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatView } from './ChatView';

const directory = [
  { slug: 'quiet-room', username: 'quiet', displayName: 'Quiet Room' },
  { slug: 'night-drive', username: 'night', displayName: 'Night Drive' },
].map((item) => ({ ...item, avatarUrl: null, genres: [] }));

vi.mock('../api/client', () => ({
  fetchDirectory: vi.fn(async () => ({ data: { items: directory } })),
  fetchChatHistory: vi.fn(async (slug: string) => ({
    data:
      slug === 'night-drive'
        ? [
            { id: 'a', handle: 'fan', text: 'hi', ts: Date.now() - 60_000 },
            { id: 'b', handle: 'fan', text: 'yo', ts: Date.now() - 120_000 },
          ]
        : [],
  })),
}));
vi.mock('../components/ChannelChatPanel', () => ({
  ChannelChatPanel: ({ slug }: { slug: string }) => {
    const [joined, setJoined] = useState(false);
    return (
      <button type="button" onClick={() => setJoined(true)}>
        {joined ? `joined ${slug}` : `join ${slug}`}
      </button>
    );
  },
}));

describe('ChatView', () => {
  afterEach(cleanup);

  it('starts the next channel’s chat from scratch instead of keeping the joined state', async () => {
    function Host() {
      const [slug, setSlug] = useState('night-drive');
      return (
        <>
          <button type="button" onClick={() => setSlug('aurora-fm')}>
            other channel
          </button>
          <ChatView slug={slug} />
        </>
      );
    }
    const router = createRouter({
      routeTree: createRootRoute({ component: Host }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });

    fireEvent.click(screen.getByRole('button', { name: 'join night-drive' }));
    expect(
      screen.getByRole('button', { name: 'joined night-drive' }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'other channel' }));

    expect(screen.getByRole('button', { name: 'join aurora-fm' })).toBeTruthy();
  });

  it('picks a channel from a dropdown and lists the last 24 hours of chat activity', async () => {
    const router = createRouter({
      routeTree: createRootRoute({ component: () => <ChatView /> }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });

    const activity = await screen.findByTestId('chat-activity');
    expect(await within(activity).findByText('Night Drive')).toBeTruthy();
    expect(within(activity).getByText('2 messages')).toBeTruthy();
    expect(within(activity).queryByText('Quiet Room')).toBeNull();
    expect(screen.queryByText('night-drive')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open chat' })).toBeTruthy();
  });
});
