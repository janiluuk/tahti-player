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

export function formatLibraryTable(sounds) {
  return formatTable(
    ['ID', 'TITLE', 'STATUS', 'DURATION'],
    sounds.map(formatSoundRow),
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
