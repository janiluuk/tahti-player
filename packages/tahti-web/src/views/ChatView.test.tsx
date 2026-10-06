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
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatView } from './ChatView';

vi.mock('../api/client', () => ({
  fetchDirectory: vi.fn().mockResolvedValue({ data: { items: [] } }),
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
});
