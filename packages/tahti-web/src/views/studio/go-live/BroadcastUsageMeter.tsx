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

export function usageWarning(usage: BroadcastUsage): string | null {
  const level = usage.blocked ? 'blocked' : (usage.warningLevel ?? 'none');
  if (level === 'blocked') {
    return 'Your live time for this week is used up. It resets Monday 00:00 UTC.';
  }
  if (level === 'grace' || usage.inGrace) {
    const grace = usage.graceSeconds ?? 0;
    return grace > 0
      ? `You've reached this week's live time. Your set has about ${grace} seconds left before it ends.`
      : "You've reached this week's live time. Your set is wrapping up.";
  }
  if (level === '45m' || level === '55m') {
    const left =
      usage.secondsRemaining == null
        ? null
        : formatLiveTime(usage.secondsRemaining);
    return left
      ? `Only ${left} of live time left this week.`
      : 'You are close to this week’s live time.';
  }
  return null;
}

export function BroadcastUsageMeter({ usage }: { usage: BroadcastUsage }) {
  if (usage.unlimited) {
    return null;
  }
  const warning = usageWarning(usage);
  const exhausted = usage.blocked || usage.inGrace;
  const used = formatLiveTime(usage.secondsUsed);
  const cap = formatLiveTime(usage.weeklyCapSeconds);

  return (
    <div className="flex flex-col gap-2" data-testid="broadcast-usage">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-foreground-secondary">Weekly live time</span>
        <span className="text-foreground tabular-nums">
          {used} of {cap} used this week
        </span>
      </div>
      <Meter
        value={usage.secondsUsed}
        max={usage.weeklyCapSeconds}
        aria-label={`Weekly live time: ${used} of ${cap} used`}
        barClassName={
          exhausted ? 'bg-accent-red' : warning ? 'bg-accent-yellow' : undefined
        }
      />
      {warning || usage.showUpgradeCta ? (
        <Alert tone={exhausted ? 'error' : warning ? 'warning' : 'info'}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {warning ?? 'Membership gives you unlimited live time.'}
            </span>
            {usage.showUpgradeCta ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => useSettingsModalStore.getState().open('account')}
              >
                Get unlimited live time
              </Button>
            ) : null}
          </div>
        </Alert>
      ) : null}
    </div>
  );
}
