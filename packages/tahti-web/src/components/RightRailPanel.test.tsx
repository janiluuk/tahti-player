import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { useLayoutStore } from '../stores/layoutStore';
import { RightRailHeaderActions } from './RightRailHeaderActions';
import { RightRailPanel } from './RightRailPanel';

const CHAT_OR_NOTIFICATIONS = /chat|notification/i;

async function renderInRouter(ui: ReactNode) {
  const root = createRootRoute({ component: () => ui });
  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({ getParentRoute: () => root, path: '/' }),
      createRoute({ getParentRoute: () => root, path: '/discover' }),
      createRoute({ getParentRoute: () => root, path: '/radio' }),
    ]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('right rail is the queue only', () => {
  afterEach(cleanup);

  it('has no chat or notification controls, open or collapsed', async () => {
    for (const isCollapsed of [false, true]) {
      await renderInRouter(
        <>
          <RightRailHeaderActions />
          <RightRailPanel isCollapsed={isCollapsed} />
        </>,
      );
      const labels = screen
        .queryAllByRole('button')
        .map(
          (button) =>
            `${button.getAttribute('aria-label') ?? ''} ${button.textContent ?? ''}`,
        );
      expect(
        labels.filter((label) => CHAT_OR_NOTIFICATIONS.test(label)),
      ).toEqual([]);
      cleanup();
    }
  });

  it('renders the queue view', async () => {
    await renderInRouter(<RightRailPanel isCollapsed={false} />);
    expect(
      screen.getByTestId('right-rail').getAttribute('data-right-rail-view'),
    ).toBe('queue');
  });

  it('moves a saved chat or notifications rail back to the queue', async () => {
    localStorage.setItem(
      'tahti-web-layout',
      JSON.stringify({
        state: { rightRailTab: 'chat', chatSlug: 'yaniho', chatEnabled: true },
        version: 6,
      }),
    );
    await useLayoutStore.persist.rehydrate();
    const state = useLayoutStore.getState() as unknown as Record<
      string,
      unknown
    >;
    expect(state.rightRailTab).toBe('queue');
    expect(state.chatSlug).toBeUndefined();
    localStorage.removeItem('tahti-web-layout');
  });
});
