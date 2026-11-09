import { Link } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';
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
import { useSnapshotFetch } from '../../../lib/useSnapshotFetch';
import { formatEur } from './LedgerPanel';

export function FanSubArtistsPanel() {
  const { t } = useTranslation('web');
  const {
    data: rows,
    loading,
    retry: load,
  } = useSnapshotFetch<AdminFanSubArtist[]>(
    'admin-fan-sub-artists',
    async () => {
      const result = await fetchFanSubArtists();
      if (!result.data) {
        throw new Error('Fan subscription artists unavailable');
      }
      return result.data;
    },
  );

  return (
    <StudioPanel
      title={t('fanSubArtistsPanel.fanSubscriptionsByArtist')}
      description={t('fanSubArtistsPanel.activeSubscribersMonthlyRevenueAnd')}
    >
      {loading && !rows ? (
        <PageLoading label={t('loading.loadingArtists')} />
      ) : !rows ? (
        <PageError title={t('loadErrors.couldnTLoadArtists')} onRetry={load} />
      ) : rows.length === 0 ? (
        <PageEmpty title={t('empties.noActiveFanSubscriptions')} />
      ) : (
        <HorizontalScroll
          label={t('fanSubArtistsPanel.fanSubscriptionsByArtist')}
        >
          <DataTable data-testid="fansub-artists">
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>
                  {t('fanSubArtistsPanel.artist')}
                </DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">
                  {t('fanSubArtistsPanel.subscribers')}
                </DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">
                  MRR
                </DataTableHeaderCell>
                <DataTableHeaderCell className="text-right">
                  {t('fanSubArtistsPanel.paidOut')}
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
                        {t('fanSubArtistsPanel.ready')}
                      </Badge>
                    ) : (
                      <Badge variant="pill" color="red">
                        {row.stripeConnectAccountId
                          ? t('fanSubArtistsPanelStates.onboarding')
                          : t('fanSubArtistsPanelStates.notConnected')}
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
