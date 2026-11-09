import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink, Card, CardGrid, MediaArtwork } from '@tahti-player/ui';

import { fetchVenues } from '../api/client';
import type { VenueDirectoryItem } from '../api/types';
import { countryFlagAndName } from '../lib/countries';
import { DIRECTORY_CARD_GRID } from '../lib/directoryCardGrid';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from './PageStates';

export function VenuesDirectory() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const [venues, setVenues] = useState<VenueDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchVenues().then((res) => {
      if (cancelled) {
        return;
      }
      setVenues(res.data);
      setLoadError(
        res.meta.source === 'api' ? (res.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (loading) {
    return <PageLoading label={t('loading.loadingVenues')} />;
  }

  if (loadError && venues.length === 0) {
    return (
      <PageError
        title={t('loadErrors.couldNotLoadVenues')}
        description={loadError}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  if (venues.length === 0) {
    return (
      <PageEmpty
        title={t('empties.noVerifiedVenues')}
        description={t('empties.noVerifiedVenuesAreAvailableRight')}
        action={
          <ButtonLink to="/venues/register" size="sm">
            {t('discover.registerVenue')}
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {loadError ? (
        <PageErrorBanner
          title={t('loadErrors.couldNotRefreshVenues')}
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : null}
      <CardGrid className={DIRECTORY_CARD_GRID} data-testid="venues-directory">
        {venues.map((venue) => {
          const photo = venue.photos?.[1] ?? venue.photos?.[0];
          const place = [
            venue.city,
            countryFlagAndName(venue.countryCode) || null,
          ]
            .filter(Boolean)
            .join(', ');
          const capacity =
            venue.capacity != null
              ? t('discover.venueCapacity', { capacity: venue.capacity })
              : null;
          return (
            <Card
              key={venue.id}
              surface="neutral"
              image={
                <MediaArtwork
                  size="fill"
                  src={photo}
                  alt=""
                  seed={venue.slug}
                  onArtworkClick={() =>
                    void navigate({
                      to: '/v/$slug',
                      params: { slug: venue.slug },
                    })
                  }
                />
              }
              title={
                <Link
                  to="/v/$slug"
                  params={{ slug: venue.slug }}
                  className="hover:underline"
                >
                  {venue.name}
                </Link>
              }
              subtitle={[place, capacity].filter(Boolean).join(' · ')}
            />
          );
        })}
      </CardGrid>
    </div>
  );
}
