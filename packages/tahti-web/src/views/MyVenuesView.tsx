import { Link } from '@tanstack/react-router';
import { MapPinIcon, SearchIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Box,
  Button,
  ButtonLink,
  EmptyState,
  Input,
  SectionTitle,
  ViewShell,
} from '@tahti-player/ui';

import { fetchMyVenues, type MyVenue } from '../api/venues-manage';
import { PageBackLink } from '../components/PageBackLink';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { VenueDetailsForm } from '../components/venues/VenueDetailsForm';
import { VenueShowsSection } from '../components/venues/VenueShowsSection';
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
      <SectionTitle
        wrap
        title={venue.name}
        badge={verified ? 'Verified' : 'Waiting for board verification'}
        badgeColor={verified ? 'green' : 'yellow'}
      />
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
      <VenueShowsSection venue={venue} onChanged={onChanged} />
    </Box>
  );
}

/** Venues the signed-in user registered (GET /api/me/venues). */
export function MyVenuesView() {
  const user = useAuthStore((s) => s.user);
  const [venues, setVenues] = useState<MyVenue[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const result = await fetchMyVenues();
    setVenues(result.data);
    setFailed(
      Boolean(result.meta.reason) && result.meta.reason !== 'VITE_FORCE_MOCK',
    );
  }, []);

  const filtered = useMemo(() => {
    if (!venues) {
      return [];
    }
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return venues;
    }
    return venues.filter((venue) =>
      [venue.name, venue.city, venue.address, venue.slug].some((text) =>
        text?.toLowerCase().includes(needle),
      ),
    );
  }, [venues, query]);

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
      <PageBackLink
        to="/discover"
        search={{ tab: 'venues' }}
        label="All venues"
      />
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
        <PageError
          title="Could not load your venues"
          onRetry={() => {
            setVenues(null);
            void load();
          }}
        />
      ) : venues.length === 0 ? (
        <EmptyState
          title="No venues yet"
          description="Register a venue to list it in the directory and book shows there."
          action={registerLink}
        />
      ) : (
        <>
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search venues…"
            aria-label="Search venues"
            className="max-w-md"
            startAddon={
              <SearchIcon size={14} aria-hidden className="opacity-70" />
            }
          />
          {filtered.length === 0 ? (
            <PageEmpty
              title={`No venues match “${query.trim()}”`}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setQuery('')}
                >
                  Clear search
                </Button>
              }
            />
          ) : (
            filtered.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                onChanged={() => void load()}
              />
            ))
          )}
          {registerLink}
        </>
      )}
    </ViewShell>
  );
}
