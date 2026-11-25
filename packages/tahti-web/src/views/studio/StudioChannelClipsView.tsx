import { useTranslation } from '@tahti-player/i18n';
import { BackButtonLink, ViewShell } from '@tahti-player/ui';

import { ChannelAnnouncementsPanel } from '../../components/ChannelAnnouncementsPanel';
import { StudioGate } from '../../components/StudioGate';

export function StudioChannelClipsView() {
  const { t } = useTranslation('web');

  return (
    <StudioGate requireChannel>
      <div className="studio-page-layout mx-auto flex w-full max-w-6xl flex-col gap-4 px-1 py-2">
        <ViewShell
          title={t('channelAnnouncementsPanel.clipsBetweenPrograms')}
          classes={{ root: 'px-0 pt-0', content: 'gap-5' }}
          corner={
            <BackButtonLink
              to="/studio/channel/$section"
              params={{ section: 'settings' }}
              aria-label={t('studioChannelView.backToChannelSettings')}
            />
          }
        >
          <ChannelAnnouncementsPanel />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
