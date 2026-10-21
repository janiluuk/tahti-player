import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  dismissNotification,
  fetchNotifications,
  fetchStickyNotifications,
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
    const first = await fetchStickyNotifications();
    expect(first.data.some((item) => item.sticky)).toBe(true);

    const sticky = first.data.find((item) => item.sticky);
    expect(sticky).toBeDefined();
    await dismissNotification(sticky!.id);

    const second = await fetchStickyNotifications();
    expect(second.data.some((item) => item.id === sticky!.id)).toBe(false);

    const inbox = await fetchNotifications();
    expect(inbox.data.some((item) => item.id === sticky!.id)).toBe(false);
  });
});
