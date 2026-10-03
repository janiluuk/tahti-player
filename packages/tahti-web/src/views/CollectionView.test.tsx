// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CollectionItemContribution } from '../api/collection-contribution';
import type { CollectionItem, PublicCollection } from '../api/types';
import { CollectionView } from './CollectionView';

const TEST_ROW_HEIGHT = 42;

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (opts: { count: number }) => {
    const count = Math.max(0, Number(opts?.count ?? 0));
    return {
      getVirtualItems: () =>
        Array.from({ length: count }).map((_, i) => ({
          index: i,
          start: i * TEST_ROW_HEIGHT,
          end: (i + 1) * TEST_ROW_HEIGHT,
          key: i,
          size: TEST_ROW_HEIGHT,
        })),
      getTotalSize: () => count * TEST_ROW_HEIGHT,
    };
  },
}));

let collection: PublicCollection;

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return {
    ...actual,
    fetchCollection: async () => ({
      data: collection,
      meta: { source: 'api' as const },
    }),
    fetchCollectionSubscription: async () => null,
  };
});

function item(
  n: number,
  contribution: CollectionItemContribution = {},
): CollectionItem & CollectionItemContribution {
  return {
    position: n,
    release: null,
    sound: {
      id: `s${n}`,
      title: `Track ${n}`,
      audioUrl: `https://cdn.example/s${n}.mp3`,
      channel: { slug: 'chan' },
    },
    ...contribution,
  };
}

function makeCollection(items: CollectionItem[]): PublicCollection {
  return {
    slug: 'road-trip',
    name: 'Road trip',
    isPublic: true,
    collaborative: true,
    user: { username: 'owner', displayName: 'Owner' },
    items,
    links: { page: '', rss: '' },
  };
}

async function renderView() {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <CollectionView slug="road-trip" />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  await screen.findByText('Track 1');
}

afterEach(() => {
  cleanup();
});

describe('CollectionView contributions', () => {
  it("credits other people's additions by username and shows their note", async () => {
    collection = makeCollection([
      item(1, {
        addedBy: { username: 'mira', displayName: 'mira@example.com' },
        addNote: 'Perfect for the drive home',
      }),
      item(2, {
        addedBy: { username: 'owner', displayName: 'Owner' },
        addNote: null,
      }),
      item(3),
    ]);
    await renderView();

    const lines = screen.getAllByTestId('collection-contribution');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveTextContent(
      'Added by @mira · “Perfect for the drive home”',
    );
    expect(
      within(lines[0]!).getByRole('link', { name: '@mira' }),
    ).toHaveAttribute('href', '/u/mira');
    expect(screen.queryByText(/mira@example\.com/)).not.toBeInTheDocument();
  });

  it("shows the owner's own note without crediting them", async () => {
    collection = makeCollection([
      item(1, {
        addedBy: { username: 'owner', displayName: 'Owner' },
        addNote: 'Opener',
      }),
    ]);
    await renderView();

    const line = screen.getByTestId('collection-contribution');
    expect(line).toHaveTextContent('“Opener”');
    expect(line).not.toHaveTextContent('Added by');
  });

  it('shows no contribution line when the API omits the fields', async () => {
    collection = makeCollection([item(1)]);
    await renderView();

    expect(
      screen.queryByTestId('collection-contribution'),
    ).not.toBeInTheDocument();
  });
});
