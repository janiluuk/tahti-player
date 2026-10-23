import { useId, useState } from 'react';

import { Button, InlineError, Textarea } from '@tahti-player/ui';

import {
  standForElection,
  withdrawCandidacy,
  type GovernanceElection,
} from '../../api/governance-elections';
import { ConfirmDialog } from '../ConfirmDialog';

const STATEMENT_MAX = 2000;

/** Stand in an election while nominations are open, or withdraw until the
 * result is recorded. */
export function CandidacyControl({
  election,
  onChanged,
}: {
  election: GovernanceElection;
  onChanged: () => void;
}) {
  const statementId = useId();
  const [writing, setWriting] = useState(false);
  const [statement, setStatement] = useState('');
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closed = Boolean(election.decidedAt || election.cancelledAt);

  if (closed || (!election.youAreCandidate && !election.nominationsOpen)) {
    return null;
  }

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(true);
    setError(null);
    void action().then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error ?? 'Something went wrong');
        return;
      }
      setWriting(false);
      setStatement('');
      onChanged();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {election.youAreCandidate ? (
        <Button
          size="sm"
          variant="secondary"
          className="w-fit"
          disabled={busy}
          onClick={() => setConfirmWithdraw(true)}
        >
          Withdraw my candidacy
        </Button>
      ) : writing ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => standForElection(election.id, statement));
          }}
        >
          <Textarea
            id={statementId}
            label="Why you are standing (optional)"
            value={statement}
            maxLength={STATEMENT_MAX}
            rows={3}
            onChange={(e) => setStatement(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? 'Sending…' : 'Stand in this election'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => setWriting(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button size="sm" className="w-fit" onClick={() => setWriting(true)}>
          Stand for election
        </Button>
      )}
      {error && <InlineError textSize="xs">{error}</InlineError>}
      <ConfirmDialog
        isOpen={confirmWithdraw}
        title="Withdraw your candidacy?"
        description={`You will no longer stand in "${election.title}". You can stand again while nominations are open.`}
        confirmLabel="Withdraw"
        onCancel={() => setConfirmWithdraw(false)}
        onConfirm={() => {
          setConfirmWithdraw(false);
          run(() => withdrawCandidacy(election.id));
        }}
      />
    </div>
  );
}
