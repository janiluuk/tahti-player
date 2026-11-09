import { ActivityIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button } from '@tahti-player/ui';

import { streamFailureLabel } from '../../lib/streamFailure';
import {
  useStationHealth,
  useStationHealthStore,
  type StationHealth,
} from '../../stores/stationHealthStore';

function checkedTime(checkedAt: number): string {
  return new Date(checkedAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HealthBadge({ health }: { health: StationHealth | undefined }) {
  const { t } = useTranslation('web');
  if (!health) {
    return <Badge variant="pill">{t('stationHealth.notChecked')}</Badge>;
  }
  switch (health.state) {
    case 'checking':
      return <Badge variant="pill">{t('stationHealth.checking')}</Badge>;
    case 'ok':
      return (
        <Badge variant="pill" color="green">
          {t('stationHealth.working')}
        </Badge>
      );
    case 'unavailable':
      return (
        <Badge variant="pill" color="red">
          Unavailable · {streamFailureLabel(health.failure)}
        </Badge>
      );
    case 'unknown':
      return (
        <Badge variant="pill" color="yellow">
          {t('stationHealth.couldnTVerify')}
        </Badge>
      );
  }
}

/** Last health result for a station stream this session, and a Test now.
 * The test runs from the admin's browser, so a host without CORS headers
 * reads as "Couldn't verify", not as down. */
export function StationHealthCell({
  streamUrl,
  name,
}: {
  streamUrl: string | null;
  name: string;
}) {
  const { t } = useTranslation('web');
  const health = useStationHealth(streamUrl, { precheck: false });
  const check = useStationHealthStore((s) => s.check);
  const checking = health?.state === 'checking';
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="station-health"
    >
      {streamUrl ? (
        <HealthBadge health={health} />
      ) : (
        <Badge variant="pill">{t('stationHealth.noStreamUrl')}</Badge>
      )}
      {health && health.state !== 'checking' ? (
        <span className="text-foreground-secondary text-xs">
          {health.state === 'unknown'
            ? `offline, or no CORS headers · ${checkedTime(health.checkedAt)}`
            : `checked ${checkedTime(health.checkedAt)}`}
        </span>
      ) : null}
      <Button
        className="gap-1.5"
        size="xs"
        variant="text"
        aria-label={t('stationHealthCellLabels.testNameStream', { name })}
        disabled={!streamUrl || checking}
        onClick={() => {
          if (streamUrl) {
            void check(streamUrl);
          }
        }}
      >
        <ActivityIcon size={14} aria-hidden />
        {checking
          ? t('stationHealthCellStates.testing')
          : t('stationHealthCellStates.test')}
      </Button>
    </div>
  );
}
