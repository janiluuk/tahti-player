import { useTranslation } from '@tahti-player/i18n';

import { StudioPanel } from '../../components/StudioPanel';
import type { StudioProfileSection } from '../../lib/studioProfileSections';
import {
  ArtistPanel,
  ReleaseVisualDefaultsPanel,
} from '../settings/panels/ArtistPanel';
import { LinkPageEditor } from './LinkPageEditor';
import { StudioBrandingPanel } from './StudioBrandingView';
import { StudioSectionPage } from './StudioSectionPage';

function ProfileSectionBody({ section }: { section: StudioProfileSection }) {
  const { t } = useTranslation('web');
  if (section === 'link-page') {
    return <LinkPageEditor />;
  }
  if (section === 'gallery') {
    return <StudioBrandingPanel section="gallery-and-press-kit" />;
  }
  if (section === 'branding') {
    return (
      <>
        <StudioBrandingPanel section="branding" />
        <StudioPanel
          id="release-visuals"
          className="scroll-mt-4"
          title={t('studioProfileView.releaseVisuals')}
          description={t('studioProfileView.defaultArtworkStyleForNew')}
        >
          <ReleaseVisualDefaultsPanel />
        </StudioPanel>
      </>
    );
  }
  return <ArtistPanel section={section} />;
}

/** Studio → Profile: one tab of the artist profile (identity, links, link
 * page, branding, gallery and press kit). */
export function StudioProfileSectionView({
  section,
}: {
  section: StudioProfileSection;
}) {
  return (
    <StudioSectionPage
      section={section}
      requireChannel={false}
      data-testid={`studio-profile-section-${section}`}
    >
      <ProfileSectionBody section={section} />
    </StudioSectionPage>
  );
}
