import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../../../stores/authStore';
import type { ServicePlugin } from '../serviceCatalog';
import { HearthisCard } from './HearthisCard';

const { toast, sources, studio, extras } = vi.hoisted(() => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(() => 'id'),
  },
  sources: {
    library: vi.fn(),
    collectionTracks: vi.fn(),
    importTracks: vi.fn(),
    search: vi.fn(),
  },
  studio: {
    createStudioCollection: vi.fn(),
    fetchStudioCollections: vi.fn(),
    patchStudioCollection: vi.fn(),
  },
  extras: { fetchMeProfile: vi.fn(), patchMeProfile: vi.fn() },
}));

vi.mock('sonner', () => ({ toast, Toaster: () => null }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../../plugins/import-sources', () => ({
  hearthisSourceAdapter: sources,
}));
vi.mock('../../../api/studio', () => studio);
vi.mock('../../../api/studio-extras', () => extras);
vi.mock('../../../api/integrations', () => ({
  installMeIntegration: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../SourceServiceIcon', () => ({ SourceServiceIcon: () => null }));

const plugin = {
  id: 'hearthis',
  name: 'hearthis.at',
  author: 'Tahti',
  description: '',
} as unknown as ServicePlugin;

const track = (id: string) => ({
  id,
  title: `Track ${id}`,
  username: 'dj',
  url: `https://hearthis.at/${id}`,
});
const collection = (id: string, permalink: string) => ({
  id,
  title: `Set ${id}`,
  description: '',
  permalink,
  coverUrl: null,
  trackCount: 1,
});

const openPanel = async () => {
  const gears = await screen.findAllByRole('button', { name: 'Configure' });
  fireEvent.click(gears[gears.length - 1]!);
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useAuthStore.setState({ user: { id: 'u1' } } as never);
  extras.fetchMeProfile.mockResolvedValue({
    data: { socialLinks: { hearthisAt: 'dj' } },
  });
  studio.fetchStudioCollections.mockResolvedValue({ data: [] });
});

describe('HearthisCard', () => {
  it('toasts when the library fails to load', async () => {
    sources.library.mockRejectedValue(new Error('down'));
    render(<HearthisCard plugin={plugin} />);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not load your hearthis.at library.',
      ),
    );
  });

  it('keeps every imported id when several collections import in a row', async () => {
    sources.library.mockResolvedValue({
      data: {
        tracks: [],
        sets: [],
        collections: [collection('c1', 'one'), collection('c2', 'two')],
      },
    });
    sources.collectionTracks.mockImplementation(async (permalink: string) =>
      permalink === 'one' ? [track('t1')] : [track('t2')],
    );
    let n = 0;
    studio.createStudioCollection.mockImplementation(async () => ({
      ok: true,
      data: { id: `coll${++n}`, slug: `coll${n}`, name: 'x' },
    }));
    sources.importTracks.mockImplementation(
      async (_id: string, ts: { id: string }[]) => ({
        imported: ts.length,
        failed: 0,
        artworkFailed: 0,
        items: ts.map((t) => ({ trackId: t.id, soundId: `s-${t.id}` })),
      }),
    );

    render(<HearthisCard plugin={plugin} />);
    await openPanel();
    fireEvent.click(await screen.findByRole('tab', { name: /Collections/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Select all' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Import selected (2)' }),
    );

    await waitFor(() => expect(sources.importTracks).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem('tahti-web-hearthis-imports:u1')!),
      ).toEqual(['t1', 't2']),
    );
  });

  it('does not stay busy when every track of a collection is already imported', async () => {
    localStorage.setItem(
      'tahti-web-hearthis-imports:u1',
      JSON.stringify(['t1']),
    );
    sources.library.mockResolvedValue({
      data: { tracks: [], sets: [], collections: [collection('c1', 'one')] },
    });
    sources.collectionTracks.mockResolvedValue([track('t1')]);

    render(<HearthisCard plugin={plugin} />);
    await openPanel();
    fireEvent.click(await screen.findByRole('tab', { name: /Collections/ }));
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Import Set c1 as collection',
      }),
    );
    await waitFor(() => expect(toast.info).toHaveBeenCalled());
    expect(studio.createStudioCollection).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        (
          screen.getByRole('button', {
            name: 'Import Set c1 as collection',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
  });
});
