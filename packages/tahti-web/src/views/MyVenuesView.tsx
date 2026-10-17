import { Link } from '@tanstack/react-router';
import { MapPinIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  Badge,
  Box,
  Button,
  ButtonLink,
  EmptyState,
  ViewShell,
} from '@tahti-player/ui';

import { fetchMyVenues, type MyVenue } from '../api/venues-manage';
import { PageLoading } from '../components/PageStates';
import { VenueDetailsForm } from '../components/venues/VenueDetailsForm';
import { useAuthStore } from '../stores/authStore';

function VenueCard({
  venue,
  onChanged,
}: {
  venue: MyVenue;
  onChanged: () => void;
}) {
  const verified = Boolean(venue.verifiedAt);
  const [editing, setEditing] = useState(false);
  return (
    <Box variant="tertiary" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold">{venue.name}</h2>
        <Badge variant="pill" color={verified ? 'green' : 'yellow'}>
          {verified ? 'Verified' : 'Waiting for board verification'}
        </Badge>
      </div>
      <p className="text-foreground-secondary flex items-center gap-1.5 text-sm">
        <MapPinIcon size={14} aria-hidden />
        {venue.address}, {venue.city}
      </p>
      {verified ? (
        <Link
          to="/v/$slug"
          params={{ slug: venue.slug }}
          className="w-fit text-sm font-medium underline-offset-2 hover:underline"
        >
          Public page
        </Link>
      ) : (
        <p className="text-foreground-secondary text-xs">
          It appears in the venue directory once the board has verified it.
        </p>
      )}
      {editing ? (
        <VenueDetailsForm
          venue={venue}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onChanged();
          }}
        />
      ) : (
        <Button
          size="sm"
          variant="secondary"
          className="w-fit"
          onClick={() => setEditing(true)}
        >
          Edit details
        </Button>
      )}
    </Box>
  );
}

/** Venues the signed-in user registered (GET /api/me/venues). */
export function MyVenuesView() {
  const user = useAuthStore((s) => s.user);
  const [venues, setVenues] = useState<MyVenue[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchMyVenues();
    setVenues(result.data);
    setFailed(
      result.meta.source !== 'api' && result.meta.reason !== 'VITE_FORCE_MOCK',
    );
  }, []);

  useEffect(() => {
    if (user) {
      void load();
    }
  }, [user, load]);

  const registerLink = (
    <ButtonLink to="/venues/register" size="sm" className="w-fit">
      Register a venue
    </ButtonLink>
  );

  return (
    <ViewShell
      title="My venues"
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl', content: 'gap-4' }}
    >
      {!user ? (
        <EmptyState
          title="Sign in to manage your venues"
          action={
            <Link
              to="/login"
              className="text-sm font-medium underline-offset-2 hover:underline"
            >
              Log in
            </Link>
          }
        />
      ) : venues === null ? (
        <PageLoading label="Loading your venues…" />
      ) : failed ? (
        <EmptyState
          title="Could not load your venues"
          description="Try again in a moment."
        />
      ) : venues.length === 0 ? (
        <EmptyState
          title="No venues yet"
          description="Register a venue to list it in the directory and book shows there."
          action={registerLink}
        />
      ) : (
        <>
          {venues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              onChanged={() => void load()}
            />
          ))}
          {registerLink}
        </>
      )}
    </ViewShell>
  );
}
