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

import type { TahtiPlayable } from '../api/types';
import { useLayoutStore } from '../stores/layoutStore';
import { usePlayerStore } from '../stores/playerStore';
import { RightRailHeaderActions } from './RightRailHeaderActions';
import { RightRailPanel } from './RightRailPanel';

const SAMPLE: TahtiPlayable = {
  id: 'sound:queue-fs',
  kind: 'sound',
  title: 'Queue FS',
  artist: 'Test',
  streamUrl: 'https://cdn.tahti.live/demo.mp3',
  protocol: 'https',
  durationSec: 60,
};

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

  it('opens the full-screen player from the queue header', async () => {
    useLayoutStore.getState().setFullScreenPlayerOpen(false);
    usePlayerStore.getState().clearQueue();
    await renderInRouter(<RightRailHeaderActions />);
    expect(screen.getByTestId('queue-fullscreen-button')).toBeDisabled();
    cleanup();
    usePlayerStore.getState().hydrateQueue([SAMPLE], SAMPLE.id);
    await renderInRouter(<RightRailHeaderActions />);
    const enabled = screen.getByTestId('queue-fullscreen-button');
    expect(enabled).not.toBeDisabled();
    await act(async () => {
      enabled.click();
    });
    expect(useLayoutStore.getState().fullScreenPlayerOpen).toBe(true);
    usePlayerStore.getState().clearQueue();
    useLayoutStore.getState().setFullScreenPlayerOpen(false);
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
