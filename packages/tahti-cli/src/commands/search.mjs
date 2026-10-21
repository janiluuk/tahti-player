import {
  apiGet,
  buildQuery,
  CliError,
  parsePositiveInt,
} from '../api-client.mjs';
import { formatDuration, formatTable, safeName } from '../format.mjs';

/** Fixed `PAGE_SIZE` of `GET /api/v1/search/tracks`; the route has no limit param. */
export const SEARCH_PAGE_SIZE = 20;

/** Bound from `CatalogTrackSearchQuerySchema` in `@tahti/shared`. */
export const MAX_QUERY_LENGTH = 100;

function parseQuery(query) {
  const trimmed = query?.trim();
  if (!trimmed) {
    throw new CliError('Missing search query. Usage: tahti search <query>');
  }
  if (trimmed.length > MAX_QUERY_LENGTH) {
    throw new CliError(
      `Search query is too long (max ${MAX_QUERY_LENGTH} characters).`,
    );
  }
  return trimmed;
}

/**
 * The API always returns up to 20 tracks from `offset`, so `--limit` pages are
 * built by offsetting in `limit`-sized steps and trimming the response.
 */
export async function searchTracks(config, query, { page, limit } = {}) {
  const q = parseQuery(query);
  const pageNumber = parsePositiveInt('--page', page) ?? 1;
  const pageSize =
    parsePositiveInt('--limit', limit, SEARCH_PAGE_SIZE) ?? SEARCH_PAGE_SIZE;
  const offset = (pageNumber - 1) * pageSize;
  const result = await apiGet(
    `/api/v1/search/tracks${buildQuery({ q, offset: offset || undefined })}`,
    config,
    { auth: false },
  );
  return {
    result,
    page: pageNumber,
    offset,
    tracks: result.tracks.slice(0, pageSize),
    hasMore: result.hasMore || result.tracks.length > pageSize,
  };
}

export function formatSearchTable(tracks) {
  return formatTable(
    ['ID', 'TITLE', 'ARTIST', 'DURATION', 'CHANNEL'],
    tracks.map((track) => [
      track.id,
      track.title,
      safeName(track.artistName, track.channelSlug),
      formatDuration(track.durationSec ?? null),
      track.channelSlug,
    ]),
  );
}

export async function runSearch(
  config,
  query,
  { json = false, page, limit } = {},
) {
  const search = await searchTracks(config, query, { page, limit });
  if (json) {
    return JSON.stringify(search.result, null, 2);
  }
  if (search.tracks.length === 0) {
    return search.page > 1
      ? `No more tracks on page ${search.page}.`
      : 'No tracks found.';
  }
  const table = formatSearchTable(search.tracks);
  if (!search.hasMore) {
    return table;
  }
  const first = search.offset + 1;
  const last = search.offset + search.tracks.length;
  return `${table}\n\nShowing ${first}-${last}. Use --page ${search.page + 1} to see more.`;
}
