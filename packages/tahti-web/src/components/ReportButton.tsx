import { FlagIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, Select, Textarea, Tooltip } from '@tahti-player/ui';

import {
  submitContentReport,
  type ContentReportReason,
  type ContentReportTarget,
} from '../api/content-reports';

const REASONS: Array<{ id: ContentReportReason; label: string }> = [
  { id: 'COPYRIGHT', label: 'Copyright infringement' },
  { id: 'HARASSMENT', label: 'Harassment or abuse' },
  { id: 'SPAM', label: 'Spam' },
  { id: 'ILLEGAL_CONTENT', label: 'Illegal content' },
  { id: 'OTHER', label: 'Other' },
];

const MAX_DETAILS = 2000;

/** Flag a track, release, channel, collection or comment for the board to review. */
export function ReportButton({
  targetType,
  targetId,
  label,
  defaultReason = 'COPYRIGHT',
  variant = 'secondary',
}: {
  targetType: ContentReportTarget;
  targetId: string;
  /** What's being reported, for the dialog title — e.g. the track name. */
  label: string;
  defaultReason?: ContentReportReason;
  variant?: 'secondary' | 'text';
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ContentReportReason>(defaultReason);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const close = () => {
    setOpen(false);
    setReason(defaultReason);
    setDetails('');
  };

  const send = async () => {
    setSending(true);
    const result = await submitContentReport({
      targetType,
      targetId,
      reason,
      details,
    });
    setSending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Report sent. Thanks — the board will take a look.');
    close();
  };

  return (
    <>
      <Tooltip content="Report" side="top">
        <Button
          size="icon-sm"
          variant={variant}
          aria-label={`Report ${label}`}
          onClick={() => setOpen(true)}
        >
          <FlagIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
      <Dialog.Root isOpen={open} onClose={close} className="max-w-md">
        <Dialog.Title>Report {label}</Dialog.Title>
        <Dialog.Description>
          Reports go to the Tahti board&apos;s moderation queue. You don&apos;t
          need an account, and the artist doesn&apos;t see who reported.
        </Dialog.Description>
        <div className="mt-4 flex flex-col gap-3">
          <Select
            label="Reason"
            value={reason}
            onValueChange={(value) => setReason(value as ContentReportReason)}
            options={REASONS}
          />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground-secondary text-xs">
              Details (optional)
            </span>
            <Textarea
              aria-label="Details"
              rows={4}
              maxLength={MAX_DETAILS}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
            />
          </label>
        </div>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button size="sm" disabled={sending} onClick={() => void send()}>
            {sending ? 'Sending…' : 'Send report'}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
