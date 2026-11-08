import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, InlineError } from '@tahti-player/ui';

import { circulateMotion } from '../../api/governance-motion-circulate';
import { ConfirmDialog } from '../ConfirmDialog';
import { ListingDate } from '../ListingDate';

/** Board only, on a draft: send members a notice asking for seconds. */
export function MotionCirculateControl({
  motionId,
  circulatedAt,
}: {
  motionId: string;
  circulatedAt?: string | null;
}) {
  const { t } = useTranslation('web');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (circulatedAt && message === null) {
    return (
      <p className="text-foreground-secondary text-xs">
        Circulated to members for seconds on{' '}
        <ListingDate value={circulatedAt} />.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        variant="secondary"
        className="w-fit"
        disabled={busy || message !== null}
        onClick={() => setConfirming(true)}
      >
        {t('motionCirculateControl.circulateForSeconds')}
      </Button>
      {message ? (
        <p role="status" className="text-xs">
          {message}
        </p>
      ) : null}
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
      <ConfirmDialog
        isOpen={confirming}
        title={t('motionCirculateControl.circulateThisDraft')}
        description={t('motionCirculateControl.everyMemberGetsANotice')}
        confirmLabel={t('motionCirculateControl.circulate')}
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
