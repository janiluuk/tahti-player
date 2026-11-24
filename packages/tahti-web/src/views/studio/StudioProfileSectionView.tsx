import { useTranslation } from '@tahti-player/i18n';
import { ViewShell } from '@tahti-player/ui';

import { PageBackLink } from '../../components/PageBackLink';
import { ProfileVisibilitySection } from '../../components/ProfileVisibilitySection';
import { SectionTabs } from '../../components/SectionTabs';
import { StudioGate } from '../../components/StudioGate';
import {
  isStudioProfileChannelSection,
  type StudioProfileSection,
} from '../../lib/studioProfileSections';
import { ArtistPanel } from '../settings/panels/ArtistPanel';
import { ChannelPanel } from '../settings/panels/ChannelPanel';
import { LinkPageEditor } from './LinkPageEditor';
import {
  studioProfileArtistItems,
  studioProfileChannelItems,
} from './StudioProfileView';

/** One Studio → Profile form on its own page: a link back to the hub, a
 * tab row to the other profile forms, the hub card's title, and the form
 * that saves on its own. */
export function StudioProfileSectionView({
  section,
}: {
  section: StudioProfileSection;
}) {
  const { t } = useTranslation('web');
  const channelForm =
    isStudioProfileChannelSection(section) && section !== 'visibility';
  const cards = [
    ...studioProfileArtistItems(t),
    ...studioProfileChannelItems(t),
  ];
  const card = cards.find((item) => item.id === section);

  return (
    <StudioGate requireChannel={channelForm}>
      <div className="studio-page-layout mx-auto flex max-w-6xl flex-col gap-4 px-1 py-2">
        <PageBackLink to="/studio/profile" label={t('studioProfile.profile')} />
        <SectionTabs
          aria-label={t('studioProfile.profileSections')}
          items={cards.map(({ id, href, title, icon: Icon }) => ({
            id,
            to: href,
            label: title,
            icon: <Icon size={14} aria-hidden />,
            active: id === section,
          }))}
        />
        <ViewShell
          title={card?.title ?? t('studioProfile.profile')}
          subtitle={card?.description}
          classes={{ root: 'px-0 pt-0', content: 'gap-5' }}
        >
          <div data-testid={`studio-profile-section-${section}`}>
            {section === 'link-page' ? (
              <LinkPageEditor />
            ) : section === 'visibility' ? (
              <ProfileVisibilitySection />
            ) : channelForm ? (
              <ChannelPanel section={section} />
            ) : (
              <ArtistPanel section={section} />
            )}
          </div>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
