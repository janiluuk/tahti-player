import { Link } from '@tanstack/react-router';
import { LayoutDashboard, Lock } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, EmptyState } from '@nuclearplayer/ui';

import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { PageLoading } from './PageStates';

type Props = {
  children: ReactNode;
  /** When true, require an artist channel (archive/upload). */
  requireChannel?: boolean;
};

export function StudioGate({ children, requireChannel = true }: Props) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const openAuth = useAuthModalStore((s) => s.open);

  if (!hydrated) {
    return <PageLoading label="Loading session…" />;
  }

  if (!user) {
    return (
      <EmptyState
        icon={<Lock size={40} className="opacity-40" />}
        title="Studio"
        description="Sign in to manage your catalog, uploads, and audio editor."
        action={<Button onClick={() => openAuth('login')}>Log in</Button>}
      />
    );
  }

  if (requireChannel && !user.channel) {
    return (
      <EmptyState
        icon={<LayoutDashboard size={40} className="opacity-40" />}
        title="Artist channel required"
        description={`Signed in as @${user.username}, but this account has no channel yet.`}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/studio/channel" search={{ tab: 'setup' }}>
              <Button size="sm">Create channel</Button>
            </Link>
            <Link to="/studio">
              <Button size="sm" variant="secondary">
                Studio overview
              </Button>
            </Link>
          </div>
        }
      />
    );
  }

  return <>{children}</>;
}
