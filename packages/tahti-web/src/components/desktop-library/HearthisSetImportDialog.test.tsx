import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HearthisTrack } from '../../api/sources';
import type {
  NativeProviderImport,
  NativeProviderImportProgress,
  NativeProviderImportRequest,
  NativeProviderImportResult,
  NativeProviderImportSpace,
} from '../../lib/nativeLibrary';
import { HearthisSetImportDialog } from './HearthisSetImportDialog';

const { sources } = vi.hoisted(() => ({
  sources: {
    fetchHearthisCollectionTracks: vi.fn(),
    fetchHearthisLibrary: vi.fn(),
  },
}));

vi.mock('../../api/sources', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/sources')>()),
  ...sources,
}));

const track = (id: string, title: string, downloadable: boolean) =>
  ({
    id,
    url: `https://hearthis.at/dj/${id}/`,
    title,
    username: 'DJ Test',
    durationSec: 600,
    download: downloadable
      ? { url: `https://hearthis.at/dj/${id}/download/`, fileName: `${id}.mp3` }
      : null,
  }) satisfies HearthisTrack;

const SET = [
  track('a', 'Opening', true),
  track('b', 'Stream only', false),
  track('c', 'Closing', true),
];

function fakeImport(results: NativeProviderImportResult[]) {
  const listeners: Array<(event: NativeProviderImportProgress) => void> = [];
  const requests: NativeProviderImportRequest[] = [];
  const api: NativeProviderImport = {
    destination: vi.fn(
      async (_provider, title) => `/Music/Tahti/hearthis.at/${title}`,
    ),
    start: vi.fn(async (request) => {
      requests.push(request);
      const result = results.shift()!;
      for (const entry of request.entries) {
        const failure = result.failures.find(
          (f) => f.remoteId === entry.remoteId,
        );
        for (const listener of listeners) {
          listener({
            remoteId: entry.remoteId,
            state: failure ? 'failed' : 'imported',
            receivedBytes: 0,
            totalBytes: null,
            error: failure?.error ?? null,
          });
        }
      }
      return result;
    }),
    cancel: vi.fn(async () => undefined),
    onProgress: (listener) => {
      listeners.push(listener);
      return () => undefined;
    },
  };
  return { api, requests, listeners };
}

const done = (
  overrides: Partial<NativeProviderImportResult>,
): NativeProviderImportResult => ({
  imported: 0,
  skipped: 0,
  failures: [],
  cancelled: false,
  playlistId: 'pl-1',
  trackIds: [],
  ...overrides,
});

const MB = 1024 ** 2;

const space = (
  overrides: Partial<NativeProviderImportSpace>,
): NativeProviderImportSpace => ({
  neededBytes: 150 * MB,
  sized: 1,
  unknownSize: 1,
  alreadyImported: 0,
  freeBytes: 40 * 1024 * MB,
  verdict: 'fits',
  ...overrides,
});

