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

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import {
  HubCards,
  SectionTitle,
  ViewShell,
  type HubCardItem,
} from '@tahti-player/ui';

import { renderHubLink } from '../../components/HubLink';
import { StudioGate } from '../../components/StudioGate';

export function studioProfileArtistItems(t: TFunction<'web'>): HubCardItem[] {
  return [
    {
      id: 'identity',
      href: '/settings/artist?tab=identity',
      icon: UserIcon,
      title: t('studioProfileView.identity'),
      description: t('studioProfileView.artistNamePictureGenresAnd'),
    },
    {
      id: 'story',
      href: '/settings/artist?tab=story',
      icon: BookOpenIcon,
      title: t('studioProfileView.story'),
      description: t('studioProfileView.yourBioAndTheLonger'),
    },
    {
      id: 'people',
      href: '/settings/artist?tab=people',
      icon: UsersIcon,
      title: t('studioProfileView.people'),
      description: t('studioProfileView.bandMembersAndCollaboratorsShown'),
    },
    {
      id: 'connections',
      href: '/settings/artist?tab=connections',
      icon: LinkIcon,
      title: t('studioProfileView.links'),
      description: t('studioProfileView.yourWebsiteSocialsAndStreaming'),
    },
    {
      id: 'branding',
      href: '/settings/artist?tab=branding',
      icon: PaletteIcon,
      title: t('studioProfileView.branding'),
      description: t('studioProfileView.logoColoursAndHeaderImage'),
    },
    {
      id: 'gallery',
      href: '/settings/artist?tab=gallery',
      icon: ImagesIcon,
      title: t('studioProfileView.gallery'),
      description: t('studioProfileView.photosFansSeeOnYour'),
    },
    {
      id: 'press-kit',
      href: '/settings/artist?tab=press-kit',
      icon: FileTextIcon,
      title: t('studioProfileView.pressKit'),
      description: t('studioProfileView.downloadablePhotosBioAndTechnical'),
    },
    {
      id: 'release-visuals',
      href: '/settings/artist?tab=release-visuals',
      icon: ImageIcon,
      title: t('studioProfileView.releaseVisuals'),
      description: t('studioProfileView.defaultArtworkStyleForNew'),
    },
  ];
}

export function studioProfileChannelItems(t: TFunction<'web'>): HubCardItem[] {
  return [
    {
      id: 'appearance',
      href: '/settings/channel?tab=appearance',
      icon: PaletteIcon,
      title: t('studioProfileView.channelDesign'),
      description: t('studioProfileView.howYourChannelPageLooks'),
    },
    {
      id: 'discovery',
      href: '/settings/channel?tab=discovery',
      icon: CompassIcon,
      title: t('studioProfileView.howFansFindYou'),
      description: t('studioProfileView.directoryListingTagsAndSearch'),
    },
    {
      id: 'domain',
      href: '/settings/channel?tab=domain',
      icon: GlobeIcon,
      title: t('studioProfileView.addressAndDomain'),
      description: t('studioProfileView.yourChannelAddressAndA'),
    },
    {
      id: 'chat',
      href: '/studio/fans',
      icon: MessageSquareIcon,
      title: t('studioProfileView.chat'),
      description: t('studioProfileView.whoCanChatOnYour'),
    },
    {
      id: 'moderators',
      href: '/studio/fans',
      icon: ShieldIcon,
      title: t('studioProfileView.moderators'),
      description: t('studioProfileView.peopleWhoCanModerateYour'),
    },
  ];
}

export function StudioProfileView() {
  const { t } = useTranslation('web');
  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-4xl flex-col gap-4 px-1 py-2">
        <ViewShell
          title={t('studioProfile.profile')}
          subtitle={t('studioProfile.howYouLookToListeners')}
          classes={{ root: 'px-0 pt-0', content: 'gap-5' }}
        >
          <section
            className="flex flex-col gap-2"
            aria-labelledby="profile-artist"
          >
            <SectionTitle
              id="profile-artist"
              title={t('studioProfile.artistProfile')}
            />
            <HubCards
              aria-label={t('studioProfile.artistProfileSettings')}
              items={studioProfileArtistItems(t)}
              renderLink={renderHubLink}
            />
          </section>
          <section
            className="flex flex-col gap-2"
            aria-labelledby="profile-channel"
          >
            <SectionTitle
              id="profile-channel"
              title={t('studioProfile.channelPage')}
            />
            <HubCards
              aria-label={t('studioProfile.channelPageSettings')}
              items={studioProfileChannelItems(t)}
              renderLink={renderHubLink}
            />
          </section>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
