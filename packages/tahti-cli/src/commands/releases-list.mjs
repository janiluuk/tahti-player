import { apiGet, buildQuery, parsePositiveInt } from '../api-client.mjs';
import { formatDate, formatTable } from '../format.mjs';

/** Bounds from `MeReleaseListQuerySchema` in `@tahti/shared`. */
export const MAX_RELEASES_LIMIT = 100;

export async function fetchReleases(config, { page, limit } = {}) {
  const query = buildQuery({
    page: parsePositiveInt('--page', page),
    limit: parsePositiveInt('--limit', limit, MAX_RELEASES_LIMIT),
  });
  return apiGet(`/api/me/releases${query}`, config);
}

export function formatReleaseRow(release) {
  return [
    release.id,
    release.title,
    release.type,
    release.state,
    formatDate(release.releaseDate),
    release._count?.tracks ?? release.tracks?.length,
  ];
}

export function formatReleasesTable(releases) {
  return formatTable(
    ['ID', 'TITLE', 'TYPE', 'STATE', 'RELEASE DATE', 'TRACKS'],
    releases.map(formatReleaseRow),
  );
}

export async function runReleasesList(
  config,
  { json = false, page, limit } = {},
) {
  const result = await fetchReleases(config, { page, limit });
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  if (result.releases.length === 0) {
    return result.total > 0
      ? `No releases on page ${result.page} (${result.total} total).`
      : 'No releases yet.';
  }
  const table = formatReleasesTable(result.releases);
  const shown = result.releases.length;
  if (shown >= result.total) {
    return table;
  }
  const first = (result.page - 1) * result.limit + 1;
  return `${table}\n\nShowing ${first}-${first + shown - 1} of ${result.total}. Use --page to see more.`;
}
