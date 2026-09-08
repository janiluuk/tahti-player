import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { Badge, Input, ViewShell } from '@tahti-player/ui';

import { fetchGovernanceMembers } from '../api/client';
import type { GovernanceMember } from '../api/types';
import { PageLoading } from '../components/PageStates';
import { useAuthStore } from '../stores/authStore';

export function GovernanceMembersView() {
  const user = useAuthStore((s) => s.user);
  const [members, setMembers] = useState<GovernanceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchGovernanceMembers().then((result) => {
      setMembers(result.data);
      setLoading(false);
    });
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return members;
    }
    return members.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <ViewShell
      title="Member directory"
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-2xl',
        scrollableArea: 'gap-6',
      }}
    >
      <Link
        to="/governance"
        className="text-foreground-secondary w-fit text-xs underline-offset-2 hover:underline"
      >
        ← Back to governance
      </Link>

      {!user && (
        <p className="text-foreground-secondary text-sm">
          Sign in with a cooperative membership account to view the member
          directory.
        </p>
      )}

      {user && loading && <PageLoading label="Loading members…" />}

      {user && !loading && (
        <>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or username"
          />
          {filtered.length === 0 ? (
            <p className="text-foreground-secondary text-sm">
              {members.length === 0
                ? 'No member directory is published yet.'
                : 'No members match this search.'}
            </p>
          ) : (
            <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
              {filtered.map((member) => {
                const row = (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium">{member.displayName}</span>
                      <span className="text-foreground-secondary ml-2 text-xs">
                        @{member.username}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {member.isBoard && (
                        <Badge variant="pill" color="cyan">
                          Board
                        </Badge>
                      )}
                      {member.memberNumber != null && (
                        <span className="text-foreground-secondary text-xs">
                          #{member.memberNumber}
                        </span>
                      )}
                      {member.memberSince && (
                        <span className="text-foreground-secondary text-xs">
                          since {new Date(member.memberSince).getFullYear()}
                        </span>
                      )}
                    </div>
                  </div>
                );
                return (
                  <li key={member.username}>
                    {member.channelSlug ? (
                      <Link
                        to="/channel/$slug"
                        params={{ slug: member.channelSlug }}
                        className="hover:bg-background-secondary block"
                      >
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </ViewShell>
  );
}
