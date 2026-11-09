import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink, Tooltip } from '@tahti-player/ui';

import {
  fetchAdminGrants,
  type AdminGrantYearSummary,
} from '../../../../api/admin';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { useSnapshotFetch } from '../../../../lib/useSnapshotFetch';

function formatEur(cents: number): string {
  return `€${(cents / 100).toLocaleString('fi-FI', { minimumFractionDigits: 2 })}`;
}

export function GrantsTab() {
  const { t } = useTranslation('web');
  const snapshot = useSnapshotFetch<{
    history: AdminGrantYearSummary[];
    reason: string | null;
  }>('admin-grants', async () => {
    const res = await fetchAdminGrants();
    const reason = res.meta.source === 'api' ? (res.meta.reason ?? null) : null;
    if (reason && res.data.length === 0) {
      throw new Error(reason);
    }
    return { history: res.data, reason };
  });
  const history = snapshot.data?.history ?? [];
  const loadError = snapshot.error ?? snapshot.data?.reason ?? null;
  const { loading, retry: reload } = snapshot;

  return (
    <>
      <StudioPanel title={t('grantsTab.disbursementHistory')}>
        {loading ? (
          <PageLoading label={t('loading.loadingGrantCycles')} />
        ) : loadError && history.length === 0 ? (
          <PageError
            title={t('loadErrors.couldNotLoadGrantCycles')}
            description={loadError}
            onRetry={reload}
          />
        ) : history.length === 0 ? (
          <PageEmpty title={t('empties.noGrantCyclesHaveBeenRun')} />
        ) : (
          <>
            {loadError ? (
              <PageErrorBanner
                title={t('loadErrors.someYearsCouldNotBeLoaded')}
                description={loadError}
                onRetry={reload}
              />
            ) : null}
            <ul className="divide-border divide-y">
              {history.map((row) => (
                <li
                  key={row.year}
                  className="flex items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                >
                  <div className="font-medium">{row.year}</div>
                  <div className="text-foreground-secondary text-xs">
                    {row.grantCount} recipients
                  </div>
                  <div className="text-sm font-medium">
                    {formatEur(row.totalCents)}
                  </div>
                  <Tooltip
                    content={t('grantsTabLabels.viewYearGrants', {
                      year: row.year,
                    })}
                    side="top"
                  >
                    <ButtonLink
                      to="/admin/grants/$year"
                      params={{ year: String(row.year) }}

                      size="icon-sm"
                      variant="text"
                      aria-label={t('grantsTabLabels.viewYearGrants', {
                        year: row.year,
                      })}
                    >
                      →
                    </ButtonLink>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </>
        )}
      </StudioPanel>
      <StudioPanel title={t('grantsTab.previewAGrantCycle')}>
        <p className="text-foreground-secondary text-sm">
          {t('grantsTab.reviewADryRunAllocation')}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            new Date().getUTCFullYear() - 1,
            new Date().getUTCFullYear() - 2,
            new Date().getUTCFullYear() - 3,
          ].map((year) => (
            <ButtonLink
              key={year}
              to="/admin/grants/$year"
              params={{ year: String(year) }}
              size="sm"
              variant="secondary"
            >
              {year}
            </ButtonLink>
          ))}
        </div>
      </StudioPanel>
    </>
  );
}
