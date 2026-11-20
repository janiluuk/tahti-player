import { Link } from '@tanstack/react-router';
import {
  CalendarPlusIcon,
  EyeIcon,
  FilePenLineIcon,
  SaveIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Input,
  Loader,
  Select,
  Textarea,
  Toggle,
} from '@tahti-player/ui';

import { fetchVenues } from '../../api/client';
import type { EventShareTarget } from '../../api/event-calendar';
import {
  createEvent,
  fetchMyEvents,
  updateEvent,
  type ArtistEvent,
  type ArtistEventGalleryImage,
  type ArtistEventVenue,
} from '../../api/events';
import type { VenueDirectoryItem } from '../../api/types';
import { toDatetimeLocalValue } from '../../lib/datetimeLocal';
import { PageLoading } from '../PageStates';
import { EventBannerField } from './EventBannerField';
import { EventGalleryField } from './EventGalleryField';
import { EventPreviewDialog } from './EventPreviewDialog';
import { EventShareTargets } from './EventShareTargets';

const NO_VALUE = '';

function viewerTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function timeZoneOptions(current: string): string[] {
  const zones =
    (
      Intl as { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf?.('timeZone') ?? [];
  return current && !zones.includes(current) ? [current, ...zones] : zones;
}

export type EventFormProps = {
  /** Edit this event of the viewer's instead of adding a new one. */
  eventId?: string;
  /** Drafts, fans-only visibility and social announcements are artist
   * (Studio) features; the public `/events/new` form leaves them out. */
  artistFeatures?: boolean;
  cancel: ReactNode;
  onSaved: (event: ArtistEvent, created: boolean) => void;
  /** `eventId` is not one of the viewer's events. Keep it stable
   * (`useCallback`): a new identity reloads the event into the form. */
  onMissing: () => void;
};

/** Add or edit an event: details, venue, banner, time and visibility. */
export function EventForm({
  eventId,
  artistFeatures = true,
  cancel,
  onSaved,
  onMissing,
}: EventFormProps) {
  const { t } = useTranslation('web');
  const editing = eventId !== undefined;
  const [loadingEvent, setLoadingEvent] = useState(editing);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState('');
  const [location, setLocation] = useState('');
  const [eventUrl, setEventUrl] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [gallery, setGallery] = useState<ArtistEventGalleryImage[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [savedGallery, setSavedGallery] = useState<ArtistEventGalleryImage[]>(
    [],
  );
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [timezone, setTimezone] = useState(editing ? '' : viewerTimeZone());
  const [venueId, setVenueId] = useState<string | null>(null);
  const [savedVenue, setSavedVenue] = useState<ArtistEventVenue | null>(null);
  const [fansOnly, setFansOnly] = useState(false);
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
        onMissing();
        return;
      }
      prefill(event);
      setLoadingEvent(false);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, onMissing]);

  function prefill(event: ArtistEvent) {
    setTitle(event.title);
    setDescription(event.description ?? '');
    setPlace(event.place);
    setLocation(event.location);
    setEventUrl(event.eventUrl ?? '');
    setTicketUrl(event.ticketUrl ?? '');
    setImageUrl(event.imageUrl ?? '');
    setGallery(event.gallery ?? []);
    setSavedGallery(event.gallery ?? []);
    setStartAt(toDatetimeLocalValue(event.startAt));
    setEndAt(event.endAt ? toDatetimeLocalValue(event.endAt) : '');
    setTimezone(event.timezone ?? '');
    setVenueId(event.venue?.id ?? null);
    setSavedVenue(event.venue ?? null);
    setFansOnly(event.visibility === 'FANS');
  }

  const save = (asDraft: boolean) => {
    const fields = {
      title: title.trim(),
      description: description.trim(),
      place: place.trim(),
      location: location.trim(),
      startAt: new Date(startAt).toISOString(),
      endAt: endAt ? new Date(endAt).toISOString() : null,
      timezone: timezone || null,
      venueId,
      visibility: fansOnly ? ('FANS' as const) : ('PUBLIC' as const),
    };
    const nextGallery = gallery.map((image) => ({
      url: image.url,
      caption: image.caption.trim(),
    }));
    // Send `gallery` only when it changed, so saving keeps working against
    // an API that does not accept the field yet.
    const galleryField =
      JSON.stringify(nextGallery) !== JSON.stringify(savedGallery)
        ? { gallery: nextGallery }
        : {};
    return eventId === undefined
      ? createEvent({
          ...fields,
          ...galleryField,
          eventUrl: eventUrl.trim() || undefined,
          ticketUrl: ticketUrl.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          status: asDraft ? 'DRAFT' : 'PUBLISHED',
          shareTo: asDraft || fansOnly || !artistFeatures ? [] : shareTo,
        })
      : updateEvent(eventId, {
          ...fields,
          ...galleryField,
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
    !endBeforeStart &&
    !galleryUploading,
  );
  const venueChoices: ArtistEventVenue[] = [
    ...venues.map((venue) => ({
      id: venue.id,
      slug: venue.slug,
      name: venue.name,
      city: venue.city ?? '',
    })),
    ...(savedVenue && !venues.some((venue) => venue.id === savedVenue.id)
      ? [savedVenue]
      : []),
  ];
  const pickedVenue =
    venueChoices.find((candidate) => candidate.id === venueId) ?? null;
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
    timezone: timezone || null,
    venue: pickedVenue,
    visibility: fansOnly ? 'FANS' : 'PUBLIC',
    status: 'PUBLISHED',
    publishedAt: null,
    participants: [],
    gallery,
  };

  if (loadingEvent) {
    return <PageLoading label={t('loading.loading')} />;
  }

  return (
    <>
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
              onSaved(result.data, !editing);
            })
            .catch(() => {
              setBusy(false);
              toast.error(
                editing
                  ? t('studioEventCreateViewStates.couldNotSaveTheEvent')
                  : t('studioEventCreateViewStates.couldNotCreateTheEvent'),
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
              value={venueId ?? NO_VALUE}
              options={[
                { id: NO_VALUE, label: t('events.noVenue') },
                ...venueChoices.map((venue) => ({
                  id: venue.id,
                  label: `${venue.name}${venue.city ? ` · ${venue.city}` : ''}`,
                })),
              ]}
              onValueChange={(nextId) => {
                setVenueId(nextId === NO_VALUE ? null : nextId);
                const venue = venues.find(
                  (candidate) => candidate.id === nextId,
                );
                if (venue) {
                  setPlace(venue.name);
                  setLocation(
                    [venue.city, venue.countryCode].filter(Boolean).join(', '),
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
        </div>
        <EventBannerField
          value={imageUrl}
          onChange={setImageUrl}
          seed={eventId ?? 'new-event'}
        />
        <Textarea
          submitOnModEnter
          label={t('eventCreate.description')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder={t('eventCreate.whatShouldPeopleExpectSet')}
        />
        <EventGalleryField
          value={gallery}
          onChange={setGallery}
          seed={eventId ?? 'new-event'}
          onUploadingChange={setGalleryUploading}
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
            error={endBeforeStart ? t('events.endAfterStart') : undefined}
          />
          <Select
            id="event-timezone"
            label={t('events.timezone')}
            description={t('events.timezoneDescription')}
            value={timezone || NO_VALUE}
            onValueChange={(next) => setTimezone(next === NO_VALUE ? '' : next)}
            options={[
              { id: NO_VALUE, label: t('events.timezoneNotSet') },
              ...timeZoneOptions(timezone).map((zone) => ({
                id: zone,
                label: zone.replace(/_/g, ' '),
              })),
            ]}
          />
        </div>
        {artistFeatures || fansOnly ? (
          <Toggle
            showLabel
            label={t('events.fansOnly')}
            description={t('events.fansOnlyDescription')}
            checked={fansOnly}
            onChange={setFansOnly}
          />
        ) : null}
        {artistFeatures && !editing && !fansOnly ? (
          <EventShareTargets value={shareTo} onChange={setShareTo} />
        ) : null}
        <div className="flex flex-wrap gap-2">
          {cancel}
          <Button
            size="sm"
            variant="secondary"
            disabled={!canSubmit}
            onClick={() => setPreviewOpen(true)}
          >
            <EyeIcon size={16} aria-hidden className="mr-1.5" />
            {t('events.preview')}
          </Button>
          {artistFeatures && !editing ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={!canSubmit || busy}
              type="submit"
              data-draft="true"
            >
              <FilePenLineIcon size={16} aria-hidden className="mr-1.5" />
              {t('events.saveDraft')}
            </Button>
          ) : null}
          <Button size="sm" disabled={!canSubmit || busy} type="submit">
            {busy ? (
              <Loader size="sm" shape="circle" className="mr-1.5" />
            ) : editing ? (
              <SaveIcon size={16} aria-hidden className="mr-1.5" />
            ) : (
              <CalendarPlusIcon size={16} aria-hidden className="mr-1.5" />
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
      <EventPreviewDialog
        event={previewEvent}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
