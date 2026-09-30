// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
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

import * as api from '../api/newsletter-links';
import { NewsletterStatusView } from './NewsletterStatusView';

async function renderAt(path: string) {
  const rootRoute = createRootRoute();
  const routes = [
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/newsletter/confirmed',
      component: () => <NewsletterStatusView status={{ kind: 'confirmed' }} />,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/newsletter/unsubscribed',
      component: () => (
        <NewsletterStatusView status={{ kind: 'unsubscribed' }} />
      ),
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/newsletter/unsubscribe/tok',
      component: () => (
        <NewsletterStatusView status={{ kind: 'unsubscribe', token: 'tok' }} />
      ),
    }),
  ];
  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

describe('NewsletterStatusView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('confirms a subscription', async () => {
    await renderAt('/newsletter/confirmed');
    expect(
      screen.getByRole('heading', { name: "You're subscribed" }),
    ).toBeTruthy();
  });

  it('unsubscribes from an emailed link and lands on the done page', async () => {
    const spy = vi
      .spyOn(api, 'unsubscribeFromNewsletter')
      .mockResolvedValue({ ok: true });
    const router = await renderAt('/newsletter/unsubscribe/tok');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }));
    });
    expect(spy).toHaveBeenCalledWith('tok');
    expect(router.state.location.pathname).toBe('/newsletter/unsubscribed');
    expect(
      screen.getByRole('heading', { name: "You're unsubscribed" }),
    ).toBeTruthy();
  });

  it('shows why an unsubscribe link failed', async () => {
    vi.spyOn(api, 'unsubscribeFromNewsletter').mockResolvedValue({
      ok: false,
      error: 'This unsubscribe link is invalid or was already used.',
    });
    await renderAt('/newsletter/unsubscribe/tok');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }));
    });
    expect(screen.getByRole('alert').textContent).toContain('invalid');
  });
});
