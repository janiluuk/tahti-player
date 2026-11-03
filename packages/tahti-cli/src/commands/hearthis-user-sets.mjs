import { CliError } from '../api-client.mjs';
import { formatTable } from '../format.mjs';

const HEARTHIS_API = 'https://api-v2.hearthis.at';
const PAGE_SIZE = 20;
const MAX_PAGES = 50;

export async function fetchHearthisUserSets(user, { fetchImpl = fetch } = {}) {
  const handle = String(user ?? '')
    .trim()
    .replace(/^@/, '');
  if (!/^[\w.-]+$/.test(handle)) {
    throw new CliError(`Not a hearthis.at handle: ${user}`);
  }
  const sets = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await fetchImpl(
      `${HEARTHIS_API}/${encodeURIComponent(handle)}/?type=playlists&page=${page}&count=${PAGE_SIZE}`,
    );
    if (!response.ok) {
      throw new CliError(
        `hearthis.at answered HTTP ${response.status} for @${handle}`,
      );
    }
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      break;
    }
    for (const row of rows) {
      sets.push({
        permalink: String(row.permalink),
        title: String(row.title ?? '')
          .replace(/\s+/g, ' ')
          .trim(),
        trackCount: Number(row.track_count ?? row.counts?.tracks ?? 0),
      });
    }
    if (rows.length < PAGE_SIZE) {
      break;
    }
  }
  return { user: handle, sets };
}

export function filterSetsByTitle(sets, match) {
  if (!match) {
    return sets;
  }
  let pattern;
  try {
    pattern = new RegExp(match, 'i');
  } catch {
    throw new CliError(`--match is not a valid pattern: ${match}`);
  }
  return sets.filter((set) => pattern.test(set.title));
}

export async function runHearthisUserSets(
  user,
  { json = false, match = null, fetchImpl } = {},
) {
  if (!user) {
    throw new CliError(
      'Missing hearthis.at handle.\nRun `tahti hearthis user-sets --help` for usage.',
    );
  }
  const result = await fetchHearthisUserSets(user, { fetchImpl });
  const sets = filterSetsByTitle(result.sets, match);
  if (json) {
    return JSON.stringify({ user: result.user, sets }, null, 2);
  }
  if (sets.length === 0) {
    return match
      ? `No sets on hearthis.at/@${result.user} match "${match}".`
      : `No sets on hearthis.at/@${result.user}.`;
  }
  const table = formatTable(
    ['PERMALINK', 'TITLE', 'TRACKS'],
    sets.map((set) => [set.permalink, set.title, String(set.trackCount)]),
  );
  return `${table}\n\n${sets.length} set(s) for @${result.user}.`;
}
