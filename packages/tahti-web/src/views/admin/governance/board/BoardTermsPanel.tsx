import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@tahti-player/ui';

import {
  fetchAdminBoardTerms,
  type AdminBoardTerm,
} from '../../../../api/admin/admin-governance-board';
import { BOARD_ROLE_LABELS } from '../../../../api/governance-board';
import { PageEmpty, PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { AddBoardTermForm } from './AddBoardTermForm';
import { EndBoardTermForm } from './EndBoardTermForm';

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isTermCurrent(term: AdminBoardTerm, now = new Date()): boolean {
  return (
    new Date(term.termStart) <= now &&
    (!term.termEnd || new Date(term.termEnd) > now)
  );
}

function termStatus(term: AdminBoardTerm): {
  label: string;
  color: 'green' | 'secondary' | 'blue';
} {
  if (isTermCurrent(term)) {
    return { label: 'Serving', color: 'green' };
  }
  if (new Date(term.termStart) > new Date()) {
    return { label: 'Starts later', color: 'blue' };
  }
  return { label: 'Ended', color: 'secondary' };
}

/** Every board term the association has recorded, current ones first. */
export function BoardTermsPanel() {
  const [terms, setTerms] = useState<AdminBoardTerm[] | null>(null);

  const load = useCallback(async () => {
    const result = await fetchAdminBoardTerms();
    setTerms(result.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = terms
    ? [...terms].sort(
        (a, b) =>
          Number(isTermCurrent(b)) - Number(isTermCurrent(a)) ||
          b.termStart.localeCompare(a.termStart),
      )
    : null;

  return (
    <StudioPanel title="Board terms">
      <AddBoardTermForm onAdded={() => void load()} />
      {sorted === null ? (
        <PageLoading label="Loading board terms…" />
      ) : sorted.length === 0 ? (
        <PageEmpty title="No board terms recorded yet" />
      ) : (
        <ul className="divide-border divide-y">
          {sorted.map((term) => {
            const status = termStatus(term);
            return (
              <li
                key={term.id}
                className="flex flex-col gap-1 py-2 text-sm first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{term.displayName}</span>
                  <span className="text-foreground-secondary text-xs">
                    {BOARD_ROLE_LABELS[term.role]}
                  </span>
                  <Badge variant="pill" color={status.color}>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-foreground-secondary text-xs">
                  {formatDay(term.termStart)} –{' '}
                  {term.termEnd ? formatDay(term.termEnd) : 'open-ended'}
                  {term.endReason ? ` · ${term.endReason}` : ''}
                </p>
                {status.label !== 'Ended' ? (
                  <EndBoardTermForm term={term} onEnded={() => void load()} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </StudioPanel>
  );
}
