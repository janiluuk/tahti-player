import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/admin/admin-listening';
import { AdminListeningPanel } from './AdminListeningPanel';

function renderPanel() {
  const rootRoute = createRootRoute();
  const index = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: AdminListeningPanel,
  });
  const channel = createRoute({
    getParentRoute: () => rootRoute,
    path: '/channel/$slug',
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([index, channel]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return render(<RouterProvider router={router} />);
}

const sample: api.AdminListening = {
  range: '30',
  listens: 1200,
  minutes: 34_000,
  signedInListeners: 210,
  surfaces: [
    { name: 'CHANNEL_PAGE', count: 900, share: 0.75 },
    { name: 'Other', count: 300, share: 0.25 },
  ],
  topChannels: [
    { slug: 'northern', name: 'Northern Lights', minutes: 5000, listens: 140 },
  ],
};

describe('AdminListeningPanel', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows totals, surfaces and top channels, and reloads for another period', async () => {
    const fetch = vi
      .spyOn(api, 'fetchAdminListening')
      .mockResolvedValue({ data: sample, meta: { source: 'api' } });
    renderPanel();

    expect(await screen.findByText('34,000')).toBeTruthy();
    expect(screen.getByText('Channel pages')).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Northern Lights' })
        .getAttribute('href'),
    ).toBe('/channel/northern');
    expect(fetch).toHaveBeenCalledWith('30');

    fireEvent.click(screen.getByRole('radio', { name: '7 days' }));
    await waitFor(() => expect(fetch).toHaveBeenLastCalledWith('7'));
  });

  it('shows a retry when the stats fail to load', async () => {
    vi.spyOn(api, 'fetchAdminListening').mockResolvedValue({
      data: { ...sample, listens: 0 },
      meta: { source: 'api', reason: 'HTTP 500' },
    });
    renderPanel();
    expect(await screen.findByText('Could not load listening')).toBeTruthy();
  });

  it('says when nobody listened in the period', async () => {
    vi.spyOn(api, 'fetchAdminListening').mockResolvedValue({
      data: { ...sample, listens: 0, surfaces: [], topChannels: [] },
      meta: { source: 'api' },
    });
    renderPanel();
    expect(
      await screen.findByText('No listening in this period.'),
    ).toBeTruthy();
  });
});
