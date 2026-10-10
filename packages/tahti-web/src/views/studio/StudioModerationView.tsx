import { BanIcon, MessageSquareIcon, ShieldCheckIcon } from 'lucide-react';
import { useState } from 'react';

import { Tabs, ViewShell } from '@tahti-player/ui';

import { ChannelModeratorsPanel } from '../../components/moderation/ChannelModeratorsPanel';
import { ChatAccessPanel } from '../../components/moderation/ChatAccessPanel';
import { ChatBansPanel } from '../../components/moderation/ChatBansPanel';
import { ChatMessagesPanel } from '../../components/moderation/ChatMessagesPanel';
import { StudioGate } from '../../components/StudioGate';

/** Studio → Moderation: who may post in chat, the latest messages, the
 * channel's moderators and chat bans. Settings shows the same panels under Channel → Chat and
 * Channel → Moderators. */
export function StudioModerationView() {
  const [bansVersion, setBansVersion] = useState(0);
  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <ViewShell title="Moderation" classes={{ root: 'px-0 pt-0' }}>
          <ChatAccessPanel />
          <Tabs
            listClassName="border-border border-b pb-3"
            panelClassName="pt-2"
            items={[
              {
                id: 'messages',
                label: 'Messages',
                icon: <MessageSquareIcon size={14} />,
                content: (
                  <ChatMessagesPanel
                    onBanned={() => setBansVersion((v) => v + 1)}
                  />
                ),
              },
              {
                id: 'moderators',
                label: 'Moderators',
                icon: <ShieldCheckIcon size={14} />,
                content: <ChannelModeratorsPanel />,
              },
              {
                id: 'bans',
                label: 'Chat bans',
                icon: <BanIcon size={14} />,
                content: <ChatBansPanel key={bansVersion} />,
              },
            ]}
          />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
