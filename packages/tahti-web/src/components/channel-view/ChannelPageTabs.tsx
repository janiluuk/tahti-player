import { MessageCircle, MessagesSquare, MusicIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { TabLabel, Tabs } from '@tahti-player/ui';

import { ChannelChatPanel } from '../ChannelChatPanel';
import { ChannelComments } from '../ChannelComments';

export type ChannelPageTab = 'music' | 'comments' | 'chat';

const TABS: { id: ChannelPageTab; label: string; Icon: typeof MusicIcon }[] = [
  { id: 'music', label: 'Music', Icon: MusicIcon },
  { id: 'comments', label: 'Comments', Icon: MessagesSquare },
  { id: 'chat', label: 'Chat', Icon: MessageCircle },
];

/** The channel page's own sections under the stage: the music blocks, the
 * comment wall and the live chat room. Chat is left out when the artist
 * has switched it off. */
export function ChannelPageTabs({
  value,
  onChange,
  chatOn,
}: {
  value: ChannelPageTab;
  onChange: (tab: ChannelPageTab) => void;
  chatOn: boolean;
}) {
  const tabs = chatOn ? TABS : TABS.filter((tab) => tab.id !== 'chat');
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
 * blocks, and a switched-off chat falls back to Music. */
export function ChannelPageSections({
  tab,
  onTabChange,
  editing,
  chatOn,
  slug,
  isOwner,
  music,
}: {
  tab: ChannelPageTab;
  onTabChange: (tab: ChannelPageTab) => void;
  editing: boolean;
  chatOn: boolean;
  slug: string;
  isOwner: boolean;
  music: ReactNode;
}) {
  const active: ChannelPageTab = editing
    ? 'music'
    : tab === 'chat' && !chatOn
      ? 'music'
      : tab;
  return (
    <>
      {editing ? null : (
        <ChannelPageTabs
          value={active}
          onChange={onTabChange}
          chatOn={chatOn}
        />
      )}
      {active === 'music' ? music : null}
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
