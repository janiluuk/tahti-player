import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Alert, Button, Meter } from '@tahti-player/ui';

import type { BroadcastUsage } from '../../../api/broadcast';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';

export function formatLiveTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds / 60));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) {
    return `${minutes}m`;
  }
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function usageWarning(
  usage: BroadcastUsage,
  t: TFunction<'web'>,
): string | null {
  const level = usage.blocked ? 'blocked' : (usage.warningLevel ?? 'none');
  if (level === 'blocked') {
    return t('broadcastUsageMeterBatch30.blocked');
  }
  if (level === 'grace' || usage.inGrace) {
    const grace = usage.graceSeconds ?? 0;
    return grace > 0
      ? t('broadcastUsageMeterBatch30.graceSecondsLeft', { count: grace })
      : t('broadcastUsageMeterBatch30.graceWrappingUp');
  }
  if (level === '45m' || level === '55m') {
    const left =
      usage.secondsRemaining == null
        ? null
        : formatLiveTime(usage.secondsRemaining);
    return left
      ? t('broadcastUsageMeterBatch30.onlyLeft', { left })
      : t('broadcastUsageMeterBatch30.closeToCap');
  }
  return null;
}

export function BroadcastUsageMeter({ usage }: { usage: BroadcastUsage }) {
  const { t } = useTranslation('web');
  if (usage.unlimited) {
    return null;
  }
  const warning = usageWarning(usage, t);
  const exhausted = usage.blocked || usage.inGrace;
  const used = formatLiveTime(usage.secondsUsed);
  const cap = formatLiveTime(usage.weeklyCapSeconds);

  return (
    <div className="flex flex-col gap-2" data-testid="broadcast-usage">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-foreground-secondary">
          {t('broadcastUsageMeter.weeklyLiveTime')}
        </span>
        <span className="text-foreground tabular-nums">
          {t('broadcastUsageMeterBatch30.usedOfCap', { used, cap })}
        </span>
      </div>
      <Meter
        value={usage.secondsUsed}
        max={usage.weeklyCapSeconds}
        aria-label={t('broadcastUsageMeterLabels.weeklyLiveTimeUsedOf', {
          used,
          cap,
        })}
        barClassName={
          exhausted ? 'bg-accent-red' : warning ? 'bg-accent-yellow' : undefined
        }
      />
      {warning || usage.showUpgradeCta ? (
        <Alert tone={exhausted ? 'error' : warning ? 'warning' : 'info'}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {warning ?? t('broadcastUsageMeterBatch30.membershipUnlimited')}
            </span>
            {usage.showUpgradeCta ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => useSettingsModalStore.getState().open('account')}
              >
                {t('broadcastUsageMeter.getUnlimitedLiveTime')}
              </Button>
            ) : null}
          </div>
        </Alert>
      ) : null}
    </div>
  );
}
