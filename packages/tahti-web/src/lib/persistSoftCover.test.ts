import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patchStudioSound } from '../api/studio';
import { persistSoftCover, resetPersistedSoftCovers } from './persistSoftCover';

vi.mock('../api/studio', () => ({
  patchStudioSound: vi.fn(),
}));

describe('persistSoftCover', () => {
  beforeEach(() => {
    resetPersistedSoftCovers();
    vi.mocked(patchStudioSound).mockReset();
    vi.mocked(patchStudioSound).mockResolvedValue({
      ok: true,
      data: { id: 's1', title: 'Mix', status: 'READY' },
    });
  });

  it('patches the banner once per sound', async () => {
    await expect(
      persistSoftCover('s1', 'https://img.example/a.jpg'),
    ).resolves.toBe(true);
    await expect(
      persistSoftCover('s1', 'https://img.example/b.jpg'),
    ).resolves.toBe(false);
    expect(patchStudioSound).toHaveBeenCalledTimes(1);
    expect(patchStudioSound).toHaveBeenCalledWith('s1', {
      bannerUrl: 'https://img.example/a.jpg',
    });
  });

  it('reports a failed patch without retrying it', async () => {
    vi.mocked(patchStudioSound).mockResolvedValue({
      ok: false,
      error: 'nope',
    });
    await expect(
      persistSoftCover('s2', 'https://img.example/a.jpg'),
    ).resolves.toBe(false);
    await persistSoftCover('s2', 'https://img.example/a.jpg');
    expect(patchStudioSound).toHaveBeenCalledTimes(1);
  });
});
