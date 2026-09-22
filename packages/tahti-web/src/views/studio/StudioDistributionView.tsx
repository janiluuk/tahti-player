import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { EmptyState, ViewShell } from '@tahti-player/ui';

import { fetchAllRoyalties } from '../../api/distribution';
import { fetchStudioReleases } from '../../api/studio';
import type {
  RevelatorRoyaltyReportRow,
  StudioRelease,
} from '../../api/studio-types';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
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

  useEffect(() => {
    Promise.all([fetchStudioReleases(), fetchAllRoyalties()])
      .then(([rel, roy]) => {
        setReleases(rel.data.releases ?? []);
        setAllRoyalties(roy.data ?? []);
      })
      .catch(() => toast.error('Could not load your releases.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <StudioNav current="/studio/distribution" />
        <ViewShell title="Distribution" classes={{ root: 'px-0 pt-0' }}>
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
            {loading ? (
              <PageLoading label="Loading…" />
            ) : releases.length === 0 ? (
              <EmptyState
                size="sm"
                title="No releases yet"
                description="Create one under Releases first."
                action={
                  <Link
                    to="/studio/releases"
                    className="text-sm underline underline-offset-2"
                  >
                    Releases
                  </Link>
                }
              />
            ) : (
              releases.map((release) => (
                <ReleaseOpsPanel key={release.id} release={release} />
              ))
            )}
          </section>

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
