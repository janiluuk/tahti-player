import { useTranslation } from '@tahti-player/i18n';
import { ViewShell } from '@tahti-player/ui';

import type { InsightsKind } from '../../api/track-insights';
import { PageBackLink } from '../../components/PageBackLink';
import { StudioGate } from '../../components/StudioGate';
import { TrackInsightsPanel } from '../../components/TrackInsightsPanel';

export function StudioTrackInsightsView({
  kind,
  id,
  releaseId,
}: {
  kind: InsightsKind;
  id: string;
  releaseId?: string;
}) {
  const { t } = useTranslation('web');
  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6">
        {kind === 'sound' ? (
          <PageBackLink
            to="/library/sounds"
            label={t('studioTrackInsightsView.sounds')}
          />
        ) : releaseId ? (
          <PageBackLink
            to="/studio/releases/$id"
            params={{ id: releaseId }}
            search={{ tab: 'stats' }}
            label={t('studioTrackInsightsView.releaseStats')}
          />
        ) : (
          <PageBackLink
            to="/studio/releases"
            label={t('studioTrackInsightsView.releases')}
          />
        )}

        <ViewShell
          title={t('studioTrackInsightsView.trackInsights')}
          classes={{ root: 'px-0 pt-0' }}
        >
          <TrackInsightsPanel kind={kind} id={id} />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
