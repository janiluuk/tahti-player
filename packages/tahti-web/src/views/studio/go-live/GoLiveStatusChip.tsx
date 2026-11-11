import { useTranslation } from '@tahti-player/i18n';

import { cn } from '../../../lib/cn';
import { formatClockTime, formatElapsed, useNow } from './goLiveTime';

export type GoLiveStatus = 'offline' | 'ready' | 'live' | 'reconnecting';

export function goLiveStatus({
  isBroadcastLive,
  reconnecting,
  requiredDone,
}: {
  isBroadcastLive: boolean;
  reconnecting: boolean;
  requiredDone: boolean;
}): GoLiveStatus {
  if (reconnecting) {
    return 'reconnecting';
  }
  if (isBroadcastLive) {
    return 'live';
  }
  return requiredDone ? 'ready' : 'offline';
}

const DOT_CLASS: Record<GoLiveStatus, string> = {
  offline: 'bg-status-offline',
  ready: 'bg-primary',
  live: 'bg-accent-red',
  reconnecting: 'bg-accent-red animate-pulse motion-reduce:animate-none',
};

export function GoLiveStatusChip({
  status,
  liveSince,
  reconnectDeadline,
}: {
  status: GoLiveStatus;
  liveSince: string | null;
  reconnectDeadline: string | null;
}) {
  const { t } = useTranslation('web');
  const now = useNow(status === 'live' && Boolean(liveSince));
  const elapsed =
    status === 'live' && liveSince
      ? formatElapsed((now - new Date(liveSince).getTime()) / 1000)
      : null;

  let detail: string | null = null;
  if (status === 'reconnecting' && reconnectDeadline) {
    detail = t('goLivePage.status.until', {
      time: formatClockTime(reconnectDeadline),
    });
  }

  return (
    <span
      role="status"
      data-testid="go-live-status"
      data-status={status}
      className="border-border-subtle bg-background-secondary text-foreground inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold"
    >
      <span
        aria-hidden
        className={cn('size-2.5 shrink-0 rounded-full', DOT_CLASS[status])}
      />
      <span>{t(`goLivePage.status.${status}`)}</span>
      {elapsed ? (
        <span
          className="text-foreground-secondary font-normal tabular-nums"
          aria-hidden
        >
          {elapsed}
        </span>
      ) : null}
      {detail ? (
        <span className="text-foreground-secondary font-normal">{detail}</span>
      ) : null}
    </span>
  );
}
