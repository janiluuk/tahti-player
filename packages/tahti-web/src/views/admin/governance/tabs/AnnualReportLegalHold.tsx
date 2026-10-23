import { useState } from 'react';

import { Button, InlineError, Input } from '@tahti-player/ui';

import {
  setAnnualReportLegalHold,
  type AdminAnnualReport,
} from '../../../../api/admin/admin-annual-reports';

/** Put a report on legal hold (with a reason) or release it. */
export function AnnualReportLegalHold({
  report,
  onChanged,
}: {
  report: AdminAnnualReport;
  onChanged: () => void;
}) {
  const [writing, setWriting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = (next: string | null) => {
    setBusy(true);
    setError(null);
    void setAnnualReportLegalHold(report.year, next).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setWriting(false);
      setReason('');
      onChanged();
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      {report.legalHoldAt ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-foreground-secondary">
            Held{report.legalHoldReason ? `: ${report.legalHoldReason}` : ''}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
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
            if (!reason.trim()) {
              setError('Give the reason for the hold.');
              return;
            }
            apply(reason);
          }}
        >
          <Input
            label="Reason for the hold"
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={busy}>
            Hold report
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
          size="sm"
          variant="secondary"
          className="w-fit"
          onClick={() => setWriting(true)}
        >
          Legal hold
        </Button>
      )}
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
    </div>
  );
}
