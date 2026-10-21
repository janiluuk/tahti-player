// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/channel-redirect';
import { ChannelNotFound } from './ChannelNotFound';

async function renderAt(slug: string) {
  const rootRoute = createRootRoute();
  const channelRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/channel/$slug',
    component: function Channel() {
      const { slug: current } = channelRoute.useParams();
      return current === slug ? (
        <ChannelNotFound slug={current} />
      ) : (
        <p>Channel {current}</p>
      );
    },
  });
  const history = createMemoryHistory({ initialEntries: [`/channel/${slug}`] });
  const router = createRouter({
    routeTree: rootRoute.addChildren([channelRoute]),
    history,
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

describe('ChannelNotFound', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("sends a renamed channel's old address to the new one", async () => {
    const spy = vi
      .spyOn(api, 'fetchChannelSlugRedirect')
      .mockResolvedValue('new-name');
    const router = await renderAt('old-name');
    expect(spy).toHaveBeenCalledWith('old-name');
    expect(router.state.location.pathname).toBe('/channel/new-name');
    expect(screen.getByText('Channel new-name')).toBeTruthy();
  });

  it('says the channel is gone without a redirect', async () => {
    vi.spyOn(api, 'fetchChannelSlugRedirect').mockResolvedValue(null);
    await renderAt('gone');
    expect(screen.getByText('Channel not found')).toBeTruthy();
  });
});
