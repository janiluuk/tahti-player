// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LatestRelease } from '../../api/latest-releases';
import { WidgetCard } from './WidgetCard';

async function renderReleases(release: LatestRelease) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <WidgetCard
          id="latest-releases"
          title="Latest releases"
          loading={false}
          items={[]}
          releases={[release]}
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
  return within(screen.getByTestId('latest-releases'));
}

const RELEASE: LatestRelease = {
  id: 'r1',
  title: 'Night Drive',
  type: 'EP',
  releaseDate: '2026-09-25T00:00:00.000Z',
  artworkUrl: null,
  smartLinkSlug: 'night-drive',
  artistDisplayName: 'Tahti',
  artistUsername: 'tahti',
};

describe('WidgetCard latest releases', () => {
  afterEach(cleanup);

  it('links each release to its smart link and its artist', async () => {
    const list = await renderReleases(RELEASE);
    expect(
      list.getByRole('link', { name: 'Night Drive' }).getAttribute('href'),
    ).toBe('/r/night-drive');
    expect(list.getByRole('link', { name: 'Tahti' }).getAttribute('href')).toBe(
      '/u/tahti',
    );
    expect(list.getByText(/ep ·/)).toBeTruthy();
  });

  it('shows the artist name without a link from an older API', async () => {
    const list = await renderReleases({
      ...RELEASE,
      artistUsername: undefined,
    });
    expect(list.queryByRole('link', { name: 'Tahti' })).toBeNull();
    expect(list.getByText(/Tahti/)).toBeTruthy();
  });
});
