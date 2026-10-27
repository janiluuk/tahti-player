import { keyName, parseKey } from '@tahti-web/lib/musicalKey';
import type {
  NativeAnalysisDetail,
  NativeLibraryTrack,
  NativePlayLogEntry,
  NativeSmartDefinition,
  TahtiNativeLibrary,
} from '@tahti-web/lib/nativeLibrary';

function track(
  id: string,
  title: string,
  artist: string,
  bpm: number | null,
  musicalKey: string | null,
  genre = 'Techno',
): NativeLibraryTrack {
  return {
    id,
    title,
    artist,
    album: 'Night Shift',
    format: 'flac',
    duration: 372,
    sizeBytes: 48_000_000,
    available: true,
    unavailableSince: null,
    path: `/Music/DJ/${title}.flac`,
    sampleRate: 44100,
    channels: 2,
    bitsPerSample: 16,
    albumArtist: artist,
    trackNo: null,
    discNo: null,
    year: 2025,
    genre,
    comment: '',
    bitrateKbps: 1020,
    addedAt: '2026-10-01 18:00:00',
    rating: 4,
    color: '',
    playCount: 3,
    skipCount: 0,
    lastPlayedAt: '2026-10-27 22:05:00',
    bpm,
    musicalKey,
    loudnessLufs: -8.4,
    analyzed: bpm !== null,
    artworkKey: null,
  };
}

export const DJ_TRACKS: NativeLibraryTrack[] = [
  track('aurora', 'Aurora Drive', 'Pohjola Unit', 128, 'Am'),
  track('harbour', 'Harbour Lights', 'Vesi', 127, 'Am'),
  track('kaamos', 'Kaamos', 'Lumi Collective', 130, 'Em'),
  track('tundra', 'Tundra Pulse', 'Revontuli', 126, 'Dm'),
  track('sauna', 'Sauna Steam', 'Kivi', 128, 'C'),
  track('halftime', 'Halftime Fog', 'Usva', 64, 'Am', 'Dub'),
  track('unknown', 'Untagged Jam', 'Local file', null, null, ''),
];

export const SOURCE_TRACK = DJ_TRACKS[0]!;

function matches(item: NativeLibraryTrack, definition: NativeSmartDefinition) {
  return definition.rules.every((rule) => {
    if (rule.field === 'key') {
      const key = parseKey(item.musicalKey);
      return key !== null && keyName(key) === rule.value;
    }
    if (rule.field === 'bpm' && item.bpm !== null) {
      return item.bpm >= Number(rule.value) && item.bpm <= Number(rule.value2);
    }
    return false;
  });
}

export const DJ_PLAY_HISTORY: NativePlayLogEntry[] = [
  {
    id: 6,
    trackId: 'sauna',
    title: 'Sauna Steam',
    artist: 'Kivi',
    playedAt: '2026-10-27 22:40:00',
  },
  {
    id: 5,
    trackId: 'kaamos',
    title: 'Kaamos',
    artist: 'Lumi Collective',
    playedAt: '2026-10-27 22:33:00',
  },
  {
    id: 4,
    trackId: 'harbour',
    title: 'Harbour Lights',
    artist: 'Vesi',
    playedAt: '2026-10-27 22:26:00',
  },
  {
    id: 3,
    trackId: 'aurora',
    title: 'Aurora Drive',
    artist: 'Pohjola Unit',
    playedAt: '2026-10-27 22:19:00',
  },
  {
    id: 2,
    trackId: 'tundra',
    title: 'Tundra Pulse',
    artist: 'Revontuli',
    playedAt: '2026-10-27 18:02:00',
  },
];

