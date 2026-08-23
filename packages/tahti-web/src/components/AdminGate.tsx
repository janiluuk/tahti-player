import { Link } from '@tanstack/react-router';
import { ShieldAlertIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, EmptyState } from '@nuclearplayer/ui';

import { hasAccountRole } from '../lib/accountRoles';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { PageLoading } from './PageStates';

export function AdminGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const openAuth = useAuthModalStore((s) => s.open);

  if (!hydrated) {
    return <PageLoading label="Loading session…" />;
  }

  if (!user) {
    return (
      <EmptyState
        icon={<ShieldAlertIcon size={40} className="opacity-40" />}
        title="Board admin"
        description="Sign in with a board member account to continue."
        action={<Button onClick={() => openAuth('login')}>Log in</Button>}
      />
    );
  }

  if (!hasAccountRole(user, 'BOARD')) {
    return (
      <EmptyState
        icon={<ShieldAlertIcon size={40} className="opacity-40" />}
        title="Board access required"
        description={`Signed in as @${user.username}, but this account doesn't have the Board role.`}
        action={
          <Link to="/">
            <Button size="sm" variant="secondary">
              Back to Listen
            </Button>
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
