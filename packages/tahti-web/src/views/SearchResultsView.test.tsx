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
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as listen from '../api/listen';
import type { SearchResponse } from '../api/search-types';
import { SearchResultsView } from './SearchResultsView';

const EMPTY: SearchResponse = { tracks: [], artists: [], collections: [] };

async function renderResults(q = 'aurora') {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <SearchResultsView q={q} />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('SearchResultsView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a retryable error instead of "No results" when the API fails', async () => {
    const search = vi
      .spyOn(listen, 'fetchSearch')
      .mockResolvedValueOnce({
        data: EMPTY,
        meta: { source: 'api', reason: '/api/v1/search → 500' },
      })
      .mockResolvedValue({
        data: {
          ...EMPTY,
          artists: [
            { username: 'aurora', displayName: 'Aurora', avatarUrl: null },
          ],
        },
        meta: { source: 'api' },
      });

    await renderResults();

    expect(
      await screen.findByText('Could not load search results'),
    ).toBeTruthy();
    expect(screen.queryByText(/No results for/)).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });

    expect(await screen.findByText('Aurora')).toBeTruthy();
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('keeps "No results" for a genuine empty response', async () => {
    vi.spyOn(listen, 'fetchSearch').mockResolvedValue({
      data: EMPTY,
      meta: { source: 'api' },
    });

    await renderResults('zzz');

    expect(await screen.findByText('No results for “zzz”')).toBeTruthy();
    expect(screen.queryByText('Could not load search results')).toBeNull();
  });
});
