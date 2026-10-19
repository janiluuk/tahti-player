import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { ViewShell } from '@tahti-player/ui';

import { fetchTransparencyGrants } from '../api/client';
import type { TransparencyGrantReport } from '../api/types';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';

function centsLabel(raw: string | number) {
  const n = Number(raw);
  return Number.isFinite(n) ? `€${(n / 100).toFixed(2)}` : String(raw);
}

export function TransparencyGrantYearView({ year }: { year: number }) {
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
      title={`Grant report ${year}`}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl' }}
    >
      <Link
        to="/transparency"
        className="text-foreground-secondary text-xs underline-offset-2 hover:underline"
      >
        Transparency overview →
      </Link>
      {loading ? (
        <PageLoading label="Loading grant report…" />
      ) : failed ? (
        <PageError
          title={`Could not load the ${year} grant report`}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : !report ? (
        <PageEmpty title={`No grant report is available for ${year}.`} />
      ) : (
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Total" value={centsLabel(report.totalCents)} />
            <Stat label="Grants" value={String(report.grantCount)} />
            <Stat
              label="Disbursed"
              value={report.disbursedAt ? report.disbursedAt.slice(0, 10) : '—'}
            />
          </div>
          {report.grants.length === 0 ? (
            <PageEmpty title="No grants were made this year." />
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-border text-foreground-secondary border-b text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Published as</th>
                  <th className="py-2 pr-3 font-medium">Amount</th>
                  <th className="py-2 font-medium">State</th>
                </tr>
              </thead>
              <tbody>
                {report.grants.map((grant) => (
                  <tr
                    key={`${grant.publishedAs}-${grant.amountCents}`}
                    className="border-border border-b"
                  >
                    <td className="py-2 pr-3">{grant.publishedAs}</td>
                    <td className="py-2 pr-3">
                      {centsLabel(grant.amountCents)}
                    </td>
                    <td className="text-foreground-secondary py-2 text-xs">
                      {grant.state}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
