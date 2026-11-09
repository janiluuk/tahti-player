import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Box,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  HorizontalScroll,
  SectionShell,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchTransparencyGrants,
  fetchTransparencyLedger,
  fetchTransparencyYtd,
} from '../api/client';
import type {
  TransparencyGrantReport,
  TransparencyLedgerEntry,
  TransparencyYtd,
} from '../api/types';
import { PageBackLink } from '../components/PageBackLink';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';

function rejectedReason(result: PromiseRejectedResult): string {
  return result.reason instanceof Error
    ? result.reason.message
    : 'Request failed';
}

function centsLabel(raw: string) {
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return raw;
  }
  return `€${(n / 100).toFixed(2)}`;
}

export function TransparencyView() {
  const { t } = useTranslation('web');
  const [ytd, setYtd] = useState<TransparencyYtd | null>(null);
  const [grants, setGrants] = useState<TransparencyGrantReport | null>(null);
  const [ledger, setLedger] = useState<TransparencyLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [ytdError, setYtdError] = useState<string | null>(null);
  const [grantsError, setGrantsError] = useState<string | null>(null);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void Promise.allSettled([
      fetchTransparencyYtd(),
      fetchTransparencyGrants(),
      fetchTransparencyLedger(),
    ]).then(([y, g, l]) => {
      if (cancelled) {
        return;
      }
      setYtd(y.status === 'fulfilled' ? y.value.data : null);
      setGrants(g.status === 'fulfilled' ? g.value.data : null);
      setLedger(l.status === 'fulfilled' ? l.value.data : []);
      setYtdError(y.status === 'rejected' ? rejectedReason(y) : null);
      setGrantsError(g.status === 'rejected' ? rejectedReason(g) : null);
      const ledgerReason =
        l.status === 'fulfilled'
          ? l.value.meta.source === 'api'
            ? (l.value.meta.reason ?? null)
            : null
          : rejectedReason(l);
      setLedgerError(ledgerReason);
      setFailed(
        y.status === 'rejected' &&
          g.status === 'rejected' &&
          l.status === 'rejected',
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <ViewShell
      title={t('transparencyPage.transparency')}
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-4xl',
      }}
    >
      <PageBackLink to="/governance" label={t('transparencyPage.governance')} />
      <div className="mb-6 flex flex-col gap-1">
        <Link
          to="/transparency/methodology"
          className="text-foreground-secondary w-fit text-xs underline-offset-2 hover:underline"
        >
          How this data is recorded and published →
        </Link>
        <Link
          to="/governance/history"
          className="text-foreground-secondary w-fit text-xs underline-offset-2 hover:underline"
        >
          Closed governance decisions →
        </Link>
        <Link
          to="/transparency/resolutions"
          className="text-foreground-secondary w-fit text-xs underline-offset-2 hover:underline"
        >
          Board resolutions →
        </Link>
      </div>

      {loading ? (
        <PageLoading label={t('loading.loadingTransparency')} />
      ) : failed ? (
        <PageError
          title={t('loadErrors.couldNotLoadTransparencyData')}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : (
        <>
          {!ytd && ytdError && (
            <SectionShell title={t('transparencyPage.yearToDate')}>
              <PageError
                title={t('loadErrors.couldNotLoadYearToDate')}
                description={ytdError}
                onRetry={() => setAttempt((n) => n + 1)}
              />
            </SectionShell>
          )}

          {ytd && (
            <SectionShell
              title={t('transparencyViewLabels.ytdYear', { year: ytd.year })}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat
                  label={t('transparencyPage.runningSurplus')}
                  value={centsLabel(ytd.runningSurplus)}
                />
                <Stat
                  label={t('transparencyPage.monthsFinalized')}
                  value={String(ytd.monthsFinalized)}
                />
                <Stat
                  label={t('transparencyPage.categories')}
                  value={String(Object.keys(ytd.byCategory).length)}
                />
              </div>
              <HorizontalScroll
                label={t('transparencyViewLabels.spendingYearByCategory', {
                  year: ytd.year,
                })}
                className="mt-3"
              >
                <DataTable>
                  <DataTableHead>
                    <DataTableRow>
                      <DataTableHeaderCell>
                        {t('transparencyPage.category')}
                      </DataTableHeaderCell>
                      <DataTableHeaderCell>
                        {t('transparencyPage.amount')}
                      </DataTableHeaderCell>
                    </DataTableRow>
                  </DataTableHead>
                  <DataTableBody>
                    {Object.entries(ytd.byCategory).map(([cat, amt]) => (
                      <DataTableRow key={cat}>
                        <DataTableCell className="font-mono text-xs">
                          {cat}
                        </DataTableCell>
                        <DataTableCell>{centsLabel(amt)}</DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              </HorizontalScroll>
            </SectionShell>
          )}

          {!grants && grantsError && (
            <SectionShell title={t('transparencyPage.grants')}>
              <PageError
                title={t('loadErrors.couldNotLoadTheGrantsReport')}
                description={grantsError}
                onRetry={() => setAttempt((n) => n + 1)}
              />
            </SectionShell>
          )}

          {grants && (
            <SectionShell
              title={t('transparencyViewLabels.grantsYear', {
                year: grants.year,
              })}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat
                  label={t('transparencyPage.total')}
                  value={centsLabel(grants.totalCents)}
                />
                <Stat
                  label={t('transparencyPage.count')}
                  value={String(grants.grantCount)}
                />
                <Stat
                  label={t('transparencyPage.disbursed')}
                  value={
                    grants.disbursedAt ? grants.disbursedAt.slice(0, 10) : '—'
                  }
                />
              </div>
              <HorizontalScroll
                label={t('transparencyViewLabels.grantsYear', {
                  year: grants.year,
                })}
                className="mt-3"
              >
                <DataTable>
                  <DataTableHead>
                    <DataTableRow>
                      <DataTableHeaderCell>
                        {t('transparencyPage.publishedAs')}
                      </DataTableHeaderCell>
                      <DataTableHeaderCell>
                        {t('transparencyPage.amount')}
                      </DataTableHeaderCell>
                      <DataTableHeaderCell>
                        {t('transparencyPage.state')}
                      </DataTableHeaderCell>
                    </DataTableRow>
                  </DataTableHead>
                  <DataTableBody>
                    {grants.grants.map((g) => (
                      <DataTableRow key={`${g.publishedAs}-${g.amountCents}`}>
                        <DataTableCell>{g.publishedAs}</DataTableCell>
                        <DataTableCell>
                          {centsLabel(g.amountCents)}
                        </DataTableCell>
                        <DataTableCell className="text-foreground-secondary text-xs">
                          {g.state}
                        </DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              </HorizontalScroll>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {Array.from(
                  { length: 5 },
                  (_, index) => grants.year - index - 1,
                ).map((year) => (
                  <Link
                    key={year}
                    to="/transparency/grants/$year"
                    params={{ year: String(year) }}
                    className="border-border hover:bg-background-secondary rounded border px-2 py-1"
                  >
                    Grants {year}
                  </Link>
                ))}
              </div>
            </SectionShell>
          )}

          <SectionShell title={t('transparency.latestLedger')}>
            {ledgerError && ledger.length === 0 ? (
              <PageError
                title={t('transparency.ledgerLoadError')}
                description={ledgerError}
                onRetry={() => setAttempt((n) => n + 1)}
              />
            ) : ledger.length === 0 ? (
              <PageEmpty title={t('transparency.noLedger')} />
            ) : (
              <HorizontalScroll label={t('transparency.latestLedger')}>
                <DataTable>
                  <DataTableHead>
                    <DataTableRow>
                      <DataTableHeaderCell>
                        {t('transparencyPage.when')}
                      </DataTableHeaderCell>
                      <DataTableHeaderCell>
                        {t('transparencyPage.category')}
                      </DataTableHeaderCell>
                      <DataTableHeaderCell>
                        {t('transparencyPage.description')}
                      </DataTableHeaderCell>
                      <DataTableHeaderCell>
                        {t('transparencyPage.amount')}
                      </DataTableHeaderCell>
                    </DataTableRow>
                  </DataTableHead>
                  <DataTableBody>
                    {ledger.map((e) => (
                      <DataTableRow key={e.id}>
                        <DataTableCell className="text-foreground-secondary text-xs whitespace-nowrap">
                          {e.createdAt.slice(0, 10)}
                        </DataTableCell>
                        <DataTableCell className="font-mono text-xs">
                          {e.category}
                        </DataTableCell>
                        <DataTableCell>{e.description}</DataTableCell>
                        <DataTableCell className="whitespace-nowrap">
                          {centsLabel(e.amountCents)}
                        </DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              </HorizontalScroll>
            )}
          </SectionShell>
        </>
      )}
    </ViewShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box variant="secondary" shadow="default" className="flex-col gap-1">
      <div className="text-foreground-secondary text-[10px] tracking-wide uppercase">
        {label}
      </div>
      <div className="font-display text-lg font-bold">{value}</div>
    </Box>
  );
}
