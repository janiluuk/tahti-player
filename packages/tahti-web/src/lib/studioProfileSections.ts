import type { ArtistSettingsSection } from '../stores/settingsModalStore';
import type { ChannelRadioTab } from './channelSections';

/** Studio → Profile tabs: how the artist looks to listeners. */
export const STUDIO_PROFILE_SECTIONS = [
  'identity',
  'connections',
  'link-page',
  'branding',
  'gallery',
] as const satisfies readonly ArtistSettingsSection[];

/** Studio → Channel tabs: the artist's channel page and 24/7 stream. */
export const STUDIO_CHANNEL_SECTIONS = [
  'design',
  'radio',
  'settings',
  'visibility',
  'address',
] as const;

export type StudioProfileSection = (typeof STUDIO_PROFILE_SECTIONS)[number];
export type StudioChannelSection = (typeof STUDIO_CHANNEL_SECTIONS)[number];

export function isStudioProfileSection(
  value: unknown,
): value is StudioProfileSection {
  return (STUDIO_PROFILE_SECTIONS as readonly unknown[]).includes(value);
}

export function isStudioChannelSection(
  value: unknown,
): value is StudioChannelSection {
  return (STUDIO_CHANNEL_SECTIONS as readonly unknown[]).includes(value);
}

export function studioProfilePath(section: StudioProfileSection): string {
  return `/studio/profile/${section}`;
}

export function studioChannelPath(section: StudioChannelSection): string {
  return `/studio/channel/${section}`;
}

export type StudioSectionRedirect =
  | {
      to: '/studio/profile/$section';
      params: { section: StudioProfileSection };
      hash?: string;
      replace: true;
    }
  | {
      to: '/studio/channel/$section';
      params: { section: StudioChannelSection };
      search?: { tab?: ChannelRadioTab };
      replace: true;
    };

const MERGED_PROFILE_SECTIONS: Record<
  string,
  { section: StudioProfileSection; hash: string }
> = {
  story: { section: 'identity', hash: 'story' },
  people: { section: 'identity', hash: 'people' },
  'release-visuals': { section: 'branding', hash: 'release-visuals' },
  'press-kit': { section: 'gallery', hash: 'press-kit' },
};

const MOVED_CHANNEL_SECTIONS: Record<string, StudioChannelSection> = {
  appearance: 'design',
  'channel-designer': 'design',
  discovery: 'visibility',
  visibility: 'visibility',
  domain: 'address',
};

/** Where an old `/studio/profile/<section>` address lands now, or null when
 * the section is current or unknown. */
export function legacyProfileSectionRedirect(
  section: string | null | undefined,
): StudioSectionRedirect | null {
  if (!section) {
    return null;
  }
  const merged = MERGED_PROFILE_SECTIONS[section];
  if (merged) {
    return {
      to: '/studio/profile/$section',
      params: { section: merged.section },
      hash: merged.hash,
      replace: true,
    };
  }
  const channel = MOVED_CHANNEL_SECTIONS[section];
  if (channel) {
    return {
      to: '/studio/channel/$section',
      params: { section: channel },
      replace: true,
    };
  }
  return null;
}

/** In-app path for any current or former Profile section name. */
export function profileSectionPath(section: string): string | null {
  if (isStudioProfileSection(section)) {
    return studioProfilePath(section);
  }
  const redirect = legacyProfileSectionRedirect(section);
  if (!redirect) {
    return null;
  }
  if (redirect.to === '/studio/channel/$section') {
    return studioChannelPath(redirect.params.section);
  }
  const path = studioProfilePath(redirect.params.section);
  return redirect.hash ? `${path}#${redirect.hash}` : path;
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
    return '/studio/chat';
  }
  if (tab === 'moderators') {
    return '/studio/chat?section=moderators';
  }
  const path = tab ? profileSectionPath(tab) : null;
  if (path) {
    return path;
  }
  return section === 'channel'
    ? studioChannelPath('design')
    : studioProfilePath('identity');
}
