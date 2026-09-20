import { requestJson } from './client-request';
import {
  channelToPlayable,
  DEMO_MP3,
  mockChannel,
  mockCollection,
} from './mock';
import {
  allowMockFallback,
  failMeta,
  isForceMock,
  type FetchMeta,
} from './mode';
import type {
  ChannelEmbedView,
  CollectionEmbedView,
  ReleaseEmbedView,
  TahtiPlayable,
} from './types';

async function getJson<T>(path: string): Promise<T> {
  const { data } = await requestJson<T>(path);
  return data;
}

export async function fetchEmbedChannel(slug: string): Promise<{
  data: ChannelEmbedView;
  meta: FetchMeta;
  playable: TahtiPlayable | null;
}> {
  if (isForceMock()) {
    const ch = mockChannel(slug);
    const data: ChannelEmbedView = {
      slug: ch.slug,
      state: ch.state,
      artist: {
        username: ch.user.username,
        displayName: ch.user.displayName,
        avatarUrl: ch.user.avatarUrl,
      },
      hlsUrl: ch.hlsUrl,
    };
    return {
      data,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      playable: channelToPlayable(ch),
    };
  }
  try {
    const data = await getJson<ChannelEmbedView>(
      `/api/v1/embed/c/${encodeURIComponent(slug)}`,
    );
    const playable: TahtiPlayable | null = data.hlsUrl
      ? {
          id: `live:${data.slug}`,
          kind: 'live',
          title: data.artist.displayName,
          artist: data.artist.displayName,
          coverUrl: data.artist.avatarUrl ?? undefined,
          streamUrl: data.hlsUrl,
          protocol: 'hls',
          channelSlug: data.slug,
        }
      : null;
    return { data, meta: { source: 'api' }, playable };
  } catch (err) {
    if (!allowMockFallback()) {
      throw err instanceof Error ? err : new Error('Embed channel failed');
    }
    const ch = mockChannel(slug);
    return {
      data: {
        slug: ch.slug,
        state: ch.state,
        artist: {
          username: ch.user.username,
          displayName: ch.user.displayName,
          avatarUrl: ch.user.avatarUrl,
        },
        hlsUrl: ch.hlsUrl,
      },
      meta: failMeta(err),
      playable: channelToPlayable(ch),
    };
  }
}

export async function fetchEmbedRelease(id: string): Promise<{
  data: ReleaseEmbedView;
  meta: FetchMeta;
  playables: TahtiPlayable[];
}> {
  if (isForceMock()) {
    const data: ReleaseEmbedView = {
      id,
      title: 'Mock release',
      artworkUrl: null,
      smartLinkSlug: id,
      artist: { username: 'northern-lights', displayName: 'Northern Lights' },
      tracks: [
        {
          id: `${id}-t1`,
          position: 1,
          title: 'Track one',
          hasStream: true,
        },
        {
          id: `${id}-t2`,
          position: 2,
          title: 'Track two',
          hasStream: true,
        },
      ],
    };
    const playables = data.tracks.map(
      (t): TahtiPlayable => ({
        id: `sound:${t.id}`,
        kind: 'sound',
        title: t.title,
        artist: data.artist.displayName,
        streamUrl: DEMO_MP3,
        protocol: 'https',
      }),
    );
    return {
      data,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      playables,
    };
  }
  try {
    const data = await getJson<ReleaseEmbedView>(
      `/api/v1/embed/r/${encodeURIComponent(id)}`,
    );
    const playables: TahtiPlayable[] = [];
    for (const t of data.tracks) {
      if (!t.hasStream) {
        continue;
      }
      try {
        const play = await getJson<{ url: string }>(
          `/api/v1/embed/r/${encodeURIComponent(id)}/tracks/${encodeURIComponent(t.id)}/play`,
        );
        if (play.url) {
          playables.push({
            id: `sound:${t.id}`,
            kind: 'sound',
            title: t.title,
            artist: data.artist.displayName,
            coverUrl: data.artworkUrl ?? undefined,
            streamUrl: play.url,
            protocol: play.url.includes('.m3u8') ? 'hls' : 'https',
          });
        }
      } catch {
        // skip unplayable track
      }
    }
    return { data, meta: { source: 'api' }, playables };
  } catch (err) {
    if (!allowMockFallback()) {
      throw err instanceof Error ? err : new Error('Embed release failed');
    }
    const data: ReleaseEmbedView = {
      id,
      title: 'Mock release',
      artworkUrl: null,
      artist: { username: 'northern-lights', displayName: 'Northern Lights' },
      tracks: [
        {
          id: `${id}-t1`,
          position: 1,
          title: 'Track one',
          hasStream: true,
        },
      ],
    };
    return {
      data,
      meta: failMeta(err),
      playables: [
        {
          id: `sound:${id}-t1`,
          kind: 'sound',
          title: 'Track one',
          artist: data.artist.displayName,
          streamUrl: DEMO_MP3,
          protocol: 'https',
        },
      ],
    };
  }
}

