import { Link, useParams } from '@tanstack/react-router';
import { CheckIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button, SectionShell, ViewShell } from '@tahti-player/ui';

import {
  fetchAdminGrantHistory,
  fetchAdminGrantPreview,
  runAdminGrantCycle,
  type AdminGrantHistoryDetail,
  type AdminGrantPreview,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageLoading } from '../../components/PageStates';
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
            <ViewShell
              title={`${year} grant cycle`}
              classes={{ root: 'px-0 pt-0' }}
            >
              <div className="flex flex-wrap gap-2">
                <a href={`/tahti-api/api/admin/grants/export.csv?year=${year}`}>
                  <Button size="sm" variant="secondary">
                    Board CSV
                  </Button>
                </a>
                <Link to="/admin/governance/$tab" params={{ tab: 'grants' }}>
                  <Button size="sm" variant="secondary">
                    All cycles
                  </Button>
                </Link>
              </div>

              {loading ? (
                <PageLoading label="Loading grant preview…" />
              ) : !preview ? (
                <p className="text-accent-red text-sm">
                  Could not load the grant preview.
                </p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-4">
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
                      <div className="text-xl font-bold">{eligible.length}</div>
                    </StudioPanel>
                    <StudioPanel title="Below threshold">
                      <div className="text-xl font-bold">{belowThreshold}</div>
                    </StudioPanel>
                  </div>

                  <SectionShell title="Per-artist allocation preview">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="text-foreground-secondary border-border border-b text-xs">
                          <tr>
                            <th className="px-2 py-2">Artist</th>
                            <th className="px-2 py-2">Downloads</th>
                            <th className="px-2 py-2">Fan subs</th>
                            <th className="px-2 py-2">Units</th>
                            <th className="px-2 py-2 text-right">Grant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-border divide-y">
                          {[...preview.artists]
                            .sort((left, right) => right.units - left.units)
                            .map((artist) => (
                              <tr key={artist.userId}>
                                <td className="px-2 py-2">
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
                                </td>
                                <td className="px-2 py-2">
                                  {artist.freeDownloads} +{' '}
                                  {artist.paidDownloads}
                                  ×5
                                </td>
                                <td className="px-2 py-2">
                                  €{artist.fanSubEuros}
                                </td>
                                <td className="px-2 py-2">
                                  {artist.units.toLocaleString()}
                                </td>
                                <td className="px-2 py-2 text-right font-medium">
                                  {formatEur(artist.amountCents)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
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
                        <p className="text-accent-red mt-2 text-sm">{error}</p>
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
