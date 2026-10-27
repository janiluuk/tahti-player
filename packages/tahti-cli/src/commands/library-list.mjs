import { apiGet, buildQuery, CliError } from '../api-client.mjs';
import { formatDuration, formatTable } from '../format.mjs';

export { formatDuration } from '../format.mjs';

/** Mirrors `SOUND_LIST_SORTS` in `@tahti/shared` (GET /api/me/sound `sort` query). */
export const LIBRARY_SORTS = [
  'newest',
  'oldest',
  'title',
  'duration',
  'bpm',
  'genre',
];

export function assertLibrarySort(sort) {
  if (sort !== undefined && !LIBRARY_SORTS.includes(sort)) {
    throw new CliError(
      `Invalid --sort "${sort}". Expected one of: ${LIBRARY_SORTS.join(', ')}.`,
    );
  }
}

export async function fetchLibrarySounds(config, { sort } = {}) {
  assertLibrarySort(sort);
  return apiGet(`/api/me/sound${buildQuery({ sort })}`, config);
}

export function formatSoundRow(sound) {
  return [
    sound.id,
    sound.title,
    sound.status,
    formatDuration(sound.durationSec ?? null),
  ];
}

function count(value) {
  return value == null ? '' : String(value);
}

/** Plays, likes and downloads columns appear when the API sends the totals
 * (tahti-org GET /api/me/sound with public counts). */
export function formatLibraryTable(sounds) {
  const withTotals = sounds.some(
    (sound) =>
      sound.playCount != null ||
      sound.likeCount != null ||
      sound.downloadCount != null,
  );
  if (!withTotals) {
    return formatTable(
      ['ID', 'TITLE', 'STATUS', 'DURATION'],
      sounds.map(formatSoundRow),
    );
  }
  return formatTable(
    ['ID', 'TITLE', 'STATUS', 'DURATION', 'PLAYS', 'LIKES', 'DLS'],
    sounds.map((sound) => [
      ...formatSoundRow(sound),
      count(sound.playCount),
      count(sound.likeCount),
      count(sound.downloadCount),
    ]),
  );
}

export async function runLibraryList(config, { json = false, sort } = {}) {
  const sounds = await fetchLibrarySounds(config, { sort });
  if (json) {
    return JSON.stringify(sounds, null, 2);
  }
  if (sounds.length === 0) {
    return 'No library items yet.';
  }
  return formatLibraryTable(sounds);
}
