import { apiGet, buildQuery, CliError } from '../api-client.mjs';
import { formatDetails, formatTable } from '../format.mjs';

/** `StatsRangeQuerySchema` in `@tahti/shared`: days, or the whole history. */
export const STATS_RANGES = ['1', '7', '30', 'all'];

function parseRange(range) {
  if (range === undefined) {
    return 'all';
  }
  if (!STATS_RANGES.includes(range)) {
    throw new CliError(
      `Invalid --range "${range}". Expected one of: ${STATS_RANGES.join(', ')}.`,
    );
  }
  return range;
}

export async function fetchStats(config, { range } = {}) {
  const query = buildQuery({ range: parseRange(range) });
  const [summary, topTracks] = await Promise.all([
    apiGet('/api/me/stats/summary', config),
    apiGet(`/api/me/stats/top-tracks${query}`, config),
  ]);
  return { summary, topTracks };
}

export function formatStats({ summary, topTracks }, range) {
  const counters = formatDetails([
    ['Plays today', summary.playsToday],
    ['Plays total', summary.playsTotal],
    ['Downloads today', summary.downloadsToday],
    ['Downloads total', summary.downloadsTotal],
    ['Followers', summary.followerCount],
  ]);
  const label = range === 'all' ? 'all time' : `last ${range} days`;
  if (topTracks.items.length === 0) {
    return `${counters}\n\nNo track plays yet (${label}).`;
  }
  const table = formatTable(
    ['#', 'TRACK', 'PLAYS', 'ID'],
    topTracks.items.map((item, index) => [
      index + 1,
      item.title,
      item.plays,
      item.soundId,
    ]),
  );
  return `${counters}\n\nTop tracks (${label}):\n${table}`;
}

export async function runStats(config, { json = false, range } = {}) {
  const parsedRange = parseRange(range);
  const result = await fetchStats(config, { range: parsedRange });
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  return formatStats(result, parsedRange);
}
