import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Box, SectionShell, ViewShell } from '@tahti-player/ui';

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
import { PageLoading } from '../components/PageStates';

function centsLabel(raw: string) {
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return raw;
  }
  return `€${(n / 100).toFixed(2)}`;
}

export function TransparencyView() {
  const [ytd, setYtd] = useState<TransparencyYtd | null>(null);
  const [grants, setGrants] = useState<TransparencyGrantReport | null>(null);
  const [ledger, setLedger] = useState<TransparencyLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchTransparencyYtd(),
      fetchTransparencyGrants(),
      fetchTransparencyLedger(),
    ]).then(([y, g, l]) => {
      if (cancelled) {
        return;
      }
      setYtd(y.data);
      setGrants(g.data);
      setLedger(l.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ViewShell
      title="Transparency"
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-4xl',
        scrollableArea: 'gap-8',
      }}
    >
      <div className="flex flex-col gap-1">
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
        <PageLoading label="Loading transparency…" />
      ) : (
        <>
          {ytd && (
            <SectionShell title={`YTD ${ytd.year}`}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat
                  label="Running surplus"
                  value={centsLabel(ytd.runningSurplus)}
                />
                <Stat
                  label="Months finalized"
                  value={String(ytd.monthsFinalized)}
                />
                <Stat
                  label="Categories"
                  value={String(Object.keys(ytd.byCategory).length)}
                />
              </div>
              <table className="mt-3 w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-border text-foreground-secondary border-b text-xs uppercase">
                    <th className="py-2 pr-3 font-medium">Category</th>
                    <th className="py-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(ytd.byCategory).map(([cat, amt]) => (
                    <tr key={cat} className="border-border border-b">
                      <td className="py-2 pr-3 font-mono text-xs">{cat}</td>
                      <td className="py-2">{centsLabel(amt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionShell>
          )}

          {grants && (
            <SectionShell title={`Grants ${grants.year}`}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat label="Total" value={centsLabel(grants.totalCents)} />
                <Stat label="Count" value={String(grants.grantCount)} />
                <Stat
                  label="Disbursed"
                  value={
                    grants.disbursedAt ? grants.disbursedAt.slice(0, 10) : '—'
                  }
                />
              </div>
              <table className="mt-3 w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-border text-foreground-secondary border-b text-xs uppercase">
                    <th className="py-2 pr-3 font-medium">Published as</th>
                    <th className="py-2 pr-3 font-medium">Amount</th>
                    <th className="py-2 font-medium">State</th>
                  </tr>
                </thead>
                <tbody>
                  {grants.grants.map((g) => (
                    <tr
                      key={`${g.publishedAs}-${g.amountCents}`}
                      className="border-border border-b"
                    >
                      <td className="py-2 pr-3">{g.publishedAs}</td>
                      <td className="py-2 pr-3">{centsLabel(g.amountCents)}</td>
                      <td className="text-foreground-secondary py-2 text-xs">
                        {g.state}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

          <SectionShell title="Latest ledger">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-border text-foreground-secondary border-b text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">When</th>
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 pr-3 font-medium">Description</th>
                  <th className="py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((e) => (
                  <tr key={e.id} className="border-border border-b">
                    <td className="text-foreground-secondary py-2 pr-3 text-xs">
                      {e.createdAt.slice(0, 10)}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {e.category}
                    </td>
                    <td className="py-2 pr-3">{e.description}</td>
                    <td className="py-2">{centsLabel(e.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
