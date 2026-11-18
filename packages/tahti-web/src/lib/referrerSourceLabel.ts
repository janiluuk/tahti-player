const DIRECT = 'Direct';
const OTHER = 'Other';
const URL_MAX = 48;

export function truncateReferrerLabel(name: string, max = URL_MAX): string {
  if (name.length <= max) {
    return name;
  }
  return `${name.slice(0, Math.max(1, max - 1))}…`;
}

export function isHttpReferrerUrl(name: string): boolean {
  try {
    const url = new URL(name);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function referrerSourceLabel(
  name: string,
  count: number,
  mode: 'host' | 'url',
  locale: string,
): string {
  const listens = `${count.toLocaleString(locale)} ${count === 1 ? 'listen' : 'listens'}`;
  if (name === DIRECT) {
    return `Direct or unknown · ${listens}`;
  }
  if (name === OTHER) {
    return mode === 'url'
      ? `Other pages · ${listens}`
      : `Other sites · ${listens}`;
  }
  const shown = mode === 'url' ? truncateReferrerLabel(name) : name;
  return `${shown} · ${listens}`;
}

export { DIRECT, OTHER };
