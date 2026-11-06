import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink, MediaArtwork } from '@tahti-player/ui';

import { fetchVenues } from '../api/client';
import type { VenueDirectoryItem } from '../api/types';
import { countryFlagAndName } from '../lib/countries';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from './PageStates';

export function VenuesDirectory() {
  const { t } = useTranslation('web');
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
      <ul
        data-testid="venues-directory"
        className="border-border divide-border divide-y overflow-hidden rounded-lg border"
      >
        {venues.map((venue) => {
          const photo = venue.photos?.[1] ?? venue.photos?.[0];
          return (
            <li key={venue.id} className="flex gap-4 px-4 py-3">
              <Link
                to="/v/$slug"
                params={{ slug: venue.slug }}
                tabIndex={-1}
                aria-hidden
                className="h-16 w-24 shrink-0 overflow-hidden rounded-md"
              >
                <MediaArtwork
                  size="fill"
                  src={photo}
                  alt=""
                  seed={venue.slug}
                />
              </Link>
              <div className="flex min-w-0 flex-col items-start gap-1">
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
                  <p className="text-foreground line-clamp-2 text-sm">
                    {venue.description}
                  </p>
                )}
                <ButtonLink
                  to="/v/$slug"
                  params={{ slug: venue.slug }}
                  size="xs"
                  variant="secondary"
                  className="mt-1 gap-1"
                >
                  {t('discover.viewVenue')}
                  <ArrowRightIcon size={14} aria-hidden />
                </ButtonLink>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
