import { apiGet } from '../api-client.mjs';

export async function fetchLibrarySounds(config) {
  return apiGet('/api/me/sound', config);
}

export function formatDuration(durationSec) {
  if (
    durationSec === null ||
    durationSec === undefined ||
    Number.isNaN(durationSec)
  ) {
    return '--:--';
  }
  const totalSeconds = Math.floor(durationSec);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
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
  const header = ['ID', 'TITLE', 'STATUS', 'DURATION'];
  const rows = sounds.map(formatSoundRow);
  const widths = header.map((label, index) =>
    Math.max(
      label.length,
      ...rows.map((row) => String(row[index] ?? '').length),
    ),
  );
  const formatRow = (row) =>
    row
      .map((cell, index) => String(cell ?? '').padEnd(widths[index]))
      .join('  ');
  return [formatRow(header), ...rows.map(formatRow)].join('\n');
}

export async function runLibraryList(config, { json = false } = {}) {
  const sounds = await fetchLibrarySounds(config);
  if (json) {
    return JSON.stringify(sounds, null, 2);
  }
  if (sounds.length === 0) {
    return 'No library items yet.';
  }
  return formatLibraryTable(sounds);
}
