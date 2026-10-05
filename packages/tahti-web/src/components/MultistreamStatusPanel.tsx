import { useCallback, useEffect, useState } from 'react';

import { Badge, ButtonLink } from '@tahti-player/ui';

import {
  fetchRtmpTargetStatuses,
  type RtmpTargetLiveStatus,
} from '../api/rtmp-status';
import { usePolling } from '../hooks/usePolling';
import { StudioPanel } from './StudioPanel';

const REFRESH_MS = 15_000;

const STATUS_BADGE: Record<
  RtmpTargetLiveStatus['status'],
  { label: string; color: 'green' | 'red' | 'secondary' }
> = {
  connected: { label: 'Streaming', color: 'green' },
  error: { label: 'Error', color: 'red' },
  offline: { label: 'Not streaming', color: 'secondary' },
  disabled: { label: 'Off', color: 'secondary' },
};

/** Whether each multistream destination is receiving the stream right now. */
export function MultistreamStatusPanel({ slug }: { slug: string }) {
  const [targets, setTargets] = useState<RtmpTargetLiveStatus[] | null>(null);

  const load = useCallback(() => {
    void fetchRtmpTargetStatuses(slug).then((result) => {
      setTargets(result.data);
    });
  }, [slug]);

  useEffect(load, [load]);
  usePolling(load, REFRESH_MS, Boolean(targets?.length));

  if (!targets || targets.length === 0) {
    return null;
  }

  return (
    <StudioPanel
      title="Multistream status"
      description="Whether each destination is receiving your stream right now. Refreshes every 15 seconds."
      action={
        <ButtonLink
          to="/studio/go-live"
          search={{ tab: 'destinations' }}
          size="sm"
          variant="ghost"
        >
          Manage
        </ButtonLink>
      }
    >
      <ul
        className="divide-border divide-y text-sm"
        data-testid="multistream-status"
      >
        {targets.map((target) => {
          const badge = STATUS_BADGE[target.status];
          return (
            <li key={target.id} className="flex flex-col gap-1 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-semibold">
                  {target.label || target.provider}
                </span>
                <Badge variant="pill" color={badge.color}>
                  {badge.label}
                </Badge>
              </div>
              {target.status === 'error' && target.lastError ? (
                <p className="text-accent-red-strong text-xs">
                  {target.lastError}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </StudioPanel>
  );
}
