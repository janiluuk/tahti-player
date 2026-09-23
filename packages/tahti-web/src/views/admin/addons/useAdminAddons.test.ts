import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminAddon, AdminAddonInstall } from '../../../api/admin';
import { useAdminAddons } from './useAdminAddons';

const api = vi.hoisted(() => ({
  approveAdminAddon: vi.fn(),
  createAdminAddonInstall: vi.fn(),
  deleteAdminAddonInstall: vi.fn(),
  disableAdminAddon: vi.fn(),
  fetchAdminAddonInstalls: vi.fn(),
  fetchAdminAddons: vi.fn(),
  patchAdminAddonInstall: vi.fn(),
  registerAdminAddon: vi.fn(),
  rejectAdminAddon: vi.fn(),
  setAdminAddonDefaultConfig: vi.fn(),
  setAdminAddonEnabledByDefault: vi.fn(),
}));
vi.mock('../../../api/admin', () => api);

const addon = (overrides: Partial<AdminAddon>): AdminAddon =>
  ({
    id: 'a',
    slug: 'a',
    scope: 'ADMIN',
    status: 'APPROVED',
    name: 'A',
    description: '',
    authorName: 'Author',
    categories: [],
    iconUrl: null,
    currentVersion: '1.0.0',
    enabledByDefault: false,
    defaultConfigJson: null,
    moderationNote: null,
    ...overrides,
  }) as AdminAddon;

const install = (id: string, widget: AdminAddon, position: number) =>
  ({ id, widget, position, enabled: true }) as unknown as AdminAddonInstall;

describe('useAdminAddons', () => {
  const approved = addon({ id: 'w1', name: 'Installed' });
  const spare = addon({ id: 'w2', name: 'Spare' });
  const pending = addon({ id: 'p1', status: 'PENDING', scope: 'ARTIST' });

  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchAdminAddons.mockResolvedValue({
      data: [approved, spare, pending],
    });
    api.fetchAdminAddonInstalls.mockResolvedValue({
      data: [install('i1', approved, 0)],
    });
  });

  it('counts pending add-ons and filters by scope and review status', async () => {
    const { result } = renderHook(() => useAdminAddons());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.pendingCount).toBe(1);
    expect(result.current.visibleAddons).toHaveLength(3);

    act(() => result.current.setNeedsReviewOnly(true));
    expect(result.current.visibleAddons.map((a) => a.id)).toEqual(['p1']);

    act(() => {
      result.current.setNeedsReviewOnly(false);
      result.current.setScope('ADMIN');
    });
    expect(result.current.visibleAddons.map((a) => a.id)).toEqual(['w1', 'w2']);
  });

  it('offers only approved admin add-ons not yet installed', async () => {
    const { result } = renderHook(() => useAdminAddons());
    await waitFor(() => expect(result.current.installsLoading).toBe(false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.installCandidates.map((a) => a.id)).toEqual(['w2']);
  });

  it('replaces an approved add-on in the list', async () => {
    api.approveAdminAddon.mockResolvedValue({
      ok: true,
      data: { ...pending, status: 'APPROVED' },
    });
    const { result } = renderHook(() => useAdminAddons());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => result.current.approve(pending));

    await waitFor(() => expect(result.current.pendingCount).toBe(0));
    expect(result.current.pending).toBe(false);
  });

  it('swaps positions with the neighbour when moving an install', async () => {
    const first = install('i1', approved, 0);
    const second = install('i2', spare, 1);
    api.fetchAdminAddonInstalls.mockResolvedValue({ data: [first, second] });
    api.patchAdminAddonInstall.mockImplementation(
      async (id: string, _surface: string, patch: { position: number }) => ({
        ok: true,
        data: { ...(id === 'i1' ? first : second), position: patch.position },
      }),
    );
    const { result } = renderHook(() => useAdminAddons());
    await waitFor(() => expect(result.current.installs).toHaveLength(2));

    await act(async () => result.current.moveInstall(second, 'up'));

    expect(api.patchAdminAddonInstall).toHaveBeenCalledWith('i2', 'homepage', {
      position: 0,
    });
    expect(api.patchAdminAddonInstall).toHaveBeenCalledWith('i1', 'homepage', {
      position: 1,
    });
    await waitFor(() =>
      expect(
        result.current.installs.find((item) => item.id === 'i2')?.position,
      ).toBe(0),
    );
  });

  it('reloads installs and reports the error when a reorder half-fails', async () => {
    const first = install('i1', approved, 0);
    const second = install('i2', spare, 1);
    api.fetchAdminAddonInstalls.mockResolvedValue({ data: [first, second] });
    api.patchAdminAddonInstall
      .mockResolvedValueOnce({ ok: false, error: 'nope' })
      .mockResolvedValueOnce({ ok: true, data: first });
    const { result } = renderHook(() => useAdminAddons());
    await waitFor(() => expect(result.current.installs).toHaveLength(2));

    await act(async () => result.current.moveInstall(first, 'down'));

    await waitFor(() => expect(result.current.installsError).toBe('nope'));
    expect(api.fetchAdminAddonInstalls).toHaveBeenCalledTimes(2);
  });
});
