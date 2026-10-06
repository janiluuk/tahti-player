import { Link } from '@tanstack/react-router';

import { ViewShell } from '@tahti-player/ui';

import type { InsightsKind } from '../../api/track-insights';
import { StudioGate } from '../../components/StudioGate';
import { TrackInsightsPanel } from '../../components/TrackInsightsPanel';

export function StudioTrackInsightsView({
  kind,
  id,
}: {
  kind: InsightsKind;
  id: string;
}) {
  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6">
        <Link
          to={kind === 'sound' ? '/studio/sounds' : '/studio/releases'}
          className="text-foreground-secondary text-xs hover:underline"
        >
          ← {kind === 'sound' ? 'Music' : 'Releases'}
        </Link>

        <ViewShell title="Track insights" classes={{ root: 'px-0 pt-0' }}>
          <TrackInsightsPanel kind={kind} id={id} />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
