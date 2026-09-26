import { apiGet } from '../api-client.mjs';
import { formatBytes, formatDetails, safeName } from '../format.mjs';

export async function fetchCurrentUser(config) {
  return apiGet('/api/auth/me', config);
}

export function safeDisplayName(user) {
  return safeName(user.displayName, user.username);
}

export function formatCurrentUser(user) {
  return formatDetails([
    ['USERNAME', user.username],
    ['DISPLAY NAME', safeDisplayName(user)],
    ['TIER', user.tier],
    ['MEMBER', user.isMember ? 'yes' : 'no'],
    ['CHANNEL', user.channel?.slug],
    ['STORAGE USED', formatBytes(user.storage?.usedBytes)],
  ]);
}

export async function runWhoami(config, { json = false } = {}) {
  const user = await fetchCurrentUser(config);
  if (json) {
    return JSON.stringify(user, null, 2);
  }
  return formatCurrentUser(user);
}
