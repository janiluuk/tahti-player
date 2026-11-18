import type { FetchMeta } from '../client';
import { getJson } from '../http';
import { failMeta, isForceMock } from '../mode';

// ── Top lists ───────────────────────────────────────────────────────────────

export type AdminTopListPeriod = 'month' | 'half_year' | 'all_time';
export type AdminTopListDimension = 'type' | 'genre';
export type AdminTopListSort = 'desc' | 'asc';

export type AdminTopListEntry = {
  soundId: string;
  listens: number;
  title: string;
  artistName: string;
  channelSlug: string;
  audioUrl?: string | null;
};

export type AdminTopListBucket = {
  bucket: string;
  entries: AdminTopListEntry[];
};

function mockTopLists(dimension: AdminTopListDimension): AdminTopListBucket[] {
  const tracks = [
    {
      title: 'Moonlight Drive',
      artistName: 'DJ Moonlight',
      channelSlug: 'dj-moonlight',
      listens: 842,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    {
      title: 'Route 550',
      artistName: 'Midnight Cartography',
      channelSlug: 'midnight-cartography',
      listens: 611,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    },
    {
      title: 'Aurora Drift',
      artistName: 'Northern Lights',
      channelSlug: 'northern-lights',
      listens: 590,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    },
    {
      title: 'Echo Chamber Cypher',
      artistName: 'Kaiku Collective',
      channelSlug: 'kaiku-collective',
      listens: 401,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
  ];
  const bucketed =
    dimension === 'type'
      ? [
          { bucket: 'Live sets', entries: tracks.slice(0, 2) },
          { bucket: 'Archive tracks', entries: tracks.slice(2) },
        ]
      : [
          { bucket: 'Electronic', entries: tracks.slice(0, 2) },
          { bucket: 'Downtempo', entries: [tracks[1]!] },
          { bucket: 'Hip-hop', entries: [tracks[3]!] },
        ];
  return bucketed.map((b) => ({
    bucket: b.bucket,
    entries: b.entries.map((t, i) => ({
      soundId: `${b.bucket}-${i}`,
      listens: t.listens,
      title: t.title,
      artistName: t.artistName,
      channelSlug: t.channelSlug,
      audioUrl: t.audioUrl,
    })),
  }));
}

export async function fetchAdminTopLists(
  period: AdminTopListPeriod,
  dimension: AdminTopListDimension,
  sort: AdminTopListSort,
): Promise<{ data: AdminTopListBucket[]; meta: FetchMeta }> {
  if (isForceMock()) {
    const buckets = mockTopLists(dimension).map((b) => ({
      bucket: b.bucket,
      entries: [...b.entries].sort((a, c) =>
        sort === 'desc' ? c.listens - a.listens : a.listens - c.listens,
      ),
    }));
    return {
      data: buckets,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ buckets: AdminTopListBucket[] }>(
      `/api/admin/top-lists?period=${period}&dimension=${dimension}&sort=${sort}`,
    );
    return { data: data.buckets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}
