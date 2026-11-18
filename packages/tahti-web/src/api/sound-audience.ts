import type { FetchMeta } from './client';
import { getJson } from './http';
import { failMeta, isForceMock } from './mode';

export type SoundAudiencePersonWire = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  at: string;
};

export type SoundAudience = {
  collections: {
    total: number;
    items: {
      slug: string;
      name: string;
      coverUrl: string | null;
      ownerUsername: string;
      ownerName: string;
      itemCount: number;
    }[];
  };
  likes: { total: number; items: SoundAudiencePersonWire[] };
  reposts: { total: number; items: SoundAudiencePersonWire[] };
  plays: {
    total: number;
    items: (SoundAudiencePersonWire & { plays: number })[];
  };
};

const EMPTY: SoundAudience = {
  collections: { total: 0, items: [] },
  likes: { total: 0, items: [] },
  reposts: { total: 0, items: [] },
  plays: { total: 0, items: [] },
};

function mockAudience(): SoundAudience {
  const at = (days: number) =>
    new Date(Date.now() - days * 86_400_000).toISOString();
  const liina = {
    username: 'liina',
    displayName: 'Liina',
    avatarUrl: null,
  };
  const moonlight = {
    username: 'dj-moonlight',
    displayName: 'DJ Moonlight',
    avatarUrl: '/mock/dj-moonlight/avatar.svg',
  };
  const northern = {
    username: 'northern-lights',
    displayName: 'Northern Lights',
    avatarUrl: '/mock/northern-lights/cover-first-light.svg',
  };
  return {
    collections: {
      total: 2,
      items: [
        {
          slug: 'night-drives',
          name: 'Night drives',
          coverUrl: '/artwork-presets/artwork-05.webp',
          ownerUsername: 'liina',
          ownerName: 'Liina',
          itemCount: 24,
        },
        {
          slug: 'moonlight-picks',
          name: 'Moonlight picks',
          coverUrl: null,
          ownerUsername: 'dj-moonlight',
          ownerName: 'DJ Moonlight',
          itemCount: 9,
        },
      ],
    },
    likes: {
      total: 3,
      items: [
        { ...moonlight, at: at(1) },
        { ...liina, at: at(3) },
        { ...northern, at: at(9) },
      ],
    },
    reposts: { total: 1, items: [{ ...moonlight, at: at(2) }] },
    plays: {
      total: 3,
      items: [
        { ...liina, at: at(0), plays: 12 },
        { ...moonlight, at: at(1), plays: 4 },
        { ...northern, at: at(5), plays: 1 },
      ],
    },
  };
}

/** Public collections a sound is in, and who liked, reposted and (signed
 * in) played it (`GET /api/v1/c/:slug/sounds/:id/audience`). */
export type SoundAudienceTab = 'collections' | 'likes' | 'reposts' | 'plays';

export async function fetchSoundAudience(
  channelSlug: string,
  soundId: string,
  page?: { tab: SoundAudienceTab; offset: number; limit?: number },
): Promise<{ data: SoundAudience; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: page ? EMPTY : mockAudience(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const query = page
      ? `limit=${page.limit ?? 30}&tab=${page.tab}&offset=${page.offset}`
      : 'limit=12';
    const data = await getJson<SoundAudience>(
      `/api/v1/c/${encodeURIComponent(channelSlug)}/sounds/${encodeURIComponent(soundId)}/audience?${query}`,
    );
    return { data: { ...EMPTY, ...data }, meta: { source: 'api' } };
  } catch (err) {
    return { data: EMPTY, meta: failMeta(err) };
  }
}
