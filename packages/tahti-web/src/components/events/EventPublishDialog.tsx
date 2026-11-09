import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog } from '@tahti-player/ui';

import type { EventShareTarget } from '../../api/event-calendar';
import { EventShareTargets } from './EventShareTargets';

/** Confirm publishing, with the accounts that should announce the event. */
export function EventPublishDialog({
  title,
  isOpen,
  firstPublish,
  onCancel,
  onConfirm,
}: {
  title: string;
  isOpen: boolean;
  firstPublish: boolean;
  onCancel: () => void;
  onConfirm: (shareTo: EventShareTarget[]) => void;
}) {
  const { t } = useTranslation('web');
  const [shareTo, setShareTo] = useState<EventShareTarget[]>([]);
  return (
    <Dialog.Root isOpen={isOpen} onClose={onCancel}>
      <Dialog.Title>{t('events.publishConfirmTitle', { title })}</Dialog.Title>
      <Dialog.Description>
        {t('events.publishConfirmDescription')}
      </Dialog.Description>
      {firstPublish ? (
        <div className="py-3">
          <EventShareTargets value={shareTo} onChange={setShareTo} />
        </div>
      ) : null}
      <Dialog.Actions>
        <Dialog.Close>{t('actions.cancel')}</Dialog.Close>
        <Button onClick={() => onConfirm(firstPublish ? shareTo : [])}>
          {t('events.publish')}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
