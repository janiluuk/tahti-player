import type { ArtistSettingsSection } from '../stores/settingsModalStore';

/** Artist profile forms, each on its own Studio → Profile page. */
export const STUDIO_PROFILE_ARTIST_SECTIONS = [
  'identity',
  'story',
  'people',
  'connections',
  'link-page',
  'branding',
  'gallery',
  'press-kit',
  'release-visuals',
] as const satisfies readonly ArtistSettingsSection[];

/** Channel page forms, each on its own Studio → Profile page. */
export const STUDIO_PROFILE_CHANNEL_SECTIONS = [
  'appearance',
  'discovery',
  'domain',
] as const;

export type StudioProfileArtistSection =
  (typeof STUDIO_PROFILE_ARTIST_SECTIONS)[number];
export type StudioProfileChannelSection =
  (typeof STUDIO_PROFILE_CHANNEL_SECTIONS)[number];
export type StudioProfileSection =
  StudioProfileArtistSection | StudioProfileChannelSection;

export function isStudioProfileArtistSection(
  value: unknown,
): value is StudioProfileArtistSection {
  return (STUDIO_PROFILE_ARTIST_SECTIONS as readonly unknown[]).includes(value);
}

export function isStudioProfileChannelSection(
  value: unknown,
): value is StudioProfileChannelSection {
  return (STUDIO_PROFILE_CHANNEL_SECTIONS as readonly unknown[]).includes(
    value,
  );
}

export function isStudioProfileSection(
  value: unknown,
): value is StudioProfileSection {
  return (
    isStudioProfileArtistSection(value) || isStudioProfileChannelSection(value)
  );
}

export function studioProfilePath(section: StudioProfileSection): string {
  return `/studio/profile/${section}`;
}

/** Where a former Settings → Artist or Channel & chat link lands now. */
export function movedProfileSettingsPath(
  section: 'artist' | 'channel',
  tab: string | null | undefined,
): string {
  if (tab === 'following') {
    return '/library/following';
  }
  if (tab === 'chat') {
    return '/studio/fans?tab=chat';
  }
  if (tab === 'moderators') {
    return '/studio/fans?tab=chat&section=moderators';
  }
  if (isStudioProfileSection(tab)) {
    return studioProfilePath(tab);
  }
  return section === 'channel'
    ? studioProfilePath('appearance')
    : '/studio/profile';
}
