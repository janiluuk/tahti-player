import { useState } from 'react';

import { Button, InlineError, Input } from '@tahti-player/ui';

import type { BoardActionResult } from '../../../../api/admin/admin-governance-board';
import {
  cancelAdminElection,
  updateAdminElection,
  type AdminElection,
} from '../../../../api/admin/admin-governance-elections';

type Mode = 'idle' | 'edit' | 'cancel';

/** What the board can still do with an open election. */
export function ElectionActions({
  election,
  onChanged,
}: {
  election: AdminElection;
  onChanged: () => void;
}) {
  const [mode, setMode] = useState<Mode>('idle');
  const [title, setTitle] = useState(election.title);
  const [seats, setSeats] = useState(String(election.seats));
  const [closeAt, setCloseAt] = useState(
    election.nominationsCloseAt?.slice(0, 10) ?? '',
  );
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (election.decidedAt || election.cancelledAt) {
    return null;
  }

  const run = (action: () => Promise<BoardActionResult>) => {
    setBusy(true);
    setError(null);
    void action().then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMode('idle');
      onChanged();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {mode === 'idle' ? (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            aria-label={`Edit election: ${election.title}`}
            onClick={() => setMode('edit')}
          >
            Edit election
          </Button>
          <Button
            size="sm"
            variant="secondary"
            aria-label={`Cancel election: ${election.title}`}
            onClick={() => setMode('cancel')}
          >
            Cancel election
          </Button>
        </div>
      ) : null}
      {mode === 'edit' ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const seatCount = Number(seats);
            if (!title.trim()) {
              setError('Give the election a title.');
              return;
            }
            if (
              !Number.isInteger(seatCount) ||
              seatCount < 1 ||
              seatCount > 20
            ) {
              setError('Seats must be a whole number from 1 to 20.');
              return;
            }
            run(() =>
              updateAdminElection(election.id, {
                title: title.trim(),
                seats: seatCount,
                nominationsCloseAt: closeAt || null,
              }),
            );
          }}
        >
          <Input
            label="Title"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Seats"
            inputMode="numeric"
            value={seats}
            disabled={election.role === 'CHAIR'}
            onChange={(e) => setSeats(e.target.value)}
          />
          <Input
            label="Nominations close"
            type="date"
            value={closeAt}
            onChange={(e) => setCloseAt(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={busy}>
            Save election
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => setMode('idle')}
          >
            Back
          </Button>
        </form>
      ) : null}
      {mode === 'cancel' ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!reason.trim()) {
              setError('Members see why it was cancelled; give the reason.');
              return;
            }
            run(() => cancelAdminElection(election.id, reason));
          }}
        >
          <Input
            label="Why is it cancelled?"
            value={reason}
            maxLength={1000}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button type="submit" size="sm" intent="danger" disabled={busy}>
            Cancel the election
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => setMode('idle')}
          >
            Back
          </Button>
        </form>
      ) : null}
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
    </div>
  );
}
