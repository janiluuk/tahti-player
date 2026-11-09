import { Link } from '@tanstack/react-router';
import { CalendarPlusIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  ButtonAnchor,
  ClampedText,
  CopyButton,
  ExternalLink,
} from '@tahti-player/ui';

import { fetchVenueProfile, venueCalendarFeedUrl } from '../api/client';
import type { VenueProfile, VenueUpcomingBroadcast } from '../api/types';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { PageBackLink } from '../components/PageBackLink';
import { PageFrame } from '../components/PageHeader';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { VenueRecordings } from '../components/VenueRecordings';
import { countryFlagAndName } from '../lib/countries';
import { formatScheduleWindow } from '../lib/scheduleTime';
import { syncDocumentMetadata } from '../lib/seo';

export function VenueDetailView({ slug }: { slug: string }) {
  const { t } = useTranslation('web');
  const [venue, setVenue] = useState<VenueProfile | null | undefined>(
    undefined,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setVenue(undefined);
    setLoadError(null);
    void fetchVenueProfile(slug)
      .then((res) => {
        if (cancelled) {
          return;
        }
        const found = res.data;
        setVenue(found);
        setLoadError(
          res.meta.source === 'api' ? (res.meta.reason ?? null) : null,
        );
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
      })
      .catch((err) => {
        if (!cancelled) {
          setVenue(null);
          setLoadError(
            err instanceof Error ? err.message : 'Could not load this venue.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  const backLink = (
    <PageBackLink
      to="/discover"
      search={{ tab: 'venues' }}
      label={t('venueDetailView.allVenues')}
    />
  );

  if (venue === undefined) {
    return (
      <PageFrame maxWidth="3xl">
        {backLink}
        <PageLoading label={t('loading.loadingVenue')} />
      </PageFrame>
    );
  }

  if (venue === null && loadError) {
    return (
      <PageFrame maxWidth="3xl">
        {backLink}
        <PageError
          title={t('loadErrors.couldNotLoadThisVenue')}
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </PageFrame>
    );
  }

  if (venue === null) {
    return (
      <PageFrame maxWidth="3xl">
        {backLink}
        <PageEmpty
          headingLevel={1}
          icon="alert"
          title={t('empties.venueNotFound')}
          description={t('venueDetailViewLabels.noVerifiedVenueMatchesSlug', {
            slug,
          })}
          action={
            <Link
              to="/discover"
              search={{ tab: 'venues' }}
              className="text-sm font-medium underline-offset-2 hover:underline"
            >
              {t('venueDetailView.browseVenues')}
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
            label: t('venueDetailViewFields.capacity'),
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
            <ClampedText lines={3} className="whitespace-pre-line">
              {venue.description}
            </ClampedText>
          ) : (
            <p className="text-foreground-secondary">
              {t('venueDetailView.thisVenueHasnAposT')}
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
            {t('venueDetailView.venueWebsite')}
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
      <VenueRecordings recordings={venue.recordings} />
    </PageFrame>
  );
}

function formatShowTime(show: VenueUpcomingBroadcast): string {
  return formatScheduleWindow(show.startAt, show.endAt, ' ');
}

function VenueUpcomingShows({
  slug,
  broadcasts,
}: {
  slug: string;
  broadcasts: VenueUpcomingBroadcast[];
}) {
  const { t } = useTranslation('web');
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
          {t('venueDetailView.upcomingShows')}
        </h2>
        <div className="flex items-center gap-1.5">
          <ButtonAnchor href={feedUrl} size="sm" variant="secondary" download>
            <CalendarPlusIcon size={14} aria-hidden className="mr-1.5" />
            {t('venueDetailView.addToCalendar')}
          </ButtonAnchor>
          <CopyButton
            text={feedUrl}
            aria-label={t('venueDetailView.copyCalendarFeedLink')}
            toastMessage="Calendar feed link copied. Subscribe to it in your calendar app to keep it up to date."
          />
        </div>
      </div>
      {broadcasts.length === 0 ? (
        <PageEmpty title={t('empties.noVenueShows')} />
      ) : (
        <ul className="divide-border mt-2 divide-y">
          {broadcasts.map((show) => (
            <li key={show.id} className="flex flex-col gap-0.5 py-2 text-sm">
              <span className="flex flex-wrap items-center gap-2">
                <time dateTime={show.startAt} className="font-medium">
                  {formatShowTime(show)}
                </time>
                {show.state === 'LIVE' ? (
                  <Badge variant="pill" color="red">
                    {t('venueDetailView.liveNow')}
                  </Badge>
                ) : null}
              </span>
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
