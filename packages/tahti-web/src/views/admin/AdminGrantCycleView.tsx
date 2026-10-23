import { Link, useParams } from '@tanstack/react-router';
import { CheckIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
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
import { AdminPageLayout } from '../../components/AdminNav';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';

const MIN_UNITS = 5;

const formatEur = (cents: number) =>
  `€${(cents / 100).toLocaleString('fi-FI', { minimumFractionDigits: 2 })}`;

const formatEurString = (cents: string) =>
  formatEur(Number.parseInt(cents, 10));

export function AdminGrantCycleView() {
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
            <nav
              aria-label="Breadcrumb"
              className="text-foreground-secondary flex flex-wrap items-center gap-1 text-xs"
            >
              <Link to="/admin" className="hover:underline">
                Admin
              </Link>
              <span aria-hidden>→</span>
              <Link to="/admin/governance" className="hover:underline">
                Governance
              </Link>
              <span aria-hidden>→</span>
              <Link
                to="/admin/governance/$tab"
                params={{ tab: 'grants' }}
                className="hover:underline"
              >
                Grants
              </Link>
              <span aria-hidden>→</span>
              <span aria-current="page">{year}</span>
            </nav>
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
                  Board CSV
                </ButtonAnchor>
                <ButtonLink
                  to="/admin/governance/$tab"
                  params={{ tab: 'grants' }}
                  size="sm"
                  variant="secondary"
                >
                  All cycles
                </ButtonLink>
              </div>

              {loading ? (
                <PageLoading label="Loading grant preview…" />
              ) : !preview ? (
                <PageError
                  title="Could not load the grant preview"
                  onRetry={load}
                />
              ) : (
                <>
                  <div className="@container">
                    <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @4xl:grid-cols-4">
                      <StudioPanel title="Pool">
                        <div className="text-xl font-bold">
                          {formatEur(preview.poolCents)}
                        </div>
                      </StudioPanel>
                      <StudioPanel title="Engagement units">
                        <div className="text-xl font-bold">
                          {preview.totalUnits.toLocaleString()}
                        </div>
                      </StudioPanel>
                      <StudioPanel title={`Eligible ≥${MIN_UNITS}`}>
                        <div className="text-xl font-bold">
                          {eligible.length}
                        </div>
                      </StudioPanel>
                      <StudioPanel title="Below threshold">
                        <div className="text-xl font-bold">
                          {belowThreshold}
                        </div>
                      </StudioPanel>
                    </div>
                  </div>

                  <SectionShell title="Per-artist allocation preview">
                    {preview.artists.length === 0 ? (
                      <PageEmpty
                        title={`No artist activity in ${year}`}
                        description="Downloads and fan subscriptions count toward a grant; none were recorded this year."
                      />
                    ) : (
                      <HorizontalScroll label="Per-artist allocation preview">
                        <DataTable>
                          <DataTableHead>
                            <DataTableRow>
                              <DataTableHeaderCell>Artist</DataTableHeaderCell>
                              <DataTableHeaderCell>
                                Downloads
                              </DataTableHeaderCell>
                              <DataTableHeaderCell>
                                Fan subs
                              </DataTableHeaderCell>
                              <DataTableHeaderCell>Units</DataTableHeaderCell>
                              <DataTableHeaderCell className="text-right">
                                Grant
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
                    <StudioPanel title="Approve disbursement">
                      <p className="text-foreground-secondary text-sm">
                        This creates grant ledger entries for {eligible.length}{' '}
                        eligible artists.
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
                            Approve distribution
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
