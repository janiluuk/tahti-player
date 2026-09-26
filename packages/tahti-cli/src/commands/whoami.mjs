import { apiGet } from '../api-client.mjs';
import { formatBytes, formatDetails } from '../format.mjs';

export async function fetchCurrentUser(config) {
  return apiGet('/api/auth/me', config);
}

/**
 * The API already rejects email-shaped display names, but a CLI must never
 * echo one as a name either way, so an email-looking value falls back to the
 * username instead of being printed.
 */
export function safeDisplayName(user) {
  const displayName = user.displayName?.trim();
  if (!displayName || displayName.includes('@')) {
    return user.username;
  }
  return displayName;
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
