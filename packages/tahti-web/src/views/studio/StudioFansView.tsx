import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  BanknoteIcon,
  HeartIcon,
  LayoutGridIcon,
  MessageSquareIcon,
  NewspaperIcon,
  SendIcon,
  ShoppingBagIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  HubCards,
  TabLabel,
  Tabs,
  ViewShell,
  type HubCardItem,
} from '@tahti-player/ui';

import { renderHubLink } from '../../components/HubLink';
import { ChannelChatSettings } from '../../components/moderation/ChannelChatSettings';
import { StudioGate } from '../../components/StudioGate';

export type StudioFansTab = 'tools' | 'chat';
export type StudioFansChatSection =
  'access' | 'messages' | 'moderators' | 'bans';

function chatSectionFromSearch(
  value: unknown,
): StudioFansChatSection | undefined {
  return value === 'access' ||
    value === 'messages' ||
    value === 'moderators' ||
    value === 'bans'
    ? value
    : undefined;
}

export function StudioFansView({
  tab: tabProp,
  chatSection: chatSectionProp,
}: {
  tab?: StudioFansTab;
  chatSection?: StudioFansChatSection;
} = {}) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    tab?: string;
    section?: string;
  };
  const tab: StudioFansTab =
    tabProp ?? (search.tab === 'chat' ? 'chat' : 'tools');
  const chatSection = chatSectionProp ?? chatSectionFromSearch(search.section);

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

  const selectedIndex = tab === 'chat' ? 1 : 0;

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-4xl flex-col gap-4 px-1 py-2">
        <ViewShell
          title={t('studioFans.title')}
          subtitle={t('studioFans.subtitle')}
          classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
        >
          <Tabs.Root
            selectedIndex={selectedIndex}
            onChange={(index) => {
              void navigate({
                to: '/studio/fans',
                search: index === 1 ? { tab: 'chat' } : {},
              });
            }}
          >
            <Tabs.List className="border-border border-b">
              <Tabs.Tab>
                <TabLabel icon={<LayoutGridIcon size={14} />}>
                  {t('studioFans.tabTools')}
                </TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel icon={<MessageSquareIcon size={14} />}>
                  {t('studioFans.tabChat')}
                </TabLabel>
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>

          {tab === 'chat' ? (
            <ChannelChatSettings initialTab={chatSection} />
          ) : (
            <HubCards
              aria-label={t('studioFans.ariaLabel')}
              items={items}
              renderLink={renderHubLink}
            />
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
