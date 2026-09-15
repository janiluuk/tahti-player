import { Link } from '@tanstack/react-router';
import { ScrollTextIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge, Box, Button, StatChip, ViewShell } from '@tahti-player/ui';

import { fetchPublicGovernanceMotions } from '../api/client';
import type { PublicGovernanceMotion } from '../api/types';
import { PageLoading } from '../components/PageStates';

export function PublicGovernanceHistoryView() {
  const [motions, setMotions] = useState<PublicGovernanceMotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchPublicGovernanceMotions().then((result) => {
      setMotions(result.data);
      setLoading(false);
    });
  }, []);

  return (
    <ViewShell
      title="Governance history"
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl', scrollableArea: 'gap-6' }}
    >
      <Link to="/transparency">
        <Button size="sm" variant="secondary">
          <ScrollTextIcon size={14} aria-hidden className="mr-1.5" />
          Transparency overview
        </Button>
      </Link>

      {!loading && motions.length > 0 && (
        <StatChip value={motions.length} label="Closed motions" />
      )}

      {loading ? (
        <PageLoading label="Loading governance history…" />
      ) : motions.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          No closed advisory motions have been published yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {motions.map((motion) => (
            <Box
              key={motion.id}
              variant="tertiary"
              className="flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-bold">
                    {motion.title}
                  </h2>
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
