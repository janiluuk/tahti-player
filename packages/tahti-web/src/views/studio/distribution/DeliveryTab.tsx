import { SendIcon } from 'lucide-react';

import { Button, EmptyState } from '@tahti-player/ui';

import type {
  RevelatorBillingStatus,
  RevelatorRoyaltyReportRow,
} from '../../../api/studio-types';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { PageLoading } from '../../../components/PageStates';
import { euros } from './distribution-helpers';

export function DeliveryTab({
  revelatorStatus,
  revelatorId,
  billing,
  busy,
  canSubmit,
  confirmSubmit,
  setConfirmSubmit,
  onSubmit,
  showRoyalties,
  royaltiesLoaded,
  royalties,
}: {
  revelatorStatus: string | null;
  revelatorId: string | null;
  billing: RevelatorBillingStatus | null;
  busy: boolean;
  canSubmit: boolean;
  confirmSubmit: boolean;
  setConfirmSubmit: (open: boolean) => void;
  onSubmit: () => void;
  showRoyalties: boolean;
  royaltiesLoaded: boolean;
  royalties: RevelatorRoyaltyReportRow[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-foreground-secondary text-xs">
        Submits catalog metadata to Revelator (Spotify, Apple, etc.). Requires
        UPC or ISRC on every track.
      </p>
      {revelatorStatus && (
        <p className="text-xs">
          Status: <strong>{revelatorStatus}</strong>
          {revelatorId && (
            <span className="text-foreground-secondary">
              {' '}
              · id {revelatorId}
            </span>
          )}
        </p>
      )}
      {billing && !billing.paid && (
        <p className="text-foreground-secondary text-xs">
          {billing.feeCents === 0 && billing.studioIncludedRemaining != null
            ? `Studio included slot (${billing.studioIncludedRemaining} left this year)`
            : `Distribution fee: ${euros(billing.feeCents)}`}
        </p>
      )}
      {billing?.paid && (
        <p className="text-foreground-secondary text-xs">
          {billing.waived
            ? 'Fee waived (Studio included)'
            : `Distribution fee paid${
                billing.distributionPaidAt
                  ? ` on ${new Date(billing.distributionPaidAt).toLocaleDateString()}`
                  : ''
              }`}
        </p>
      )}
      <Button
        size="sm"
        className="self-start"
        disabled={busy || !canSubmit}
        onClick={() => setConfirmSubmit(true)}
      >
        {!busy && <SendIcon size={14} aria-hidden className="mr-1.5" />}
        {busy
          ? 'Submitting…'
          : billing && !billing.paid && billing.feeCents > 0
            ? `Pay ${euros(billing.feeCents)} & submit`
            : 'Submit to Revelator'}
      </Button>

      <ConfirmDialog
        isOpen={confirmSubmit}
        title="Submit to Revelator?"
        description={
          billing && !billing.paid && billing.feeCents > 0
            ? `You will be taken to checkout to pay ${euros(billing.feeCents)}. Submitting sends this release to stores.`
            : 'This sends the release to Revelator for distribution to stores.'
        }
        confirmLabel="Submit"
        onCancel={() => setConfirmSubmit(false)}
        onConfirm={() => {
          setConfirmSubmit(false);
          onSubmit();
        }}
      />

      {showRoyalties && (
        <div className="border-border border-t pt-3">
          <p className="mb-1 text-xs font-medium">Royalty reports</p>
          {!royaltiesLoaded ? (
            <PageLoading label="Loading…" />
          ) : royalties.length === 0 ? (
            <EmptyState
              size="sm"
              title="No reports yet"
              description="Synced monthly after DSP delivery."
            />
          ) : (
            <ul className="divide-border divide-y text-xs">
              {royalties.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-1.5"
                >
                  <span>{row.periodStart.slice(0, 7)}</span>
                  <span className="text-foreground-secondary">
                    {row.streams != null
                      ? `${row.streams.toLocaleString()} streams · `
                      : ''}
                    {euros(row.amountCents)} {row.currency}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
