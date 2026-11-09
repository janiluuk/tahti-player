import { useTranslation } from '@tahti-player/i18n';
import { Badge, Dialog } from '@tahti-player/ui';

import type { ArtistEvent } from '../../api/events';
import { EventCard, type EventCardHost } from './EventCard';

/** How the event will look to listeners, rendered from the unsaved form. */
export function EventPreviewDialog({
  event,
  host,
  isOpen,
  onClose,
}: {
  event: ArtistEvent;
  host?: EventCardHost;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('web');
  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <Dialog.Title>{t('events.previewTitle')}</Dialog.Title>
      <Dialog.Description>{t('events.previewDescription')}</Dialog.Description>
      <div className="flex flex-col gap-3 py-3" data-testid="event-preview">
        <EventCard
          event={{ ...event, status: 'PUBLISHED' }}
          host={host}
          badge={
            <Badge variant="pill" color="purple">
              {t('events.previewBadge')}
            </Badge>
          }
        />
      </div>
      <Dialog.Actions>
        <Dialog.Close>{t('events.close')}</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
