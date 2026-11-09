import { Link } from '@tanstack/react-router';
import { LandmarkIcon, UsersIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, Input, StatChip, ViewShell } from '@tahti-player/ui';

import { fetchGovernanceMembers } from '../api/client';
import type { GovernanceMember } from '../api/types';
import { PageBackLink } from '../components/PageBackLink';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { apiResult, useSnapshotFetch } from '../lib/useSnapshotFetch';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

export function GovernanceMembersView() {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const [query, setQuery] = useState('');
  const snapshot = useSnapshotFetch<GovernanceMember[]>(
    `governance-members:${user?.id ?? 'signed-out'}`,
    async () => (user ? apiResult(await fetchGovernanceMembers()) : []),
  );
  const members = snapshot.data ?? [];
  const { loading, error: loadError, retry } = snapshot;

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
      title={t('governanceMembersView.memberDirectory')}
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-2xl',
        content: 'gap-6',
      }}
    >
      <PageBackLink
        to="/governance"
        label={t('governanceMembersView.governance')}
      />

      {!user && (
        <PageEmpty
          icon="inbox"
          title={t('empties.signInToViewTheMember')}
          description={t('empties.useACooperativeMembershipAccountTo')}
          action={
            <Button onClick={() => useAuthModalStore.getState().open('login')}>
              {t('governanceMembersView.signIn')}
            </Button>
          }
        />
      )}

      {user && loading && <PageLoading label={t('loading.loadingMembers')} />}

      {user && !loading && members.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <StatChip
            value={members.length}
            label={t('governanceMembersView.members')}
            icon={<UsersIcon size={16} aria-hidden />}
          />
          <StatChip
            value={members.filter((m) => m.isBoard).length}
            label={t('governanceMembersView.board')}
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
            aria-label={t('governanceMembersView.searchByNameOrUsername')}
            placeholder={t('governanceMembersView.searchByNameOrUsername')}
          />
          {loadError && members.length > 0 ? (
            <PageErrorBanner
              title={t('loadErrors.couldNotRefreshTheMemberDirectory')}
              description={loadError}
              onRetry={retry}
            />
          ) : null}
          {loadError && members.length === 0 ? (
            <PageError
              title={t('loadErrors.couldNotLoadTheMemberDirectory')}
              description={loadError}
              onRetry={retry}
            />
          ) : filtered.length === 0 ? (
            <PageEmpty
              title={
                members.length === 0
                  ? t(
                      'governanceMembersViewStates.noMemberDirectoryIsPublished',
                    )
                  : t('governanceMembersViewStates.noMembersMatchThisSearch')
              }
              action={
                members.length > 0 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setQuery('')}
                  >
                    {t('governanceMembersView.clearSearch')}
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
                          {t('governanceMembersView.board')}
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
