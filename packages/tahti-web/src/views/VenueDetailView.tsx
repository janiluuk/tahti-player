import { Link } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  CalendarPlusIcon,
  MapPinIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  ButtonAnchor,
  CopyButton,
  EmptyState,
  ExternalLink,
} from '@tahti-player/ui';

import { fetchVenueProfile, venueCalendarFeedUrl } from '../api/client';
import type { VenueProfile, VenueUpcomingBroadcast } from '../api/types';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { PageFrame } from '../components/PageHeader';
import { PageLoading } from '../components/PageStates';
import { countryFlagAndName } from '../lib/countries';
import { syncDocumentMetadata } from '../lib/seo';

export function VenueDetailView({ slug }: { slug: string }) {
  const [venue, setVenue] = useState<VenueProfile | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    setVenue(undefined);
    void fetchVenueProfile(slug).then((res) => {
      if (cancelled) {
        return;
      }
      const found = res.data;
      setVenue(found);
      if (found) {
        const place = [found.city, found.countryCode]
          .filter(Boolean)
          .join(', ');
        syncDocumentMetadata(window.location.pathname, {
          title: `${found.name} on Tahti`,
          description:
            found.description ??
            `${found.name}${place ? ` — ${place}` : ''} is a verified venue on Tahti.`,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const backLink = (
    <Link
      to="/discover"
      search={{ tab: 'venues' }}
      className="text-foreground-secondary inline-flex w-fit items-center gap-1.5 text-xs hover:underline"
    >
      <ArrowLeftIcon size={13} aria-hidden />
      All venues
    </Link>
  );

  if (venue === undefined) {
    return (
      <PageFrame maxWidth="3xl">
        {backLink}
        <PageLoading label="Loading venue…" />
      </PageFrame>
    );
  }

  if (venue === null) {
    return (
      <PageFrame maxWidth="3xl">
        {backLink}
        <EmptyState
          title="Venue not found"
          description={`No verified venue matches "${slug}".`}
          action={
            <Link
              to="/discover"
              search={{ tab: 'venues' }}
              className="text-sm font-medium underline-offset-2 hover:underline"
            >
              Browse venues
            </Link>
          }
        />
      </PageFrame>
    );
  }

  const placeLabel = [venue.city, countryFlagAndName(venue.countryCode) || null]
    .filter(Boolean)
    .join(', ');

  const headerStats: EntitySocialStat[] =
    venue.capacity != null && venue.capacity > 0
      ? [
          {
            key: 'capacity',
            label: 'Capacity',
            value: venue.capacity,
            icon: UsersIcon,
          },
        ]
      : [];

  const thumb = venue.photos?.[0] ?? null;
  const backdrop = venue.photos?.[1] ?? venue.photos?.[0] ?? null;

  return (
    <PageFrame maxWidth="3xl">
      {backLink}
      <EntitySocialHeader
        title={venue.name}
        imageUrl={thumb}
        location={placeLabel || null}
        description={
          venue.description ? (
            <p className="line-clamp-3 whitespace-pre-line">
              {venue.description}
            </p>
          ) : (
            <p className="text-foreground-secondary">
              This venue hasn&apos;t added a description yet.
            </p>
          )
        }
        backdropUrl={backdrop}
        visualizerPreset="WATER_RIPPLE"
        artworkUrlForVisualizer={thumb}
        stats={headerStats}
        data-testid="venue-social-header"
      >
        {venue.externalLinks?.website ? (
          <ExternalLink
            href={venue.externalLinks.website}
            className="text-sm font-medium"
          >
            Venue website
          </ExternalLink>
        ) : null}
      </EntitySocialHeader>
      {venue.address ? (
        <p className="text-foreground-secondary flex items-center gap-1.5 text-sm">
          <MapPinIcon size={14} aria-hidden />
          {venue.address}
        </p>
      ) : null}
      <VenueUpcomingShows slug={venue.slug} broadcasts={venue.broadcasts} />
    </PageFrame>
  );
}

function formatShowTime(show: VenueUpcomingBroadcast): string {
  const start = new Date(show.startAt);
  const date = start.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = start.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (!show.endAt) {
    return `${date} ${time}`;
  }
  const end = new Date(show.endAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} ${time}–${end}`;
}

function VenueUpcomingShows({
  slug,
  broadcasts,
}: {
  slug: string;
  broadcasts: VenueUpcomingBroadcast[];
}) {
  const feedUrl = venueCalendarFeedUrl(slug);
  return (
    <section
      aria-labelledby="venue-upcoming-title"
      className="border-border rounded-xl border p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="venue-upcoming-title"
          className="font-display text-lg font-bold"
        >
          Upcoming shows
        </h2>
        <div className="flex items-center gap-1.5">
          <ButtonAnchor href={feedUrl} size="sm" variant="secondary" download>
            <CalendarPlusIcon size={14} aria-hidden className="mr-1.5" />
            Add to calendar
          </ButtonAnchor>
          <CopyButton
            text={feedUrl}
            aria-label="Copy calendar feed link"
            toastMessage="Calendar feed link copied. Subscribe to it in your calendar app to keep it up to date."
          />
        </div>
      </div>
      {broadcasts.length === 0 ? (
        <p className="text-foreground-secondary mt-2 text-sm">
          No shows booked here yet.
        </p>
      ) : (
        <ul className="divide-border mt-2 divide-y">
          {broadcasts.map((show) => (
            <li key={show.id} className="flex flex-col gap-0.5 py-2 text-sm">
              <time dateTime={show.startAt} className="font-medium">
                {formatShowTime(show)}
              </time>
              {show.description ? (
                <span className="text-foreground-secondary">
                  {show.description}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
