import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { ImageReveal } from '@tahti-player/ui';

import { fetchVenues } from '../api/client';
import type { VenueDirectoryItem } from '../api/types';
import { countryFlagAndName } from '../lib/countries';
import { PageEmpty, PageLoading } from './PageStates';

export function VenuesDirectory() {
  const [venues, setVenues] = useState<VenueDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchVenues().then((res) => {
      if (cancelled) {
        return;
      }
      setVenues(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <PageLoading label="Loading venues…" />;
  }

  if (venues.length === 0) {
    return (
      <PageEmpty
        title="No verified venues"
        description="No verified venues are available right now."
        action={
          <Link
            to="/venues/register"
            className="text-sm font-medium underline-offset-2 hover:underline"
          >
            Register a venue
          </Link>
        }
      />
    );
  }

  return (
    <ul
      data-testid="venues-directory"
      className="border-border divide-border divide-y overflow-hidden rounded-lg border"
    >
      {venues.map((venue) => {
        const photo = venue.photos?.[1] ?? venue.photos?.[0];
        return (
          <li key={venue.id} className="flex gap-4 px-4 py-3">
            {photo ? (
              <ImageReveal
                src={photo}
                alt=""
                className="h-16 w-24 shrink-0 rounded-md"
              />
            ) : null}
            <div className="flex min-w-0 flex-col gap-1">
              <Link
                to="/v/$slug"
                params={{ slug: venue.slug }}
                className="font-medium hover:underline"
              >
                {venue.name}
              </Link>
              <div className="text-foreground-secondary text-xs">
                {[venue.city, countryFlagAndName(venue.countryCode) || null]
                  .filter(Boolean)
                  .join(', ')}
                {venue.capacity != null ? ` — cap. ${venue.capacity}` : ''}
              </div>
              {venue.description && (
                <p className="text-foreground text-sm">{venue.description}</p>
              )}
              <Link
                to="/v/$slug"
                params={{ slug: venue.slug }}
                className="text-foreground-secondary text-xs underline-offset-2 hover:underline"
              >
                View venue →
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
