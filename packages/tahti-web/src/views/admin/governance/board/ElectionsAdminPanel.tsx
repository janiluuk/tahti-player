import { useCallback, useEffect, useState } from 'react';

import { Badge, Button, Input, Select } from '@tahti-player/ui';

import {
  createAdminElection,
  fetchAdminElections,
  type AdminElection,
} from '../../../../api/admin/admin-governance-elections';
import {
  BOARD_ROLE_LABELS,
  type GovernanceBoardRole,
} from '../../../../api/governance-board';
import { PageEmpty, PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { BOARD_ROLE_OPTIONS } from './AddBoardTermForm';
import { ElectionActions } from './ElectionActions';

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function electionStage(election: AdminElection): {
  label: string;
  color: 'green' | 'secondary' | 'yellow' | 'red';
} {
  if (election.cancelledAt) {
    return { label: 'Cancelled', color: 'red' };
  }
  if (election.decidedAt) {
    return { label: 'Decided', color: 'secondary' };
  }
  if (
    election.nominationsCloseAt &&
    new Date(election.nominationsCloseAt) <= new Date()
  ) {
    return { label: 'Nominations closed', color: 'yellow' };
  }
  return { label: 'Nominations open', color: 'green' };
}

function NewElectionForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [role, setRole] = useState<GovernanceBoardRole>('MEMBER');
  const [seats, setSeats] = useState('1');
  const [closeAt, setCloseAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button size="sm" className="w-fit" onClick={() => setOpen(true)}>
        Call an election
      </Button>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const seatCount = Number(seats);
        if (!title.trim()) {
          setError('Give the election a title.');
          return;
        }
        if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 20) {
          setError('Seats must be a whole number from 1 to 20.');
          return;
        }
        setBusy(true);
        setError(null);
        void createAdminElection({
          title,
          role,
          seats: seatCount,
          ...(closeAt ? { nominationsCloseAt: closeAt } : {}),
        }).then((result) => {
          setBusy(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setOpen(false);
          setTitle('');
          setCloseAt('');
          onCreated();
        });
      }}
    >
      <Input
        label="Title"
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Select
        label="Role"
        value={role}
        onValueChange={(value) => {
          setRole(value as GovernanceBoardRole);
          if (value === 'CHAIR') {
            setSeats('1');
          }
        }}
        options={BOARD_ROLE_OPTIONS}
      />
      <div className="flex flex-wrap gap-2">
        <Input
          label="Seats"
          inputMode="numeric"
          value={seats}
          disabled={role === 'CHAIR'}
          onChange={(e) => setSeats(e.target.value)}
        />
        <Input
          label="Nominations close (optional)"
          type="date"
          value={closeAt}
          onChange={(e) => setCloseAt(e.target.value)}
        />
      </div>
      {error ? (
        <p role="alert" className="text-accent-red-strong text-sm">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          Call election
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

/** Board elections: call one, follow it to the result. */
export function ElectionsAdminPanel() {
  const [elections, setElections] = useState<AdminElection[] | null>(null);

  const load = useCallback(async () => {
    const result = await fetchAdminElections();
    setElections(result.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <StudioPanel title="Elections">
      <NewElectionForm onCreated={() => void load()} />
      {elections === null ? (
        <PageLoading label="Loading elections…" />
      ) : elections.length === 0 ? (
        <PageEmpty title="No elections called yet" />
      ) : (
        <ul className="divide-border divide-y">
          {elections.map((election) => {
            const stage = electionStage(election);
            return (
              <li
                key={election.id}
                className="flex flex-col gap-1 py-2 text-sm first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{election.title}</span>
                  <Badge variant="pill" color={stage.color}>
                    {stage.label}
                  </Badge>
                </div>
                <p className="text-foreground-secondary text-xs">
                  {BOARD_ROLE_LABELS[election.role]} ·{' '}
                  {election.seats === 1 ? '1 seat' : `${election.seats} seats`}
                  {election.nominationsCloseAt
                    ? ` · nominations close ${formatDay(election.nominationsCloseAt)}`
                    : ''}
                  {election.cancelReason ? ` · ${election.cancelReason}` : ''}
                </p>
                <ElectionActions
                  election={election}
                  onChanged={() => void load()}
                />
              </li>
            );
          })}
        </ul>
      )}
    </StudioPanel>
  );
}
