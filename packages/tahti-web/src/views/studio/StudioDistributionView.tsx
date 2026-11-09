import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink, ViewShell } from '@tahti-player/ui';

import { fetchAllRoyalties } from '../../api/distribution';
import { fetchStudioReleases } from '../../api/studio';
import type {
  RevelatorRoyaltyReportRow,
  StudioRelease,
} from '../../api/studio-types';
import { PageBackLink } from '../../components/PageBackLink';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { Eyebrow } from '../../components/tahti/Eyebrow';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { euros } from './distribution/distribution-helpers';
import { ReleaseOpsPanel } from './distribution/ReleaseOpsPanel';

export function StudioDistributionView() {
  const { t } = useTranslation('web');
  const releasesSnapshot = useSnapshotFetch(
    'studio-distribution-releases',
    async () => apiResult(await fetchStudioReleases()).releases ?? [],
  );
  const royaltiesSnapshot = useSnapshotFetch(
    'studio-distribution-royalties',
    async () => apiResult(await fetchAllRoyalties()) ?? [],
  );
  const releases: StudioRelease[] = releasesSnapshot.data ?? [];
  const allRoyalties: RevelatorRoyaltyReportRow[] =
    royaltiesSnapshot.data ?? [];
  const loading = releasesSnapshot.loading;
  const loadError = releasesSnapshot.error;
  const royaltiesError = royaltiesSnapshot.error;
  const retry = () => {
    releasesSnapshot.retry();
    royaltiesSnapshot.retry();
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <ViewShell
          title={t('studioDistribution.title')}
          classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
        >
          <PageBackLink
            to="/studio/releases"
            label={t('studioDistribution.releases')}
          />

          <section className="flex flex-col gap-3">
            <h2>
              <Eyebrow>{t('studioDistribution.releases')}</Eyebrow>
            </h2>
            {!loading && loadError && releases.length > 0 ? (
              <PageErrorBanner
                title={t('studioDistribution.refreshError')}
                description={loadError}
                onRetry={retry}
              />
            ) : null}
            {loading ? (
              <PageLoading label={t('studioDistribution.loading')} />
            ) : loadError && releases.length === 0 ? (
              <PageError
                title={t('studioDistribution.loadError')}
                description={loadError}
                onRetry={retry}
              />
            ) : releases.length === 0 ? (
              <PageEmpty
                title={t('studioDistribution.emptyTitle')}
                description={t('studioDistribution.emptyDescription')}
                action={
                  <ButtonLink
                    to="/studio/releases"
                    size="sm"
                    variant="secondary"
                  >
                    {t('studioDistribution.releases')}
                  </ButtonLink>
                }
              />
            ) : (
              releases.map((release) => (
                <ReleaseOpsPanel key={release.id} release={release} />
              ))
            )}
          </section>

          {royaltiesError ? (
            <PageErrorBanner
              title={t('studioDistribution.royaltiesError')}
              description={royaltiesError}
              onRetry={retry}
            />
          ) : null}

          {allRoyalties.length > 0 && (
            <StudioPanel title={t('studioDistribution.royaltiesTitle')}>
              <ul className="divide-border divide-y text-sm">
                {allRoyalties.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">{row.releaseTitle}</div>
                      <div className="text-foreground-secondary text-xs">
                        {row.periodStart} – {row.periodEnd}
                      </div>
                    </div>
                    <div className="text-foreground-secondary text-xs">
                      {row.streams != null
                        ? `${row.streams.toLocaleString()} streams · `
                        : ''}
                      {euros(row.amountCents)} {row.currency}
                    </div>
                  </li>
                ))}
              </ul>
            </StudioPanel>
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
