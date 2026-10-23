import { useState } from 'react';

import { Button, InlineError, Textarea } from '@tahti-player/ui';

import {
  answerAdminCorrection,
  type CorrectionAnswer,
} from '../../../../api/admin/admin-governance-corrections';

/** Accept or reject a waiting request, with the note the member reads. */
export function AnswerCorrectionForm({
  id,
  onAnswered,
}: {
  id: string;
  onAnswered: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="w-fit"
        onClick={() => setOpen(true)}
      >
        Answer
      </Button>
    );
  }

  const answer = (state: CorrectionAnswer['state']) => {
    setBusy(true);
    setError(null);
    void answerAdminCorrection(id, { state, resolutionNote: note }).then(
      (result) => {
        setBusy(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setOpen(false);
        onAnswered();
      },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        label="What was decided (the member reads this)"
        description="Answering changes no record by itself. Make the correction where it belongs and say here what you did."
        rows={2}
        value={note}
        maxLength={2000}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => answer('ACCEPTED')}>
          Accept
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => answer('REJECTED')}
        >
          Reject
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
    </div>
  );
}
