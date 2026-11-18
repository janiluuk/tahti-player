import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { DayOfWeekChart } from '@tahti-player/ui';

import {
  fetchStatsLoyalty,
  type StatsAudienceWindow,
  type StatsLoyalty,
} from '../../../api/studio-extras';
import { PageError } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { dateLocaleTag } from '../../../lib/locale';

const percent = (share: number) => `${Math.round(share * 100)} %`;

export function ListenerLoyalty({
  window,
}: {
  window: Omit<StatsAudienceWindow, 'includeBots'>;
}) {
  const { t } = useTranslation('web');
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
      title={t('listenerLoyalty.listenerLoyalty')}
      description={t('listenerLoyalty.howFarIntoATrack')}
    >
      {failed ? (
        <PageError
          title={t('loadErrors.couldNotLoadListenerLoyalty')}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : !loyalty ? null : loyalty.points.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          {t('studioStatsText.loyaltyWaiting', { count: loyalty.minBucket })}
        </p>
      ) : (
        <div data-testid="stats-loyalty" className="flex flex-col gap-3">
          <p className="text-sm">
            {halfway
              ? t('studioStatsText.gotHalfway', {
                  percent: percent(halfway.share),
                })
              : null}
            {halfway && end ? ' · ' : null}
            {end
              ? t('studioStatsText.listenedToEnd', {
                  percent: percent(end.share),
                })
              : null}
            <span className="text-foreground-secondary">
              {' '}
              {t('studioStatsText.listensTotal', {
                count: loyalty.total,
                formatted: loyalty.total.toLocaleString(dateLocaleTag()),
              })}
            </span>
          </p>
          <div
            className="h-44 w-full"
            role="img"
            aria-label={t('listenerLoyalty.shareStillListeningByOf')}
          >
            <DayOfWeekChart
              values={loyalty.points.map((point) => point.share * 100)}
              labels={{
                weekdays: loyalty.points.map((point) => String(point.percent)),
              }}
              formatValue={(value) =>
                t('studioStatsText.stillListening', {
                  percent: Math.round(value),
                })
              }
            />
          </div>
          <p className="text-foreground-secondary text-xs">
            {t('studioStatsText.percentOfTrack')}
          </p>
        </div>
      )}
    </StudioPanel>
  );
}
