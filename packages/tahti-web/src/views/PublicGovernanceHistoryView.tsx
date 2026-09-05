import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Badge, ViewShell } from '@tahti-player/ui';

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
      subtitle="Public results of closed advisory motions. These records are not binding AGM ballots."
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl' }}
    >
      <Link
        to="/governance"
        className="text-foreground-secondary mb-2 block w-fit text-xs underline-offset-2 hover:underline"
      >
        ← Governance
      </Link>
      <Link
        to="/transparency"
        className="text-foreground-secondary mb-2 block w-fit text-xs underline-offset-2 hover:underline"
      >
        Transparency overview →
      </Link>
      {loading ? (
        <PageLoading label="Loading governance history…" />
      ) : motions.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          No closed advisory motions have been published yet.
        </p>
      ) : (
        <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
          {motions.map((motion) => (
            <li key={motion.id} className="p-4">
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
              <p className="mt-3 text-sm">{motion.description}</p>
              <p className="text-foreground-secondary mt-3 text-xs">
                YES {motion.voteFor} · NO {motion.voteAgainst} · ABSTAIN{' '}
                {motion.voteAbstain}
              </p>
            </li>
          ))}
        </ul>
      )}
    </ViewShell>
  );
}
