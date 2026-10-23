import { useState } from 'react';

import { Badge, Button, InlineError, Input } from '@tahti-player/ui';

import {
  setRecordLegalHold,
  type HoldableRecord,
} from '../../../../api/admin/admin-governance-holds';

/** Hold or release one meeting, document or resolution. Keeps its own copy
 * of the hold so the surrounding list does not have to reload. */
export function LegalHoldControl({
  kind,
  id,
  title,
  legalHoldAt,
  legalHoldReason,
}: {
  kind: HoldableRecord;
  id: string;
  title: string;
  legalHoldAt?: string | null;
  legalHoldReason?: string | null;
}) {
  const [held, setHeld] = useState(Boolean(legalHoldAt));
  const [heldReason, setHeldReason] = useState(legalHoldReason ?? null);
  const [writing, setWriting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = (next: string | null) => {
    setBusy(true);
    setError(null);
    void setRecordLegalHold(kind, id, next).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setHeld(next !== null);
      setHeldReason(next?.trim() || null);
      setWriting(false);
      setReason('');
    });
  };

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {held ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="pill" color="red">
            On legal hold
          </Badge>
          {heldReason ? (
            <span className="text-foreground-secondary">{heldReason}</span>
          ) : null}
          <Button
            size="xs"
            variant="secondary"
            disabled={busy}
            aria-label={`Release hold: ${title}`}
            onClick={() => apply(null)}
          >
            Release hold
          </Button>
        </div>
      ) : writing ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply(reason);
          }}
        >
          <Input
            label="Reason for the hold"
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={busy || !reason.trim()}>
            Hold
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
        </form>
      ) : (
        <Button
          size="xs"
          variant="secondary"
          className="w-fit"
          aria-label={`Legal hold: ${title}`}
          onClick={() => setWriting(true)}
        >
          Legal hold
        </Button>
      )}
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
    </div>
  );
}
