import { getNativeLibrary, type TahtiNativeLibrary } from '../nativeLibrary';
import type { NativeLibraryTrack } from '../nativeLibrary';
import { preparePlayables } from '../nativePlayback';
import { playModeParam, playPlayables, type PlayMode } from './play';
import { McpUserError, type DomainDef } from './types';

const PAGE = 50;

function library(): TahtiNativeLibrary {
  const native = getNativeLibrary();
  if (!native) {
    throw new McpUserError(
      'The desktop library is only available in the Tahti Player desktop app.',
    );
  }
  return native;
}

function summarizeTrack(track: NativeLibraryTrack) {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    durationSec: track.duration,
    available: track.available,
  };
}

async function playIds(ids: string[], mode: unknown, noun: string) {
  const playables = await preparePlayables(library(), ids, noun);
  return playPlayables(playables, mode as PlayMode | undefined);
}

export const libraryDomain: DomainDef = {
  description:
    'Music files in the desktop library: search them, play them, and play local playlists. Desktop app only.',
  methods: {
    search: {
      description: `Find tracks by title, artist or album. Returns up to ${PAGE} tracks per page and the total.`,
      params: [
        {
          name: 'query',
          type: 'string',
          description: 'Words to match; "" lists everything.',
        },
        {
          name: 'offset',
          type: 'number',
          description: 'Tracks to skip, for the next page.',
          optional: true,
        },
      ],
      returns: 'LibraryPage',
      run: async ({ query, offset }) => {
        const page = await library().list(
          query as string,
          (offset as number | undefined) ?? 0,
        );
        return {
          total: page.total,
          tracks: page.tracks.slice(0, PAGE).map(summarizeTrack),
        };
      },
    },
    totals: {
      description:
        'How many tracks the library holds, their total length and size.',
      params: [],
      returns: 'LibraryTotals',
      run: () => library().totals(),
    },
    play: {
      description:
        'Play library tracks by id, in the order given. Missing files are skipped.',
      params: [
        {
          name: 'ids',
          type: 'string[]',
          description: 'Track ids from Library.search.',
        },
        playModeParam,
      ],
      returns: 'PlayResult',
      run: ({ ids, mode }) => playIds(ids as string[], mode, 'selected'),
    },
    playlists: {
      description: 'The local playlists, with their track counts.',
      params: [],
      returns: 'LocalPlaylist[]',
      run: async () =>
        (await library().playlists.list()).map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          trackCount: playlist.trackCount,
          durationSec: playlist.durationSec,
        })),
    },
    playPlaylist: {
      description: 'Play a local playlist from the start.',
      params: [
        {
          name: 'id',
          type: 'string',
          description: 'A playlist id from Library.playlists.',
        },
        playModeParam,
      ],
      returns: 'PlayResult',
      run: async ({ id, mode }) => {
        const native = library();
        const known = await native.playlists.list();
        if (!known.some((playlist) => playlist.id === id)) {
          throw new McpUserError(
            `No local playlist has the id "${String(id)}". Library.playlists lists them.`,
          );
        }
        return playIds(
          await native.playlists.trackIds(id as string),
          mode,
          'playlist',
        );
      },
    },
  },
};
