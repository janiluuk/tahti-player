import { afterEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../api/studio';
import { saveCollectionSoundOrder } from './saveCollectionSoundOrder';

const items = [
  { id: 'i1', position: 0, sound: { id: 's1', title: 'One' } },
  { id: 'i2', position: 1, sound: { id: 's2', title: 'Two' } },
];

describe('saveCollectionSoundOrder', () => {
  afterEach(() => vi.restoreAllMocks());

  it('saves the order and keeps the mode when it is unchanged', async () => {
    const reorder = vi
      .spyOn(studio, 'reorderStudioCollectionItems')
      .mockResolvedValue({ ok: true });
    const patch = vi.spyOn(studio, 'patchStudioCollection');
    const result = await saveCollectionSoundOrder({
      slug: 'mix',
      items,
      ids: ['i2', 'i1'],
      mode: 'NEWEST',
      currentMode: 'MANUAL',
    });
    expect(reorder).toHaveBeenCalledWith('mix', ['i2', 'i1']);
    expect(patch).not.toHaveBeenCalled();
    expect(result.ok && result.items.map((item) => item.id)).toEqual([
      'i2',
      'i1',
    ]);
  });

  it('stores the public sort mode for oldest first', async () => {
    vi.spyOn(studio, 'reorderStudioCollectionItems').mockResolvedValue({
      ok: true,
    });
    const patch = vi
      .spyOn(studio, 'patchStudioCollection')
      .mockResolvedValue({ ok: true, data: { slug: 'mix', name: 'Mix' } });
    const result = await saveCollectionSoundOrder({
      slug: 'mix',
      items,
      ids: ['i1', 'i2'],
      mode: 'OLDEST',
      currentMode: 'MANUAL',
    });
    expect(patch).toHaveBeenCalledWith('mix', { trackSortMode: 'TIME' });
    expect(result.ok && result.trackSortMode).toBe('TIME');
  });

  it('stops at a failed reorder', async () => {
    vi.spyOn(studio, 'reorderStudioCollectionItems').mockResolvedValue({
      ok: false,
      error: 'HTTP 500',
    });
    const patch = vi.spyOn(studio, 'patchStudioCollection');
    const result = await saveCollectionSoundOrder({
      slug: 'mix',
      items,
      ids: ['i1', 'i2'],
      mode: 'OLDEST',
      currentMode: 'MANUAL',
    });
    expect(result).toEqual({ ok: false, error: 'HTTP 500' });
    expect(patch).not.toHaveBeenCalled();
  });
});
