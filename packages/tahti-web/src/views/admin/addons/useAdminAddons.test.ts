import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminAddon, AdminAddonInstall } from '../../../api/admin';
import { useAdminAddons } from './useAdminAddons';

const api = vi.hoisted(() => ({
  approveAdminAddon: vi.fn(),
  createAdminAddonInstall: vi.fn(),
  deleteAdminAddon: vi.fn(),
  deleteAdminAddonInstall: vi.fn(),
  disableAdminAddon: vi.fn(),
  fetchAdminAddonInstalls: vi.fn(),
  fetchAdminAddons: vi.fn(),
  patchAdminAddonInstall: vi.fn(),
  publishAdminAddonVersion: vi.fn(),
  registerAdminAddon: vi.fn(),
  rejectAdminAddon: vi.fn(),
  setAdminAddonDefaultConfig: vi.fn(),
  setAdminAddonEnabledByDefault: vi.fn(),
  updateAdminAddon: vi.fn(),
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

  it('publishes a version, replaces the card and closes the dialog', async () => {
    const file = new File(['export default {}'], 'w.js');
    api.publishAdminAddonVersion.mockResolvedValue({
      ok: true,
      data: { ...approved, status: 'PENDING', currentVersion: '1.0.1' },
    });
    const { result } = renderHook(() => useAdminAddons());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.openPublish(approved));
    await act(async () =>
      result.current.publish(approved, { version: '1.0.1', file }),
    );

    expect(api.publishAdminAddonVersion).toHaveBeenCalledWith('w1', {
      version: '1.0.1',
      file,
    });
    await waitFor(() => expect(result.current.publishTarget).toBeNull());
    expect(
      result.current.visibleAddons.find((item) => item.id === 'w1')?.status,
    ).toBe('PENDING');
  });

  it('keeps the publish dialog open with the error when publishing fails', async () => {
    api.publishAdminAddonVersion.mockResolvedValue({
      ok: false,
      error: 'That version is already published — bump it',
    });
    const { result } = renderHook(() => useAdminAddons());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.openPublish(approved));
    await act(async () =>
      result.current.publish(approved, {
        version: '1.0.0',
        file: new File(['x'], 'w.js'),
      }),
    );

    await waitFor(() =>
      expect(result.current.error).toBe(
        'That version is already published — bump it',
      ),
    );
    expect(result.current.publishTarget?.id).toBe('w1');
  });

  it('prefills the edit dialog from the add-on and saves the metadata', async () => {
    const withIcon = addon({
      id: 'w9',
      slug: 'w9',
      name: 'Old',
      description: 'd',
      categories: ['stats'],
      iconUrl: 'https://cdn/i.png',
    });
    api.fetchAdminAddons.mockResolvedValue({ data: [withIcon] });
    api.updateAdminAddon.mockResolvedValue({
      ok: true,
      data: { ...withIcon, name: 'New' },
    });
    const { result } = renderHook(() => useAdminAddons());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.openEdit(withIcon));
    expect(result.current.draft).toMatchObject({
      slug: 'w9',
      name: 'Old',
      iconUrl: 'https://cdn/i.png',
    });
    act(() =>
      result.current.setDraft({ ...result.current.draft, name: 'New' }),
    );
    await act(async () => result.current.saveEdit());

    expect(api.updateAdminAddon).toHaveBeenCalledWith(
      'w9',
      expect.objectContaining({ name: 'New', categories: ['stats'] }),
    );
    await waitFor(() => expect(result.current.editTarget).toBeNull());
    expect(result.current.visibleAddons[0]?.name).toBe('New');
  });

  it('deletes an add-on and drops it and its installs from the page', async () => {
    api.deleteAdminAddon.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useAdminAddons());
    await waitFor(() => expect(result.current.installs).toHaveLength(1));

    act(() => result.current.setDeleteTarget(approved));
    await act(async () => result.current.removeAddon(approved));

    expect(api.deleteAdminAddon).toHaveBeenCalledWith('w1');
    await waitFor(() => expect(result.current.deleteTarget).toBeNull());
    expect(result.current.visibleAddons.map((item) => item.id)).not.toContain(
      'w1',
    );
    expect(result.current.installs).toHaveLength(0);
  });

  it('keeps the add-on and shows the error when the delete fails', async () => {
    api.deleteAdminAddon.mockResolvedValue({ ok: false, error: 'Forbidden' });
    const { result } = renderHook(() => useAdminAddons());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => result.current.removeAddon(approved));

    await waitFor(() => expect(result.current.error).toBe('Forbidden'));
    expect(result.current.visibleAddons.map((item) => item.id)).toContain('w1');
  });
});
