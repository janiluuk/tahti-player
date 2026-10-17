import { useState } from 'react';

import { Button, Input } from '@tahti-player/ui';

import {
  endAdminBoardTerm,
  type AdminBoardTerm,
} from '../../../../api/admin/admin-governance-board';

/** End a serving or future term early (resignation, removal, …). */
export function EndBoardTermForm({
  term,
  onEnded,
}: {
  term: AdminBoardTerm;
  onEnded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [termEnd, setTermEnd] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="w-fit"
        aria-label={`End term early: ${term.displayName}`}
        onClick={() => setOpen(true)}
      >
        End term early
      </Button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!termEnd) {
          setError('Choose the day the term ends.');
          return;
        }
        setBusy(true);
        setError(null);
        void endAdminBoardTerm(term.id, termEnd, reason).then((result) => {
          setBusy(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setOpen(false);
          onEnded();
        });
      }}
    >
      <Input
        label="Term ends on"
        type="date"
        value={termEnd}
        onChange={(e) => setTermEnd(e.target.value)}
      />
      <Input
        label="Why (optional)"
        value={reason}
        maxLength={500}
        onChange={(e) => setReason(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={busy}>
        End term
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
      {error ? (
        <p role="alert" className="text-accent-red-strong w-full text-xs">
          {error}
        </p>
      ) : null}
    </form>
  );
}
