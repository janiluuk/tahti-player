import { apiGet, apiPost, CliError } from '../api-client.mjs';
import { formatTable } from '../format.mjs';

const PAGE = 100;

/** Every sound in your library that is still a hearthis.at embed. */
export async function fetchHearthisEmbeds(config) {
  const embeds = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await apiGet(
      `/api/me/sound?source=HEARTHIS&limit=${PAGE}&offset=${offset}`,
      config,
    );
    const items = Array.isArray(page) ? page : (page.items ?? []);
    embeds.push(...items.filter((item) => item.source === 'HEARTHIS_EMBED'));
    const total = Array.isArray(page) ? items.length : page.total;
    if (items.length < PAGE || offset + PAGE >= total) {
      return embeds;
    }
  }
}

function outcomeFor(error) {
  const message = error?.message ?? String(error);
  if (/not enabled downloads/i.test(message)) {
    return {
      status: 'not downloadable',
      detail: 'downloads are off on hearthis.at',
    };
  }
  if (/already has real audio/i.test(message)) {
    return { status: 'already imported', detail: '' };
  }
  return { status: 'failed', detail: message };
}

/** Ask the API to download each embed's audio from hearthis.at and turn the
 * sound into a real upload (`POST /api/me/sound/:id/import-embed`). The
 * server queues the download; the sound keeps its id, plays, likes and
 * places in collections. */
export async function runHearthisImportEmbeds(
  config,
  { dryRun = false, json = false, limit = null } = {},
) {
  let embeds = await fetchHearthisEmbeds(config);
  if (limit !== null) {
    embeds = embeds.slice(0, limit);
  }
  if (embeds.length === 0) {
    return json ? '[]' : 'No hearthis.at embeds left in your library.';
  }

  const results = [];
  for (const sound of embeds) {
    if (dryRun) {
      results.push({
        id: sound.id,
        title: sound.title,
        status: 'would import',
        detail: '',
      });
      continue;
    }
    try {
      await apiPost(
        `/api/me/sound/${encodeURIComponent(sound.id)}/import-embed`,
        {},
        config,
      );
      results.push({
        id: sound.id,
        title: sound.title,
        status: 'importing',
        detail: '',
      });
    } catch (error) {
      if (!(error instanceof CliError)) {
        throw error;
      }
      results.push({ id: sound.id, title: sound.title, ...outcomeFor(error) });
    }
  }

  if (json) {
    return JSON.stringify(results, null, 2);
  }
  const counts = results.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
  const summary = Object.entries(counts)
    .map(([status, count]) => `${count} ${status}`)
    .join(', ');
  return `${formatTable(
    ['ID', 'TITLE', 'STATUS', 'DETAIL'],
    results.map((row) => [row.id, row.title, row.status, row.detail]),
  )}\n\n${embeds.length} hearthis.at embed${embeds.length === 1 ? '' : 's'}: ${summary}.${
    dryRun ? '\nRun again without --dry-run to import them.' : ''
  }`;
}
