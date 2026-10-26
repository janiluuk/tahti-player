import { Link } from '@tanstack/react-router';
import { LandmarkIcon, UsersIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge, Button, Input, StatChip, ViewShell } from '@tahti-player/ui';

import { fetchGovernanceMembers } from '../api/client';
import type { GovernanceMember } from '../api/types';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

export function GovernanceMembersView() {
  const user = useAuthStore((s) => s.user);
  const [members, setMembers] = useState<GovernanceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchGovernanceMembers().then((result) => {
      setMembers(result.data);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
  }, [user, attempt]);

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
        content: 'gap-6',
      }}
    >
      <Link
        to="/governance"
        className="text-foreground-secondary w-fit text-xs underline-offset-2 hover:underline"
      >
        ← Back to governance
      </Link>

      {!user && (
        <PageEmpty
          icon="inbox"
          title="Sign in to view the member directory"
          description="Use a cooperative membership account to see who belongs to the co-op."
          action={
            <Button onClick={() => useAuthModalStore.getState().open('login')}>
              Sign in
            </Button>
          }
        />
      )}

      {user && loading && <PageLoading label="Loading members…" />}

      {user && !loading && members.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <StatChip
            value={members.length}
            label="Members"
            icon={<UsersIcon size={16} aria-hidden />}
          />
          <StatChip
            value={members.filter((m) => m.isBoard).length}
            label="Board"
            icon={<LandmarkIcon size={16} aria-hidden />}
          />
        </div>
      )}

      {user && !loading && (
        <>
          <Input
            enterKeyHint="search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search by name or username"
            placeholder="Search by name or username"
          />
          {loadError && members.length > 0 ? (
            <PageErrorBanner
              title="Could not refresh the member directory."
              description={loadError}
              onRetry={() => setAttempt((n) => n + 1)}
            />
          ) : null}
          {loadError && members.length === 0 ? (
            <PageError
              title="Could not load the member directory"
              description={loadError}
              onRetry={() => setAttempt((n) => n + 1)}
            />
          ) : filtered.length === 0 ? (
            <PageEmpty
              title={
                members.length === 0
                  ? 'No member directory is published yet.'
                  : 'No members match this search.'
              }
              action={
                members.length > 0 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setQuery('')}
                  >
                    Clear search
                  </Button>
                ) : undefined
              }
            />
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
