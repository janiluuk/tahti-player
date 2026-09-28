import { LayoutDashboard, Lock } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, EmptyState } from '@tahti-player/ui';

import { hasAccountRole } from '../lib/accountRoles';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { useChannelSetupModalStore } from '../stores/channelSetupModalStore';
import { PageLoading } from './PageStates';

type Props = {
  children: ReactNode;
  /** When true, require an artist channel (archive/upload). */
  requireChannel?: boolean;
};

export function StudioGate({ children, requireChannel = true }: Props) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const profileLoaded = useAuthStore((s) => s.profileLoaded);
  const openAuth = useAuthModalStore((s) => s.open);
  const openChannelSetup = useChannelSetupModalStore((s) => s.open);

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

  if (!hasAccountRole(user, 'ARTIST') && !hasAccountRole(user, 'BOARD')) {
    return (
      <EmptyState
        icon={<Lock size={40} className="opacity-40" />}
        title="Artist access required"
        description={`Signed in as @${user.username}, but this account does not have artist access.`}
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openAuth('login')}
          >
            Switch account
          </Button>
        }
      />
    );
  }

  if (requireChannel && !user.channel && !profileLoaded) {
    return <PageLoading label="Loading your channel…" />;
  }

  if (requireChannel && !user.channel) {
    return (
      <EmptyState
        icon={<LayoutDashboard size={40} className="opacity-40" />}
        title="Artist channel required"
        description={`Signed in as @${user.username}, but this account has no channel yet.`}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={openChannelSetup}>
              Create channel
            </Button>
          </div>
        }
      />
    );
  }

  return <>{children}</>;
}
