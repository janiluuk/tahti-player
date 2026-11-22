import { useTranslation } from '@tahti-player/i18n';

import { ListenerWorldMap } from '../../../components/ListenerWorldMap';
import { StudioPanel } from '../../../components/StudioPanel';
import { dateLocaleTag } from '../../../lib/locale';
import { AudienceBreakdown } from './AudienceBreakdown';
import { ListenerLocations } from './ListenerLocations';
import { ListenerLoyalty } from './ListenerLoyalty';
import { ReferrerSources } from './ReferrerSources';
import type { StatsData } from './useStatsData';

export function AudienceTab({ state }: { state: StatsData }) {
  const { t } = useTranslation('web');
  const { listenerGeo, loading, live, range, appliedCustom } = state;

  return (
    <div className="grid gap-6">
      <StudioPanel title={t('playsTab.listenerMap')}>
        <div className="mb-3 flex flex-wrap justify-between gap-2">
          <p className="text-foreground-secondary text-sm">
            {t('playsTab.anonymizedCountriesFromChannelListening')}
          </p>
          <span className="text-foreground-secondary text-xs tabular-nums">
            {t('playsTabBatch32.peakDay', {
              count: live.peakDailyListeners,
              formatted:
                live.peakDailyListeners.toLocaleString(dateLocaleTag()),
            })}
          </span>
        </div>
        <ListenerWorldMap data={listenerGeo} loading={loading} compact />
        <ListenerLocations
          window={{
            range,
            from: appliedCustom?.from,
            to: appliedCustom?.to,
          }}
        />
      </StudioPanel>

      <ListenerLoyalty
        window={{
          range,
          from: appliedCustom?.from,
          to: appliedCustom?.to,
        }}
      />
      <AudienceBreakdown
        window={{
          range,
          from: appliedCustom?.from,
          to: appliedCustom?.to,
        }}
      />
      <ReferrerSources
        window={{
          range,
          from: appliedCustom?.from,
          to: appliedCustom?.to,
        }}
      />
    </div>
  );
}
