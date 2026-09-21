import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  NativeCatalog,
  NativeDuplicateGroup,
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { BackupRestoreDialog } from './BackupRestoreDialog';
import { DuplicatesDialog } from './DuplicatesDialog';
import { PlayHistoryDialog } from './PlayHistoryDialog';
import { TrackEditorDialog } from './TrackEditorDialog';
import { TrackOrganizeDialog } from './TrackOrganizeDialog';
import { WriteTagsDialog } from './WriteTagsDialog';

afterEach(cleanup);

const withCatalog = (catalog: Partial<NativeCatalog>) =>
  ({
    catalog,
    reveal: vi.fn(),
    remove: vi.fn(),
  }) as unknown as TahtiNativeLibrary;

const summary = (field: string, value: string, distinct = 1, edited = 0) => ({
  field,
  value,
  distinct,
  edited,
});

const ALL_FIELDS = [
  'title',
  'artist',
  'albumArtist',
  'album',
  'genre',
  'year',
  'trackNo',
  'discNo',
  'comment',
];

describe('TrackEditorDialog', () => {
  const fieldSummary = vi.fn(async () =>
    ALL_FIELDS.map((field) =>
      field === 'album'
        ? summary(field, '', 2)
        : field === 'artist'
          ? summary(field, 'Band', 1, 1)
          : summary(field, field === 'title' ? 'Song' : ''),
    ),
  ) as unknown as NativeCatalog['fieldSummary'];

  it('shows mixed values, previews the change and applies it with an undo', async () => {
    const editPreview = vi.fn(async () => ({
      tracksChanged: 2,
      tracksUnchanged: 0,
      fieldsChanged: 2,
      examples: [
        {
          trackId: 'a',
          title: 'Song',
          field: 'album' as const,
          before: 'Old',
          after: 'New',
        },
      ],
    }));
    const undo = [
      { trackId: 'a', field: 'album' as const, value: 'Old', extracted: null },
    ];
    const editTracks = vi.fn(async () => ({ tracksChanged: 2, undo }));
    const onChanged = vi.fn();
    render(
      <TrackEditorDialog
        isOpen
        onClose={() => undefined}
        ids={['a', 'b']}
        onChanged={onChanged}
        library={withCatalog({ fieldSummary, editPreview, editTracks })}
      />,
    );

    const album = await screen.findByLabelText('Album');
    expect(album).toHaveAttribute('placeholder', 'Mixed values');
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();

    fireEvent.change(album, { target: { value: 'New' } });
    expect(await screen.findByText(/2 tracks will change/)).toBeInTheDocument();
    expect(screen.getByText(/Old → New/)).toBeInTheDocument();
    expect(editPreview).toHaveBeenLastCalledWith(
      ['a', 'b'],
      [{ field: 'album', value: 'New' }],
    );

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(editTracks).toHaveBeenCalledTimes(1));
    expect(editTracks).toHaveBeenCalledWith(
      ['a', 'b'],
      [{ field: 'album', value: 'New' }],
    );
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('puts an edited field back to the file tag', async () => {
    const editPreview = vi.fn(async () => ({
      tracksChanged: 1,
      tracksUnchanged: 0,
      fieldsChanged: 1,
      examples: [],
    }));
    render(
      <TrackEditorDialog
        isOpen
        onClose={() => undefined}
        ids={['a']}
        onChanged={() => undefined}
        library={withCatalog({
          fieldSummary,
          editPreview,
          editTracks: vi.fn(),
        })}
      />,
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Put Artist back to the file’s tag',
      }),
    );
    await waitFor(() =>
      expect(editPreview).toHaveBeenLastCalledWith(
        ['a'],
        [{ field: 'artist', value: null }],
      ),
    );
    expect(screen.getByLabelText('Artist')).toBeDisabled();
  });

  it('blocks Apply and shows the reason when the edit is invalid', async () => {
    const editPreview = vi.fn(async () => {
      throw new Error('"abc" is not a whole number.');
    });
    render(
      <TrackEditorDialog
        isOpen
        onClose={() => undefined}
        ids={['a']}
        onChanged={() => undefined}
        library={withCatalog({ fieldSummary, editPreview })}
      />,
    );
    fireEvent.change(await screen.findByLabelText('Year'), {
      target: { value: 'abc' },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'not a whole number',
    );
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });
});

