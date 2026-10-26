import { PencilLineIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge, Button, InlineError, Select, Textarea } from '@tahti-player/ui';

import {
  CORRECTION_DETAILS_MAX,
  CORRECTION_DETAILS_MIN,
  CORRECTION_SUBJECT_LABELS,
  fetchMyCorrections,
  requestCorrection,
  withdrawCorrection,
  type CorrectionState,
  type CorrectionSubject,
  type GovernanceCorrection,
} from '../../api/governance-corrections';
import { ConfirmDialog } from '../ConfirmDialog';
import { PageError } from '../PageStates';
import { GovernancePanel } from './GovernancePanel';

const STATE_LABELS: Record<
  CorrectionState,
  { label: string; color: 'yellow' | 'green' | 'red' | 'secondary' }
> = {
  OPEN: { label: 'Waiting for the board', color: 'yellow' },
  ACCEPTED: { label: 'Accepted', color: 'green' },
  REJECTED: { label: 'Rejected', color: 'red' },
  WITHDRAWN: { label: 'Withdrawn', color: 'secondary' },
};

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function CorrectionItem({
  correction,
  onChanged,
}: {
  correction: GovernanceCorrection;
  onChanged: () => void;
}) {
  const state = STATE_LABELS[correction.state];
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withdraw = () => {
    setConfirming(false);
    setBusy(true);
    setError(null);
    void withdrawCorrection(correction.id).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onChanged();
    });
  };

  return (
    <li className="flex flex-col gap-1 py-2 text-sm first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">
          {CORRECTION_SUBJECT_LABELS[correction.subject]}
        </span>
        <Badge variant="pill" color={state.color}>
          {state.label}
        </Badge>
      </div>
      <p className="text-foreground-secondary text-xs">
        Sent {formatDay(correction.createdAt)}
      </p>
      <p className="whitespace-pre-line">{correction.details}</p>
      {correction.resolutionNote ? (
        <p className="text-foreground-secondary text-xs">
          Board's answer: {correction.resolutionNote}
        </p>
      ) : null}
      {correction.state === 'OPEN' ? (
        <Button
          size="sm"
          variant="secondary"
          className="w-fit"
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          Withdraw request
        </Button>
      ) : null}
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
      <ConfirmDialog
        isOpen={confirming}
        title="Withdraw this request?"
        description="The board will not answer it. It stays in your list as withdrawn."
        confirmLabel="Withdraw"
        onCancel={() => setConfirming(false)}
        onConfirm={withdraw}
      />
    </li>
  );
}

/** Ask the board to correct your member-register data or a governance
 * record, and follow its answer (/api/v1/governance/corrections). */
export function CorrectionsPanel() {
  const [corrections, setCorrections] = useState<GovernanceCorrection[] | null>(
    null,
  );
  const [subject, setSubject] = useState<CorrectionSubject>('MEMBER_REGISTER');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await fetchMyCorrections();
    setCorrections(result.data);
    setLoadError(
      result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tooShort = details.trim().length < CORRECTION_DETAILS_MIN;

  return (
    <GovernancePanel title="Request a correction" icon={PencilLineIcon}>
      <p className="text-foreground-secondary text-sm">
        Something wrong in your member details or in a published record? Tell
        the board what is wrong and what it should be. You will see their answer
        here.
      </p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (tooShort) {
            setError('Say what is wrong and what it should be.');
            return;
          }
          setBusy(true);
          setError(null);
          setSent(false);
          void requestCorrection({ subject, details }).then((result) => {
            setBusy(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setDetails('');
            setSent(true);
            void load();
          });
        }}
      >
        <Select
          label="What needs correcting"
          value={subject}
          onValueChange={(value) => setSubject(value as CorrectionSubject)}
          options={(
            Object.keys(CORRECTION_SUBJECT_LABELS) as CorrectionSubject[]
          ).map((id) => ({ id, label: CORRECTION_SUBJECT_LABELS[id] }))}
        />
        <Textarea
          submitOnModEnter
          label="What is wrong, and what should it be?"
          rows={3}
          value={details}
          maxLength={CORRECTION_DETAILS_MAX}
          onChange={(e) => setDetails(e.target.value)}
        />
        <Button type="submit" size="sm" className="w-fit" disabled={busy}>
          {busy ? 'Sending…' : 'Send to the board'}
        </Button>
        {error ? <InlineError textSize="xs">{error}</InlineError> : null}
        {sent ? (
          <p role="status" className="text-xs">
            Sent. The board will answer here.
          </p>
        ) : null}
      </form>
      {corrections && corrections.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">Your requests</h3>
          <ul className="divide-border divide-y">
            {corrections.map((correction) => (
              <CorrectionItem
                key={correction.id}
                correction={correction}
                onChanged={() => void load()}
              />
            ))}
          </ul>
        </div>
      ) : loadError ? (
        <PageError
          title="Could not load your requests"
          description={loadError}
          onRetry={() => void load()}
        />
      ) : null}
    </GovernancePanel>
  );
}
