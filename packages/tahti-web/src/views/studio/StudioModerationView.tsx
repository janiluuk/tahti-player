import { BanIcon, ShieldCheckIcon } from 'lucide-react';

import { Tabs, ViewShell } from '@tahti-player/ui';

import { ChannelModeratorsPanel } from '../../components/moderation/ChannelModeratorsPanel';
import { ChatAccessPanel } from '../../components/moderation/ChatAccessPanel';
import { ChatBansPanel } from '../../components/moderation/ChatBansPanel';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';

/** Studio → Moderation: who may post in chat, the channel's moderators and
 * chat bans. Settings shows the same panels under Channel → Chat and
 * Channel → Moderators. */
export function StudioModerationView() {
  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <StudioNav current="/studio/moderation" />
        <ViewShell title="Moderation" classes={{ root: 'px-0 pt-0' }}>
          <ChatAccessPanel />
          <Tabs
            listClassName="border-border border-b pb-3"
            panelClassName="pt-2"
            items={[
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
                content: <ChatBansPanel />,
              },
            ]}
          />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
