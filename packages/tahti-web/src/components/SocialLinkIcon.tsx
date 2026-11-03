import type { ReactNode } from 'react';

type SocialPlatform =
  | 'bandcamp'
  | 'discord'
  | 'facebook'
  | 'hearthis'
  | 'instagram'
  | 'kick'
  | 'mixcloud'
  | 'soundcloud'
  | 'spotify'
  | 'tiktok'
  | 'twitch'
  | 'twitter'
  | 'website'
  | 'youtube';

const PLATFORM_DETAILS: Record<
  SocialPlatform,
  { label: string; background: string; mark: string }
> = {
  bandcamp: { label: 'Bandcamp', background: '#1da0c3', mark: 'bc' },
  discord: { label: 'Discord', background: '#5865f2', mark: 'dc' },
  facebook: { label: 'Facebook', background: '#1877f2', mark: 'f' },
  hearthis: { label: 'hearthis.at', background: '#55acee', mark: 'ht' },
  instagram: { label: 'Instagram', background: '#e1306c', mark: 'ig' },
  kick: { label: 'Kick', background: '#53fc18', mark: 'k' },
  mixcloud: { label: 'Mixcloud', background: '#5000ff', mark: 'mc' },
  soundcloud: { label: 'SoundCloud', background: '#ff5500', mark: 'sc' },
  spotify: { label: 'Spotify', background: '#1db954', mark: 'sp' },
  tiktok: { label: 'TikTok', background: '#111827', mark: 'tk' },
  twitch: { label: 'Twitch', background: '#9146ff', mark: 'tw' },
  twitter: { label: 'X / Twitter', background: '#111827', mark: 'X' },
  website: { label: 'Website', background: '#475569', mark: '↗' },
  youtube: { label: 'YouTube', background: '#ff0000', mark: 'yt' },
};

function platformFromLabel(label: string, url: string): SocialPlatform {
  const value = `${label} ${url}`.toLowerCase();
  if (value.includes('bandcamp')) {
    return 'bandcamp';
  }
  if (value.includes('discord')) {
    return 'discord';
  }
  if (value.includes('facebook')) {
    return 'facebook';
  }
  if (value.includes('hearthis')) {
    return 'hearthis';
  }
  if (value.includes('instagram')) {
    return 'instagram';
  }
  if (value.includes('kick.com')) {
    return 'kick';
  }
  if (value.includes('mixcloud')) {
    return 'mixcloud';
  }
  if (value.includes('soundcloud')) {
    return 'soundcloud';
  }
  if (value.includes('spotify')) {
    return 'spotify';
  }
  if (value.includes('tiktok')) {
    return 'tiktok';
  }
  if (value.includes('twitch')) {
    return 'twitch';
  }
  if (value.includes('twitter') || value.includes('x.com')) {
    return 'twitter';
  }
  if (value.includes('youtube') || value.includes('youtu.be')) {
    return 'youtube';
  }
  return 'website';
}

export function SocialLinkIcon({
  label,
  url,
}: {
  label: string;
  url: string;
}): ReactNode {
  const details = PLATFORM_DETAILS[platformFromLabel(label, url)];
  return (
    <span
      className="inline-flex size-8 items-center justify-center rounded-md text-[0.62rem] font-black tracking-tight text-white uppercase shadow-sm"
      style={{ backgroundColor: details.background }}
      aria-hidden="true"
    >
      {details.mark}
    </span>
  );
}
