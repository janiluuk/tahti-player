import { apiGet, CliError } from '../api-client.mjs';
import { formatDuration, formatTable } from '../format.mjs';

/**
 * The set permalink from a pasted hearthis.at set link
 * (`https://hearthis.at/set/378936-9675121/`) or a bare permalink.
 */
export function parseHearthisSetPermalink(input) {
  const value = typeof input === 'string' ? input.trim() : '';
  if (!value) {
    return null;
  }
  try {
    const url = new URL(
      value.startsWith('http') ? value : `https://hearthis.at/set/${value}/`,
    );
    if (!/(^|\.)hearthis\.at$/.test(url.hostname)) {
      return null;
    }
    const match = /^\/set\/([^/]+)\/?$/.exec(url.pathname);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  } catch {
    // bare permalink below
  }
  return /^[\w-]+$/.test(value) ? value : null;
}

export async function fetchHearthisSetTracks(config, permalinkOrUrl) {
  const permalink = parseHearthisSetPermalink(permalinkOrUrl);
  if (!permalink) {
    throw new CliError(
      `Invalid set permalink or URL: ${permalinkOrUrl}\nExpected https://hearthis.at/set/<permalink>/ or a bare permalink from \`tahti hearthis sets\`.`,
    );
  }
  return apiGet(
    `/api/v1/imports/hearthis/sets/${encodeURIComponent(permalink)}/tracks`,
    config,
  );
}

export function formatHearthisSetTrackRow(track) {
  return [
    String(track.position).padStart(2, '0'),
    track.title,
    track.username,
    formatDuration(track.durationSec ?? null),
    track.downloadable ? 'yes' : 'no',
    track.downloadFilename || '-',
  ];
}

export function formatHearthisSetTracksTable(tracks) {
  return formatTable(
    ['#', 'TITLE', 'ARTIST', 'DURATION', 'DOWNLOADABLE', 'FILENAME'],
    tracks.map(formatHearthisSetTrackRow),
  );
}

export async function runHearthisSet(
  config,
  permalinkOrUrl,
  { json = false } = {},
) {
  if (!permalinkOrUrl) {
    throw new CliError(
      'Missing set permalink.\nRun `tahti hearthis set --help` for usage.',
    );
  }
  const result = await fetchHearthisSetTracks(config, permalinkOrUrl);
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  if (result.tracks.length === 0) {
    return `No tracks in set ${result.permalink} (${result.url}).`;
  }
  const downloadable = result.tracks.filter(
    (track) => track.downloadable,
  ).length;
  return `${formatHearthisSetTracksTable(result.tracks)}\n\n${result.tracks.length} track(s) in ${result.url} (${downloadable} downloadable).`;
}
