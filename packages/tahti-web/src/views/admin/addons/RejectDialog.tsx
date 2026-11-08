import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, Textarea } from '@tahti-player/ui';

import { type AdminAddon } from '../../../api/admin';

export function RejectDialog({
  addon,
  pending,
  onCancel,
  onConfirm,
}: {
  addon: AdminAddon | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (moderationNote: string) => void;
}) {
  const { t } = useTranslation('web');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!addon) {
      setNote('');
    }
  }, [addon]);

  return (
    <Dialog.Root
      isOpen={addon !== null}
      onClose={onCancel}
      className="max-w-md"
    >
      <Dialog.Title>Reject {addon?.name}?</Dialog.Title>
      <Dialog.Description>
        {t('addonReject.aReasonIsRequiredThe')}
      </Dialog.Description>
      <form
        className="contents"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(note.trim());
        }}
      >
        <Textarea
          submitOnModEnter
          aria-label={t('addonReject.rejectionReason')}
          value={note}
          rows={3}
          placeholder={t('addonReject.whyIsThisAddOn')}
          onChange={(event) => setNote(event.target.value)}
        />
        <Dialog.Actions>
          <Dialog.Close>{t('addonReject.cancel')}</Dialog.Close>
          <Button
            disabled={pending || !note.trim()}
            intent="danger"
            type="submit"
          >
            {t('addonReject.reject')}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
