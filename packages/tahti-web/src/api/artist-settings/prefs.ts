import type { FetchMeta } from '.././client';
import {
  ALLOW_MOCK_FALLBACK,
  apiErrorMeta,
  FORCE_MOCK,
  mockFallbackMeta,
} from '.././mode';
import { requestJson } from '.././request-json';
import { mockNotifications, setMockNotifications } from './mock';

export type NotificationPrefs = {
  notifyMoneyMovesEmail: boolean;
  notifyMoneyMovesInApp: boolean;
  notifyListenerActivityEmail: boolean;
  notifyWeeklyRecapEmail: boolean;
  /** Absent until the API has the switch (tahti-org #988). */
  notifyStudioJobsInApp?: boolean;
};

export async function fetchNotificationPrefs(): Promise<{
  data: NotificationPrefs;
  meta: FetchMeta;
}> {
  if (FORCE_MOCK) {
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
    if (ALLOW_MOCK_FALLBACK) {
      return { data: { ...mockNotifications }, meta: mockFallbackMeta(err) };
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
  if (FORCE_MOCK) {
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
