import { useTranslation } from '@tahti-player/i18n';

import { fetchAdminDashboard } from '../../../api/admin';
import { PageError, PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { StatNumber } from '../../../components/tahti/StatNumber';
import { useSnapshotFetch } from '../../../lib/useSnapshotFetch';

function euros(cents: number): string {
  return `€${(cents / 100).toLocaleString('fi-FI', { minimumFractionDigits: 0 })}`;
}

export function FinanceYtdPanel() {
  const { t } = useTranslation('web');
  const { data, error, loading, retry } = useSnapshotFetch(
    'admin-finance-ytd',
    async () => {
      const res = await fetchAdminDashboard();
      const reason = res.meta.source === 'api' ? res.meta.reason : undefined;
      if (reason) {
        throw new Error(reason);
      }
      return res.data.financeYtdCents;
    },
  );

  if (loading) {
    return (
      <StudioPanel title={t('adminDashboard.financeYtd')}>
        <PageLoading label={t('loading.loadingDashboard')} />
      </StudioPanel>
    );
  }

  if (!data) {
    return (
      <StudioPanel title={t('adminDashboard.financeYtd')}>
        <PageError
          title={t('loadErrors.couldnTLoadTheDashboard')}
          description={error ?? undefined}
          onRetry={retry}
        />
      </StudioPanel>
    );
  }

  return (
    <StudioPanel title={t('adminDashboard.financeYtd')}>
      <StatNumber className="block text-3xl">{euros(data.surplus)}</StatNumber>
      <p className="text-foreground-secondary mt-1 text-sm">
        {t('adminDashboard.financeBreakdown', {
          revenue: euros(data.revenue),
          costs: euros(data.costs),
        })}
      </p>
    </StudioPanel>
  );
}
