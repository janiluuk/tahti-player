import {
  Link2Icon,
  MessageCircle,
  MessagesSquare,
  MusicIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { TabLabel, Tabs } from '@tahti-player/ui';

import { ChannelChatPanel } from '../ChannelChatPanel';
import { ChannelComments } from '../ChannelComments';

export type ChannelPageTab = 'music' | 'embeds' | 'comments' | 'chat';

/** The channel page's own sections under the stage: the music blocks, the
 * tracks hosted on other sites (embeds), the comment wall and the live chat
 * room. Embeds shows only when the channel has some; chat is left out when
 * the artist has switched it off. */
export function ChannelPageTabs({
  value,
  onChange,
  chatOn,
  embedsOn = false,
}: {
  value: ChannelPageTab;
  onChange: (tab: ChannelPageTab) => void;
  chatOn: boolean;
  embedsOn?: boolean;
}) {
  const { t } = useTranslation('web');
  const tabs = (
    [
      {
        id: 'music' as const,
        label: t('channelPage.tabMusic'),
        Icon: MusicIcon,
      },
      {
        id: 'embeds' as const,
        label: t('channelPage.tabEmbeds'),
        Icon: Link2Icon,
      },
      {
        id: 'comments' as const,
        label: t('channelPage.tabComments'),
        Icon: MessagesSquare,
      },
      {
        id: 'chat' as const,
        label: t('channelPage.tabChat'),
        Icon: MessageCircle,
      },
    ] as const
  ).filter(
    (tab) => (tab.id !== 'chat' || chatOn) && (tab.id !== 'embeds' || embedsOn),
  );
  return (
    <div data-testid="channel-page-tabs">
      <Tabs.Root
        selectedIndex={Math.max(
          0,
          tabs.findIndex((tab) => tab.id === value),
        )}
        onChange={(index) => {
          const next = tabs[index];
          if (next) {
            onChange(next.id);
          }
        }}
      >
        <Tabs.List
          aria-label="Channel sections"
          className="w-fit overflow-x-auto"
        >
          {tabs.map((tab) => (
            <Tabs.Tab key={tab.id}>
              <TabLabel icon={<tab.Icon size={14} />}>{tab.label}</TabLabel>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
}

/** The tab bar plus the active section. Edit mode only arranges the music
 * blocks, and a switched-off chat or a channel without embeds falls back
 * to Music. */
export function ChannelPageSections({
  tab,
  onTabChange,
  editing,
  chatOn,
  slug,
  isOwner,
  music,
  embeds = null,
}: {
  tab: ChannelPageTab;
  onTabChange: (tab: ChannelPageTab) => void;
  editing: boolean;
  chatOn: boolean;
  slug: string;
  isOwner: boolean;
  music: ReactNode;
  /** The Embeds tab's content; null hides the tab. */
  embeds?: ReactNode;
}) {
  const embedsOn = embeds != null;
  const active: ChannelPageTab =
    editing || (tab === 'chat' && !chatOn) || (tab === 'embeds' && !embedsOn)
      ? 'music'
      : tab;
  return (
    <>
      {editing ? null : (
        <ChannelPageTabs
          value={active}
          onChange={onTabChange}
          chatOn={chatOn}
          embedsOn={embedsOn}
        />
      )}
      {active === 'music' ? music : null}
      {active === 'embeds' ? embeds : null}
      {active === 'comments' ? (
        <ChannelComments slug={slug} isOwner={isOwner} />
      ) : null}
      {active === 'chat' ? (
        <div className="max-w-2xl" data-testid="channel-chat-tab">
          <ChannelChatPanel key={slug} slug={slug} />
        </div>
      ) : null}
    </>
  );
}
