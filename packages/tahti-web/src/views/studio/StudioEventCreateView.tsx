import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon, CalendarPlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, Select, Textarea, ViewShell } from '@tahti-player/ui';

import { fetchVenues } from '../../api/client';
import { createEvent } from '../../api/events';
import type { VenueDirectoryItem } from '../../api/types';
import { StudioGate } from '../../components/StudioGate';
import { BroadcastSubNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';

export function StudioEventCreateView() {
  const navigate = useNavigate();
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

  const canSubmit = Boolean(
    title.trim() && place.trim() && location.trim() && startAt,
  );

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <BroadcastSubNav current="/studio/events" />
        <ViewShell title="Add event" classes={{ root: 'px-0 pt-0' }}>
          <StudioPanel title="Event details">
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
                <Link to="/studio/events">
                  <Button size="sm" variant="secondary">
                    <ArrowLeftIcon size={14} aria-hidden className="mr-1.5" />
                    Cancel
                  </Button>
                </Link>
                <Button
                  size="sm"
                  disabled={!canSubmit || busy}
                  onClick={() => {
                    setBusy(true);
                    void createEvent({
                      title: title.trim(),
                      description: description.trim(),
                      place: place.trim(),
                      location: location.trim(),
                      eventUrl: eventUrl.trim() || undefined,
                      startAt: new Date(startAt).toISOString(),
                    }).then((result) => {
                      setBusy(false);
                      if (!result.ok) {
                        toast.error(result.error);
                        return;
                      }
                      void navigate({ to: '/studio/events' });
                    });
                  }}
                >
                  <CalendarPlusIcon size={16} aria-hidden className="mr-1.5" />
                  {busy ? 'Adding…' : 'Add event'}
                </Button>
              </div>
            </div>
          </StudioPanel>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
