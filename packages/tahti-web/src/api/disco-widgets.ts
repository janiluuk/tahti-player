import { apiBase } from './http';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
  type FetchMeta,
} from './mode';

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
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

export type DiscoWidgetScope = 'LISTENER' | 'ARTIST';

export type DiscoWidgetStoreItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  authorName: string;
  categories: string[];
  iconUrl: string | null;
  currentVersion: string;
};

export type DiscoWidgetInstallView = {
  id: string;
  widget: DiscoWidgetStoreItem;
  position: number;
  enabled: boolean;
  configJson: unknown;
  createdAt: string;
};

export type DiscoWidgetRenderItem = {
  installId: string;
  widgetSlug: string;
  name: string;
  sandboxUrl: string;
  version: string;
  position: number;
  config: unknown;
  context: unknown;
};

type ActionResult<T = void> =
  | { error: null; data: T }
  | { error: string; data?: undefined };

function emptyMeta(err: unknown): FetchMeta {
  return allowMockFallback() ? failMeta(err) : apiErrorMeta(err);
}

export async function fetchDiscoWidgetStore(scope: DiscoWidgetScope): Promise<{
  data: DiscoWidgetStoreItem[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<{ widgets: DiscoWidgetStoreItem[] }>(
      `/api/disco-widgets/store?scope=${scope}`,
    );
    return { data: data.widgets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: emptyMeta(err) };
  }
}

export async function fetchDiscoWidgetInstalls(
  scope: DiscoWidgetScope,
): Promise<{
  data: DiscoWidgetInstallView[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  const path =
    scope === 'ARTIST'
      ? '/api/me/channel/disco-widgets/installs'
      : '/api/me/disco-widgets/installs';
  try {
    const { data } = await requestJson<{ installs: DiscoWidgetInstallView[] }>(
      path,
    );
    return { data: data.installs, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: emptyMeta(err) };
  }
}

export async function createDiscoWidgetInstall(
  scope: DiscoWidgetScope,
  widgetId: string,
): Promise<ActionResult<DiscoWidgetInstallView>> {
  if (isForceMock()) {
    return { error: 'Disco-widgets are unavailable in mock mode' };
  }
  const path =
    scope === 'ARTIST'
      ? '/api/me/channel/disco-widgets/installs'
      : '/api/me/disco-widgets/installs';
  try {
    const { data } = await requestJson<DiscoWidgetInstallView>(path, {
      method: 'POST',
      body: JSON.stringify({ widgetId }),
    });
    return { error: null, data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to install',
    };
  }
}

export async function patchDiscoWidgetInstall(
  scope: DiscoWidgetScope,
  id: string,
  patch: { enabled?: boolean; position?: number },
): Promise<ActionResult<DiscoWidgetInstallView>> {
  if (isForceMock()) {
    return { error: 'Disco-widgets are unavailable in mock mode' };
  }
  const path =
    scope === 'ARTIST'
      ? `/api/me/channel/disco-widgets/installs/${id}`
      : `/api/me/disco-widgets/installs/${id}`;
  try {
    const { data } = await requestJson<DiscoWidgetInstallView>(path, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return { error: null, data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to update',
    };
  }
}

export async function removeDiscoWidgetInstall(
  scope: DiscoWidgetScope,
  id: string,
): Promise<ActionResult> {
  if (isForceMock()) {
    return { error: 'Disco-widgets are unavailable in mock mode' };
  }
  const path =
    scope === 'ARTIST'
      ? `/api/me/channel/disco-widgets/installs/${id}`
      : `/api/me/disco-widgets/installs/${id}`;
  try {
    await requestJson<void>(path, { method: 'DELETE' });
    return { error: null, data: undefined };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to remove',
    };
  }
}

export async function fetchDiscoverDiscoWidgets(): Promise<{
  data: DiscoWidgetRenderItem[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<{ widgets: DiscoWidgetRenderItem[] }>(
      '/api/v1/disco-widgets/discover',
    );
    return { data: data.widgets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: emptyMeta(err) };
  }
}

export async function fetchHomepageDiscoWidgets(): Promise<{
  data: DiscoWidgetRenderItem[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<{ widgets: DiscoWidgetRenderItem[] }>(
      '/api/v1/disco-widgets/homepage',
    );
    return { data: data.widgets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: emptyMeta(err) };
  }
}

export async function fetchChannelDiscoWidgets(slug: string): Promise<{
  data: DiscoWidgetRenderItem[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<{ widgets: DiscoWidgetRenderItem[] }>(
      `/api/v1/channels/${encodeURIComponent(slug)}/disco-widgets`,
    );
    return { data: data.widgets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: emptyMeta(err) };
  }
}
