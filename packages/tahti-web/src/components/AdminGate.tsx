import { ShieldAlertIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink } from '@tahti-player/ui';

import { hasAccountRole } from '../lib/accountRoles';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { PageGate, PageLoading } from './PageStates';

export function AdminGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const openAuth = useAuthModalStore((s) => s.open);

  if (!hydrated) {
    return <PageLoading label={t('loading.loadingSession')} />;
  }

  if (!user) {
    return (
      <PageGate
        page="Board admin"
        icon={<ShieldAlertIcon size={40} className="opacity-40" />}
        title={t('adminGate.boardAdmin')}
        description={t('adminGate.signInWithABoard')}
        action={
          <Button onClick={() => openAuth('login')}>
            {t('adminGate.logIn')}
          </Button>
        }
      />
    );
  }

  if (!hasAccountRole(user, 'BOARD')) {
    return (
      <PageGate
        page="Board admin"
        icon={<ShieldAlertIcon size={40} className="opacity-40" />}
        title={t('adminGate.boardAccessRequired')}
        description={t('adminGateLabels.signedInAsUsernameBut', {
          username: user.username,
        })}
        action={
          <ButtonLink to="/" size="sm" variant="secondary">
            {t('adminGate.backToListen')}
          </ButtonLink>
        }
      />
    );
  }

  return <>{children}</>;
}
