import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  CalendarPlusIcon,
  EyeIcon,
  FilePenLineIcon,
  SaveIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  Input,
  Loader,
  Select,
  Textarea,
  ViewShell,
} from '@tahti-player/ui';

import { fetchVenues } from '../../api/client';
import type { EventShareTarget } from '../../api/event-calendar';
import {
  createEvent,
  deleteEvent,
  fetchMyEvents,
  updateEvent,
  type ArtistEvent,
} from '../../api/events';
import type { VenueDirectoryItem } from '../../api/types';
import { EventPreviewDialog } from '../../components/events/EventPreviewDialog';
import { EventShareTargets } from '../../components/events/EventShareTargets';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { toDatetimeLocalValue } from '../../lib/datetimeLocal';
import { toastWithUndo } from '../../lib/undoToast';

/** Add a new event, or edit an existing one when `eventId` is given. */
export function StudioEventCreateView({ eventId }: { eventId?: string } = {}) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const editing = eventId !== undefined;
  const [loadingEvent, setLoadingEvent] = useState(editing);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState('');
  const [location, setLocation] = useState('');
  const [eventUrl, setEventUrl] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareTo, setShareTo] = useState<EventShareTarget[]>([]);
  const [busy, setBusy] = useState(false);
  const [venues, setVenues] = useState<VenueDirectoryItem[]>([]);
  const [venuesFailed, setVenuesFailed] = useState(false);
  const [venuesAttempt, setVenuesAttempt] = useState(0);

  useEffect(() => {
    void fetchVenues().then((result) => {
      setVenues(result.data);
      setVenuesFailed(
        result.meta.source === 'api' && Boolean(result.meta.reason),
      );
    });
  }, [venuesAttempt]);

  useEffect(() => {
    if (eventId === undefined) {
      return;
    }
    let cancelled = false;
    void fetchMyEvents().then((result) => {
      if (cancelled) {
        return;
      }
      const event = result.data.find((candidate) => candidate.id === eventId);
      if (!event) {
        toast.error(i18n.t('web:toasts.eventNotFound'));
        void navigate({ to: '/studio/events' });
        return;
      }
      prefill(event);
      setLoadingEvent(false);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, navigate]);

  function prefill(event: ArtistEvent) {
    setTitle(event.title);
    setDescription(event.description ?? '');
    setPlace(event.place);
    setLocation(event.location);
    setEventUrl(event.eventUrl ?? '');
    setTicketUrl(event.ticketUrl ?? '');
    setImageUrl(event.imageUrl ?? '');
    setStartAt(toDatetimeLocalValue(event.startAt));
    setEndAt(event.endAt ? toDatetimeLocalValue(event.endAt) : '');
  }

  const save = (asDraft: boolean) => {
    const fields = {
      title: title.trim(),
      description: description.trim(),
      place: place.trim(),
      location: location.trim(),
      startAt: new Date(startAt).toISOString(),
      endAt: endAt ? new Date(endAt).toISOString() : null,
    };
    return eventId === undefined
      ? createEvent({
          ...fields,
          eventUrl: eventUrl.trim() || undefined,
          ticketUrl: ticketUrl.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          status: asDraft ? 'DRAFT' : 'PUBLISHED',
          shareTo: asDraft ? [] : shareTo,
        })
      : updateEvent(eventId, {
          ...fields,
          eventUrl: eventUrl.trim(),
          ticketUrl: ticketUrl.trim(),
          imageUrl: imageUrl.trim(),
        });
  };

  const endBeforeStart = Boolean(
    startAt && endAt && new Date(endAt) <= new Date(startAt),
  );
  const canSubmit = Boolean(
    title.trim() &&
    place.trim() &&
    location.trim() &&
    startAt &&
    !endBeforeStart,
  );
  const previewEvent: ArtistEvent = {
    id: eventId ?? 'preview',
    title: title.trim() || t('events.untitled'),
    description: description.trim(),
    place: place.trim(),
    location: location.trim(),
    eventUrl: eventUrl.trim() || null,
    ticketUrl: ticketUrl.trim() || null,
    imageUrl: imageUrl.trim() || null,
    startAt: startAt
      ? new Date(startAt).toISOString()
      : new Date().toISOString(),
    endAt: endAt ? new Date(endAt).toISOString() : null,
    status: 'PUBLISHED',
    publishedAt: null,
    participants: [],
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
            {loadingEvent ? (
              <PageLoading label={t('loading.loading')} />
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const submitter = (event.nativeEvent as SubmitEvent)
                    .submitter as HTMLElement | null;
                  setBusy(true);
                  save(submitter?.dataset.draft === 'true')
                    .then((result) => {
                      setBusy(false);
                      if (!result.ok) {
                        toast.error(result.error);
                        return;
                      }
                      if (!editing) {
                        const created = result.data;
                        toastWithUndo(`Created ${created.title}.`, {
                          undo: () => deleteEvent(created.id),
                          undoneMessage: `Removed ${created.title}.`,
                          onUndone: () => {
                            window.dispatchEvent(
                              new Event('tahti-studio-events'),
                            );
                          },
                        });
                      }
                      void navigate({ to: '/studio/events' });
                    })
                    .catch(() => {
                      setBusy(false);
                      toast.error(
                        editing
                          ? t(
                              'studioEventCreateViewStates.couldNotSaveTheEvent',
                            )
                          : t(
                              'studioEventCreateViewStates.couldNotCreateTheEvent',
                            ),
                      );
                    });
                }}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label={t('eventCreate.title')}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                  <Input
                    label={t('eventCreate.place')}
                    value={place}
                    onChange={(event) => setPlace(event.target.value)}
                    placeholder={t('eventCreate.northernLightsHall')}
                  />
                  <div className="flex flex-col gap-1">
                    <Select
                      id="event-venue"
                      label={t('eventCreate.venueFromDirectory')}
                      placeholder={t('eventCreate.chooseAVenueOrEnter')}
                      options={venues.map((venue) => ({
                        id: venue.slug,
                        label: `${venue.name}${venue.city ? ` · ${venue.city}` : ''}`,
                      }))}
                      onValueChange={(venueSlug) => {
                        const venue = venues.find(
                          (candidate) => candidate.slug === venueSlug,
                        );
                        if (venue) {
                          setPlace(venue.name);
                          setLocation(
                            [venue.city, venue.countryCode]
                              .filter(Boolean)
                              .join(', '),
                          );
                        }
                      }}
                    />
                    {venuesFailed && venues.length === 0 ? (
                      <div
                        role="alert"
                        className="text-accent-red-strong flex flex-wrap items-center gap-2 text-xs"
                      >
                        {t('eventCreate.couldNotLoadTheVenue')}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setVenuesAttempt((n) => n + 1)}
                        >
                          {t('eventCreate.retry')}
                        </Button>
                      </div>
                    ) : null}
                    <Link
                      to="/venues/register"
                      className="text-primary-strong text-xs hover:underline"
                    >
                      {t('eventCreate.registerANewVenue')}
                    </Link>
                  </div>
                  <Input
                    label={t('eventCreate.location')}
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder={t('eventCreate.helsinkiFinland')}
                  />
                  <Input
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    label={t('events.eventPageLinkOptional')}
                    value={eventUrl}
                    onChange={(event) => setEventUrl(event.target.value)}
                    placeholder="https://venue.example/event"
                  />
                  <Input
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    label={t('events.ticketLinkOptional')}
                    value={ticketUrl}
                    onChange={(event) => setTicketUrl(event.target.value)}
                    placeholder="https://tickets.example/event"
                  />
                  <Input
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    label={t('events.coverImageLinkOptional')}
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    placeholder="https://images.example/poster.jpg"
                  />
                </div>
                <Textarea
                  submitOnModEnter
                  label={t('eventCreate.description')}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder={t('eventCreate.whatShouldPeopleExpectSet')}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    type="datetime-local"
                    label={t('eventCreate.start')}
                    value={startAt}
                    onChange={(event) => setStartAt(event.target.value)}
                  />
                  <Input
                    type="datetime-local"
                    label={t('events.endOptional')}
                    value={endAt}
                    onChange={(event) => setEndAt(event.target.value)}
                    error={
                      endBeforeStart ? t('events.endAfterStart') : undefined
                    }
                  />
                </div>
                {!editing ? (
                  <EventShareTargets value={shareTo} onChange={setShareTo} />
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <ButtonLink to="/studio/events" size="sm" variant="secondary">
                    <ArrowLeftIcon size={14} aria-hidden className="mr-1.5" />
                    {t('eventCreate.cancel')}
                  </ButtonLink>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!canSubmit}
                    onClick={() => setPreviewOpen(true)}
                  >
                    <EyeIcon size={16} aria-hidden className="mr-1.5" />
                    {t('events.preview')}
                  </Button>
                  {!editing ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!canSubmit || busy}
                      type="submit"
                      data-draft="true"
                    >
                      <FilePenLineIcon
                        size={16}
                        aria-hidden
                        className="mr-1.5"
                      />
                      {t('events.saveDraft')}
                    </Button>
                  ) : null}
                  <Button size="sm" disabled={!canSubmit || busy} type="submit">
                    {busy ? (
                      <Loader size="sm" shape="circle" className="mr-1.5" />
                    ) : editing ? (
                      <SaveIcon size={16} aria-hidden className="mr-1.5" />
                    ) : (
                      <CalendarPlusIcon
                        size={16}
                        aria-hidden
                        className="mr-1.5"
                      />
                    )}
                    {editing
                      ? busy
                        ? t('studioEventCreateViewStates.saving')
                        : t('studioEventCreateViewStates.saveChanges')
                      : busy
                        ? t('studioEventCreateViewStates.adding')
                        : t('events.publish')}
                  </Button>
                </div>
              </form>
            )}
          </StudioPanel>
        </ViewShell>
        <EventPreviewDialog
          event={previewEvent}
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      </div>
    </StudioGate>
  );
}
