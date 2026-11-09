import { Link } from '@tanstack/react-router';
import { RotateCcwIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, InlineError, Select } from '@tahti-player/ui';

import {
  fetchFanSubPayouts,
  retryFanSubPayout,
  type AdminFanSubPayout,
  type AdminFanSubPayoutState,
} from '../../../api/admin';
import { ListingDate } from '../../../components/ListingDate';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';

const FILTERS = [
  { id: '', label: 'Pending and failed' },
  { id: 'FAILED', label: 'Failed' },
  { id: 'PENDING', label: 'Pending' },
];

function formatEur(cents: number): string {
  return `€${(cents / 100).toLocaleString('fi-FI', { minimumFractionDigits: 2 })}`;
}

function PayoutPeriod({ payout }: { payout: AdminFanSubPayout }) {
  return (
    <>
      <ListingDate value={payout.forPeriodStart} />
      {' – '}
      <ListingDate value={payout.forPeriodEnd} />
    </>
  );
}

export function FanSubPayoutQueue({ onChanged }: { onChanged?: () => void }) {
  const { t } = useTranslation('web');
  const [state, setState] = useState<'' | AdminFanSubPayoutState>('');
  const [rows, setRows] = useState<AdminFanSubPayout[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    void fetchFanSubPayouts(state || undefined).then((result) => {
      if (cancelled) {
        return;
      }
      setRows(result.data?.payouts ?? null);
      setTotal(result.data?.total ?? 0);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [state]);

  useEffect(() => load(), [load]);

  const retry = async (payout: AdminFanSubPayout) => {
    setRetrying(payout.id);
    setError(null);
    const result = await retryFanSubPayout(payout.id);
    setRetrying(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    load();
    onChanged?.();
  };

  return (
    <StudioPanel
      title={t('fanSubPayoutQueue.payoutQueue')}
      description={t('fanSubPayoutQueue.fanSubscriptionPayoutsWaitingFor')}
      action={
        <Select
          label={t('fanSubPayoutQueue.show')}
          value={state}
          onValueChange={(value) =>
            setState(value as '' | AdminFanSubPayoutState)
          }
          options={FILTERS}
        />
      }
    >
      {error ? <InlineError className="mb-3">{error}</InlineError> : null}
      {loading && !rows ? (
        <PageLoading label={t('loading.loadingPayouts')} />
      ) : !rows ? (
        <PageError
          title={t('loadErrors.couldnTLoadPayouts')}
          onRetry={() => void load()}
        />
      ) : rows.length === 0 ? (
        <PageEmpty title={t('empties.nothingToPayOut')} />
      ) : (
        <>
          <ul
            className="divide-border divide-y text-sm"
            data-testid="payout-queue"
          >
            {rows.map((payout) => (
              <li
                key={payout.id}
                className="flex flex-wrap items-center justify-between gap-3 py-2"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/u/$username"
                      params={{ username: payout.artistUsername }}
                      className="font-semibold hover:underline"
                    >
                      {payout.artistDisplayName}
                    </Link>
                    <Badge
                      variant="pill"
                      color={payout.state === 'FAILED' ? 'red' : 'orange'}
                    >
                      {payout.state === 'FAILED' ? 'Failed' : 'Pending'}
                    </Badge>
                  </span>
                  <span className="text-foreground-secondary block text-xs">
                    From {payout.subscriberDisplayName} ·{' '}
                    <PayoutPeriod payout={payout} />
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums">
                    {formatEur(payout.netToArtistCents)}
                  </span>
                  {payout.state === 'FAILED' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={retrying !== null}
                      aria-label={t(
                        'fanSubPayoutQueueLabels.retryPayoutToArtistdisplayname',
                        { artistDisplayName: payout.artistDisplayName },
                      )}
                      onClick={() => void retry(payout)}
                    >
                      <RotateCcwIcon size={14} aria-hidden className="mr-1.5" />
                      {retrying === payout.id ? 'Retrying…' : 'Retry'}
                    </Button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          {total > rows.length ? (
            <p className="text-foreground-secondary mt-2 text-xs">
              Showing the newest {rows.length} of {total}.
            </p>
          ) : null}
        </>
      )}
    </StudioPanel>
  );
}
