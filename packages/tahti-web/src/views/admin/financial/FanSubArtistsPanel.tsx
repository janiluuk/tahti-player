import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import {
  Badge,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  HorizontalScroll,
} from '@tahti-player/ui';

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
        <HorizontalScroll label="Fan subscriptions by artist">
          <DataTable data-testid="fansub-artists">
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Artist</DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">
                  Subscribers
                </DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">
                  MRR
                </DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">
                  Paid out
                </DataTableHeaderCell>
                <DataTableHeaderCell>Stripe</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {rows.map((row) => (
                <DataTableRow key={row.artistUserId}>
                  <DataTableCell>
                    <Link
                      to="/u/$username"
                      params={{ username: row.username }}
                      className="font-semibold hover:underline"
                    >
                      {row.displayName || row.username}
                    </Link>
                  </DataTableCell>
                  <DataTableCell className="text-right tabular-nums">
                    {row.activeSubscriberCount}
                  </DataTableCell>
                  <DataTableCell className="text-right tabular-nums">
                    {formatEur(row.mrrCents)}
                  </DataTableCell>
                  <DataTableCell className="text-right tabular-nums">
                    {formatEur(row.totalPaidCents)}
                  </DataTableCell>
                  <DataTableCell>
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
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </HorizontalScroll>
      )}
    </StudioPanel>
  );
}
