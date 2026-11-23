import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { patchChannelVisual } from '../api/channel-design/patch';
import {
  loadArtistLookVisibility,
  saveArtistLookVisibility,
} from './channelLookElements';

vi.mock('../api/channel-design/patch', () => ({
  patchChannelVisual: vi.fn(),
}));

const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (msg: string) => toastError(msg) },
}));

async function freshModule() {
  vi.resetModules();
  return import('./persistArtistLookVisibility');
}

const hidden = () => ({
  ...loadArtistLookVisibility('aino'),
  bio: false,
  gallery: false,
});

describe('persistArtistLookVisibility', () => {
  beforeEach(() => {
    vi.mocked(patchChannelVisual).mockResolvedValue({
      ok: true,
      data: {} as never,
    });
  });

  afterEach(() => {
    vi.mocked(patchChannelVisual).mockReset();
    toastError.mockReset();
    localStorage.clear();
  });

  it('saves locally and on the channel', async () => {
    const { persistArtistLookVisibility } = await freshModule();
    await expect(persistArtistLookVisibility('aino', hidden())).resolves.toBe(
      true,
    );
    expect(patchChannelVisual).toHaveBeenCalledWith({
      artistBlockVisibility: expect.objectContaining({
        bio: false,
        gallery: false,
        tracks: true,
      }),
    });
    expect(loadArtistLookVisibility('aino').bio).toBe(false);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('keeps the local copy and says so when the server save fails', async () => {
    vi.mocked(patchChannelVisual).mockResolvedValue({
      ok: false,
      error: 'nope',
    });
    const { persistArtistLookVisibility } = await freshModule();
    await expect(persistArtistLookVisibility('aino', hidden())).resolves.toBe(
      false,
    );
    expect(loadArtistLookVisibility('aino').gallery).toBe(false);
    expect(toastError).toHaveBeenCalledOnce();
  });

  it('uploads an old local-only choice once when the channel has none', async () => {
    saveArtistLookVisibility('aino', hidden());
    const { uploadLocalArtistLookVisibilityOnce } = await freshModule();
    uploadLocalArtistLookVisibilityOnce('aino', null);
    uploadLocalArtistLookVisibilityOnce('aino', null);
    expect(patchChannelVisual).toHaveBeenCalledOnce();
    expect(
      vi.mocked(patchChannelVisual).mock.calls[0]?.[0].artistBlockVisibility
        ?.bio,
    ).toBe(false);
  });

  it('does not upload when the channel already has a value or nothing is stored', async () => {
    const { uploadLocalArtistLookVisibilityOnce } = await freshModule();
    uploadLocalArtistLookVisibilityOnce('aino', null);
    saveArtistLookVisibility('aino', hidden());
    uploadLocalArtistLookVisibilityOnce('aino', '{"bio":true}');
    expect(patchChannelVisual).not.toHaveBeenCalled();
  });

  it('seeds this browser from the channel value on the designer load', async () => {
    saveArtistLookVisibility('aino', hidden());
    const { syncArtistLookVisibilityFromChannel } = await freshModule();
    syncArtistLookVisibilityFromChannel('aino', '{"news":false}');
    const local = loadArtistLookVisibility('aino');
    expect(local.news).toBe(false);
    expect(local.bio).toBe(true);
    expect(patchChannelVisual).not.toHaveBeenCalled();
  });

  it('uploads the local copy on the designer load when the channel has none', async () => {
    saveArtistLookVisibility('aino', hidden());
    const { syncArtistLookVisibilityFromChannel } = await freshModule();
    syncArtistLookVisibilityFromChannel('aino', null);
    expect(patchChannelVisual).toHaveBeenCalledOnce();
  });
});
