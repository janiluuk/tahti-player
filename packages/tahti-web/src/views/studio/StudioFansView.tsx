import {
  BanknoteIcon,
  HeartIcon,
  NewspaperIcon,
  SendIcon,
  ShoppingBagIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { HubCards, ViewShell, type HubCardItem } from '@tahti-player/ui';

import { renderHubLink } from '../../components/HubLink';
import { ChannelChatSettings } from '../../components/moderation/ChannelChatSettings';
import { StudioGate } from '../../components/StudioGate';

export function StudioFansView() {
  const { t } = useTranslation('web');

  const items: HubCardItem[] = [
    {
      id: 'posts',
      href: '/studio/updates',
      icon: NewspaperIcon,
      title: t('studioFans.postsTitle'),
      description: t('studioFans.postsDescription'),
    },
    {
      id: 'newsletter',
      href: '/studio/updates?tab=newsletter',
      icon: SendIcon,
      title: t('studioFans.newsletterTitle'),
      description: t('studioFans.newsletterDescription'),
    },
    {
      id: 'memberships',
      href: '/studio/audience?tab=tiers',
      icon: HeartIcon,
      title: t('studioFans.membershipsTitle'),
      description: t('studioFans.membershipsDescription'),
    },
    {
      id: 'store',
      href: '/studio/audience?tab=store',
      icon: ShoppingBagIcon,
      title: t('studioFans.storeTitle'),
      description: t('studioFans.storeDescription'),
    },
    {
      id: 'earnings',
      href: '/studio/audience',
      icon: BanknoteIcon,
      title: t('studioFans.earningsTitle'),
      description: t('studioFans.earningsDescription'),
    },
  ];

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-4xl flex-col gap-4 px-1 py-2">
        <ViewShell
          title={t('studioFans.title')}
          subtitle={t('studioFans.subtitle')}
          classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
        >
          <HubCards
            aria-label={t('studioFans.ariaLabel')}
            items={items}
            renderLink={renderHubLink}
          />
          <ChannelChatSettings />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