describe('TrackOrganizeDialog', () => {
  it('rates, tags and undoes through the catalog', async () => {
    const data = [{ trackId: 'a', rating: 2, color: '', tags: ['warm'] }];
    const setRating = vi.fn(async () => data);
    const addTag = vi.fn(async () => data);
    const removeTag = vi.fn(async () => data);
    const onChanged = vi.fn();
    render(
      <TrackOrganizeDialog
        isOpen
        onClose={() => undefined}
        ids={['a']}
        onChanged={onChanged}
        library={withCatalog({
          userData: vi.fn(async () => data),
          listTags: vi.fn(async () => [
            { name: 'warm', tracks: 1 },
            { name: 'peak', tracks: 3 },
          ]),
          setRating,
          addTag,
          removeTag,
        })}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: '5 stars' }));
    await waitFor(() => expect(setRating).toHaveBeenCalledWith(['a'], 5));
    expect(onChanged).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '+ peak' }));
    await waitFor(() => expect(addTag).toHaveBeenCalledWith(['a'], 'peak'));

    fireEvent.click(screen.getByRole('button', { name: 'Remove tag warm' }));
    await waitFor(() => expect(removeTag).toHaveBeenCalledWith(['a'], 'warm'));

    fireEvent.change(screen.getByLabelText('Add a tag'), {
      target: { value: '  new one ' },
    });
    fireEvent.keyDown(screen.getByLabelText('Add a tag'), { key: 'Enter' });
    await waitFor(() => expect(addTag).toHaveBeenCalledWith(['a'], 'new one'));
  });
});

const track = (id: string, title: string): NativeLibraryTrack =>
  ({
    id,
    title,
    artist: 'Band',
    path: `/music/${id}.wav`,
    sizeBytes: 1000,
    duration: 60,
  }) as NativeLibraryTrack;

describe('DuplicatesDialog', () => {
  it('labels exact, different and possible groups and only removes after confirming', async () => {
    const groups: NativeDuplicateGroup[] = [
      {
        kind: 'exact',
        tracks: [track('1', 'Song'), track('2', 'Song')],
        confirmedDifferent: false,
      },
      {
        kind: 'similar',
        tracks: [track('3', 'Live'), track('4', 'Live')],
        confirmedDifferent: true,
      },
      {
        kind: 'similar',
        tracks: [track('5', 'Maybe'), track('6', 'Maybe')],
        confirmedDifferent: false,
      },
    ];
    const library = withCatalog({
      duplicates: vi.fn(async () => groups),
      onHashProgress: vi.fn(() => () => undefined),
    });
    render(
      <DuplicatesDialog
        isOpen
        onClose={() => undefined}
        library={library}
        onChanged={() => undefined}
      />,
    );
    expect(await screen.findByText('Identical files (2)')).toBeInTheDocument();
    expect(
      screen.getByText('Same name, different files (2)'),
    ).toBeInTheDocument();
    expect(screen.getByText('Possibly the same track (2)')).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Remove Song from library' })[0]!,
    );
    expect(library.remove).not.toHaveBeenCalled();
    expect(
      screen.getByText(/The audio file on disk is not touched/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(library.remove).toHaveBeenCalledWith('1'));
  });

  it('compares file contents with progress and reloads the groups', async () => {
    let report: (p: { done: number; total: number }) => void = () => undefined;
    const duplicates = vi.fn(async () => [] as NativeDuplicateGroup[]);
    const hashTracks = vi.fn(async () => {
      report({ done: 3, total: 10 });
      return { hashed: 10, alreadyCurrent: 0, failed: 0, cancelled: false };
    });
    render(
      <DuplicatesDialog
        isOpen
        onClose={() => undefined}
        onChanged={() => undefined}
        library={withCatalog({
          duplicates,
          hashTracks,
          onHashProgress: (listener) => {
            report = listener;
            return () => undefined;
          },
        })}
      />,
    );
    await screen.findByText(/No duplicates found/);
    fireEvent.click(
      screen.getByRole('button', { name: /Compare file contents/ }),
    );
    await waitFor(() => expect(hashTracks).toHaveBeenCalledWith([]));
    await waitFor(() => expect(duplicates).toHaveBeenCalledTimes(2));
  });
});

