import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  ViewShell,
} from '@tahti-player/ui';

import { fetchTransparencyGrants } from '../api/client';
import type { TransparencyGrantReport } from '../api/types';
import { PageBackLink } from '../components/PageBackLink';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';

function centsLabel(raw: string | number) {
  const n = Number(raw);
  return Number.isFinite(n) ? `€${(n / 100).toFixed(2)}` : String(raw);
}

export function TransparencyGrantYearView({ year }: { year: number }) {
  const { t } = useTranslation('web');
  const [report, setReport] = useState<TransparencyGrantReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    fetchTransparencyGrants(year)
      .then((result) => {
        if (!cancelled) {
          setReport(result.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReport(null);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [year, attempt]);

  return (
    <ViewShell
      title={t('transparencyGrantYearViewLabels.grantReportYear', { year })}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl' }}
    >
      <PageBackLink
        to="/transparency"
        label={t('transparencyGrantYearView.transparency')}
      />
      {loading ? (
        <PageLoading label={t('loading.loadingGrantReport')} />
      ) : failed ? (
        <PageError
          title={t('transparencyGrantYearViewLabels.couldNotLoadTheYear', {
            year,
          })}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : !report ? (
        <PageEmpty
          title={t('transparencyGrantYearViewLabels.noGrantReportIsAvailable', {
            year,
          })}
        />
      ) : (
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat
              label={t('transparencyGrantYearView.total')}
              value={centsLabel(report.totalCents)}
            />
            <Stat
              label={t('transparencyGrantYearView.grants')}
              value={String(report.grantCount)}
            />
            <Stat
              label={t('transparencyGrantYearView.disbursed')}
              value={report.disbursedAt ? report.disbursedAt.slice(0, 10) : '—'}
            />
          </div>
          {report.grants.length === 0 ? (
            <PageEmpty title={t('empties.noGrantsThisYear')} />
          ) : (
            <DataTable>
              <DataTableHead>
                <DataTableRow>
                  <DataTableHeaderCell>
                    {t('transparencyGrantYearView.publishedAs')}
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>
                    {t('transparencyGrantYearView.amount')}
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>
                    {t('transparencyGrantYearView.state')}
                  </DataTableHeaderCell>
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {report.grants.map((grant) => (
                  <DataTableRow
                    key={`${grant.publishedAs}-${grant.amountCents}`}
                  >
                    <DataTableCell>{grant.publishedAs}</DataTableCell>
                    <DataTableCell>
                      {centsLabel(grant.amountCents)}
                    </DataTableCell>
                    <DataTableCell className="text-foreground-secondary text-xs">
                      {grant.state}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </section>
      )}
    </ViewShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-background rounded-lg border p-3">
      <div className="text-foreground-secondary text-[10px] tracking-wide uppercase">
        {label}
      </div>
      <div className="font-display mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}
