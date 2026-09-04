import { Link } from '@tanstack/react-router';
import { CalendarPlusIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  EmptyState,
  Input,
  SaveButton,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  cancelVenueBroadcast,
  createVenueBroadcast,
  fetchMyVenues,
  patchVenue,
  type MyVenue,
  type VenueBroadcast,
} from '../../api/venues-manage';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ImageUploadField } from '../../components/ImageUploadField';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { Eyebrow } from '../../components/tahti/Eyebrow';

function VenueCard({
  venue,
  onChanged,
}: {
  venue: MyVenue;
  onChanged: () => void;
}) {
  const [name, setName] = useState(venue.name);
  const [address, setAddress] = useState(venue.address);
  const [city, setCity] = useState(venue.city);
  const [capacity, setCapacity] = useState(
    venue.capacity != null ? String(venue.capacity) : '',
  );
  const [imageUrl, setImageUrl] = useState(venue.photos[0] ?? '');
  const [coverUrl, setCoverUrl] = useState(venue.photos[1] ?? '');
  const [pageUrl, setPageUrl] = useState(venue.externalLinks?.website ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [pendingCancel, setPendingCancel] = useState<VenueBroadcast | null>(
    null,
  );

  const [startAt, setStartAt] = useState('');
  const [bookingDesc, setBookingDesc] = useState('');

  const upcoming = venue.broadcasts.filter((b) => b.state !== 'CANCELED');

  return (
    <StudioPanel
      title={venue.name}
      description={`${venue.verifiedAt ? 'Verified' : 'Pending verification'} · /v/${venue.slug}`}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/v/$slug"
          params={{ slug: venue.slug }}
          className="text-sm font-medium underline-offset-2 hover:underline"
        >
          View public page →
        </Link>
        {venue.photos[0] && (
          <img
            src={venue.photos[0]}
            alt=""
            className="border-border h-12 w-12 rounded-md border object-cover"
          />
        )}
        {venue.photos[1] && (
          <img
            src={venue.photos[1]}
            alt=""
            className="border-border h-12 w-20 rounded-md border object-cover"
          />
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Capacity"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Input
          label="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <ImageUploadField
          label="Venue image"
          description="JPEG, PNG, WebP, or GIF"
          value={imageUrl}
          onChange={setImageUrl}
        />
        <ImageUploadField
          label="Cover art"
          description="JPEG, PNG, WebP, or GIF"
          value={coverUrl}
          onChange={setCoverUrl}
        />
        <Input
          label="Venue website"
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {msg && <p className="text-xs">{msg}</p>}
        <SaveButton
          label="Save venue"
          onClick={() => {
            const cap = Number(capacity);
            void patchVenue(venue.slug, {
              name: name.trim(),
              address: address.trim(),
              city: city.trim(),
              capacity: capacity.trim() && Number.isFinite(cap) ? cap : null,
              photos: [imageUrl.trim(), coverUrl.trim()],
              externalLinks: pageUrl.trim()
                ? { ...(venue.externalLinks ?? {}), website: pageUrl.trim() }
                : venue.externalLinks
                  ? Object.fromEntries(
                      Object.entries(venue.externalLinks).filter(
                        ([key]) => key !== 'website',
                      ),
                    )
                  : {},
            }).then((r) => {
              setMsg(r.ok ? 'Venue saved.' : r.error);
              if (r.ok) {
                onChanged();
              }
            });
          }}
        />
      </div>

      <div className="border-border border-t pt-4">
        <div className="mb-2 flex items-center justify-between">
          <Eyebrow className="block">Bookings</Eyebrow>
          {!bookingFormOpen && (
            <Tooltip content="New booking" side="top">
              <Button
                size="icon-sm"
                variant="text"
                onClick={() => setBookingFormOpen(true)}
                aria-label="New booking"
              >
                <PlusIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          )}
        </div>
        {upcoming.length === 0 ? (
          <PageEmpty title="No upcoming bookings" />
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((b) => (
              <li
                key={b.id}
                className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {new Date(b.startAt).toLocaleString()}
                  </div>
                  {b.description && (
                    <div className="text-foreground-secondary text-xs">
                      {b.description}
                    </div>
                  )}
                </div>
                <Tooltip content="Cancel booking" side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={`Cancel booking on ${new Date(b.startAt).toLocaleString()}`}
                    onClick={() => setPendingCancel(b)}
                  >
                    <Trash2Icon size={14} aria-hidden />
                  </Button>
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
        {bookingFormOpen && (
          <div className="border-border bg-background mt-3 flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex flex-wrap items-end gap-2">
              <Input
                type="datetime-local"
                label="Start"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
              />
              <Input
                label="Description"
                value={bookingDesc}
                onChange={(e) => setBookingDesc(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!startAt}
                onClick={() => {
                  void createVenueBroadcast(venue.slug, {
                    startAt: new Date(startAt).toISOString(),
                    description: bookingDesc.trim() || undefined,
                  }).then((r) => {
                    if (!r.ok) {
                      setMsg(r.error);
                    } else {
                      setStartAt('');
                      setBookingDesc('');
                      setBookingFormOpen(false);
                      onChanged();
                    }
                  });
                }}
              >
                <CalendarPlusIcon size={14} aria-hidden className="mr-1.5" />
                Add booking
              </Button>
              <Button
                size="sm"
                variant="text"
                onClick={() => setBookingFormOpen(false)}
              >
                <XIcon size={14} aria-hidden className="mr-1.5" />
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={pendingCancel !== null}
        title={
          pendingCancel
            ? `Cancel the booking on ${new Date(pendingCancel.startAt).toLocaleString()}?`
            : 'Cancel booking?'
        }
        description="The booking is removed from this venue's schedule."
        confirmLabel="Cancel booking"
        cancelLabel="Keep"
        onCancel={() => setPendingCancel(null)}
        onConfirm={() => {
          const booking = pendingCancel;
          setPendingCancel(null);
          if (!booking) {
            return;
          }
          void cancelVenueBroadcast(venue.slug, booking.id).then((result) => {
            if (!result.ok) {
              setMsg(result.error);
              return;
            }
            toast.success('Booking cancelled.');
            onChanged();
          });
        }}
      />
    </StudioPanel>
  );
}

export function StudioVenuesView() {
  const [venues, setVenues] = useState<MyVenue[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    void fetchMyVenues().then((r) => {
      setVenues(r.data);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <StudioNav current="/studio/venues" />
        <ViewShell
          title="Venues"
          subtitle="Your venues and bookings."
          classes={{ root: 'px-0 pt-0' }}
        >
          <div className="mb-4">
            <Link to="/venues/register">
              <Button size="sm" variant="secondary">
                <PlusIcon size={14} aria-hidden className="mr-1.5" />
                Register a venue
              </Button>
            </Link>
          </div>

          {loading ? (
            <PageLoading label="Loading…" />
          ) : venues.length === 0 ? (
            <EmptyState
              size="sm"
              title="No venues yet"
              description="Register one to start booking shows."
              action={
                <Link to="/venues/register">
                  <Button size="sm" variant="secondary">
                    <PlusIcon size={14} aria-hidden className="mr-1.5" />
                    Register a venue
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {venues.map((v) => (
                <VenueCard key={v.id} venue={v} onChanged={reload} />
              ))}
            </div>
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
