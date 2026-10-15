import { apiGet, apiPost, apiSendNoContent, CliError } from '../api-client.mjs';
import { formatDate, formatTable, safeName } from '../format.mjs';

function requireUsername(username, action) {
  const handle = username?.trim().replace(/^@/, '');
  if (!handle) {
    throw new CliError(
      `Missing username.\nRun \`tahti blocks ${action} --help\` for usage.`,
    );
  }
  return handle;
}

export async function runBlocksList(config, { json = false } = {}) {
  const result = await apiGet('/api/me/blocks', config);
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  if (result.blocked.length === 0) {
    return 'You have not blocked anyone.';
  }
  return formatTable(
    ['USERNAME', 'NAME', 'BLOCKED'],
    result.blocked.map((user) => [
      user.username,
      safeName(user.displayName, user.username),
      formatDate(user.blockedAt),
    ]),
  );
}

export async function runBlocksAdd(config, username) {
  const handle = requireUsername(username, 'add');
  const blocked = await apiPost('/api/me/blocks', { username: handle }, config);
  return `Blocked @${blocked.username ?? handle}. Follows, loves, reposts and collection subscriptions between you were removed.`;
}

export async function runBlocksRemove(config, username) {
  const handle = requireUsername(username, 'remove');
  await apiSendNoContent(
    'DELETE',
    `/api/me/blocks/${encodeURIComponent(handle)}`,
    config,
  );
  return `Unblocked @${handle}. Earlier follows are not restored.`;
}
