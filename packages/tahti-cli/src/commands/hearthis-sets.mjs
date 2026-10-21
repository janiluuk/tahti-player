import { apiGet, CliError } from '../api-client.mjs';
import { formatTable } from '../format.mjs';

export async function fetchHearthisSets(config) {
  return apiGet('/api/v1/imports/hearthis/me-sets', config);
}

export function formatHearthisSetRow(set) {
  return [set.permalink, set.title, set.trackCount, set.year, set.username];
}

export function formatHearthisSetsTable(sets) {
  return formatTable(
    ['PERMALINK', 'TITLE', 'TRACKS', 'YEAR', 'ARTIST'],
    sets.map(formatHearthisSetRow),
  );
}

export async function runHearthisSets(config, { json = false } = {}) {
  const result = await fetchHearthisSets(config);
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  if (!result.username) {
    throw new CliError(
      'No hearthis.at username on your Tahti profile. Set it under Settings → Profile (hearthis.at handle), then try again.',
    );
  }
  if (result.sets.length === 0) {
    return `No sets on hearthis.at/@${result.username}.`;
  }
  return `${formatHearthisSetsTable(result.sets)}\n\n${result.sets.length} set(s) for @${result.username}. Use \`tahti hearthis set <permalink>\` to list tracks.`;
}
