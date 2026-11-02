// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { DiscoverTrackItem } from '../../api/discover-types';
import { WidgetTrackRow } from './WidgetTrackRow';

const TRACK: DiscoverTrackItem = {
  id: 'sound:s1',
  title: 'Polar Static',
  artist: 'Northern Lights',
  channelSlug: 'northern-lights',
  coverUrl: null,
};

async function renderRow(item: DiscoverTrackItem) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <WidgetTrackRow item={item} />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  let container!: HTMLElement;
  await act(async () => {
    container = render(<RouterProvider router={router} />).container;
  });
  return container;
}

describe('WidgetTrackRow', () => {
  afterEach(cleanup);

  it("shows the artist's avatar beside the name", async () => {
    const container = await renderRow({
      ...TRACK,
      artistAvatarUrl: 'https://example.com/a.png',
    });
    expect(container.querySelector('.size-4.rounded-full')).toBeTruthy();
    expect(container.textContent).toContain('Northern Lights');
  });

  it('shows the name alone without an avatar', async () => {
    const container = await renderRow(TRACK);
    expect(container.querySelector('.size-4.rounded-full')).toBeNull();
  });
});