describe('BackupRestoreDialog', () => {
  const preview = (found: number) => ({
    createdAt: '2026-09-21 10:00:00',
    roots: [{ from: '/old/Music', to: '/old/Music', exists: false, tracks: 3 }],
    tracks: 3,
    filesFound: found,
    filesMissing: 3 - found,
    edits: 1,
    playlists: 1,
    playlistEntries: 3,
    missingExamples: found ? [] : ['/old/Music/a.wav'],
  });

  it('remaps a watched folder, re-previews and restores', async () => {
    const previewBackup = vi.fn(
      async (_path: string, mappings: Array<{ from: string; to: string }>) =>
        preview(mappings.length ? 3 : 0),
    );
    const restoreBackup = vi.fn(async () => ({
      tracksRestored: 3,
      tracksMissing: 0,
      tracksFailed: 0,
      rootsAdded: 1,
      playlistsCreated: 1,
      playlistsRenamed: 0,
      editsApplied: 1,
    }));
    const onRestored = vi.fn();
    render(
      <BackupRestoreDialog
        isOpen
        onClose={() => undefined}
        sourcePath="/backups/lib.tahti-backup"
        onRestored={onRestored}
        library={withCatalog({
          previewBackup,
          restoreBackup,
          pickFolder: vi.fn(async () => '/new/Music'),
        })}
      />,
    );
    expect(await screen.findByText(/0 of 3 files found/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Choose new folder/ }));
    expect(await screen.findByText(/3 of 3 files found/)).toBeInTheDocument();
    expect(previewBackup).toHaveBeenLastCalledWith(
      '/backups/lib.tahti-backup',
      [{ from: '/old/Music', to: '/new/Music' }],
    );

    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    await waitFor(() =>
      expect(restoreBackup).toHaveBeenCalledWith('/backups/lib.tahti-backup', [
        { from: '/old/Music', to: '/new/Music' },
      ]),
    );
    await waitFor(() => expect(onRestored).toHaveBeenCalled());
  });

  it('explains a file that is not a backup', async () => {
    render(
      <BackupRestoreDialog
        isOpen
        onClose={() => undefined}
        sourcePath="/x.json"
        onRestored={() => undefined}
        library={withCatalog({
          previewBackup: vi.fn(async () => {
            throw new Error('This is not a Tahti library backup.');
          }),
        })}
      />,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'not a Tahti library backup',
    );
    expect(screen.getByRole('button', { name: 'Restore' })).toBeDisabled();
  });
});

