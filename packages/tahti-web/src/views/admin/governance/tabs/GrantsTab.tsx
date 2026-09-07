import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Button, Tooltip } from '@tahti-player/ui';

import {
  fetchAdminGrants,
  type AdminGrantYearSummary,
} from '../../../../api/admin';
import { PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';

function formatEur(cents: number): string {
  return `€${(cents / 100).toLocaleString('fi-FI', { minimumFractionDigits: 2 })}`;
}

export function GrantsTab() {
  const [history, setHistory] = useState<AdminGrantYearSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAdminGrants().then((res) => {
      setHistory(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <StudioPanel title="Disbursement history">
        {loading ? (
          <PageLoading label="Loading grant cycles…" />
        ) : history.length === 0 ? (
          <p className="text-foreground-secondary py-4 text-center text-sm">
            No grant cycles have been run yet.
          </p>
        ) : (
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
                <Link
                  to="/admin/grants/$year"
                  params={{ year: String(row.year) }}
                >
                  <Tooltip content={`View ${row.year} grants`} side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={`View ${row.year} grants`}
                    >
                      →
                    </Button>
                  </Tooltip>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </StudioPanel>
      <StudioPanel title="Preview a grant cycle">
        <p className="text-foreground-secondary text-sm">
          Review a dry-run allocation by year. Approval is only enabled when the
          allocation balances to the cent.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            new Date().getUTCFullYear() - 1,
            new Date().getUTCFullYear() - 2,
            new Date().getUTCFullYear() - 3,
          ].map((year) => (
            <Link
              key={year}
              to="/admin/grants/$year"
              params={{ year: String(year) }}
            >
              <Button size="sm" variant="secondary">
                {year}
              </Button>
            </Link>
          ))}
        </div>
      </StudioPanel>
    </>
  );
}
