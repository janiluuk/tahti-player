import { useNavigate, useSearch } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';
import { ViewShell } from '@tahti-player/ui';

import { ChannelChatSettings } from '../../components/moderation/ChannelChatSettings';
import { StudioGate } from '../../components/StudioGate';

export type StudioChatSection = 'access' | 'messages' | 'moderators' | 'bans';

function chatSectionFromSearch(value: unknown): StudioChatSection {
  return value === 'access' ||
    value === 'messages' ||
    value === 'moderators' ||
    value === 'bans'
    ? value
    : 'messages';
}

/** Studio → Fans → Chat home (`/studio/chat`). */
export function StudioChatView() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { section?: string };
  const section = chatSectionFromSearch(search.section);

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-4xl flex-col gap-4 px-1 py-2">
        <ViewShell
          title={t('channelChatSettings.chat')}
          subtitle={t('channelChatSettings.turnChatOnForYour')}
          classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
        >
          <ChannelChatSettings
            hideHeading
            initialTab={section}
            onTabChange={(next) => {
              void navigate({
                to: '/studio/chat',
                search: next === 'messages' ? {} : { section: next },
                replace: true,
              });
            }}
          />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
