import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SubscribedCollections } from './SubscribedCollections';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

describe('SubscribedCollections', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists the collections you subscribed to', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              slug: 'night-drive',
              name: 'Night Drive',
              type: 'CUSTOM',
              coverUrl: null,
              itemCount: 1,
              ownerUsername: 'aino',
              ownerDisplayName: 'Aino',
              subscribedAt: '2026-10-01T12:00:00.000Z',
            },
          ],
        }),
        { status: 200 },
      ),
    );
    render(<SubscribedCollections />);
    expect(await screen.findByText('Night Drive')).toBeTruthy();
    expect(screen.getByText('Aino · 1 track')).toBeTruthy();
    expect(String(fetchSpy.mock.calls[0]![0])).toContain(
      '/api/me/collection-subscriptions',
    );
  });

  it('renders nothing without subscriptions', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), { status: 200 }),
    );
    const { container } = render(<SubscribedCollections />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.textContent).toBe('');
  });
});
