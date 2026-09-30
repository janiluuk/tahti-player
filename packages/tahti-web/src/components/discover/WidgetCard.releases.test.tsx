// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WidgetCard } from './WidgetCard';

describe('WidgetCard latest releases', () => {
  afterEach(cleanup);

  it('links each release to its smart link', async () => {
    const router = createRouter({
      routeTree: createRootRoute({
        component: () => (
          <WidgetCard
            id="latest-releases"
            title="Latest releases"
            loading={false}
            items={[]}
            releases={[
              {
                id: 'r1',
                title: 'Night Drive',
                type: 'EP',
                releaseDate: '2026-09-25T00:00:00.000Z',
                artworkUrl: null,
                smartLinkSlug: 'night-drive',
                artistDisplayName: 'Tahti',
              },
            ]}
            emptyMessage="No releases published yet."
            canMoveUp={false}
            canMoveDown={false}
            onMove={vi.fn()}
            onRemove={vi.fn()}
          />
        ),
      }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    const link = within(screen.getByTestId('latest-releases')).getByRole(
      'link',
    );
    expect(link.getAttribute('href')).toBe('/r/night-drive');
    expect(link.textContent).toContain('Night Drive');
    expect(link.textContent).toContain('Tahti · ep');
  });
});
