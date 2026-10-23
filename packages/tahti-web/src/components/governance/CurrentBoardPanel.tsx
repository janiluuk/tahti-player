import { ShieldCheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { InlineLoader } from '@tahti-player/ui';

import {
  BOARD_ROLE_LABELS,
  fetchCurrentBoard,
  type BoardSeat,
} from '../../api/governance-board';
import { PageEmpty, PageError } from '../PageStates';
import { GovernancePanel } from './GovernancePanel';

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Who sits on the board today, chair first (GET /api/v1/governance/board). */
export function CurrentBoardPanel() {
  const [seats, setSeats] = useState<BoardSeat[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchCurrentBoard().then((result) => {
      if (cancelled) {
        return;
      }
      setSeats(result.data);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <GovernancePanel title="Board" icon={ShieldCheckIcon}>
      {seats === null ? (
        <InlineLoader label="Loading the board…" />
      ) : loadError ? (
        <PageError
          title="Could not load the board"
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : seats.length === 0 ? (
        <PageEmpty title="No board terms are recorded yet." />
      ) : (
        <ul className="divide-border divide-y">
          {seats.map((seat) => (
            <li key={seat.id} className="py-2 text-sm first:pt-0 last:pb-0">
              <span className="font-medium">{seat.displayName}</span>
              {seat.username ? (
                <span className="text-foreground-secondary ml-2 text-xs">
                  @{seat.username}
                </span>
              ) : null}
              <div className="text-foreground-secondary mt-0.5 text-xs">
                {BOARD_ROLE_LABELS[seat.role]} · since{' '}
                {formatDay(seat.termStart)}
                {seat.termEnd ? `, until ${formatDay(seat.termEnd)}` : ''}
              </div>
            </li>
          ))}
        </ul>
      )}
    </GovernancePanel>
  );
}
