import type { ArtistCredit, Track } from '@tahti-player/model';

import type { TahtiPlayable } from '../api/types';
import { placeholderArtworkUrl } from './placeholderArt';

/** Provider of the artist credit that carries the owner's channel slug, so
 * the queue keeps it: a sound's queue id holds the sound id, not the slug. */
export const CHANNEL_CREDIT_PROVIDER = 'tahti-channel';

export function playableToTrack(item: TahtiPlayable): Track {
  const provider = item.sourceProvider?.trim() || 'tahti';
  const artists: ArtistCredit[] = [
    {
      name: item.artist,
      roles: ['performer'],
      ...(item.channelSlug
        ? {
            source: { provider: CHANNEL_CREDIT_PROVIDER, id: item.channelSlug },
          }
        : {}),
    },
  ];
  const tags = provider === 'tahti' ? undefined : [provider];
  return {
    title: item.title,
    artists,
    tags,
    durationMs:
      item.durationSec != null
        ? Math.round(item.durationSec * 1000)
        : undefined,
    releaseDate: item.releaseDate ?? undefined,
    album:
      provider !== 'tahti'
        ? {
            title: provider,
            source: { provider, id: item.id },
          }
        : undefined,
    artwork: {
      items: [
        {
          url: item.coverUrl ?? placeholderArtworkUrl(item.id),
          purpose: 'cover',
        },
      ],
    },
    source: {
      provider,
      id: item.embed?.embedUri ?? item.id,
      ...(item.embed ? {} : { url: item.streamUrl }),
    },
    ...(item.embed
      ? {}
      : {
          streamCandidates: [
            {
              id: `${item.id}:stream`,
              title: item.title,
              thumbnail: item.coverUrl,
              failed: false,
              source: { provider, id: item.id },
              stream: {
                url: item.streamUrl,
                protocol: item.protocol === 'hls' ? 'hls' : 'https',
                source: { provider, id: item.id },
              },
              lastResolvedAtIso: new Date().toISOString(),
            },
          ],
        }),
  };
}

/** The track's album title, unless it is only the provider label `playableToTrack` puts there. */
export function albumTitle(track: Track): string | null {
  const title = track.album?.title;
  if (!title || track.tags?.includes(title)) {
    return null;
  }
  return title;
}

export function formatDuration(sec?: number | null): string {
  if (sec == null || !Number.isFinite(sec)) {
    return '';
  }
  const total = Math.max(0, Math.floor(sec));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function providerLabel(provider?: string | null): string | null {
  if (!provider || provider === 'tahti') {
    return null;
  }
  return provider;
}
