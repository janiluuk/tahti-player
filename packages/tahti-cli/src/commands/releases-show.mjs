import { apiGet, CliError } from '../api-client.mjs';
import {
  formatDate,
  formatDetails,
  formatDuration,
  formatTable,
} from '../format.mjs';

export async function fetchRelease(config, id) {
  if (!id) {
    throw new CliError('Missing release id. Usage: tahti releases show <id>');
  }
  return apiGet(`/api/me/releases/${encodeURIComponent(id)}`, config);
}

function formatChecklist(checklist) {
  if (!Array.isArray(checklist) || checklist.length === 0) {
    return null;
  }
  const done = checklist.filter((step) => step.done).length;
  const open = checklist.filter((step) => !step.done).map((step) => step.label);
  const summary = `${done}/${checklist.length} done`;
  return open.length > 0 ? `${summary} (open: ${open.join(', ')})` : summary;
}

export function formatReleaseDetails(release) {
  const tracks = release.tracks ?? [];
  return formatDetails([
    ['ID', release.id],
    ['TITLE', release.title],
    ['TYPE', release.type],
    ['STATE', release.state],
    ['RELEASE DATE', formatDate(release.releaseDate)],
    ['GENRE', [release.genre, release.genreCustom].filter(Boolean).join(', ')],
    ['UPC', release.upc],
    ['LABEL', release.labelImprint],
    ['SMART LINK', release.smartLinkSlug],
    ['LINK VIEWS', release.smartLinkViewCount],
    ['CHECKLIST', formatChecklist(release.checklist)],
    ['TRACKS', release._count?.tracks ?? tracks.length],
  ]);
}

export function formatTracklist(tracks) {
  return formatTable(
    ['#', 'TITLE', 'DURATION', 'STATUS', 'ISRC'],
    tracks.map((track) => [
      track.position,
      track.title,
      formatDuration(track.durationSec ?? null),
      track.status,
      track.isrc,
    ]),
  );
}

export async function runReleasesShow(config, id, { json = false } = {}) {
  const release = await fetchRelease(config, id);
  if (json) {
    return JSON.stringify(release, null, 2);
  }
  const details = formatReleaseDetails(release);
  const tracks = release.tracks ?? [];
  if (tracks.length === 0) {
    return `${details}\n\nNo tracks yet.`;
  }
  return `${details}\n\n${formatTracklist(tracks)}`;
}
