import { FlagIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation, type TFunction } from '@tahti-player/i18n';
import { Button, Dialog, Select, Textarea, Tooltip } from '@tahti-player/ui';

import {
  submitContentReport,
  type ContentReportReason,
  type ContentReportTarget,
} from '../api/content-reports';

function reasons(
  t: TFunction<'web'>,
): Array<{ id: ContentReportReason; label: string }> {
  return [
    { id: 'COPYRIGHT', label: t('reportButtonMore.copyrightInfringement') },
    { id: 'HARASSMENT', label: t('reportButtonMore.harassmentOrAbuse') },
    { id: 'SPAM', label: t('reportButtonMore.spam') },
    { id: 'ILLEGAL_CONTENT', label: t('reportButtonMore.illegalContent') },
    { id: 'OTHER', label: t('reportButtonMore.other') },
  ];
}

const MAX_DETAILS = 2000;

/** Flag a track, release, channel, collection or comment for the board to review. */
export function ReportButton({
  targetType,
  targetId,
  label,
  defaultReason = 'COPYRIGHT',
  variant = 'secondary',
  open: openProp,
  onOpenChange,
  showTrigger = true,
  className,
}: {
  targetType: ContentReportTarget;
  targetId: string;
  /** What's being reported, for the dialog title — e.g. the track name. */
  label: string;
  defaultReason?: ContentReportReason;
  variant?: 'secondary' | 'text';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  className?: string;
}) {
  const { t } = useTranslation('web');
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
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
    toast.success(i18n.t('web:toasts.reportSent'));
    close();
  };

  return (
    <>
      {showTrigger ? (
        <Tooltip content={t('reportButton.report')} side="top">
          <Button
            size="icon-sm"
            variant={variant}
            className={className}
            aria-label={t('reportButtonLabels.reportLabel', { label })}
            onClick={() => setOpen(true)}
          >
            <FlagIcon size={14} aria-hidden />
          </Button>
        </Tooltip>
      ) : null}
      <Dialog.Root isOpen={open} onClose={close} className="max-w-md">
        <Dialog.Title>Report {label}</Dialog.Title>
        <Dialog.Description>
          {t('reportButton.reportsGoToTheTahti')}
        </Dialog.Description>
        <form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <div className="mt-4 flex flex-col gap-3">
            <Select
              label={t('reportButton.reason')}
              value={reason}
              onValueChange={(value) => setReason(value as ContentReportReason)}
              options={reasons(t)}
            />
            <Textarea
              submitOnModEnter
              label={t('reportButton.detailsOptional')}
              rows={4}
              maxLength={MAX_DETAILS}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>{t('reportButton.cancel')}</Dialog.Close>
            <Button size="sm" disabled={sending} type="submit">
              {sending
                ? t('reportButtonStates.sending')
                : t('reportButtonStates.sendReport')}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>
    </>
  );
}