export function analysisDetail(
  patch: Partial<NativeAnalysisDetail> = {},
): NativeAnalysisDetail {
  return {
    analyzed: true,
    stale: false,
    peaks: Array.from(
      { length: 120 },
      (_, index) => 60 + Math.round(120 * Math.abs(Math.sin(index / 6))),
    ),
    loudnessLufs: -8.4,
    truePeakDbtp: -0.6,
    tagBpm: null,
    tagKey: null,
    bpmEstimate: 64,
    bpmConfidence: 0.42,
    keyEstimate: 'Am',
    keyConfidence: 0.71,
    userBpm: null,
    userKey: null,
    bpm: 64,
    key: 'Am',
    analyzedAt: '2026-10-27 18:00:00',
    ...patch,
  };
}

export function djLibrary(
  options: {
    tracks?: NativeLibraryTrack[];
    history?: NativePlayLogEntry[];
  } = {},
): TahtiNativeLibrary {
  const tracks = options.tracks ?? DJ_TRACKS;
  const history = options.history ?? DJ_PLAY_HISTORY;
  const playlist = {
    id: 'prepare',
    name: 'Prepare',
    trackCount: 0,
    durationSec: 0,
    unavailableCount: 0,
    createdAt: '',
    updatedAt: '',
  };
  const done = { imported: 0, skipped: 0, errors: [], cancelled: false };
  return {
    list: async () => ({ tracks, total: tracks.length }),
    matchingIds: async () => tracks.map((item) => item.id),
    filterOptions: async () => ({
      formats: ['flac'],
      yearMin: 2025,
      yearMax: 2025,
    }),
    prepareBatch: async () => ({ items: [], unavailable: 0 }),
    facets: async () => [],
    totals: async () => ({
      trackCount: tracks.length,
      durationSec: tracks.length * 372,
      sizeBytes: tracks.length * 48_000_000,
    }),
    import: async () => done,
    importFolder: async () => done,
    importPaths: async () => done,
    cancelImport: async () => undefined,
    resolve: async () => '',
    remove: async () => undefined,
    removeMany: async () => 0,
    reveal: async () => undefined,
    listUnavailable: async () => [],
    rescan: async () => [],
    relink: async () => null,
    listRoots: async () => [
      {
        id: 'root-dj',
        path: '/Music/DJ',
        createdAt: '2026-10-01T18:00:00Z',
        lastScannedAt: '2026-10-27T18:00:00Z',
        trackCount: tracks.length,
        missingCount: 0,
        available: true,
      },
    ],
    addRoot: async () => null,
    removeRoot: async () => undefined,
    rescanRoots: async () => ({
      ...done,
      missing: 0,
      recovered: 0,
      moved: 0,
      updated: 0,
    }),
    relinkRoot: async () => null,
    onImportProgress: () => () => undefined,
    onFilesDropped: () => () => undefined,
    catalog: {
      listTags: async () => [],
      provenance: async () => [],
      duplicates: async () => [],
      onHashProgress: () => () => undefined,
      playHistory: async () => ({ entries: history, total: history.length }),
      clearPlayHistory: async () => undefined,
    } as unknown as TahtiNativeLibrary['catalog'],
    analysis: {
      summary: async () => ({
        analyzed: tracks.length - 1,
        total: tracks.length,
        running: false,
        paused: false,
      }),
      onProgress: () => () => undefined,
      detail: async () => analysisDetail(),
      setCorrections: async () => [],
      restoreCorrections: async () => 0,
      analyze: async () => ({
        analyzed: 1,
        reused: 0,
        failed: 0,
        cancelled: false,
      }),
      smart: {
        list: async () => [],
        evaluate: async (
          _id: string | null,
          definition: NativeSmartDefinition | null,
        ) => {
          const found = definition
            ? tracks.filter((item) => matches(item, definition))
            : [];
          return { tracks: found, total: found.length };
        },
      },
    } as unknown as TahtiNativeLibrary['analysis'],
    playlists: {
      list: async () => [playlist],
      create: async () => playlist,
      trackIds: async () => [],
      addTracks: async (_id: string, ids: string[]) => ids.length,
      entries: async () => ({ entries: [], total: 0 }),
    } as unknown as TahtiNativeLibrary['playlists'],
  } as unknown as TahtiNativeLibrary;
}