export async function fetchEmbedCollection(slug: string): Promise<{
  data: CollectionEmbedView;
  meta: FetchMeta;
  playables: TahtiPlayable[];
}> {
  if (isForceMock()) {
    const col = mockCollection(slug);
    const data: CollectionEmbedView = {
      slug: col.slug,
      name: col.name,
      coverUrl: col.coverUrl,
      artist: col.user,
      tracks: col.items
        .filter((i) => i.sound)
        .map((i) => ({
          id: i.sound!.id,
          title: i.sound!.title,
          durationSec: i.sound!.durationSec,
          hasStream: Boolean(i.sound!.audioUrl),
        })),
    };
    const playables = col.items
      .filter((i) => i.sound?.audioUrl)
      .map(
        (i): TahtiPlayable => ({
          id: `sound:${i.sound!.id}`,
          kind: 'sound',
          title: i.sound!.title,
          artist: col.user.displayName,
          coverUrl: col.coverUrl ?? undefined,
          streamUrl: i.sound!.audioUrl!,
          protocol: i.sound!.audioUrl!.includes('.m3u8') ? 'hls' : 'https',
        }),
      );
    return {
      data,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      playables,
    };
  }
  try {
    const data = await getJson<CollectionEmbedView>(
      `/api/v1/embed/col/${encodeURIComponent(slug)}`,
    );
    const playables: TahtiPlayable[] = [];
    for (const t of data.tracks) {
      if (!t.hasStream) {
        continue;
      }
      try {
        const play = await getJson<{ url: string }>(
          `/api/v1/embed/col/${encodeURIComponent(slug)}/tracks/${encodeURIComponent(t.id)}/play`,
        );
        if (play.url) {
          playables.push({
            id: `sound:${t.id}`,
            kind: 'sound',
            title: t.title,
            artist: data.artist.displayName,
            coverUrl: data.coverUrl ?? undefined,
            streamUrl: play.url,
            protocol: play.url.includes('.m3u8') ? 'hls' : 'https',
          });
        }
      } catch {
        // skip
      }
    }
    return { data, meta: { source: 'api' }, playables };
  } catch (err) {
    if (!allowMockFallback()) {
      throw err instanceof Error ? err : new Error('Embed collection failed');
    }
    const col = mockCollection(slug);
    return {
      data: {
        slug: col.slug,
        name: col.name,
        coverUrl: col.coverUrl,
        artist: col.user,
        tracks: col.items
          .filter((i) => i.sound)
          .map((i) => ({
            id: i.sound!.id,
            title: i.sound!.title,
            hasStream: true,
          })),
      },
      meta: failMeta(err),
      playables: col.items
        .filter((i) => i.sound?.audioUrl)
        .map(
          (i): TahtiPlayable => ({
            id: `sound:${i.sound!.id}`,
            kind: 'sound',
            title: i.sound!.title,
            artist: col.user.displayName,
            streamUrl: i.sound!.audioUrl!,
            protocol: 'https',
          }),
        ),
    };
  }
}
