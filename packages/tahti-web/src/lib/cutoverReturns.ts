type CallbackSearch = Record<string, unknown>;

function stringValue(search: CallbackSearch, key: string): string | null {
  const value = search[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function appendSearchParams(
  path: string,
  search: CallbackSearch,
): string {
  const params = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (typeof value === 'string' && value.length > 0) {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function resolveDashboardCallbackRedirect(
  search: CallbackSearch,
): string | null {
  const mixcloud = stringValue(search, 'mixcloud');
  if (mixcloud) {
    return appendSearchParams('/settings/plugin-store', {
      status: mixcloud,
      category: 'import',
    });
  }

  const fanConnect = stringValue(search, 'fanConnect');
  if (fanConnect) {
    return appendSearchParams('/studio/stripe', { fanConnect });
  }

  const fanSubscriptions = stringValue(search, 'fansubs');
  if (fanSubscriptions) {
    return appendSearchParams('/studio/audience', {
      fansubs: fanSubscriptions,
    });
  }

  const membership = stringValue(search, 'membership');
  if (membership) {
    return appendSearchParams('/settings/account', { membership });
  }

  const distribution = stringValue(search, 'distribution');
  if (distribution) {
    return appendSearchParams('/studio/distribution', {
      distribution,
      releaseId: stringValue(search, 'releaseId') ?? undefined,
    });
  }

  const social = stringValue(search, 'social');
  if (social) {
    return appendSearchParams('/settings/connections', { social });
  }

  return null;
}
