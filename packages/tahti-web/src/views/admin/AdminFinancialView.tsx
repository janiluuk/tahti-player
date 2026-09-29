import { useEffect, useState } from 'react';

import { ViewShell } from '@tahti-player/ui';

import {
  fetchAdminFinancial,
  type AdminFinancialOverview,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { FanSubPayoutQueue } from './financial/FanSubPayoutQueue';
import { formatEur, LedgerPanel } from './financial/LedgerPanel';

export function AdminFinancialView() {
  const [overview, setOverview] = useState<AdminFinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    void fetchAdminFinancial().then((res) => {
      setOverview(res.data);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/financial">
          <div className="flex max-w-4xl flex-col gap-6">
            <ViewShell title="Financial" classes={{ root: 'px-0 pt-0' }}>
              {loading ? (
                <PageLoading label="Loading financial data…" />
              ) : !overview ? (
                <p className="text-foreground-secondary py-4 text-center text-sm">
                  Could not load financial data.
                </p>
              ) : (
                <>
                  <StudioPanel title="Fan subscriptions">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <div className="text-foreground-secondary text-xs">
                          Active subscriptions
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
                          Pending payouts
                        </div>
                        <div className="text-lg font-semibold">
                          {overview.pendingPayouts.count} (
                          {formatEur(overview.pendingPayouts.totalNetCents)})
                        </div>
                      </div>
                      {overview.failedPayouts.count > 0 && (
                        <div>
                          <div className="text-foreground-secondary text-xs">
                            Failed payouts
                          </div>
                          <div className="text-accent-red-strong text-lg font-semibold">
                            {overview.failedPayouts.count} (
                            {formatEur(overview.failedPayouts.totalNetCents)})
                          </div>
                        </div>
                      )}
                    </div>
                  </StudioPanel>

                  <FanSubPayoutQueue onChanged={reload} />

                  <LedgerPanel entries={overview.entries} onChanged={reload} />
                </>
              )}
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
