import { useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { ButtonLink, ViewShell } from '@tahti-player/ui';

import { deleteEvent, type ArtistEvent } from '../../api/events';
import { EventForm } from '../../components/events/EventForm';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { toastWithUndo } from '../../lib/undoToast';

/** Add a new event, or edit an existing one when `eventId` is given. */
export function StudioEventCreateView({ eventId }: { eventId?: string } = {}) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const editing = eventId !== undefined;

  const backToList = useCallback(
    () => navigate({ to: '/studio/schedule', search: { show: 'events' } }),
    [navigate],
  );
  const onMissing = useCallback(() => {
    toast.error(i18n.t('web:toasts.eventNotFound'));
    void backToList();
  }, [backToList]);

  const onSaved = (created: ArtistEvent, isNew: boolean) => {
    if (isNew) {
      toastWithUndo(`Created ${created.title}.`, {
        undo: () => deleteEvent(created.id),
        undoneMessage: `Removed ${created.title}.`,
        onUndone: () => {
          window.dispatchEvent(new Event('tahti-studio-events'));
        },
      });
    }
    void backToList();
  };

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <ViewShell
          title={
            editing
              ? t('studioEventCreateViewStates.editEvent')
              : t('studioEventCreateViewStates.addEvent')
          }
          classes={{ root: 'px-0 pt-0' }}
        >
          <StudioPanel title={t('eventCreate.eventDetails')}>
            <EventForm
              eventId={eventId}
              onSaved={onSaved}
              onMissing={onMissing}
              cancel={
                <ButtonLink
                  to="/studio/schedule"
                  search={{ show: 'events' }}
                  size="sm"
                  variant="secondary"
                >
                  <ArrowLeftIcon size={14} aria-hidden className="mr-1.5" />
                  {t('eventCreate.cancel')}
                </ButtonLink>
              }
            />
          </StudioPanel>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
