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
  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6">
        {kind === 'sound' ? (
          <PageBackLink to="/library/sounds" label="Sounds" />
        ) : releaseId ? (
          <PageBackLink
            to="/studio/releases/$id"
            params={{ id: releaseId }}
            search={{ tab: 'stats' }}
            label="Release stats"
          />
        ) : (
          <PageBackLink to="/studio/releases" label="Releases" />
        )}

        <ViewShell title="Track insights" classes={{ root: 'px-0 pt-0' }}>
          <TrackInsightsPanel kind={kind} id={id} />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
