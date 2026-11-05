import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useTranslation } from '@tahti-player/i18n';

import { PageLoading } from '../../components/PageStates';
import { useAuthStore } from '../../stores/authStore';
import { useChannelSetupModalStore } from '../../stores/channelSetupModalStore';

export function StudioSetupChannelRedirect() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const open = useChannelSetupModalStore((state) => state.open);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!user) {
      void navigate({ to: '/' });
      return;
    }
    open();
    void navigate({ to: '/studio' });
  }, [hydrated, navigate, open, user]);

  return <PageLoading label={t('loading.openingChannelSetup')} />;
}
