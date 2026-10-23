import { ScrollTextIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Badge,
  Box,
  ButtonLink,
  SectionTitle,
  StatChip,
  ViewShell,
} from '@tahti-player/ui';

import { fetchPublicGovernanceMotions } from '../api/client';
import type { PublicGovernanceMotion } from '../api/types';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { isPlausiblePublicName } from '../lib/publicDisplayName';

export function PublicGovernanceHistoryView() {
  const [motions, setMotions] = useState<PublicGovernanceMotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    void fetchPublicGovernanceMotions().then((result) => {
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setMotions(
        result.data.filter((motion) => {
          const title = motion.title?.trim();
          return !title || isPlausiblePublicName(title);
        }),
      );
      setLoading(false);
    });
  }, [attempt]);

  return (
    <ViewShell
      title="Governance history"
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl', content: 'gap-6' }}
    >
      <ButtonLink
        className="w-fit"
        to="/governance"
        size="sm"
        variant="secondary"
      >
        <ScrollTextIcon size={14} aria-hidden className="mr-1.5" />← Governance
      </ButtonLink>

      {!loading && motions.length > 0 && (
        <StatChip value={motions.length} label="Closed motions" />
      )}

      {loading ? (
        <PageLoading label="Loading governance history…" />
      ) : loadError && motions.length === 0 ? (
        <PageError
          title="Could not load governance history"
          description={loadError}
          onRetry={() => {
            setLoading(true);
            setAttempt((n) => n + 1);
          }}
        />
      ) : motions.length === 0 ? (
        <PageEmpty title="No closed advisory motions have been published yet." />
      ) : (
        <div className="flex flex-col gap-4">
          {loadError ? (
            <PageErrorBanner
              title="Could not refresh governance history"
              description={loadError}
              onRetry={() => {
                setLoading(true);
                setAttempt((n) => n + 1);
              }}
            />
          ) : null}
          {motions.map((motion) => (
            <Box
              key={motion.id}
              variant="tertiary"
              className="flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <SectionTitle
                    title={motion.title}
                    wrap
                    className="font-display"
                  />
                  <p className="text-foreground-secondary mt-1 text-xs">
                    Proposed by {motion.proposer} · Closed{' '}
                    {new Date(motion.closedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="pill" color="secondary">
                  Closed
                </Badge>
              </div>
              <p className="text-sm">{motion.description}</p>
              <p className="text-foreground-secondary text-xs">
                YES {motion.voteFor} · NO {motion.voteAgainst} · ABSTAIN{' '}
                {motion.voteAbstain}
              </p>
            </Box>
          ))}
        </div>
      )}
    </ViewShell>
  );
}
