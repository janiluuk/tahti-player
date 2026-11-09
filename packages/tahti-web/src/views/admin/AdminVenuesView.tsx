import { Link } from '@tanstack/react-router';
import { CheckIcon, MapPinIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  InlineError,
  Input,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchAdminVenues,
  setAdminVenueVerification,
  type AdminVenue,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminHubBreadcrumb } from '../../components/AdminHubBreadcrumb';
import { AdminPageLayout } from '../../components/AdminNav';
import { ListingDate } from '../../components/ListingDate';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';

export function AdminVenuesView() {
  const { t } = useTranslation('web');
  const [query, setQuery] = useState('');
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const snapshot = useSnapshotFetch('admin-venues', async () =>
    apiResult(await fetchAdminVenues()),
  );
  const venues = snapshot.data ?? [];
  const { loading, error: loadError, retry: reload } = snapshot;
  const setVenues = (update: (current: AdminVenue[]) => AdminVenue[]) =>
    snapshot.mutate((current) => update(current ?? []));

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
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminVenuesView.admin')}
              </BreadcrumbLink>
              <AdminHubBreadcrumb hub="content" />
              <BreadcrumbCurrent>
                {t('adminVenuesView.venues')}
              </BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title={t('adminVenuesView.venues')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <StudioPanel>
                <div className="flex flex-col gap-3">
                  <Input
                    enterKeyHint="search"
                    type="search"
                    label={t('adminVenuesView.searchVenues')}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t('adminVenuesView.nameCitySlugOrSubmitter')}
                  />
                  <p className="text-foreground-secondary text-xs">
                    {t('adminVenuesView.verifyingAVenueOrTaking')}
                  </p>
                  {error ? <InlineError>{error}</InlineError> : null}
                  {loading ? (
                    <PageLoading label={t('loading.loadingVenues')} />
                  ) : loadError && venues.length === 0 ? (
                    <PageError
                      title={t('loadErrors.couldNotLoadVenues')}
                      description={loadError}
                      onRetry={reload}
                    />
                  ) : filteredVenues.length === 0 ? (
                    <PageEmpty
                      title={t('empties.noVenuesFound')}
                      action={
                        query ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setQuery('')}
                          >
                            {t('adminVenuesView.clearSearch')}
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
                              <ListingDate value={venue.createdAt} />
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
