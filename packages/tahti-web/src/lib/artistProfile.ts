import { apiBase } from '../api/client';
import type { PublicProfile, TahtiPlayable } from '../api/types';
import { playableFromStudioHearthis } from './embedPlayback';

export const publicPressKitUrl = (username: string): string => {
  return `${apiBase()}/api/v1/u/${encodeURIComponent(username)}/press-kit.zip`;
};

export function releaseToPlayable(
  release: PublicProfile['releases'][number],
  artist: string,
  channelSlug?: string,
): TahtiPlayable | null {
  const track = release.tracks?.find((t) => t.playUrl);
  if (!track?.playUrl) {
    return null;
  }
  const isHls = track.playUrl.includes('.m3u8');
  return {
    id: `sound:${track.soundId ?? release.id}`,
    kind: 'sound',
    title: track.title,
    artist,
    coverUrl: release.artworkUrl ?? undefined,
    streamUrl: track.playUrl,
    protocol: isHls ? 'hls' : 'https',
    channelSlug,
    durationSec: track.durationSec ?? undefined,
    releaseDate: release.releaseDate ?? null,
  };
}

export type ArtistProfileEmbed = {
  label: string;
  url: string;
  height: number;
};

export function artistProfileEmbed(url: string): ArtistProfileEmbed | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
  const path = parsed.pathname.replace(/\/$/, '');
  const encodedUrl = encodeURIComponent(url);

  if (
    host === 'soundcloud.com' &&
    path.split('/').filter(Boolean).length === 1
  ) {
    const params = new URLSearchParams({
      url,
      color: '%23ff5500',
      auto_play: 'false',
      show_user: 'true',
      show_reposts: 'false',
      visual: 'false',
    });
    return {
      label: 'SoundCloud',
      url: `https://w.soundcloud.com/player/?${params.toString()}`,
      height: 166,
    };
  }

  if (host === 'mixcloud.com' && path.split('/').filter(Boolean).length >= 1) {
    return {
      label: 'Mixcloud',
      url: `https://player-widget.mixcloud.com/widget/iframe/?feed=${encodedUrl}&hide_cover=0&light=0`,
      height: 180,
    };
  }

  if (host === 'open.spotify.com') {
    const [kind, id] = path.split('/').filter(Boolean);
    if (kind && id && ['artist', 'show', 'playlist'].includes(kind)) {
      return {
        label: 'Spotify',
        url: `https://open.spotify.com/embed/${kind}/${encodeURIComponent(id)}`,
        height: kind === 'artist' ? 352 : 152,
      };
    }
  }

  if (host === 'twitch.tv' && path.split('/').filter(Boolean).length === 1) {
    const channelName = path.slice(1);
    const parent = encodeURIComponent(window.location.hostname);
    return {
      label: 'Twitch',
      url: `https://player.twitch.tv/?channel=${encodeURIComponent(channelName)}&parent=${parent}&autoplay=false`,
      height: 360,
    };
  }

  if (host === 'kick.com' && path.split('/').filter(Boolean).length === 1) {
    return {
      label: 'Kick',
      url: `https://player.kick.com/${encodeURIComponent(path.slice(1))}`,
      height: 360,
    };
  }

  if (
    (host === 'youtube.com' || host === 'youtu.be') &&
    (/^\/channel\/[\w-]+$/i.test(path) || /^\/@[\w-]+$/i.test(path))
  ) {
    const channelId = path.split('/').filter(Boolean).at(-1);
    return channelId
      ? {
          label: 'YouTube',
          url: `https://www.youtube-nocookie.com/embed?listType=user_uploads&list=${encodeURIComponent(channelId)}`,
          height: 220,
        }
      : null;
  }

  return null;
}

export function profileTrackToPlayable(
  track: PublicProfile['tracks'][number],
  artist: string,
  channelSlug?: string,
): TahtiPlayable | null {
  if (!track.playUrl) {
    const embed = playableFromStudioHearthis({
      ...track,
      artistName: track.artistName ?? artist,
    });
    return embed
      ? { ...embed, channelSlug, releaseDate: track.createdAt ?? null }
      : null;
  }
  const isHls = track.playUrl.includes('.m3u8');
  return {
    id: `sound:${track.id}`,
    kind: 'sound',
    title: track.title,
    artist: track.artistName ?? artist,
    coverUrl: track.bannerUrl ?? undefined,
    streamUrl: track.playUrl,
    protocol: isHls ? 'hls' : 'https',
    channelSlug,
    durationSec: track.durationSec ?? undefined,
    releaseDate: track.createdAt ?? null,
  };
}
