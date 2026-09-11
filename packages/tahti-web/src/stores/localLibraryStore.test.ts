import { describe, expect, it } from 'vitest';

import {
  fileStem,
  filterLocalLibraryTracks,
  isAudioFile,
  isLocalTrackPlayable,
  mergeLocalLibraryPersisted,
  metadataFromFile,
  partializeLocalLibrary,
  playableFromLocalTrack,
  useLocalLibraryStore,
  type LocalLibraryTrack,
} from './localLibraryStore';

describe('localLibraryStore helpers', () => {
  it('strips the extension from a file name', () => {
    expect(fileStem('Blue Hour.flac')).toBe('Blue Hour');
    expect(fileStem('riff')).toBe('riff');
  });

  it('accepts audio by MIME type or extension', () => {
    expect(isAudioFile(new File([], 'take.flac'))).toBe(true);
    expect(isAudioFile(new File([], 'take.mp3', { type: 'audio/mpeg' }))).toBe(
      true,
    );
    expect(isAudioFile(new File([], 'cover.jpg', { type: 'image/jpeg' }))).toBe(
      false,
    );
  });

  it('infers artist and title from a conventional file name', () => {
    const file = new File(
      [new Uint8Array(2048)],
      'Vladislav Delay - Huone.flac',
      {
        type: 'audio/flac',
        lastModified: 1234,
      },
    );
    expect(metadataFromFile(file)).toEqual({
      artist: 'Vladislav Delay',
      title: 'Huone',
      fileName: 'Vladislav Delay - Huone.flac',
      fileSize: 2048,
      mimeType: 'audio/flac',
      lastModified: 1234,
    });
  });

  it('searches title, artist, and file name case-insensitively', () => {
    const tracks: LocalLibraryTrack[] = [
      {
        id: '1',
        title: 'Huone',
        artist: 'Vladislav Delay',
        fileName: 'Vladislav Delay - Huone.flac',
        objectUrl: '',
        addedAt: '2026-09-04T00:00:00.000Z',
      },
      {
        id: '2',
        title: 'Blue Hour',
        artist: 'Local file',
        fileName: 'session-take.wav',
        objectUrl: '',
        addedAt: '2026-09-04T00:00:00.000Z',
      },
    ];
    expect(filterLocalLibraryTracks(tracks, 'VLADISLAV')).toEqual([tracks[0]]);
    expect(filterLocalLibraryTracks(tracks, 'session')).toEqual([tracks[1]]);
    expect(filterLocalLibraryTracks(tracks, '  ')).toEqual(tracks);
  });

  it('builds a blob playable for the shared player', () => {
    const playable = playableFromLocalTrack({
      id: 'abc',
      title: 'Blue Hour',
      artist: 'Local file',
      fileName: 'Blue Hour.flac',
      objectUrl: 'blob:http://localhost/1',
      addedAt: '2026-09-04T00:00:00.000Z',
    });
    expect(playable).not.toBeNull();
    expect(playable?.id).toBe('local:abc');
    expect(playable?.streamUrl).toBe('blob:http://localhost/1');
    expect(playable?.sourceProvider).toBe('local');
    expect(playable?.protocol).toBe('https');
  });

  it('returns null when the blob URL was cleared after reload', () => {
    expect(
      playableFromLocalTrack({
        id: 'abc',
        title: 'Blue Hour',
        artist: 'Local file',
        fileName: 'Blue Hour.flac',
        objectUrl: '',
        addedAt: '2026-09-04T00:00:00.000Z',
      }),
    ).toBeNull();
  });
});

describe('localLibraryStore metadata persistence helpers', () => {
  it('drops objectUrl from persisted tracks', () => {
    const persisted = partializeLocalLibrary({
      tracks: [
        {
          id: '1',
          title: 'Riff',
          artist: 'Local file',
          fileName: 'riff.wav',
          objectUrl: 'blob:http://localhost/1',
          addedAt: '2026-09-04T00:00:00.000Z',
        },
      ],
    });
    expect(persisted.tracks).toEqual([
      {
        id: '1',
        title: 'Riff',
        artist: 'Local file',
        fileName: 'riff.wav',
        fileSize: undefined,
        mimeType: undefined,
        lastModified: undefined,
        addedAt: '2026-09-04T00:00:00.000Z',
      },
    ]);
  });

  it('rehydrates tracks without blob URLs', () => {
    const merged = mergeLocalLibraryPersisted(
      {
        tracks: [
          {
            id: '1',
            title: 'Riff',
            artist: 'Local file',
            fileName: 'riff.wav',
            addedAt: '2026-09-04T00:00:00.000Z',
          },
        ],
      },
      useLocalLibraryStore.getState(),
    );
    expect(merged.tracks).toHaveLength(1);
    expect(merged.tracks[0]?.objectUrl).toBe('');
    expect(isLocalTrackPlayable(merged.tracks[0]!)).toBe(false);
  });

  it('restores a blob URL when re-importing the same file name', () => {
    const stale: LocalLibraryTrack = {
      id: 'keep-me',
      title: 'Riff',
      artist: 'Local file',
      fileName: 'riff.wav',
      objectUrl: '',
      addedAt: '2026-09-04T00:00:00.000Z',
    };
    useLocalLibraryStore.setState({ tracks: [stale] });
    const file = new File([new Uint8Array([1, 2, 3])], 'riff.wav', {
      type: 'audio/wav',
    });
    const [restored] = useLocalLibraryStore.getState().addFiles([file]);
    expect(restored?.id).toBe('keep-me');
    expect(isLocalTrackPlayable(restored!)).toBe(true);
    expect(useLocalLibraryStore.getState().tracks).toHaveLength(1);
    useLocalLibraryStore.getState().clear();
  });
});
