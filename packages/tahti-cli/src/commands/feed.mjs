import { apiGet, parsePositiveInt } from '../api-client.mjs';
import { formatDate, formatTable, safeName } from '../format.mjs';

const TEXT_LENGTH = 70;

function oneLine(text) {
  const line = (text ?? '').replace(/\s+/g, ' ').trim();
  return line.length > TEXT_LENGTH
    ? `${line.slice(0, TEXT_LENGTH - 1)}…`
    : line;
}

function itemKind(item) {
  if (item.kind === 'release') {
    return (item.releaseType ?? 'release').toLowerCase();
  }
  return item.kind;
}

function itemText(item) {
  if (item.kind === 'post') {
    return oneLine(item.title ? `${item.title}: ${item.body}` : item.body);
  }
  return oneLine(item.title);
}

export function formatFeedTable(items) {
  return formatTable(
    ['DATE', 'ARTIST', 'KIND', 'WHAT'],
    items.map((item) => [
      formatDate(item.date),
      safeName(item.artist.displayName, item.artist.username),
      itemKind(item),
      itemText(item),
    ]),
  );
}

export async function runFeed(config, { json = false, limit } = {}) {
  const max = parsePositiveInt('--limit', limit);
  const feed = await apiGet('/api/me/feed', config);
  if (json) {
    return JSON.stringify(feed, null, 2);
  }
  if (feed.followingCount === 0) {
    return 'You do not follow anyone yet. Follow artists on tahti.live to fill your feed.';
  }
  if (feed.items.length === 0) {
    return `Nothing new from the ${feed.followingCount} artists you follow.`;
  }
  const items = max ? feed.items.slice(0, max) : feed.items;
  return formatFeedTable(items);
}
