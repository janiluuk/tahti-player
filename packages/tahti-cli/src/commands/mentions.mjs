import { apiGet, buildQuery, parsePositiveInt } from '../api-client.mjs';
import { formatDate, formatTable, safeName } from '../format.mjs';

export const MAX_MENTIONS_LIMIT = 50;

const SURFACES = {
  BIO: 'bio',
  ANNOUNCEMENT: 'announcement',
  RELEASE: 'release',
  NEWSLETTER: 'newsletter',
  TRACKLIST: 'tracklist',
  CHAT: 'chat',
};

export function formatMentionsTable(mentions) {
  return formatTable(
    ['DATE', 'FROM', 'IN', 'WHERE'],
    mentions.map((mention) => [
      formatDate(mention.createdAt),
      safeName(mention.mentioner.displayName, mention.mentioner.username),
      SURFACES[mention.surface] ?? 'post',
      mention.sourceTitle ?? mention.sourceUrl,
    ]),
  );
}

export async function runMentions(config, { json = false, limit } = {}) {
  const query = buildQuery({
    limit: parsePositiveInt('--limit', limit, MAX_MENTIONS_LIMIT),
  });
  const result = await apiGet(`/api/me/mentions${query}`, config);
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  if (result.mentions.length === 0) {
    return 'Nobody has mentioned you yet.';
  }
  return formatMentionsTable(result.mentions);
}
