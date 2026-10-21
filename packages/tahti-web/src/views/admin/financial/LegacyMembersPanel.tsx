import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { CopyButton } from '@tahti-player/ui';

import { fetchLegacyMembers, type AdminLegacyMember } from '../../../api/admin';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';

function memberName(member: AdminLegacyMember): string {
  const name = member.displayName.trim();
  return name && !name.includes('@') ? name : member.username;
}

export function LegacyMembersPanel() {
  const [members, setMembers] = useState<AdminLegacyMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const result = await fetchLegacyMembers();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMembers(result.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <StudioPanel
      title="Legacy membership migration"
      action={
        members && members.length > 0 ? (
          <CopyButton
            text={members.map((member) => member.email).join(', ')}
            label="Copy emails"
          />
        ) : undefined
      }
    >
      <p className="text-foreground-secondary mb-3 text-sm">
        Members with no Stripe subscription yet. They move over by paying their
        membership through checkout; until then their fee isn't collected
        automatically.
      </p>
      {error ? (
        <PageError
          title="Couldn't load the migration queue"
          description={error}
          onRetry={() => void load()}
        />
      ) : members === null ? (
        <PageLoading label="Loading members…" />
      ) : members.length === 0 ? (
        <PageEmpty title="Every member is on a Stripe subscription (or Stripe is off)" />
      ) : (
        <ul className="divide-border divide-y">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {member.memberNumber != null
                    ? `#${member.memberNumber} `
                    : ''}
                  <Link
                    to="/u/$username"
                    params={{ username: member.username }}
                    className="hover:underline"
                  >
                    {memberName(member)}
                  </Link>
                </div>
                <div className="text-foreground-secondary text-xs">
                  @{member.username}
                  {member.memberSince
                    ? ` · member since ${new Date(member.memberSince).toLocaleDateString()}`
                    : ''}
                </div>
              </div>
              <div className="text-foreground-secondary text-xs">
                {member.email}
              </div>
            </li>
          ))}
        </ul>
      )}
    </StudioPanel>
  );
}
