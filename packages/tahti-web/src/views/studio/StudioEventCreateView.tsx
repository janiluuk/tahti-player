import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  CalendarPlusIcon,
  LoaderCircleIcon,
  SaveIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  ButtonLink,
  Input,
  Select,
  Textarea,
  ViewShell,
} from '@tahti-player/ui';

import { fetchVenues } from '../../api/client';
import {
  createEvent,
  fetchMyEvents,
  updateEvent,
  type ArtistEvent,
} from '../../api/events';
import type { VenueDirectoryItem } from '../../api/types';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { toDatetimeLocalValue } from '../../lib/datetimeLocal';

/** Add a new event, or edit an existing one when `eventId` is given. */
export function StudioEventCreateView({ eventId }: { eventId?: string } = {}) {
  const navigate = useNavigate();
  const editing = eventId !== undefined;
  const [loadingEvent, setLoadingEvent] = useState(editing);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState('');
  const [location, setLocation] = useState('');
  const [eventUrl, setEventUrl] = useState('');
  const [startAt, setStartAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [venues, setVenues] = useState<VenueDirectoryItem[]>([]);

  useEffect(() => {
    void fetchVenues().then((result) => setVenues(result.data));
  }, []);

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
        toast.error('That event could not be found.');
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
    setStartAt(toDatetimeLocalValue(event.startAt));
  }

  const save = () => {
    const fields = {
      title: title.trim(),
      description: description.trim(),
      place: place.trim(),
      location: location.trim(),
      startAt: new Date(startAt).toISOString(),
    };
    return eventId === undefined
      ? createEvent({ ...fields, eventUrl: eventUrl.trim() || undefined })
      : updateEvent(eventId, { ...fields, eventUrl: eventUrl.trim() });
  };

  const canSubmit = Boolean(
    title.trim() && place.trim() && location.trim() && startAt,
  );

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <ViewShell
          title={editing ? 'Edit event' : 'Add event'}
          classes={{ root: 'px-0 pt-0' }}
        >
          <StudioPanel title="Event details">
            {loadingEvent ? (
              <PageLoading label="Loading…" />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                  <Input
                    label="Place"
                    value={place}
                    onChange={(event) => setPlace(event.target.value)}
                    placeholder="Northern Lights Hall"
                  />
                  <div className="flex flex-col gap-1">
                    <Select
                      id="event-venue"
                      label="Venue from directory"
                      placeholder="Choose a venue or enter one below"
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
                    <Link
                      to="/venues/register"
                      className="text-primary text-xs hover:underline"
                    >
                      Register a new venue
                    </Link>
                  </div>
                  <Input
                    label="Location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Helsinki, Finland"
                  />
                  <Input
                    label="Tickets / event link (optional)"
                    value={eventUrl}
                    onChange={(event) => setEventUrl(event.target.value)}
                    placeholder="https://tickets.example/event"
                  />
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary text-xs uppercase">
                    Description
                  </span>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    placeholder="What should people expect — set details, door time, ticketing…"
                  />
                </label>
                <Input
                  type="datetime-local"
                  label="Start"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <ButtonLink to="/studio/events" size="sm" variant="secondary">
                    <ArrowLeftIcon size={14} aria-hidden className="mr-1.5" />
                    Cancel
                  </ButtonLink>
                  <Button
                    size="sm"
                    disabled={!canSubmit || busy}
                    onClick={() => {
                      setBusy(true);
                      save()
                        .then((result) => {
                          setBusy(false);
                          if (!result.ok) {
                            toast.error(result.error);
                            return;
                          }
                          void navigate({ to: '/studio/events' });
                        })
                        .catch(() => {
                          setBusy(false);
                          toast.error(
                            editing
                              ? 'Could not save the event.'
                              : 'Could not create the event.',
                          );
                        });
                    }}
                  >
                    {busy ? (
                      <LoaderCircleIcon
                        size={16}
                        aria-hidden
                        className="mr-1.5 animate-spin"
                      />
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
                        ? 'Saving…'
                        : 'Save changes'
                      : busy
                        ? 'Adding…'
                        : 'Add event'}
                  </Button>
                </div>
              </div>
            )}
          </StudioPanel>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
