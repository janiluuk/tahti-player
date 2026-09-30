// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/top-list-ranks';
import type { TahtiPlayable } from '../../api/types';
import { TopListRankBadges } from './TopListRankBadges';

const track = (id: string, title: string) =>
  ({ id: `sound:${id}`, title }) as TahtiPlayable;

async function renderBadges(items: TahtiPlayable[]) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <TopListRankBadges items={items} />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return act(async () => render(<RouterProvider router={router} />));
}

describe('TopListRankBadges', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows ranked tracks, best rank first', async () => {
    const spy = vi
      .spyOn(api, 'fetchTopListRanks')
      .mockResolvedValue({ b: 2, c: 14 });
    await renderBadges([
      track('a', 'Aurora'),
      track('c', 'Cold Front'),
      track('b', 'Blue Hour'),
    ]);
    expect(spy).toHaveBeenCalledWith(['a', 'c', 'b']);
    const badges = within(screen.getByTestId('top-list-ranks')).getAllByRole(
      'listitem',
    );
    expect(badges.map((badge) => badge.textContent)).toEqual([
      '#2 Blue Hour',
      '#14 Cold Front',
    ]);
  });

  it('renders nothing when no track is ranked', async () => {
    vi.spyOn(api, 'fetchTopListRanks').mockResolvedValue({});
    await renderBadges([track('a', 'Aurora')]);
    expect(screen.queryByTestId('top-list-ranks')).toBeNull();
  });
});
