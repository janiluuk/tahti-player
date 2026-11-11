import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patchStudioSound } from '../api/studio';
import type { AuthUser } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { persistSoftCover, resetPersistedSoftCovers } from './persistSoftCover';

vi.mock('../api/studio', () => ({
  patchStudioSound: vi.fn(),
}));

function signIn(user: Partial<AuthUser> | null, profileLoaded = true) {
  useAuthStore.setState({ user: user as AuthUser | null, profileLoaded });
}

const artist = {
  id: 'u1',
  username: 'artist',
  channel: { slug: 'artist', state: 'OFFLINE' },
} as unknown as AuthUser;

describe('persistSoftCover', () => {
  beforeEach(() => {
    resetPersistedSoftCovers();
    signIn(artist);
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

  it('never writes for a listener without a channel', async () => {
    signIn({ ...artist, channel: null } as unknown as AuthUser);
    await expect(
      persistSoftCover('s3', 'https://img.example/a.jpg'),
    ).resolves.toBe(false);
    expect(patchStudioSound).not.toHaveBeenCalled();
  });

  it('never writes signed out', async () => {
    signIn(null);
    await persistSoftCover('s4', 'https://img.example/a.jpg');
    expect(patchStudioSound).not.toHaveBeenCalled();
  });

  it('waits for the profile, then writes on a later fill', async () => {
    signIn(artist, false);
    await expect(
      persistSoftCover('s5', 'https://img.example/a.jpg'),
    ).resolves.toBe(false);
    signIn(artist, true);
    await expect(
      persistSoftCover('s5', 'https://img.example/a.jpg'),
    ).resolves.toBe(true);
    expect(patchStudioSound).toHaveBeenCalledTimes(1);
  });
});
