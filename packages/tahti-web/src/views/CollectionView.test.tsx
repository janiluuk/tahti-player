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
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CollectionItemContribution } from '../api/collection-contribution';
import type { CollectionItem, PublicCollection } from '../api/types';
import { useAuthStore, type AuthUser } from '../stores/authStore';
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
let fetchCollectionImpl: () => Promise<{
  data: PublicCollection;
  meta: { source: 'api' | 'mock'; reason?: string };
}>;

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return {
    ...actual,
    fetchCollection: () => fetchCollectionImpl(),
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

async function mountView() {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <CollectionView slug="road-trip" />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

async function renderView() {
  await mountView();
  await screen.findByText('Track 1');
}

beforeEach(() => {
  fetchCollectionImpl = async () => ({
    data: collection,
    meta: { source: 'api' as const },
  });
});

afterEach(() => {
  cleanup();
  useAuthStore.setState({ user: null });
});

describe('CollectionView reporting', () => {
  it('lets a visitor report a public collection', async () => {
    collection = makeCollection([item(1)]);
    await renderView();
    expect(
      screen.getByRole('button', { name: 'Report Road trip' }),
    ).toBeInTheDocument();
  });

  it('hides the report button from the owner', async () => {
    useAuthStore.setState({ user: { username: 'owner' } as AuthUser });
    collection = makeCollection([item(1)]);
    await renderView();
    expect(
      screen.queryByRole('button', { name: 'Report Road trip' }),
    ).not.toBeInTheDocument();
  });
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

describe('CollectionView load errors', () => {
  it('shows a retryable error when the collection API fails', async () => {
    collection = makeCollection([item(1)]);
    fetchCollectionImpl = vi
      .fn<typeof fetchCollectionImpl>()
      .mockRejectedValueOnce(new Error('/api/v1/collections/road-trip → 500'))
      .mockResolvedValue({ data: collection, meta: { source: 'api' } });
    await mountView();

    expect(
      await screen.findByText('Could not load this collection'),
    ).toBeTruthy();
    expect(screen.queryByText('Collection not found')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(await screen.findByText('Track 1')).toBeTruthy();
  });

  it('shows the error state when the API meta carries a reason', async () => {
    collection = makeCollection([]);
    fetchCollectionImpl = async () => ({
      data: collection,
      meta: { source: 'api', reason: 'boom' },
    });
    await mountView();

    expect(
      await screen.findByText('Could not load this collection'),
    ).toBeTruthy();
    expect(screen.getByText('boom')).toBeTruthy();
  });
});
