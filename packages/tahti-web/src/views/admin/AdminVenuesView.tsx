import { Link } from '@tanstack/react-router';
import { CheckIcon, MapPinIcon, XIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button, InlineError, Input, ViewShell } from '@tahti-player/ui';

import {
  fetchAdminVenues,
  setAdminVenueVerification,
  type AdminVenue,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';

export function AdminVenuesView() {
  const [venues, setVenues] = useState<AdminVenue[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    void fetchAdminVenues().then((result) => {
      setVenues(result.data);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
  };

  useEffect(reload, []);

  const filteredVenues = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return venues;
    }
    return venues.filter((venue) =>
      [
        venue.name,
        venue.slug,
        venue.city,
        venue.countryCode,
        venue.submitter?.username,
        venue.submitter?.displayName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, venues]);

  const toggleVerification = async (venue: AdminVenue) => {
    setBusySlug(venue.slug);
    setError(null);
    const result = await setAdminVenueVerification(
      venue.slug,
      venue.verifiedAt === null,
    );
    setBusySlug(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setVenues((current) =>
      current.map((item) =>
        item.slug === venue.slug
          ? {
              ...item,
              verifiedAt:
                venue.verifiedAt === null ? new Date().toISOString() : null,
            }
          : item,
      ),
    );
  };

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/venues">
          <div className="flex max-w-4xl flex-col gap-6">
            <nav
              aria-label="Breadcrumb"
              className="text-foreground-secondary flex flex-wrap items-center gap-1 text-xs"
            >
              <Link to="/admin" className="hover:underline">
                Admin
              </Link>
              <span aria-hidden>→</span>
              <span aria-current="page">Venues</span>
            </nav>
            <ViewShell
              title="Venues"
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <StudioPanel>
                <div className="flex flex-col gap-3">
                  <Input
                    enterKeyHint="search"
                    type="search"
                    label="Search venues"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Name, city, slug, or submitter"
                  />
                  {error ? <InlineError>{error}</InlineError> : null}
                  {loading ? (
                    <PageLoading label="Loading venues…" />
                  ) : loadError && venues.length === 0 ? (
                    <PageError
                      title="Could not load venues"
                      description={loadError}
                      onRetry={reload}
                    />
                  ) : filteredVenues.length === 0 ? (
                    <PageEmpty
                      title="No venues found"
                      action={
                        query ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setQuery('')}
                          >
                            Clear search
                          </Button>
                        ) : undefined
                      }
                    />
                  ) : (
                    <ul className="divide-border divide-y">
                      {filteredVenues.map((venue) => (
                        <li
                          key={venue.id}
                          className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <MapPinIcon
                            size={17}
                            className="text-primary-strong"
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{venue.name}</p>
                            <p className="text-foreground-secondary text-xs">
                              {venue.city}, {venue.countryCode} · /{venue.slug}{' '}
                              · submitted{' '}
                              {venue.submitter ? (
                                <>
                                  by{' '}
                                  <Link
                                    to="/u/$username"
                                    params={{
                                      username: venue.submitter.username,
                                    }}
                                    className="text-foreground underline underline-offset-2"
                                  >
                                    {venue.submitter.displayName}
                                  </Link>{' '}
                                  on{' '}
                                </>
                              ) : null}
                              {new Date(venue.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            className="gap-1.5"
                            size="sm"
                            variant={venue.verifiedAt ? 'text' : undefined}
                            disabled={busySlug === venue.slug}
                            onClick={() => void toggleVerification(venue)}
                          >
                            {venue.verifiedAt ? (
                              <XIcon size={14} aria-hidden />
                            ) : (
                              <CheckIcon size={14} aria-hidden />
                            )}
                            {venue.verifiedAt ? 'Unverify' : 'Verify'}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </StudioPanel>
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
