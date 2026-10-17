import { useState } from 'react';

import { Button, Input, Toggle } from '@tahti-player/ui';

import {
  recordElectionResult,
  type AdminElection,
  type AdminElectionCandidate,
} from '../../../../api/admin/admin-governance-elections';

/** Mark who the meeting elected and the term they start. */
export function ElectionResultForm({
  election,
  candidates,
  onRecorded,
}: {
  election: AdminElection;
  candidates: AdminElectionCandidate[];
  onRecorded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [elected, setElected] = useState<string[]>([]);
  const [termStart, setTermStart] = useState('');
  const [termEnd, setTermEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const standing = candidates.filter(
    (c): c is AdminElectionCandidate & { userId: string } =>
      !c.withdrawnAt && Boolean(c.userId),
  );

  if (election.decidedAt || election.cancelledAt || standing.length === 0) {
    return null;
  }

  if (!open) {
    return (
      <Button size="sm" className="w-fit" onClick={() => setOpen(true)}>
        Record the result
      </Button>
    );
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (elected.length > election.seats) {
          setError(
            `Only ${election.seats === 1 ? 'one seat is' : `${election.seats} seats are`} open.`,
          );
          return;
        }
        if (!termStart) {
          setError('Choose the day the terms start.');
          return;
        }
        setBusy(true);
        setError(null);
        void recordElectionResult(election.id, {
          electedUserIds: elected,
          termStart,
          ...(termEnd ? { termEnd } : {}),
        }).then((result) => {
          setBusy(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setOpen(false);
          onRecorded();
        });
      }}
    >
      <p className="text-xs font-semibold">Elected</p>
      <ul className="flex flex-col gap-1.5">
        {standing.map((candidate) => (
          <li key={candidate.id} className="flex items-center gap-2 text-sm">
            <Toggle
              label={`Elected: ${candidate.displayName}`}
              checked={elected.includes(candidate.userId)}
              onChange={(checked) =>
                setElected((current) =>
                  checked
                    ? [...current, candidate.userId]
                    : current.filter((id) => id !== candidate.userId),
                )
              }
            />
            {candidate.displayName}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Input
          label="Terms start"
          type="date"
          value={termStart}
          onChange={(e) => setTermStart(e.target.value)}
        />
        <Input
          label="Terms end (optional)"
          type="date"
          value={termEnd}
          onChange={(e) => setTermEnd(e.target.value)}
        />
      </div>
      <p className="text-foreground-secondary text-xs">
        Each elected member gets a board term in this role and the election
        closes. Board access is still granted separately.
      </p>
      {error ? (
        <p role="alert" className="text-accent-red-strong text-xs">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          Record result
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
