import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import {
  resolveLocalPlayableForReplay,
  type TahtiNativeLibrary,
} from './nativeLibrary';

const CLOUD_PLAYABLE: TahtiPlayable = {
  id: 'sound:abc',
  kind: 'sound',
  title: 'Cloud Track',
  artist: 'Someone',
  streamUrl: 'https://cdn.tahti.live/sound/abc.mp3',
  protocol: 'https',
  sourceProvider: 'tahti',
};

const LIVE_LOCAL_PLAYABLE: TahtiPlayable = {
  id: 'local:xyz',
  kind: 'sound',
  title: 'Local Track',
  artist: 'Someone',
  streamUrl: 'asset://localhost/xyz',
  protocol: 'https',
  sourceProvider: 'local',
};

const STALE_LOCAL_PLAYABLE: TahtiPlayable = {
  ...LIVE_LOCAL_PLAYABLE,
  streamUrl: '',
};

describe('resolveLocalPlayableForReplay', () => {
  afterEach(() => {
    delete globalThis.__TAHTI_NATIVE_LIBRARY__;
  });

  it('returns non-local playables unchanged', async () => {
    await expect(
      resolveLocalPlayableForReplay(CLOUD_PLAYABLE),
    ).resolves.toEqual(CLOUD_PLAYABLE);
  });

  it('returns a local playable unchanged when its streamUrl is still live', async () => {
    await expect(
      resolveLocalPlayableForReplay(LIVE_LOCAL_PLAYABLE),
    ).resolves.toEqual(LIVE_LOCAL_PLAYABLE);
  });

  it('re-resolves a redacted local streamUrl through the native catalog', async () => {
    const resolve = vi.fn().mockResolvedValue('asset://localhost/xyz-fresh');
    globalThis.__TAHTI_NATIVE_LIBRARY__ = {
      resolve,
    } as unknown as TahtiNativeLibrary;

    const resolved = await resolveLocalPlayableForReplay(STALE_LOCAL_PLAYABLE);

    expect(resolve).toHaveBeenCalledWith('xyz');
    expect(resolved).toEqual({
      ...STALE_LOCAL_PLAYABLE,
      streamUrl: 'asset://localhost/xyz-fresh',
    });
  });

  it('returns null when there is no native catalog to re-resolve a stale local track from', async () => {
    await expect(
      resolveLocalPlayableForReplay(STALE_LOCAL_PLAYABLE),
    ).resolves.toBeNull();
  });
});
