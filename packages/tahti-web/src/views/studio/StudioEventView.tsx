import { Link } from '@tanstack/react-router';
import { BanIcon, EyeIcon, SendIcon, UserPlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  backButtonCornerClassName,
  BackButtonLink,
  Button,
  EditIconLink,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { cancelEvent, publishEvent } from '../../api/event-calendar';
import {
  fetchMyEvents,
  normalizeEvent,
  type ArtistEvent,
} from '../../api/events';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EventCard } from '../../components/events/EventCard';
import { EventParticipantChips } from '../../components/events/EventParticipantChips';
import { EventParticipantsEditor } from '../../components/events/EventParticipantsEditor';
import { EventPreviewDialog } from '../../components/events/EventPreviewDialog';
import { EventStatusBadge } from '../../components/events/EventStatusBadge';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';

export function StudioEventView({ eventId }: { eventId: string }) {
  const { t } = useTranslation('web');
  const [event, setEvent] = useState<ArtistEvent | null | undefined>(undefined);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [confirm, setConfirm] = useState<'publish' | 'cancel' | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchMyEvents().then((result) => {
      if (!cancelled) {
        const found = result.data.find((item) => item.id === eventId);
        setEvent(found ? normalizeEvent(found) : null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <StudioGate>
      <div className="studio-page-layout relative mx-auto flex max-w-3xl flex-col gap-6">
        <Tooltip
          content={t('studioEventView.backToEvents')}
          side="right"
          wrapperClassName={backButtonCornerClassName}
        >
          <BackButtonLink
            to="/studio/events"
            aria-label={t('studioEventView.backToEvents')}
          />
        </Tooltip>
        {event === undefined ? (
          <PageLoading label={t('loading.loading')} />
        ) : event === null ? (
          <PageEmpty title={t('empties.eventNotFound')} />
        ) : (
          <ViewShell
            title={event.title}
            classes={{ root: 'px-0 pt-0' }}
            actions={
              <EditIconLink
                to="/studio/events/$eventId/edit"
                params={{ eventId: event.id }}
                label={t('studioEventViewLabels.editTitle', {
                  title: event.title,
                })}
              />
            }
          >
            <StudioPanel title={t('studioEventView.eventDetails')}>
              <EventCard
                event={event}
                showPendingTags
                badge={<EventStatusBadge status={event.status} showPublished />}
                actions={
                  event.status !== 'DRAFT' ? (
                    <Link
                      to="/events/$eventId"
                      params={{ eventId: event.id }}
                      className="text-primary-strong text-xs hover:underline"
                    >
                      {t('events.openPublicPage')}
                    </Link>
                  ) : null
                }
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPreviewOpen(true)}
                >
                  <EyeIcon size={15} aria-hidden className="mr-1.5" />
                  {t('events.preview')}
                </Button>
                {event.status !== 'PUBLISHED' ? (
                  <Button size="sm" onClick={() => setConfirm('publish')}>
                    <SendIcon size={15} aria-hidden className="mr-1.5" />
                    {t('events.publish')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setConfirm('cancel')}
                  >
                    <BanIcon
                      size={15}
                      aria-hidden
                      className="text-accent-red-strong mr-1.5"
                    />
                    {t('events.cancelEvent')}
                  </Button>
                )}
              </div>
            </StudioPanel>
            <StudioPanel
              title={t('events.taggedPeople')}
              description={t('events.taggedPeopleDescription')}
              action={
                tagging ? undefined : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setTagging(true)}
                  >
                    <UserPlusIcon size={15} aria-hidden className="mr-1.5" />
                    {t('events.tagSomeone')}
                  </Button>
                )
              }
            >
              {tagging ? (
                <EventParticipantsEditor
                  event={event}
                  onSaved={(saved) => {
                    setEvent(saved);
                    setTagging(false);
                  }}
                />
              ) : event.participants.length > 0 ? (
                <EventParticipantChips
                  participants={event.participants}
                  showStatus
                />
              ) : (
                <p className="text-foreground-secondary text-sm">
                  {t('events.noTags')}
                </p>
              )}
            </StudioPanel>
            <EventPreviewDialog
              event={event}
              isOpen={previewOpen}
              onClose={() => setPreviewOpen(false)}
            />
            <ConfirmDialog
              isOpen={confirm !== null}
              title={
                confirm === 'cancel'
                  ? t('events.cancelConfirmTitle', { title: event.title })
                  : t('events.publishConfirmTitle', { title: event.title })
              }
              description={
                confirm === 'cancel'
                  ? t('events.cancelConfirmDescription')
                  : t('events.publishConfirmDescription')
              }
              confirmLabel={
                confirm === 'cancel'
                  ? t('events.cancelEvent')
                  : t('events.publish')
              }
              cancelLabel={
                confirm === 'cancel' ? t('events.keepEvent') : undefined
              }
              destructive={confirm === 'cancel'}
              onCancel={() => setConfirm(null)}
              onConfirm={() => {
                const action = confirm;
                setConfirm(null);
                void (
                  action === 'cancel'
                    ? cancelEvent(event.id)
                    : publishEvent(event.id)
                ).then((result) => {
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  setEvent(result.data);
                  toast.success(
                    action === 'cancel'
                      ? t('events.cancelled', { title: event.title })
                      : t('events.published', { title: event.title }),
                  );
                });
              }}
            />
          </ViewShell>
        )}
      </div>
    </StudioGate>
  );
}
