import { Link } from '@tanstack/react-router';

import { Group } from './HomeTiles';
import type { StudioHomeState } from './useStudioHome';

export function GovernanceSection({ state }: { state: StudioHomeState }) {
  const { governanceVotes, unresolvedRequests, discussionUpdates } = state;

  return (
    <Group title="Governance">
      <div className="border-border bg-background-secondary/30 rounded-xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Have your say</p>
            <p className="text-foreground-secondary mt-1 text-xs">
              Review open votes and follow discussions that are still
              unresolved.
            </p>
          </div>
          <Link
            to="/studio/governance"
            className="text-foreground-secondary text-xs underline-offset-2 hover:underline"
          >
            Open governance →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-foreground-secondary mb-2 text-xs font-semibold tracking-wide uppercase">
              Needs your opinion
            </p>
            {governanceVotes.length === 0 &&
            unresolvedRequests.every((request) => request.youVoted) ? (
              <p className="text-foreground-secondary text-sm">
                Nothing waiting for your vote.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {[
                  ...governanceVotes.map((motion) => ({
                    id: `motion-${motion.id}`,
                    title: motion.title,
                    detail: 'Open motion',
                    to: '/studio/governance' as const,
                  })),
                  ...unresolvedRequests
                    .filter((request) => !request.youVoted)
                    .map((request) => ({
                      id: `request-${request.id}`,
                      title: request.title,
                      detail: 'Open topic',
                      to: '/governance/feature-requests' as const,
                    })),
                ]
                  .slice(0, 4)
                  .map((item) => (
                    <li key={item.id} className="py-2 first:pt-0 last:pb-0">
                      <Link to={item.to} className="block hover:underline">
                        <span className="block truncate text-sm font-medium">
                          {item.title}
                        </span>
                        <span className="text-foreground-secondary text-xs">
                          {item.detail}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-foreground-secondary mb-2 text-xs font-semibold tracking-wide uppercase">
              Ongoing discussions
            </p>
            {discussionUpdates.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                No unresolved discussion updates.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {discussionUpdates.map((item) => (
                  <li key={item.id} className="py-2 first:pt-0 last:pb-0">
                    <Link to={item.to} className="block hover:underline">
                      <span className="block truncate text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="text-foreground-secondary text-xs">
                        {item.detail}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Group>
  );
}
