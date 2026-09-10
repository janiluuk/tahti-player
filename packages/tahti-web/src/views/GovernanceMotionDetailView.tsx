import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Button, ViewShell } from '@tahti-player/ui';

import { fetchGovernanceMembers, fetchGovernanceMotion } from '../api/client';
import type { GovernanceMember, GovernanceMotionDetail } from '../api/types';
import { MotionCard } from '../components/governance/MotionCard';
import { PageLoading } from '../components/PageStates';
import { hasAccountRole } from '../lib/accountRoles';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';

export function GovernanceMotionDetailView({ id }: { id: string }) {
  const user = useAuthStore((s) => s.user);
  const isBoard = hasAccountRole(user, 'BOARD');
  const [motion, setMotion] = useState<GovernanceMotionDetail | null>(null);
  const [members, setMembers] = useState<GovernanceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const reload = () => {
    if (!user) {
      return;
    }
    setLoading(true);
    void Promise.all([
      fetchGovernanceMotion(id),
      fetchGovernanceMembers(),
    ]).then(([motionResult, membersResult]) => {
      setMembers(membersResult.data);
      if (!motionResult.ok) {
        setMotion(null);
        setError(motionResult.error);
        setForbidden(Boolean(motionResult.forbidden));
      } else {
        setMotion(motionResult.data);
        setError(null);
        setForbidden(false);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setMotion(null);
      setForbidden(true);
      return;
    }
    reload();
  }, [user, id]);

  return (
    <ViewShell
      title={motion?.title ?? 'Motion'}
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-3xl',
        scrollableArea: 'gap-6',
      }}
    >
      <Link
        to="/governance"
        className="text-foreground-secondary inline-block w-fit text-xs underline-offset-2 hover:underline"
      >
        ← Back to governance
      </Link>

      {!user && (
        <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <p className="text-sm">
            Sign in with a cooperative membership account to view this motion.
          </p>
          <Button
            size="sm"
            onClick={() => useAuthModalStore.getState().open('login')}
          >
            Log in
          </Button>
        </div>
      )}

      {user && loading && <PageLoading label="Loading motion…" />}

      {user && !loading && forbidden && (
        <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <p className="text-sm">
            Motions are gated to active Tahti ry members. Signed in as @
            {user.username}.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => useSettingsModalStore.getState().open('account')}
          >
            Manage membership
          </Button>
        </div>
      )}

      {user && !loading && !forbidden && !motion && (
        <p className="text-foreground-secondary text-sm">
          {error ?? 'Motion not found.'}
        </p>
      )}

      {user && !loading && !forbidden && motion && (
        <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
          <MotionCard
            motion={motion}
            description={motion.description}
            isBoard={isBoard}
            memberCount={members.length}
            defaultExpanded
            onChanged={reload}
          />
        </ul>
      )}
    </ViewShell>
  );
}
