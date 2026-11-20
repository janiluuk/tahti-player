import { useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon, CalendarDaysIcon } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink, ViewShell } from '@tahti-player/ui';

import type { ArtistEvent } from '../api/events';
import { EventForm } from '../components/events/EventForm';
import { PageGate, PageLoading } from '../components/PageStates';
import { StudioPanel } from '../components/StudioPanel';
import { hasStudioAccess } from '../lib/accountRoles';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

/** Post an event (`/events/new`) or edit one of yours
 * (`/events/$eventId/edit`). Open to every signed-in user. */
export function EventPostView({ eventId }: { eventId?: string } = {}) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const openAuth = useAuthModalStore((s) => s.open);
  const editing = eventId !== undefined;
  const title = editing ? t('eventForm.editTitle') : t('eventForm.postTitle');

  const onMissing = useCallback(() => {
    toast.error(t('eventForm.notYours'));
    void navigate({ to: '/discover', search: { tab: 'events' } });
  }, [navigate, t]);

  const onSaved = (event: ArtistEvent, created: boolean) => {
    toast.success(
      created
        ? t('eventForm.posted', { title: event.title })
        : t('eventForm.saved', { title: event.title }),
    );
    if (event.status === 'DRAFT') {
      void navigate({ to: '/studio/schedule', search: { show: 'events' } });
      return;
    }
    void navigate({ to: '/events/$eventId', params: { eventId: event.id } });
  };

  if (!hydrated) {
    return <PageLoading label={t('loading.loadingSession')} />;
  }

  if (!user) {
    return (
      <PageGate
        page={title}
        icon={<CalendarDaysIcon size={40} className="opacity-40" />}
        title={t('eventForm.signInTitle')}
        description={t('eventForm.signInDescription')}
        action={
          <Button onClick={() => openAuth('login')}>
            {t('eventForm.signIn')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ViewShell
        title={title}
        subtitle={editing ? undefined : t('eventForm.postSubtitle')}
        classes={{ root: 'px-0 pt-0' }}
        data-testid="event-post-page"
      >
        <StudioPanel title={t('eventCreate.eventDetails')}>
          <EventForm
            eventId={eventId}
            artistFeatures={hasStudioAccess(user)}
            onSaved={onSaved}
            onMissing={onMissing}
            cancel={
              editing ? (
                <ButtonLink
                  to="/events/$eventId"
                  params={{ eventId }}
                  size="sm"
                  variant="secondary"
                >
                  <ArrowLeftIcon size={14} aria-hidden className="mr-1.5" />
                  {t('eventCreate.cancel')}
                </ButtonLink>
              ) : (
                <ButtonLink
                  to="/discover"
                  search={{ tab: 'events' }}
                  size="sm"
                  variant="secondary"
                >
                  <ArrowLeftIcon size={14} aria-hidden className="mr-1.5" />
                  {t('eventCreate.cancel')}
                </ButtonLink>
              )
            }
          />
        </StudioPanel>
      </ViewShell>
    </div>
  );
}
