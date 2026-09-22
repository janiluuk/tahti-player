import type { FetchMeta } from '.././client';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '.././mode';
import { requestJson } from '.././request-json';
import {
  mockDiscovery,
  mockNotifications,
  setMockDiscovery,
  setMockNotifications,
} from './mock';

export type NotificationPrefs = {
  notifyMoneyMovesEmail: boolean;
  notifyMoneyMovesInApp: boolean;
  notifyListenerActivityEmail: boolean;
  notifyWeeklyRecapEmail: boolean;
};

export type DiscoveryPrefs = {
  listedInDirectory: boolean;
  allowRadioPickup: boolean;
  showOnListenHome: boolean;
  genreTags: string;
  /** Favorited tracks/channels visible on the public profile. */
  showFavorites: boolean;
  /** Notify followers (feed + optional email) when a release goes public. */
  announceReleases: boolean;
};

export async function fetchNotificationPrefs(): Promise<{
  data: NotificationPrefs;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockNotifications },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<NotificationPrefs>(
      '/api/me/notification-preferences',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: { ...mockNotifications }, meta: failMeta(err) };
    }
    return {
      data: {
        notifyMoneyMovesEmail: false,
        notifyMoneyMovesInApp: false,
        notifyListenerActivityEmail: false,
        notifyWeeklyRecapEmail: false,
      },
      meta: apiErrorMeta(err),
    };
  }
}

export async function patchNotificationPrefs(
  patch: Partial<NotificationPrefs>,
): Promise<
  { ok: true; data: NotificationPrefs } | { ok: false; error: string }
> {
  if (isForceMock()) {
    setMockNotifications({ ...mockNotifications, ...patch });
    return { ok: true, data: { ...mockNotifications } };
  }
  try {
    const { data } = await requestJson<NotificationPrefs>(
      '/api/me/notification-preferences',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function fetchDiscoveryPrefs(): Promise<{
  data: DiscoveryPrefs;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockDiscovery },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<DiscoveryPrefs>('/api/me/discovery');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: { ...mockDiscovery }, meta: failMeta(err) };
    }
    return {
      data: {
        listedInDirectory: false,
        allowRadioPickup: false,
        showOnListenHome: false,
        genreTags: '',
        showFavorites: false,
        announceReleases: false,
      },
      meta: apiErrorMeta(err),
    };
  }
}

export async function patchDiscoveryPrefs(
  patch: Partial<DiscoveryPrefs>,
): Promise<{ ok: true; data: DiscoveryPrefs } | { ok: false; error: string }> {
  if (isForceMock()) {
    setMockDiscovery({ ...mockDiscovery, ...patch });
    return { ok: true, data: { ...mockDiscovery } };
  }
  try {
    const { data } = await requestJson<DiscoveryPrefs>('/api/me/discovery', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}
