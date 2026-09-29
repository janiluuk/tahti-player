import { Link } from '@tanstack/react-router';
import { RotateCcwIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge, Button, Select } from '@tahti-player/ui';

import {
  fetchFanSubPayouts,
  retryFanSubPayout,
  type AdminFanSubPayout,
  type AdminFanSubPayoutState,
} from '../../../api/admin';
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

function formatPeriod(payout: AdminFanSubPayout): string {
  const start = new Date(payout.forPeriodStart).toLocaleDateString();
  const end = new Date(payout.forPeriodEnd).toLocaleDateString();
  return `${start} – ${end}`;
}

export function FanSubPayoutQueue({ onChanged }: { onChanged?: () => void }) {
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
      title="Payout queue"
      description="Fan subscription payouts waiting for the payout worker. Retrying a failed payout puts it back in the queue."
      action={
        <Select
          label="Show"
          value={state}
          onValueChange={(value) =>
            setState(value as '' | AdminFanSubPayoutState)
          }
          options={FILTERS}
        />
      }
    >
      {error ? (
        <p className="text-accent-red-strong mb-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {loading && !rows ? (
        <PageLoading label="Loading payouts…" />
      ) : !rows ? (
        <PageError title="Couldn't load payouts" onRetry={() => void load()} />
      ) : rows.length === 0 ? (
        <PageEmpty title="Nothing waiting to be paid out" />
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
                    From {payout.subscriberDisplayName} · {formatPeriod(payout)}
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
                      aria-label={`Retry payout to ${payout.artistDisplayName}`}
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
