import { apiBase } from './http';
import { isForceMock } from './mode';

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

export type IntegrationScope = 'IMPORT' | 'EXPORT' | 'FINGERPRINT' | 'SCROBBLE';

export type IntegrationView = {
  slug: string;
  name: string;
  description: string;
  scope: IntegrationScope;
  authKind: 'API_KEY' | 'OAUTH';
  installed: boolean;
  connected: boolean;
};

const mockInstalled = new Set<string>();

export function lastFmOauthStartUrl(returnTo: string): string {
  const params = new URLSearchParams({ returnTo });
  return `${apiBase()}/api/me/integrations/lastfm/oauth/start?${params.toString()}`;
}

export async function fetchMeIntegrations(): Promise<{
  data: IntegrationView[];
  source: 'api' | 'mock';
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          slug: 'listenbrainz',
          name: 'ListenBrainz',
          description:
            'Scrobble plays of Tahti tracks to your ListenBrainz account.',
          scope: 'SCROBBLE',
          authKind: 'API_KEY',
          installed: mockInstalled.has('listenbrainz'),
          connected: false,
        },
        {
          slug: 'lastfm',
          name: 'Last.fm',
          description:
            'Scrobble plays of Tahti tracks to your Last.fm profile.',
          scope: 'SCROBBLE',
          authKind: 'OAUTH',
          installed: false,
          connected: mockInstalled.has('lastfm'),
        },
      ],
      source: 'mock',
    };
  }
  const { data } = await requestJson<{ integrations: IntegrationView[] }>(
    '/api/me/integrations',
  );
  return { data: data.integrations, source: 'api' };
}

export async function installMeIntegration(
  slug: string,
  fields: Record<string, string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    if (slug === 'listenbrainz' && !fields.userToken?.trim()) {
      return { ok: false, error: 'User token is required.' };
    }
    if (slug === 'listenbrainz' && fields.userToken.trim() === 'bad') {
      return { ok: false, error: 'ListenBrainz token is invalid.' };
    }
    mockInstalled.add(slug);
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/integrations/${encodeURIComponent(slug)}/install`,
      {
        method: 'POST',
        body: JSON.stringify({ fields }),
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Install failed',
    };
  }
}

export async function uninstallMeIntegration(
  slug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockInstalled.delete(slug);
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/integrations/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Uninstall failed',
    };
  }
}
