import {
  apiGet,
  apiSendJson,
  buildQuery,
  CliError,
  parsePositiveInt,
} from '../api-client.mjs';
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

export async function fetchLikes(config, { limit } = {}) {
  const query = buildQuery({
    limit: parsePositiveInt('--limit', limit, MAX_LIKES_LIMIT),
  });
  return apiGet(`/api/me/likes${query}`, config);
}

export async function runLikes(config, { json = false, limit } = {}) {
  const result = await fetchLikes(config, { limit });
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  if (result.items.length === 0) {
    return 'You have not loved any tracks yet.';
  }
  return formatLikesTable(result.items);
}

/** Love (or stop loving) a track: `tahti like <channel> <track-id>`. */
export async function runSetLiked(config, channel, trackId, liked) {
  const slug = channel?.trim().replace(/^@/, '');
  const id = trackId?.trim();
  if (!slug || !id) {
    throw new CliError(
      `Give the channel and the track id.\nRun \`tahti ${liked ? 'like' : 'unlike'} --help\` for usage.`,
    );
  }
  const result = await apiSendJson(
    liked ? 'POST' : 'DELETE',
    `/api/v1/c/${encodeURIComponent(slug)}/sounds/${encodeURIComponent(id)}/like`,
    {},
    config,
  );
  const count = result.likeCount === 1 ? '1 like' : `${result.likeCount} likes`;
  return result.liked
    ? `Loved. The track has ${count}.`
    : `Unloved. The track has ${count}.`;
}