async function openReview(api: NativeProviderImport, onImported = vi.fn()) {
  render(
    <HearthisSetImportDialog
      isOpen
      onClose={vi.fn()}
      providerImport={api}
      onImported={onImported}
    />,
  );
  fireEvent.change(screen.getByLabelText('Set link'), {
    target: { value: 'https://hearthis.at/set/night-1/' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Load set' }));
  await screen.findByText(/2 of 3 tracks can be downloaded/);
  await waitFor(() =>
    expect(screen.getByText(/Saves to \/Music\/Tahti/)).toBeTruthy(),
  );
  return onImported;
}

describe('HearthisSetImportDialog', () => {
  beforeEach(() => {
    sources.fetchHearthisLibrary.mockResolvedValue({
      data: { username: null, tracks: [], sets: [], collections: [] },
      meta: { source: 'api' },
    });
    sources.fetchHearthisCollectionTracks.mockResolvedValue(SET);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('reviews the set, marks stream-only tracks and downloads the rest in set order', async () => {
    const { api, requests } = fakeImport([
      done({ imported: 2, trackIds: ['t-a', 't-c'] }),
    ]);
    const onImported = await openReview(api);

    expect(sources.fetchHearthisCollectionTracks).toHaveBeenCalledWith(
      'night-1',
    );
    expect(screen.getByText('Not offered for download')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Playlist and folder name'), {
      target: { value: 'Night Set' },
    });
    await waitFor(() =>
      expect(api.destination).toHaveBeenLastCalledWith('hearthis', 'Night Set'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Download 2 tracks' }));

    await screen.findByText('2 tracks imported.');
    expect(requests[0]).toMatchObject({
      provider: 'hearthis',
      setId: 'night-1',
      setTitle: 'Night Set',
      destination: '/Music/Tahti/hearthis.at/Night Set',
      playlistName: 'Night Set',
    });
    expect(requests[0]!.entries.map((entry) => entry.remoteId)).toEqual([
      'a',
      'c',
    ]);
    expect(requests[0]!.entries[0]).toMatchObject({
      artist: 'DJ Test',
      downloadUrl: 'https://hearthis.at/dj/a/download/',
      fileName: 'a.mp3',
    });
    expect(onImported).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Retry/ })).toBeNull();
  });

  it('shows a failed track and retries it without losing set order', async () => {
    const { api, requests } = fakeImport([
      done({
        imported: 1,
        trackIds: ['t-a'],
        failures: [
          { remoteId: 'c', title: 'Closing', error: 'Download failed: 503' },
        ],
      }),
      done({ imported: 1, skipped: 1, trackIds: ['t-a', 't-c'] }),
    ]);
    await openReview(api);
    fireEvent.click(screen.getByRole('button', { name: 'Download 2 tracks' }));

    await screen.findByText('Download failed: 503');
    expect(screen.getByText(/1 track imported, 1 failed/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry 1 track' }));

    await screen.findByText(/1 already in your library/);
    expect(requests).toHaveLength(2);
    expect(requests[1]!.entries.map((entry) => entry.remoteId)).toEqual([
      'a',
      'c',
    ]);
  });

  it('can skip the playlist', async () => {
    const { api, requests } = fakeImport([
      done({ imported: 2, playlistId: null }),
    ]);
    await openReview(api);
    fireEvent.click(
      screen.getByRole('switch', {
        name: 'Add the set to a playlist in its original order',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Download 2 tracks' }));
    await screen.findByText('2 tracks imported.');
    expect(requests[0]!.playlistName).toBeNull();
  });

  it('shows how much space the set needs, leaving unknown sizes unknown', async () => {
    const { api } = fakeImport([]);
    api.space = vi.fn(async () => space({ verdict: 'fits' }));
    await openReview(api);

    expect(
      await screen.findByText(
        'About 150 MB needed (1 track of unknown size), 40.0 GB free on that disk.',
      ),
    ).toBeTruthy();
    expect(api.space).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'hearthis',
        destination: '/Music/Tahti/hearthis.at/hearthis.at set night-1',
        entries: [
          expect.objectContaining({ remoteId: 'a' }),
          expect.objectContaining({ remoteId: 'c' }),
        ],
      }),
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Download 2 tracks' }),
    ).toHaveProperty('disabled', false);
  });

  it('warns when the set only just fits', async () => {
    const { api } = fakeImport([]);
    api.space = vi.fn(async () =>
      space({ freeBytes: 200 * MB, verdict: 'tight' }),
    );
    await openReview(api);
    expect(
      await screen.findByText(/leaves little room on the disk/),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Download 2 tracks' }),
    ).toHaveProperty('disabled', false);
  });

  it('blocks the download when the set clearly does not fit, and checks again on request', async () => {
    const { api } = fakeImport([]);
    api.space = vi
      .fn()
      .mockResolvedValueOnce(
        space({ freeBytes: 50 * MB, verdict: 'notEnough' }),
      )
      .mockResolvedValueOnce(space({ verdict: 'fits' }));
    await openReview(api);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(
      'Not enough space. Free up at least 100 MB and check again.',
    );
    expect(
      screen.getByRole('button', { name: 'Download 2 tracks' }),
    ).toHaveProperty('disabled', true);

    fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
    await waitFor(() => expect(api.space).toHaveBeenCalledTimes(2));
    await screen.findByText(/40\.0 GB free on that disk/);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Download 2 tracks' }),
    ).toHaveProperty('disabled', false);
  });

  it('says so when no file sizes are listed', async () => {
    const { api } = fakeImport([]);
    api.space = vi.fn(async () =>
      space({
        neededBytes: 0,
        sized: 0,
        unknownSize: 2,
        freeBytes: null,
        verdict: 'unknown',
      }),
    );
    await openReview(api);
    expect(
      await screen.findByText('File sizes are not listed, free space unknown.'),
    ).toBeTruthy();
  });

  it('explains a link that is not a set link', async () => {
    const { api } = fakeImport([]);
    render(
      <HearthisSetImportDialog
        isOpen
        onClose={vi.fn()}
        providerImport={api}
        onImported={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Set link'), {
      target: { value: 'https://hearthis.at/dj/some-track/' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Load set' }));
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      expect.stringContaining('Paste a hearthis.at set link'),
    );
    expect(sources.fetchHearthisCollectionTracks).not.toHaveBeenCalled();
  });

  it('offers your own sets when a hearthis.at profile is linked', async () => {
    sources.fetchHearthisLibrary.mockResolvedValue({
      data: {
        username: 'dj',
        tracks: [],
        sets: [],
        collections: [
          {
            id: '9',
            permalink: 'mine-9',
            title: 'My Summer Set',
            description: '',
            trackCount: 3,
            coverUrl: null,
          },
        ],
      },
      meta: { source: 'api' },
    });
    const { api } = fakeImport([]);
    render(
      <HearthisSetImportDialog
        isOpen
        onClose={vi.fn()}
        providerImport={api}
        onImported={vi.fn()}
      />,
    );
    await waitFor(() =>
      expect(sources.fetchHearthisLibrary).toHaveBeenCalled(),
    );
    await act(async () => {
      fireEvent.click(
        await screen.findByRole('button', { name: /My Summer Set/ }),
      );
    });
    await screen.findByText(/2 of 3 tracks can be downloaded/);
    expect(sources.fetchHearthisCollectionTracks).toHaveBeenCalledWith(
      'mine-9',
    );
    expect(
      (screen.getByLabelText('Playlist and folder name') as HTMLInputElement)
        .value,
    ).toBe('My Summer Set');
  });
});
