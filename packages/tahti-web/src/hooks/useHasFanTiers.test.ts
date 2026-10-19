import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { useHasFanTiers } from './useHasFanTiers';

const artist = {
  id: 'u1',
  displayName: 'Liis',
  username: 'liis',
  bio: null,
  avatarUrl: null,
};

describe('useHasFanTiers', () => {
  it('is false for an artist without tiers', async () => {
    vi.spyOn(client, 'fetchFanTiers').mockResolvedValue({
      data: { artist, tiers: [] },
      meta: { source: 'api' },
    } as Awaited<ReturnType<typeof client.fetchFanTiers>>);

    const { result } = renderHook(() => useHasFanTiers('liis'));

    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('is true once a tier exists', async () => {
    vi.spyOn(client, 'fetchFanTiers').mockResolvedValue({
      data: { artist, tiers: [{ id: 't1' }] },
      meta: { source: 'api' },
    } as unknown as Awaited<ReturnType<typeof client.fetchFanTiers>>);

    const { result } = renderHook(() => useHasFanTiers('liis'));

    await waitFor(() => expect(result.current).toBe(true));
  });
});
