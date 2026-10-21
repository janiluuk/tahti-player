import { apiGet, CliError } from '../api-client.mjs';
import {
  formatDate,
  formatDetails,
  formatDuration,
  formatTable,
  safeName,
} from '../format.mjs';

export async function fetchCollection(config, slug) {
  if (!slug) {
    throw new CliError(
      'Missing collection slug. Usage: tahti collections show <slug>',
    );
  }
  return apiGet(`/api/me/collections/${encodeURIComponent(slug)}`, config);
}

function itemRow(item, index) {
  if (item.sound) {
    return [
      index + 1,
      item.sound.title,
      item.sound.artist
        ? safeName(item.sound.artist.displayName, item.sound.artist.username)
        : null,
      'track',
      formatDuration(item.sound.durationSec),
      item.unavailable ? 'no longer public' : '',
    ];
  }
  if (item.release) {
    return [index + 1, item.release.title, null, 'release', null, ''];
  }
  return [index + 1, null, null, 'removed', null, 'deleted since it was added'];
}

export function formatCollection(collection) {
  const details = formatDetails([
    ['Name', collection.name],
    ['Slug', collection.slug],
    ['Type', collection.type],
    ['Visibility', collection.isPublic ? 'public' : 'private'],
    ['Collaborative', collection.collaborative ? 'yes' : 'no'],
    ['Created', formatDate(collection.createdAt)],
    ['Description', collection.description],
  ]);
  const items = collection.items ?? [];
  if (items.length === 0) {
    return `${details}\n\nNo items yet.`;
  }
  const table = formatTable(
    ['#', 'TITLE', 'ARTIST', 'KIND', 'LENGTH', 'NOTE'],
    items.map(itemRow),
  );
  return `${details}\n\n${table}`;
}

export async function runCollectionsShow(config, slug, { json = false } = {}) {
  const collection = await fetchCollection(config, slug);
  if (json) {
    return JSON.stringify(collection, null, 2);
  }
  return formatCollection(collection);
}
