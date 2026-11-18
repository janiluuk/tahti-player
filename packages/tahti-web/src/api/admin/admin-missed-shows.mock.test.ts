import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchAdminMissedShows, updateAdminMissedShow } from './admin-support';

vi.mock('../mode', async (original) => ({
  ...(await original<typeof import('../mode')>()),
  isForceMock: () => true,
}));

describe('missed shows in the mock app', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists sample flags without calling the network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const all = await fetchAdminMissedShows();
    expect(all.meta.source).toBe('mock');
    expect(all.data.length).toBeGreaterThan(1);
    const open = await fetchAdminMissedShows('OPEN');
    expect(open.data.every((show) => show.status === 'OPEN')).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('keeps a status change', async () => {
    const [first] = (await fetchAdminMissedShows('OPEN')).data;
    await expect(updateAdminMissedShow(first.id, 'DISMISSED')).resolves.toEqual(
      { ok: true },
    );
    const dismissed = await fetchAdminMissedShows('DISMISSED');
    expect(dismissed.data.map((show) => show.id)).toContain(first.id);
    await expect(updateAdminMissedShow('nope', 'DISMISSED')).resolves.toEqual({
      ok: false,
      error: 'Missed show not found',
    });
  });
});
