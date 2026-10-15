import { apiGet, buildQuery, parsePositiveInt } from '../api-client.mjs';
import { formatDate, formatTable, safeName } from '../format.mjs';

export const MAX_LIKES_LIMIT = 100;

export function formatLikesTable(items) {
  return formatTable(
    ['LIKED', 'ARTIST', 'TITLE', 'ID'],
    items.map((item) => [
      formatDate(item.likedAt),
      safeName(item.artistDisplayName, item.artistUsername),
      item.title,
      item.id,
    ]),
  );
}

export async function runLikes(config, { json = false, limit } = {}) {
  const query = buildQuery({
    limit: parsePositiveInt('--limit', limit, MAX_LIKES_LIMIT),
  });
  const result = await apiGet(`/api/me/likes${query}`, config);
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  if (result.items.length === 0) {
    return 'You have not loved any tracks yet.';
  }
  return formatLikesTable(result.items);
}
