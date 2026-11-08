import { LayoutDashboard, Lock } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { hasStudioAccess } from '../lib/accountRoles';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { useChannelSetupModalStore } from '../stores/channelSetupModalStore';
import { PageGate, PageLoading } from './PageStates';

type Props = {
  children: ReactNode;
  /** When true, require an artist channel (archive/upload). */
  requireChannel?: boolean;
  /** Inside a page that already has its own `h1`, such as a Library tab. */
  embedded?: boolean;
};

export function StudioGate({
  children,
  requireChannel = true,
  embedded = false,
}: Props) {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const profileLoaded = useAuthStore((s) => s.profileLoaded);
  const openAuth = useAuthModalStore((s) => s.open);
  const openChannelSetup = useChannelSetupModalStore((s) => s.open);

  if (!hydrated) {
    return <PageLoading label={t('loading.loadingSession')} />;
  }

  if (!user) {
    return (
      <PageGate
        page={embedded ? null : 'Studio'}
        icon={<Lock size={40} className="opacity-40" />}
        title={t('studioGate.studio')}
        description={t('studioGate.signInToManageYour')}
        action={
          <Button onClick={() => openAuth('login')}>
            {t('studioGate.logIn')}
          </Button>
        }
      />
    );
  }

  if (!hasStudioAccess(user) && !profileLoaded) {
    return <PageLoading label={t('loading.loadingYourAccount')} />;
  }

  if (!hasStudioAccess(user)) {
    return (
      <PageGate
        page={embedded ? null : 'Studio'}
        icon={<LayoutDashboard size={40} className="opacity-40" />}
        title={t('studioGate.studioIsForArtists')}
        description={`@${user.username} is a listener account. Create your channel to upload, release and broadcast. Listening needs none of it.`}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={openChannelSetup}>
              {t('studioGate.createYourChannel')}
            </Button>
            <Button size="sm" variant="text" onClick={() => openAuth('login')}>
              {t('studioGate.switchAccount')}
            </Button>
          </div>
        }
      />
    );
  }

  if (requireChannel && !user.channel && !profileLoaded) {
    return <PageLoading label={t('loading.loadingYourChannel')} />;
  }

  if (requireChannel && !user.channel) {
    return (
      <PageGate
        page={embedded ? null : 'Studio'}
        icon={<LayoutDashboard size={40} className="opacity-40" />}
        title={t('studioGate.artistChannelRequired')}
        description={`Signed in as @${user.username}, but this account has no channel yet.`}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={openChannelSetup}>
              {t('studioGate.createChannel')}
            </Button>
          </div>
        }
      />
    );
  }

  return <>{children}</>;
}
