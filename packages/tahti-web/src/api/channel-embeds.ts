import type { FetchMeta } from './client';
import { getJson } from './http';
import { failMeta, isForceMock } from './mode';

export type ChannelSoundCloudEmbed = {
  id: string;
  provider: 'soundcloud';
  url: string;
  title: string | null;
  authorName: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
};

/** Public SoundCloud tracks an artist added to their channel, newest first. */
export async function fetchChannelSoundCloudEmbeds(slug: string): Promise<{
  data: ChannelSoundCloudEmbed[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          id: 'mock-embed-1',
          provider: 'soundcloud',
          url: 'https://soundcloud.com/tahti/night-drive',
          title: 'Night Drive',
          authorName: 'Tahti',
          thumbnailUrl: null,
          createdAt: '2026-09-01T12:00:00.000Z',
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<ChannelSoundCloudEmbed[]>(
      `/api/channels/${encodeURIComponent(slug)}/embeds`,
    );
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function soundCloudWidgetSrc(trackUrl: string): string {
  const params = new URLSearchParams({
    url: trackUrl,
    auto_play: 'true',
    visual: 'false',
    show_comments: 'false',
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}
