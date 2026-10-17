import { useState } from 'react';

import { Button } from '@tahti-player/ui';

import { circulateMotion } from '../../api/governance-motion-circulate';
import { ConfirmDialog } from '../ConfirmDialog';

/** Board only, on a draft: send members a notice asking for seconds. */
export function MotionCirculateControl({ motionId }: { motionId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        variant="secondary"
        className="w-fit"
        disabled={busy || message !== null}
        onClick={() => setConfirming(true)}
      >
        Circulate for seconds
      </Button>
      {message ? (
        <p role="status" className="text-xs">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-accent-red-strong text-xs">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        isOpen={confirming}
        title="Circulate this draft?"
        description="Every member gets a notice asking them to read the draft and second it. A draft is circulated once."
        confirmLabel="Circulate"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          setBusy(true);
          setError(null);
          void circulateMotion(motionId).then((result) => {
            setBusy(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setMessage(
              result.notified === 1
                ? 'Sent to 1 member.'
                : `Sent to ${result.notified} members.`,
            );
          });
        }}
      />
    </div>
  );
}
