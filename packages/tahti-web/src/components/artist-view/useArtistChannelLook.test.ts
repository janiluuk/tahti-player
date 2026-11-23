import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchChannel } from '../../api/client';
import type { PublicChannel } from '../../api/types';
import {
  loadArtistLookVisibility,
  saveArtistLookVisibility,
} from '../../lib/channelLookElements';
import { uploadLocalArtistLookVisibilityOnce } from '../../lib/persistArtistLookVisibility';
import { useArtistChannelLook } from './useArtistChannelLook';

vi.mock('../../api/client', () => ({ fetchChannel: vi.fn() }));
vi.mock('../../api/announcements', () => ({
  fetchPinnedAnnouncements: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../api/disco-widgets', () => ({
  fetchChannelDiscoWidgets: vi.fn().mockResolvedValue({ data: [] }),
}));
vi.mock('../../api/studio-extras', () => ({
  fetchChannelPosts: vi.fn().mockResolvedValue({ data: [] }),
}));
vi.mock('../../api/shows', () => ({
  fetchPublicRadioShow: vi.fn().mockResolvedValue({ data: null }),
}));
vi.mock('../../lib/persistArtistLookVisibility', () => ({
  uploadLocalArtistLookVisibilityOnce: vi.fn(),
}));

function channelWith(json: string | null) {
  vi.mocked(fetchChannel).mockResolvedValue({
    data: {
      slug: 'nova',
      artistBlockVisibilityJson: json,
    } as unknown as PublicChannel,
  } as Awaited<ReturnType<typeof fetchChannel>>);
}

describe('useArtistChannelLook block visibility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.mocked(fetchChannel).mockReset();
    vi.mocked(uploadLocalArtistLookVisibilityOnce).mockReset();
  });

  it("shows a visitor the artist's saved choice", async () => {
    channelWith(JSON.stringify({ bio: false, gallery: false }));
    const { result } = renderHook(() => useArtistChannelLook('nova', 'nova'));
    await waitFor(() => expect(result.current.lookVisibility.bio).toBe(false));
    expect(result.current.lookVisibility.gallery).toBe(false);
    expect(result.current.lookVisibility.tracks).toBe(true);
    expect(uploadLocalArtistLookVisibilityOnce).not.toHaveBeenCalled();
  });

  it("uses the owner's local copy while the channel has none and uploads it", async () => {
    saveArtistLookVisibility('nova', {
      ...loadArtistLookVisibility('nova'),
      news: false,
    });
    channelWith(null);
    const { result } = renderHook(() =>
      useArtistChannelLook('nova', 'nova', true),
    );
    await waitFor(() =>
      expect(uploadLocalArtistLookVisibilityOnce).toHaveBeenCalledWith(
        'nova',
        null,
      ),
    );
    expect(result.current.lookVisibility.news).toBe(false);
  });
});
