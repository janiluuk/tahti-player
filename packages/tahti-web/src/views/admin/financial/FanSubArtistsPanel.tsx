import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@tahti-player/ui';

import { fetchFanSubArtists, type AdminFanSubArtist } from '../../../api/admin';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { formatEur } from './LedgerPanel';

export function FanSubArtistsPanel() {
  const [rows, setRows] = useState<AdminFanSubArtist[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    void fetchFanSubArtists().then((result) => {
      if (cancelled) {
        return;
      }
      setRows(result.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  return (
    <StudioPanel
      title="Fan subscriptions by artist"
      description="Active subscribers, monthly revenue and paid-out total per artist, highest monthly revenue first."
    >
      {loading && !rows ? (
        <PageLoading label="Loading artists…" />
      ) : !rows ? (
        <PageError title="Couldn't load artists" onRetry={() => void load()} />
      ) : rows.length === 0 ? (
        <PageEmpty title="No active fan subscriptions" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="fansub-artists">
            <thead>
              <tr className="text-foreground-secondary text-left text-xs">
                <th className="py-2 pr-3 font-semibold">Artist</th>
                <th className="py-2 pr-3 text-right font-semibold">
                  Subscribers
                </th>
                <th className="py-2 pr-3 text-right font-semibold">MRR</th>
                <th className="py-2 pr-3 text-right font-semibold">Paid out</th>
                <th className="py-2 font-semibold">Stripe</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {rows.map((row) => (
                <tr key={row.artistUserId}>
                  <td className="py-2 pr-3">
                    <Link
                      to="/u/$username"
                      params={{ username: row.username }}
                      className="font-semibold hover:underline"
                    >
                      {row.displayName || row.username}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {row.activeSubscriberCount}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatEur(row.mrrCents)}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatEur(row.totalPaidCents)}
                  </td>
                  <td className="py-2">
                    {row.stripeConnectChargesEnabled ? (
                      <Badge variant="pill" color="green">
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="pill" color="red">
                        {row.stripeConnectAccountId
                          ? 'Onboarding'
                          : 'Not connected'}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </StudioPanel>
  );
}
