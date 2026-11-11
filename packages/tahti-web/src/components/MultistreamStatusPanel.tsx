import { useCallback, useEffect, useState } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Badge, ButtonLink } from '@tahti-player/ui';

import {
  fetchRtmpTargetStatuses,
  type RtmpTargetLiveStatus,
} from '../api/rtmp-status';
import { usePolling } from '../hooks/usePolling';
import { PageErrorBanner } from './PageStates';
import { StudioPanel } from './StudioPanel';

const REFRESH_MS = 15_000;

function statusBadge(
  t: TFunction<'web'>,
): Record<
  RtmpTargetLiveStatus['status'],
  { label: string; color: 'green' | 'red' | 'secondary' }
> {
  return {
    connected: {
      label: t('multistreamStatusPanelLeftovers.streaming'),
      color: 'green',
    },
    error: { label: t('multistreamStatusPanelLeftovers.error'), color: 'red' },
    offline: {
      label: t('multistreamStatusPanelLeftovers.notStreaming'),
      color: 'secondary',
    },
    disabled: {
      label: t('multistreamStatusPanelLeftovers.off'),
      color: 'secondary',
    },
  };
}

/** Whether each multistream destination is receiving the stream right now. */
export function MultistreamStatusPanel({ slug }: { slug: string }) {
  const { t } = useTranslation('web');
  const [targets, setTargets] = useState<RtmpTargetLiveStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetchRtmpTargetStatuses(slug).then((result) => {
      const reason =
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null;
      setError(reason);
      // A failed poll keeps the last known statuses on screen.
      if (!reason) {
        setTargets(result.data);
      }
    });
  }, [slug]);

  useEffect(load, [load]);
  usePolling(load, REFRESH_MS, Boolean(targets?.length));

  if (!error && (!targets || targets.length === 0)) {
    return null;
  }

  return (
    <StudioPanel
      title={t('multistreamStatusPanel.multistreamStatus')}
      description={t(
        'multistreamStatusPanel.whetherEachDestinationIsReceiving',
      )}
      action={
        <ButtonLink
          to="/studio/go-live"
          search={{ step: 'destinations' }}
          size="sm"
          variant="ghost"
        >
          {t('multistreamStatusPanel.manage')}
        </ButtonLink>
      }
    >
      {error ? (
        <PageErrorBanner
          title={t('loadErrors.couldnTCheckMultistreamStatus')}
          description={
            targets?.length
              ? t('multistreamStatusPanelLeftovers.showingLastKnown')
              : error
          }
          onRetry={load}
        />
      ) : null}
      <ul
        className="divide-border divide-y text-sm"
        data-testid="multistream-status"
      >
        {(targets ?? []).map((target) => {
          const badge = statusBadge(t)[target.status];
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
