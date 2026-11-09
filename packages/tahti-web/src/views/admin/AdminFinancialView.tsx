import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchAdminFinancial,
  type AdminFinancialOverview,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminHubBreadcrumb } from '../../components/AdminHubBreadcrumb';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageError, PageLoading } from '../../components/PageStates';
import { useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { StudioPanel } from '../../components/StudioPanel';
import { FanSubArtistsPanel } from './financial/FanSubArtistsPanel';
import { FanSubPayoutQueue } from './financial/FanSubPayoutQueue';
import { formatEur, LedgerPanel } from './financial/LedgerPanel';
import { LegacyMembersPanel } from './financial/LegacyMembersPanel';

export function AdminFinancialView() {
  const { t } = useTranslation('web');
  const [year, setYear] = useState(() => new Date().getUTCFullYear());
  const {
    data: overview,
    error: loadError,
    loading,
    retry: reload,
  } = useSnapshotFetch<AdminFinancialOverview>(
    `admin-financial:${year}`,
    async () => {
      const res = await fetchAdminFinancial(year);
      if (!res.data) {
        throw new Error(res.meta.reason ?? 'No financial data');
      }
      return res.data;
    },
  );

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/financial">
          <div className="flex max-w-4xl flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminFinancialView.admin')}
              </BreadcrumbLink>
              <AdminHubBreadcrumb hub="coop" />
              <BreadcrumbCurrent>
                {t('adminFinancialView.financial')}
              </BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title={t('adminFinancialView.financial')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              {loading ? (
                <PageLoading label={t('loading.loadingFinancialData')} />
              ) : !overview ? (
                <PageError
                  title={t('loadErrors.couldNotLoadFinancialData')}
                  description={loadError ?? undefined}
                  onRetry={reload}
                />
              ) : (
                <>
                  <StudioPanel title={t('adminFinancialView.fanSubscriptions')}>
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <div className="text-foreground-secondary text-xs">
                          {t('adminFinancialView.activeSubscriptions')}
                        </div>
                        <div className="text-lg font-semibold">
                          {overview.activeFanSubCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-foreground-secondary text-xs">
                          MRR
                        </div>
                        <div className="text-lg font-semibold">
                          {formatEur(overview.mrrCents)}
                        </div>
                      </div>
                      <div>
                        <div className="text-foreground-secondary text-xs">
                          {t('adminFinancialView.pendingPayouts')}
                        </div>
                        <div className="text-lg font-semibold">
                          {overview.pendingPayouts.count} (
                          {formatEur(overview.pendingPayouts.totalNetCents)})
                        </div>
                      </div>
                      {overview.failedPayouts.count > 0 && (
                        <div>
                          <div className="text-foreground-secondary text-xs">
                            {t('adminFinancialView.failedPayouts')}
                          </div>
                          <div className="text-accent-red-strong text-lg font-semibold">
                            {overview.failedPayouts.count} (
                            {formatEur(overview.failedPayouts.totalNetCents)})
                          </div>
                        </div>
                      )}
                    </div>
                  </StudioPanel>

                  <FanSubArtistsPanel />

                  <FanSubPayoutQueue onChanged={reload} />

                  <LegacyMembersPanel />

                  <LedgerPanel
                    entries={overview.entries}
                    year={year}
                    onYearChange={setYear}
                    onChanged={reload}
                  />
                </>
              )}
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
