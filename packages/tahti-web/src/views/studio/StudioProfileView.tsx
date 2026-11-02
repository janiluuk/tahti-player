import {
  BookOpenIcon,
  CompassIcon,
  FileTextIcon,
  GlobeIcon,
  ImageIcon,
  ImagesIcon,
  LinkIcon,
  MessageSquareIcon,
  PaletteIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';

import {
  HubCards,
  SectionTitle,
  ViewShell,
  type HubCardItem,
} from '@tahti-player/ui';

import { renderHubLink } from '../../components/HubLink';
import { StudioGate } from '../../components/StudioGate';

export const STUDIO_PROFILE_ARTIST_ITEMS: HubCardItem[] = [
  {
    id: 'identity',
    href: '/settings/artist?tab=identity',
    icon: UserIcon,
    title: 'Identity',
    description: 'Artist name, picture, genres and where you are based.',
  },
  {
    id: 'story',
    href: '/settings/artist?tab=story',
    icon: BookOpenIcon,
    title: 'Story',
    description: 'Your bio and the longer story on your profile.',
  },
  {
    id: 'people',
    href: '/settings/artist?tab=people',
    icon: UsersIcon,
    title: 'People',
    description: 'Band members and collaborators shown on your page.',
  },
  {
    id: 'connections',
    href: '/settings/artist?tab=connections',
    icon: LinkIcon,
    title: 'Links',
    description: 'Your website, socials and streaming profiles.',
  },
  {
    id: 'branding',
    href: '/settings/artist?tab=branding',
    icon: PaletteIcon,
    title: 'Branding',
    description: 'Logo, colours and header image.',
  },
  {
    id: 'gallery',
    href: '/settings/artist?tab=gallery',
    icon: ImagesIcon,
    title: 'Gallery',
    description: 'Photos fans see on your profile.',
  },
  {
    id: 'press-kit',
    href: '/settings/artist?tab=press-kit',
    icon: FileTextIcon,
    title: 'Press kit',
    description: 'Downloadable photos, bio and technical rider.',
  },
  {
    id: 'release-visuals',
    href: '/settings/artist?tab=release-visuals',
    icon: ImageIcon,
    title: 'Release visuals',
    description: 'Default artwork style for new releases.',
  },
];

export const STUDIO_PROFILE_CHANNEL_ITEMS: HubCardItem[] = [
  {
    id: 'appearance',
    href: '/settings/channel?tab=appearance',
    icon: PaletteIcon,
    title: 'Channel design',
    description: 'How your channel page looks: layout, blocks and colours.',
  },
  {
    id: 'discovery',
    href: '/settings/channel?tab=discovery',
    icon: CompassIcon,
    title: 'How fans find you',
    description: 'Directory listing, tags and search.',
  },
  {
    id: 'domain',
    href: '/settings/channel?tab=domain',
    icon: GlobeIcon,
    title: 'Address and domain',
    description: 'Your channel address and a custom domain.',
  },
  {
    id: 'chat',
    href: '/settings/channel?tab=chat',
    icon: MessageSquareIcon,
    title: 'Chat',
    description: 'Who can chat on your channel, and slow mode.',
  },
  {
    id: 'moderators',
    href: '/settings/channel?tab=moderators',
    icon: ShieldIcon,
    title: 'Moderators',
    description: 'People who can moderate your chat.',
  },
];

export function StudioProfileView() {
  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-4xl flex-col gap-4 px-1 py-2">
        <ViewShell
          title="Profile"
          subtitle="How you look to listeners: your artist profile and your channel page. Each card opens its own settings."
          classes={{ root: 'px-0 pt-0', content: 'gap-5' }}
        >
          <section
            className="flex flex-col gap-2"
            aria-labelledby="profile-artist"
          >
            <SectionTitle id="profile-artist" title="Artist profile" />
            <HubCards
              aria-label="Artist profile settings"
              items={STUDIO_PROFILE_ARTIST_ITEMS}
              renderLink={renderHubLink}
            />
          </section>
          <section
            className="flex flex-col gap-2"
            aria-labelledby="profile-channel"
          >
            <SectionTitle id="profile-channel" title="Channel page" />
            <HubCards
              aria-label="Channel page settings"
              items={STUDIO_PROFILE_CHANNEL_ITEMS}
              renderLink={renderHubLink}
            />
          </section>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
