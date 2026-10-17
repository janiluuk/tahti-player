import { ShieldCheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  BOARD_ROLE_LABELS,
  fetchCurrentBoard,
  type BoardSeat,
} from '../../api/governance-board';
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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchCurrentBoard().then((result) => {
      if (cancelled) {
        return;
      }
      setSeats(result.data);
      setFailed(result.meta.source === 'api' && Boolean(result.meta.reason));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GovernancePanel title="Board" icon={ShieldCheckIcon}>
      {seats === null ? (
        <p className="text-foreground-secondary text-sm">Loading the board…</p>
      ) : failed ? (
        <p className="text-foreground-secondary text-sm">
          Could not load the board. Try again later.
        </p>
      ) : seats.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          No board terms are recorded yet.
        </p>
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
