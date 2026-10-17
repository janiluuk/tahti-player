import { useEffect, useState } from 'react';

import { Badge } from '@tahti-player/ui';

import {
  fetchGovernanceLegalHolds,
  type GovernanceLegalHold,
  type LegalHoldKind,
} from '../../../../api/admin/admin-governance-legal-holds';
import { PageEmpty, PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';

const KIND_LABELS: Record<LegalHoldKind, string> = {
  MEETING: 'Meeting',
  DOCUMENT: 'Document',
  RESOLUTION: 'Resolution',
  ANNUAL_REPORT: 'Annual report',
};

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Everything under a legal hold, in one place. Held records are not
 * regenerated, corrected, archived or deleted until released where they live. */
export function LegalHoldsPanel() {
  const [holds, setHolds] = useState<GovernanceLegalHold[] | null>(null);

  useEffect(() => {
    void fetchGovernanceLegalHolds().then((result) => setHolds(result.data));
  }, []);

  return (
    <StudioPanel title="Legal holds">
      {holds === null ? (
        <PageLoading label="Loading legal holds…" />
      ) : holds.length === 0 ? (
        <PageEmpty title="Nothing is on legal hold" />
      ) : (
        <ul className="divide-border divide-y">
          {holds.map((hold) => (
            <li
              key={`${hold.kind}:${hold.id}`}
              className="flex flex-col gap-1 py-2 text-sm first:pt-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="pill" color="secondary">
                  {KIND_LABELS[hold.kind]}
                </Badge>
                <span className="font-medium">{hold.title}</span>
              </div>
              <p className="text-foreground-secondary text-xs">
                Held since {formatDay(hold.legalHoldAt)}
                {hold.legalHoldReason ? ` · ${hold.legalHoldReason}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </StudioPanel>
  );
}
