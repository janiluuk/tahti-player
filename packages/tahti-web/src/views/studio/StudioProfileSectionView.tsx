import { useTranslation } from '@tahti-player/i18n';
import { ViewShell } from '@tahti-player/ui';

import { PageBackLink } from '../../components/PageBackLink';
import { ProfileVisibilitySection } from '../../components/ProfileVisibilitySection';
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

/** One Studio → Profile form on its own page: the hub card's title on top,
 * a link back to the hub, and the form that saves on its own. */
export function StudioProfileSectionView({
  section,
}: {
  section: StudioProfileSection;
}) {
  const { t } = useTranslation('web');
  const channelForm =
    isStudioProfileChannelSection(section) && section !== 'visibility';
  const card = [
    ...studioProfileArtistItems(t),
    ...studioProfileChannelItems(t),
  ].find((item) => item.id === section);

  return (
    <StudioGate requireChannel={channelForm}>
      <div className="studio-page-layout mx-auto flex max-w-6xl flex-col gap-4 px-1 py-2">
        <PageBackLink to="/studio/profile" label={t('studioProfile.profile')} />
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
