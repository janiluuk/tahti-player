import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  dismissNotification,
  fetchNotifications,
  fetchNotificationUnreadCounts,
} from './notifications';

describe('mock notifications', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it('keeps sticky notifications dismissed after acknowledge', async () => {
    const first = await fetchNotifications();
    const sticky = first.data.find((item) => item.sticky);
    expect(sticky).toBeDefined();
    await dismissNotification(sticky!.id);

    const second = await fetchNotifications();
    expect(second.data.some((item) => item.id === sticky!.id)).toBe(false);
  });

  it('counts unread mock notifications under their own kinds', async () => {
    const counts = await fetchNotificationUnreadCounts();
    expect(counts?.byKind.social).toBeGreaterThan(0);
    expect(counts?.byKind.music).toBeGreaterThan(0);
    expect(counts?.byKind.other).toBeLessThan(counts?.total ?? 0);
  });
});
