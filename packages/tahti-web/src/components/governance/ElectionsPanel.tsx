import { VoteIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@tahti-player/ui';

import { BOARD_ROLE_LABELS } from '../../api/governance-board';
import {
  fetchGovernanceElections,
  type GovernanceElection,
} from '../../api/governance-elections';
import { CandidacyControl } from './CandidacyControl';
import { GovernancePanel } from './GovernancePanel';

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function electionStatus(election: GovernanceElection): string {
  if (election.cancelledAt) {
    return election.cancelReason
      ? `Cancelled: ${election.cancelReason}`
      : 'Cancelled';
  }
  if (election.decidedAt) {
    return `Decided ${formatDay(election.decidedAt)}`;
  }
  if (election.nominationsOpen) {
    return election.nominationsCloseAt
      ? `Nominations open until ${formatDay(election.nominationsCloseAt)}`
      : 'Nominations open';
  }
  return 'Nominations closed, waiting for the meeting';
}

function ElectionItem({
  election,
  onChanged,
}: {
  election: GovernanceElection;
  onChanged: () => void;
}) {
  const seats = election.seats === 1 ? '1 seat' : `${election.seats} seats`;
  return (
    <li className="flex flex-col gap-1.5 py-3 text-sm first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{election.title}</span>
        {election.youAreCandidate ? (
          <Badge variant="pill" color="green">
            You are standing
          </Badge>
        ) : null}
      </div>
      <div className="text-foreground-secondary text-xs">
        {BOARD_ROLE_LABELS[election.role]} · {seats} ·{' '}
        {electionStatus(election)}
      </div>
      {election.candidates.length === 0 ? (
        <PageEmpty title="No candidates yet." />
      ) : (
        <ul
          aria-label={`Candidates in ${election.title}`}
          className="flex flex-col gap-1"
        >
          {election.candidates.map((candidate) => (
            <li
              key={candidate.username ?? candidate.displayName}
              className="text-xs"
            >
              <span className="font-semibold">{candidate.displayName}</span>
              {candidate.username ? (
                <span className="text-foreground-secondary ml-1.5">
                  @{candidate.username}
                </span>
              ) : null}
              {candidate.elected ? (
                <Badge variant="pill" color="green" className="ml-1.5">
                  Elected
                </Badge>
              ) : null}
              {candidate.statement ? (
                <p className="text-foreground-secondary mt-0.5">
                  {candidate.statement}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <CandidacyControl election={election} onChanged={onChanged} />
    </li>
  );
}

/** Board elections with the members standing in them
 * (GET /api/v1/governance/elections). */
export function ElectionsPanel() {
  const [elections, setElections] = useState<GovernanceElection[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchGovernanceElections();
    setElections(result.data);
    setFailed(result.meta.source === 'api' && Boolean(result.meta.reason));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <GovernancePanel title="Board elections" icon={VoteIcon}>
      {elections === null ? (
        <p className="text-foreground-secondary text-sm">Loading elections…</p>
      ) : failed ? (
        <p className="text-foreground-secondary text-sm">
          Could not load the elections. Try again later.
        </p>
      ) : elections.length === 0 ? (
        <PageEmpty title="No board elections have been called yet." />
      ) : (
        <ul className="divide-border divide-y">
          {elections.map((election) => (
            <ElectionItem
              key={election.id}
              election={election}
              onChanged={() => void load()}
            />
          ))}
        </ul>
      )}
    </GovernancePanel>
  );
}
