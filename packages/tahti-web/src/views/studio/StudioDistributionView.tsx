import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ButtonLink, ViewShell } from '@tahti-player/ui';

import { fetchAllRoyalties } from '../../api/distribution';
import { fetchStudioReleases } from '../../api/studio';
import type {
  RevelatorRoyaltyReportRow,
  StudioRelease,
} from '../../api/studio-types';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { Eyebrow } from '../../components/tahti/Eyebrow';
import { euros } from './distribution/distribution-helpers';
import { ReleaseOpsPanel } from './distribution/ReleaseOpsPanel';

export function StudioDistributionView() {
  const [releases, setReleases] = useState<StudioRelease[]>([]);
  const [allRoyalties, setAllRoyalties] = useState<RevelatorRoyaltyReportRow[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [royaltiesError, setRoyaltiesError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStudioReleases(), fetchAllRoyalties()])
      .then(([rel, roy]) => {
        setReleases(rel.data.releases ?? []);
        setAllRoyalties(roy.data ?? []);
        setLoadError(
          rel.meta.source === 'api' ? (rel.meta.reason ?? null) : null,
        );
        setRoyaltiesError(
          roy.meta.source === 'api' ? (roy.meta.reason ?? null) : null,
        );
      })
      .catch(() => toast.error('Could not load your releases.'))
      .finally(() => setLoading(false));
  }, [attempt]);

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <ViewShell
          title="Distribution"
          classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
        >
          <Link
            to="/studio/releases"
            className="text-foreground-secondary hover:text-foreground inline-flex items-center gap-1 text-xs underline underline-offset-2"
          >
            <ArrowLeftIcon size={12} aria-hidden />
            Back to Releases
          </Link>

          <section className="flex flex-col gap-3">
            <h2>
              <Eyebrow>Releases</Eyebrow>
            </h2>
            {!loading && loadError && releases.length > 0 ? (
              <PageErrorBanner
                title="Could not refresh your releases."
                description={loadError}
                onRetry={() => setAttempt((n) => n + 1)}
              />
            ) : null}
            {loading ? (
              <PageLoading label="Loading…" />
            ) : loadError && releases.length === 0 ? (
              <PageError
                title="Could not load your releases"
                description={loadError}
                onRetry={() => setAttempt((n) => n + 1)}
              />
            ) : releases.length === 0 ? (
              <PageEmpty
                title="No releases yet"
                description="Create one under Releases first."
                action={
                  <ButtonLink
                    to="/studio/releases"
                    size="sm"
                    variant="secondary"
                  >
                    Releases
                  </ButtonLink>
                }
              />
            ) : (
              releases.map((release) => (
                <ReleaseOpsPanel key={release.id} release={release} />
              ))
            )}
          </section>

          {!loading && royaltiesError ? (
            <PageErrorBanner
              title="Could not load your royalty reports."
              description={royaltiesError}
              onRetry={() => setAttempt((n) => n + 1)}
            />
          ) : null}

          {allRoyalties.length > 0 && (
            <StudioPanel title="All royalty reports">
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
