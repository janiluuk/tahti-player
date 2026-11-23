import {
  BookOpenIcon,
  CompassIcon,
  EyeIcon,
  FileTextIcon,
  GlobeIcon,
  ImageIcon,
  ImagesIcon,
  LinkIcon,
  PaletteIcon,
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
      href: '/studio/profile/identity',
      icon: UserIcon,
      title: t('studioProfileView.identity'),
      description: t('studioProfileView.artistNamePictureGenresAnd'),
    },
    {
      id: 'story',
      href: '/studio/profile/story',
      icon: BookOpenIcon,
      title: t('studioProfileView.story'),
      description: t('studioProfileView.yourBioAndTheLonger'),
    },
    {
      id: 'people',
      href: '/studio/profile/people',
      icon: UsersIcon,
      title: t('studioProfileView.people'),
      description: t('studioProfileView.bandMembersAndCollaboratorsShown'),
    },
    {
      id: 'connections',
      href: '/studio/profile/connections',
      icon: LinkIcon,
      title: t('studioProfileView.links'),
      description: t('studioProfileView.yourWebsiteSocialsAndStreaming'),
    },
    {
      id: 'link-page',
      href: '/studio/profile/link-page',
      icon: LinkIcon,
      title: t('linkPage.tab'),
      description: t('linkPage.yourLinkPage'),
    },
    {
      id: 'branding',
      href: '/studio/profile/branding',
      icon: PaletteIcon,
      title: t('studioProfileView.branding'),
      description: t('studioProfileView.logoColoursAndHeaderImage'),
    },
    {
      id: 'gallery',
      href: '/studio/profile/gallery',
      icon: ImagesIcon,
      title: t('studioProfileView.gallery'),
      description: t('studioProfileView.photosFansSeeOnYour'),
    },
    {
      id: 'press-kit',
      href: '/studio/profile/press-kit',
      icon: FileTextIcon,
      title: t('studioProfileView.pressKit'),
      description: t('studioProfileView.downloadablePhotosBioAndTechnical'),
    },
    {
      id: 'release-visuals',
      href: '/studio/profile/release-visuals',
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
      href: '/studio/profile/appearance',
      icon: PaletteIcon,
      title: t('studioProfileView.channelDesign'),
      description: t('studioProfileView.howYourChannelPageLooks'),
    },
    {
      id: 'discovery',
      href: '/studio/profile/discovery',
      icon: CompassIcon,
      title: t('studioProfileView.howFansFindYou'),
      description: t('studioProfileView.directoryListingTagsAndSearch'),
    },
    {
      id: 'visibility',
      href: '/studio/profile/visibility',
      icon: EyeIcon,
      title: t('studioProfileView.visibility'),
      description: t('studioProfileView.visibilityDescription'),
    },
    {
      id: 'domain',
      href: '/studio/profile/domain',
      icon: GlobeIcon,
      title: t('studioProfileView.addressAndDomain'),
      description: t('studioProfileView.yourChannelAddressAndA'),
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