describe('WriteTagsDialog', () => {
  it('previews, then writes with the chosen backup setting', async () => {
    const writeTags = vi.fn(async () => ({
      written: 2,
      skipped: [],
      failed: [],
      editsSettled: 3,
      editsKept: 0,
      fieldsUnsupported: 0,
    }));
    const onChanged = vi.fn();
    render(
      <WriteTagsDialog
        isOpen
        onClose={() => undefined}
        ids={['a', 'b', 'c']}
        onChanged={onChanged}
        library={withCatalog({
          writeTagsPreview: vi.fn(async () => ({
            writable: 2,
            noEdits: 1,
            skipped: [{ path: '/m/x.wav', reason: 'The file is read-only' }],
            formats: ['FLAC', 'WAV'],
          })),
          writeTags,
        })}
      />,
    );
    expect(
      await screen.findByText(/2 files will be written/),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 have no edits/)).toBeInTheDocument();
    expect(screen.getByText(/read-only/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Write to files' }));
    await waitFor(() =>
      expect(writeTags).toHaveBeenCalledWith(['a', 'b', 'c'], true),
    );
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('cannot write when nothing is writable', async () => {
    render(
      <WriteTagsDialog
        isOpen
        onClose={() => undefined}
        ids={['a']}
        onChanged={() => undefined}
        library={withCatalog({
          writeTagsPreview: vi.fn(async () => ({
            writable: 0,
            noEdits: 1,
            skipped: [],
            formats: ['FLAC', 'WAV'],
          })),
        })}
      />,
    );
    await screen.findByText(/0 files will be written/);
    expect(
      screen.getByRole('button', { name: 'Write to files' }),
    ).toBeDisabled();
  });
});

describe('PlayHistoryDialog', () => {
  it('lists plays newest first and clears only after confirming', async () => {
    const clearPlayHistory = vi.fn(async () => undefined);
    render(
      <PlayHistoryDialog
        isOpen
        onClose={() => undefined}
        onChanged={() => undefined}
        library={withCatalog({
          playHistory: vi.fn(async () => ({
            entries: [
              {
                id: 2,
                trackId: 'a',
                title: 'B side',
                artist: 'X',
                playedAt: '2026-09-21 10:00:00',
              },
              {
                id: 1,
                trackId: null,
                title: 'A side',
                artist: '',
                playedAt: '2026-09-20 09:00:00',
              },
            ],
            total: 2,
          })),
          clearPlayHistory,
        })}
      />,
    );
    expect(await screen.findByText(/B side — X/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
    expect(clearPlayHistory).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await waitFor(() => expect(clearPlayHistory).toHaveBeenCalled());
  });
});

describe('Duplicates merge', () => {
  it('merges the others into the kept track after confirming', async () => {
    const mergeTracks = vi.fn(async () => ({
      removed: 1,
      playlistEntriesMoved: 0,
    }));
    render(
      <DuplicatesDialog
        isOpen
        onClose={() => undefined}
        onChanged={() => undefined}
        library={withCatalog({
          duplicates: vi.fn(async () => [
            {
              kind: 'exact' as const,
              tracks: [track('1', 'Song'), track('2', 'Song')],
              confirmedDifferent: false,
            },
          ]),
          onHashProgress: vi.fn(() => () => undefined),
          mergeTracks,
        })}
      />,
    );
    const keep = await screen.findAllByRole('button', {
      name: /^Keep Song at/,
    });
    fireEvent.click(keep[1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Merge' }));
    await waitFor(() => expect(mergeTracks).toHaveBeenCalledWith('2', ['1']));
  });
});

describe('Inspector provenance', () => {
  it('shows what the file says for an edited tag', async () => {
    const { TrackInspectorDialog } = await import('./TrackInspectorDialog');
    render(
      <TrackInspectorDialog
        library={withCatalog({
          provenance: vi.fn(async () => [
            {
              field: 'artist' as const,
              value: 'Fixed',
              edited: true,
              fileValue: 'Typo',
              editedAt: '2026-09-21 10:00:00',
            },
            {
              field: 'title' as const,
              value: 'Song',
              edited: false,
              fileValue: 'Song',
              editedAt: null,
            },
          ]),
        })}
        track={
          {
            ...track('1', 'Song'),
            artist: 'Fixed',
            available: true,
            addedAt: '',
            format: 'wav',
          } as NativeLibraryTrack
        }
        onClose={() => undefined}
        onPlay={() => undefined}
        onQueue={() => undefined}
        onReveal={() => undefined}
        onLocate={() => undefined}
        onRemove={() => undefined}
      />,
    );
    expect(
      await screen.findByText(/Edited · file says Typo/),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Edited ·/)).toHaveLength(1);
  });
});
