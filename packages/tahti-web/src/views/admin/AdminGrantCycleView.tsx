import { Link, useParams } from '@tanstack/react-router';
import { CheckIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  ButtonAnchor,
  ButtonLink,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  HorizontalScroll,
  InlineError,
  SectionShell,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchAdminGrantHistory,
  fetchAdminGrantPreview,
  runAdminGrantCycle,
  type AdminGrantHistoryDetail,
  type AdminGrantPreview,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminHubBreadcrumb } from '../../components/AdminHubBreadcrumb';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';

const MIN_UNITS = 5;

const formatEur = (cents: number) =>
  `€${(cents / 100).toLocaleString('fi-FI', { minimumFractionDigits: 2 })}`;

const formatEurString = (cents: string) =>
  formatEur(Number.parseInt(cents, 10));

export function AdminGrantCycleView() {
  const { t } = useTranslation('web');
  const { year: rawYear } = useParams({ strict: false }) as { year: string };
  const year = Number.parseInt(rawYear, 10);
  const [preview, setPreview] = useState<AdminGrantPreview | null>(null);
  const [history, setHistory] = useState<AdminGrantHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    void Promise.all([
      fetchAdminGrantPreview(year),
      fetchAdminGrantHistory(year),
    ]).then(([previewResult, historyResult]) => {
      setPreview(previewResult.data);
      setHistory(historyResult.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, [year]);

  const eligible = useMemo(
    () => preview?.artists.filter((artist) => artist.units >= MIN_UNITS) ?? [],
    [preview],
  );
  const belowThreshold = (preview?.artists.length ?? 0) - eligible.length;
  const allocatedCents =
    preview?.artists.reduce((sum, artist) => sum + artist.amountCents, 0) ?? 0;
  const sumCheckOk = preview
    ? allocatedCents + preview.unallocatedCents === preview.poolCents
    : false;
  const alreadyRun = Boolean(
    preview?.alreadyRun || (history?.grantCount ?? 0) > 0,
  );

  const run = async () => {
    setRunning(true);
    setError(null);
    const result = await runAdminGrantCycle(year);
    setRunning(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    load();
  };

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/governance">
          <div className="flex max-w-5xl flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('grantCycle.admin')}
              </BreadcrumbLink>
              <AdminHubBreadcrumb hub="coop" />
              <BreadcrumbLink to="/admin/governance">
                {t('grantCycle.governance')}
              </BreadcrumbLink>
              <BreadcrumbLink
                to="/admin/governance/$tab"
                params={{ tab: 'grants' }}
              >
                {t('grantCycle.grants')}
              </BreadcrumbLink>
              <BreadcrumbCurrent>{year}</BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title={`${year} grant cycle`}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <div className="flex flex-wrap gap-2">
                <ButtonAnchor
                  href={`/tahti-api/api/admin/grants/export.csv?year=${year}`}
                  size="sm"
                  variant="secondary"
                >
                  {t('grantCycle.boardCsv')}
                </ButtonAnchor>
                <ButtonLink
                  to="/admin/governance/$tab"
                  params={{ tab: 'grants' }}
                  size="sm"
                  variant="secondary"
                >
                  {t('grantCycle.allCycles')}
                </ButtonLink>
              </div>

              {loading ? (
                <PageLoading label={t('loading.loadingGrantPreview')} />
              ) : !preview ? (
                <PageError
                  title={t('loadErrors.couldNotLoadTheGrantPreview')}
                  onRetry={load}
                />
              ) : (
                <>
                  <div className="@container">
                    <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @4xl:grid-cols-4">
                      <StudioPanel title={t('grantCycle.pool')}>
                        <div className="text-xl font-bold">
                          {formatEur(preview.poolCents)}
                        </div>
                      </StudioPanel>
                      <StudioPanel title={t('grantCycle.engagementUnits')}>
                        <div className="text-xl font-bold">
                          {preview.totalUnits.toLocaleString()}
                        </div>
                      </StudioPanel>
                      <StudioPanel title={`Eligible ≥${MIN_UNITS}`}>
                        <div className="text-xl font-bold">
                          {eligible.length}
                        </div>
                      </StudioPanel>
                      <StudioPanel title={t('grantCycle.belowThreshold')}>
                        <div className="text-xl font-bold">
                          {belowThreshold}
                        </div>
                      </StudioPanel>
                    </div>
                  </div>

                  <SectionShell
                    title={t('grantCycle.perArtistAllocationPreview')}
                  >
                    {preview.artists.length === 0 ? (
                      <PageEmpty
                        title={`No artist activity in ${year}`}
                        description={t(
                          'empties.downloadsAndFanSubscriptionsCountToward',
                        )}
                      />
                    ) : (
                      <HorizontalScroll
                        label={t('grantCycle.perArtistAllocationPreview')}
                      >
                        <DataTable>
                          <DataTableHead>
                            <DataTableRow>
                              <DataTableHeaderCell>
                                {t('grantCycle.artist')}
                              </DataTableHeaderCell>
                              <DataTableHeaderCell>
                                {t('grantCycle.downloads')}
                              </DataTableHeaderCell>
                              <DataTableHeaderCell>
                                {t('grantCycle.fanSubs')}
                              </DataTableHeaderCell>
                              <DataTableHeaderCell>
                                {t('grantCycle.units')}
                              </DataTableHeaderCell>
                              <DataTableHeaderCell className="text-right">
                                {t('grantCycle.grant')}
                              </DataTableHeaderCell>
                            </DataTableRow>
                          </DataTableHead>
                          <DataTableBody>
                            {[...preview.artists]
                              .sort((left, right) => right.units - left.units)
                              .map((artist) => (
                                <DataTableRow key={artist.userId}>
                                  <DataTableCell>
                                    <Link
                                      to="/u/$username"
                                      params={{ username: artist.username }}
                                      className="hover:underline"
                                    >
                                      {artist.displayName}
                                    </Link>
                                    <div className="text-foreground-secondary text-xs">
                                      @{artist.username}
                                    </div>
                                  </DataTableCell>
                                  <DataTableCell>
                                    {artist.freeDownloads} +{' '}
                                    {artist.paidDownloads}
                                    ×5
                                  </DataTableCell>
                                  <DataTableCell>
                                    €{artist.fanSubEuros}
                                  </DataTableCell>
                                  <DataTableCell>
                                    {artist.units.toLocaleString()}
                                  </DataTableCell>
                                  <DataTableCell className="text-right font-medium">
                                    {formatEur(artist.amountCents)}
                                  </DataTableCell>
                                </DataTableRow>
                              ))}
                          </DataTableBody>
                        </DataTable>
                      </HorizontalScroll>
                    )}
                    <p className="text-foreground-secondary mt-3 text-xs">
                      Sum check: allocations {sumCheckOk ? '=' : '≠'} pool to
                      the cent using largest remainder.
                    </p>
                  </SectionShell>

                  {!alreadyRun && (
                    <StudioPanel title={t('grantCycle.approveDisbursement')}>
                      <p className="text-foreground-secondary text-sm">
                        This creates grant ledger entries for {eligible.length}{' '}
                        eligible artists and notifies each of them of their
                        grant, by email too where they asked for money notices.
                      </p>
                      {error ? (
                        <InlineError className="mt-2">{error}</InlineError>
                      ) : null}
                      <Button
                        className="mt-3"
                        disabled={running || !sumCheckOk}
                        onClick={() => void run()}
                      >
                        {running ? (
                          'Approving…'
                        ) : (
                          <>
                            <CheckIcon
                              size={15}
                              aria-hidden
                              className="mr-1.5"
                            />
                            {t('grantCycle.approveDistribution')}
                          </>
                        )}
                      </Button>
                    </StudioPanel>
                  )}

                  {alreadyRun && history?.grants.length ? (
                    <StudioPanel
                      title={`Disbursed · ${history.grantCount} recipients`}
                    >
                      <ul className="divide-border divide-y">
                        {history.grants.map((grant, index) => (
                          <li
                            key={`${grant.publishedAs ?? 'anonymous'}-${index}`}
                            className="flex justify-between gap-3 py-2 text-sm"
                          >
                            <span>{grant.publishedAs ?? 'Anonymous'}</span>
                            <span>
                              {formatEurString(grant.amountCents)} ·{' '}
                              {grant.state}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </StudioPanel>
                  ) : null}
                </>
              )}
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
