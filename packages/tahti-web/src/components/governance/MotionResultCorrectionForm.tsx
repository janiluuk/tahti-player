import { useId, useState } from 'react';

import { Button, Input, Textarea, Toggle } from '@tahti-player/ui';

import {
  correctMotionResult,
  type MotionTally,
} from '../../api/governance-motion-certificate';

const FIELDS: Array<{ key: keyof MotionTally; label: string }> = [
  { key: 'YES', label: 'Yes' },
  { key: 'NO', label: 'No' },
  { key: 'ABSTAIN', label: 'Abstain' },
];

/** Board only: append a correction to the result (a note, and optionally a
 * corrected count). The original certificate stays as it was. */
export function MotionResultCorrectionForm({
  motionId,
  current,
  onCorrected,
}: {
  motionId: string;
  current: MotionTally;
  onCorrected: () => void;
}) {
  const noteId = useId();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [withCount, setWithCount] = useState(false);
  const [tally, setTally] = useState<Record<keyof MotionTally, string>>({
    YES: String(current.YES),
    NO: String(current.NO),
    ABSTAIN: String(current.ABSTAIN),
  });
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
        Correct the result
      </Button>
    );
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        let corrected: MotionTally | undefined;
        if (withCount) {
          const values = FIELDS.map(({ key }) => Number(tally[key]));
          if (values.some((v) => !Number.isInteger(v) || v < 0)) {
            setError('Counts are whole numbers from 0.');
            return;
          }
          corrected = { YES: values[0]!, NO: values[1]!, ABSTAIN: values[2]! };
        }
        setBusy(true);
        setError(null);
        void correctMotionResult(motionId, {
          note,
          ...(corrected ? { tally: corrected } : {}),
        }).then((result) => {
          setBusy(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setOpen(false);
          setNote('');
          onCorrected();
        });
      }}
    >
      <Textarea
        id={noteId}
        label="What is being corrected"
        rows={2}
        value={note}
        maxLength={2000}
        onChange={(e) => setNote(e.target.value)}
      />
      <Toggle
        label="Correct the count too"
        showLabel
        checked={withCount}
        onChange={setWithCount}
      />
      {withCount ? (
        <div className="flex flex-wrap gap-2">
          {FIELDS.map(({ key, label }) => (
            <Input
              key={key}
              label={label}
              inputMode="numeric"
              value={tally[key]}
              onChange={(e) => setTally({ ...tally, [key]: e.target.value })}
            />
          ))}
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-accent-red-strong text-xs">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy || !note.trim()}>
          Add correction
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
