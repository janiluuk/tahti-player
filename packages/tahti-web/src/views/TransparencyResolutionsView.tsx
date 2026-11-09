import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, FilterChips, SectionShell, ViewShell } from '@tahti-player/ui';

import { fetchTransparencyResolutions } from '../api/client';
import type { BoardResolution } from '../api/types';
import { ListingDate } from '../components/ListingDate';
import { PageBackLink } from '../components/PageBackLink';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

function outcomeBadge(outcome: string): {
  color: 'green' | 'red' | 'secondary';
  label: string;
} {
  if (outcome === 'PASSED') {
    return { color: 'green', label: 'Passed' };
  }
  if (outcome === 'FAILED') {
    return { color: 'red', label: 'Failed' };
  }
  return { color: 'secondary', label: outcome };
}

export function TransparencyResolutionsView() {
  const { t } = useTranslation('web');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [resolutions, setResolutions] = useState<BoardResolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchTransparencyResolutions(year).then((result) => {
      if (cancelled) {
        return;
      }
      setResolutions(result.data);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [year, attempt]);

  return (
    <ViewShell
      title={t('transparencyResolutionsView.boardResolutions')}
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-3xl',
        content: 'gap-6',
      }}
    >
      <PageBackLink
        to="/transparency"
        label={t('transparencyResolutionsView.transparency')}
      />

      <FilterChips
        aria-label={t('transparencyResolutionsView.year')}
        items={YEAR_OPTIONS.map((y) => ({ id: String(y), label: String(y) }))}
        selected={String(year)}
        onChange={(id) => setYear(Number(id))}
      />

      {loading ? (
        <PageLoading label={t('loading.loadingResolutions')} />
      ) : loadError && resolutions.length === 0 ? (
        <PageError
          title={t('loadErrors.couldNotLoadTheResolutions')}
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : resolutions.length === 0 ? (
        <PageEmpty
          title={t(
            'transparencyResolutionsViewLabels.noPublishedResolutionsForYear',
            { year },
          )}
        />
      ) : (
        <SectionShell
          title={t('transparencyResolutionsViewLabels.resolutionsYear', {
            year,
          })}
        >
          <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
            {resolutions.map((resolution) => {
              const badge = outcomeBadge(resolution.outcome);
              return (
                <li key={resolution.id} className="p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-lg font-bold">
                      {resolution.title}
                    </h2>
                    <Badge variant="pill" color={badge.color}>
                      {badge.label}
                    </Badge>
                  </div>
                  <p className="text-foreground-secondary mt-1 flex items-center gap-1 text-xs">
                    {t('transparencyResolutionsView.voted')}{' '}
                    <ListingDate value={resolution.votedAt} />
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {resolution.body}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="pill" color="secondary">
                      YES {resolution.voteFor}
                    </Badge>
                    <Badge variant="pill" color="secondary">
                      NO {resolution.voteAgainst}
                    </Badge>
                    <Badge variant="pill" color="secondary">
                      ABSTAIN {resolution.voteAbstain}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionShell>
      )}
    </ViewShell>
  );
}
