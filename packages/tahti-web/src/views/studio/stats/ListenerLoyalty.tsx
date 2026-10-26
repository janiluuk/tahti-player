import { useEffect, useState } from 'react';

import { DayOfWeekChart } from '@tahti-player/ui';

import {
  fetchStatsLoyalty,
  type StatsAudienceWindow,
  type StatsLoyalty,
} from '../../../api/studio-extras';
import { PageError } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';

const percent = (share: number) => `${Math.round(share * 100)} %`;

export function ListenerLoyalty({
  window,
}: {
  window: Omit<StatsAudienceWindow, 'includeBots'>;
}) {
  const [loyalty, setLoyalty] = useState<StatsLoyalty | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const { range, from, to, soundId } = window;

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    void fetchStatsLoyalty({ range, from, to, soundId }).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.meta.source === 'api' && result.meta.reason) {
        setFailed(true);
        return;
      }
      setLoyalty(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [range, from, to, soundId, reloadKey]);

  const halfway = loyalty?.points.find((point) => point.percent === 50);
  const end = loyalty?.points.find((point) => point.percent === 100);

  return (
    <StudioPanel
      title="Listener loyalty"
      description="How far into a track listeners got: the share still listening at each tenth of it."
    >
      {failed ? (
        <PageError
          title="Could not load listener loyalty"
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : !loyalty ? null : loyalty.points.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          The curve appears once at least {loyalty.minBucket} listens of your
          tracks report how far they got.
        </p>
      ) : (
        <div data-testid="stats-loyalty" className="flex flex-col gap-3">
          <p className="text-sm">
            {halfway ? `${percent(halfway.share)} got halfway` : null}
            {halfway && end ? ' · ' : null}
            {end ? `${percent(end.share)} listened to the end` : null}
            <span className="text-foreground-secondary">
              {' '}
              ({loyalty.total.toLocaleString()} listens)
            </span>
          </p>
          <div className="h-44 w-full">
            <DayOfWeekChart
              values={loyalty.points.map((point) => point.share * 100)}
              labels={{
                weekdays: loyalty.points.map((point) => `${point.percent}%`),
              }}
              formatValue={(value) => `${Math.round(value)} % still listening`}
            />
          </div>
        </div>
      )}
    </StudioPanel>
  );
}
