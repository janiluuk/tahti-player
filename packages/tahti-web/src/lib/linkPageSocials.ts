import type { PublicLinkPageLink } from '../api/link-page';

const SOCIAL_KEYS = [
  'website',
  'instagram',
  'facebook',
  'x',
  'tiktok',
  'youtube',
  'soundcloud',
  'bandcamp',
  'mixcloud',
  'spotify',
  'hearthisAt',
  'twitch',
  'kick',
  'discord',
] as const;

const LABELS: Record<(typeof SOCIAL_KEYS)[number], string> = {
  website: 'Website',
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
  bandcamp: 'Bandcamp',
  mixcloud: 'Mixcloud',
  spotify: 'Spotify',
  hearthisAt: 'hearthis.at',
  twitch: 'Twitch',
  kick: 'Kick',
  discord: 'Discord',
};

export function socialLinksForPreview(
  socialLinks: Record<string, string> | null | undefined,
): PublicLinkPageLink[] {
  if (!socialLinks) {
    return [];
  }
  const out: PublicLinkPageLink[] = [];
  for (const key of SOCIAL_KEYS) {
    const url = socialLinks[key]?.trim();
    if (!url) {
      continue;
    }
    out.push({
      key,
      label: LABELS[key],
      url,
      source: 'profile',
    });
  }
  return out;
}
