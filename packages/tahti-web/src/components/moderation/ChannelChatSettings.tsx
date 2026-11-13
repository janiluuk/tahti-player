import {
  MessageSquareIcon,
  ShieldBanIcon,
  UserRoundCogIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { InlineLoader, SectionTitle, Tabs } from '@tahti-player/ui';

import {
  fetchMeProfile,
  patchMeProfile,
  type ProfileFields,
} from '../../api/studio-extras';
import { SettingsToggle } from '../../views/settings/SettingsFields';
import { PageError } from '../PageStates';
import { ChannelModeratorsPanel } from './ChannelModeratorsPanel';
import { ChatAccessPanel } from './ChatAccessPanel';
import { ChatBansPanel } from './ChatBansPanel';
import { ChatMessagesPanel } from './ChatMessagesPanel';

type ChatTab = 'access' | 'messages' | 'moderators' | 'bans';

const CHAT_TABS: ChatTab[] = ['access', 'messages', 'moderators', 'bans'];

/** Live-chat on/off plus the moderation panels artists use for their channel.
 * Shared by Studio → Fans so Settings no longer duplicates the same controls. */
export function ChannelChatSettings({
  headingId = 'fans-chat',
  initialTab = 'messages',
}: {
  headingId?: string;
  /** Which moderation sub-tab to open (e.g. Profile → Moderators). */
  initialTab?: ChatTab;
}) {
  const { t } = useTranslation('web');
  const [profile, setProfile] = useState<ProfileFields | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [bansVersion, setBansVersion] = useState(0);
  const [tab, setTab] = useState<ChatTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    void fetchMeProfile().then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.data) {
        setProfile(null);
        setLoadError(
          result.meta.reason ?? i18n.t('web:batch57.couldNotLoadChatSettings'),
        );
        return;
      }
      setProfile(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const saveSwitch = (
    key: 'chatEnabled' | 'showDailyListeners',
    value: boolean,
    saved: string,
  ) => {
    if (!profile) {
      return;
    }
    const previous = profile;
    setProfile({ ...previous, [key]: value });
    void patchMeProfile({ [key]: value }).then((result) => {
      if (!result.ok) {
        setProfile(previous);
        toast.error(result.error);
        return;
      }
      setProfile(result.data);
      toast.success(saved);
    });
  };

  return (
    <section
      id="chat"
      className="flex flex-col gap-4"
      aria-labelledby={headingId}
      data-testid="fans-chat-settings"
    >
      <SectionTitle id={headingId} title={t('channelChatSettings.chat')} />
      <p className="text-foreground-secondary -mt-2 text-sm">
        {t('channelChatSettings.turnChatOnForYour')}
      </p>

      {!profile ? (
        loadError ? (
          <PageError
            title={t('loadErrors.couldNotLoadChatSettings')}
            description={loadError}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : (
          <InlineLoader label={t('channelChatSettings.loading')} />
        )
      ) : (
        <div className="flex flex-col gap-5">
          <SettingsToggle
            label={t('channelChatSettings.enableLiveChatOnMy')}
            description={t('channelChatSettings.whenThisIsOffListeners')}
            value={profile.chatEnabled}
            onChange={(value) =>
              saveSwitch('chatEnabled', value, 'Chat setting saved.')
            }
          />
          <SettingsToggle
            label={t('channelChatSettings.showTodaySListenerCount')}
            description={t('channelChatSettings.listenersSeeHowManyPeople')}
            value={profile.showDailyListeners ?? true}
            onChange={(value) =>
              saveSwitch('showDailyListeners', value, 'Chat setting saved.')
            }
          />
        </div>
      )}

      {profile?.chatEnabled !== false ? (
        <Tabs
          variant="underline"
          selectedIndex={CHAT_TABS.indexOf(tab)}
          onChange={(index) => setTab(CHAT_TABS[index] ?? 'messages')}
          listClassName="border-border border-b"
          panelClassName="pt-3"
          items={[
            {
              id: 'access',
              label: t('channelChatSettings.tabAccess'),
              icon: <UsersIcon size={14} />,
              content: <ChatAccessPanel />,
            },
            {
              id: 'messages',
              label: t('channelChatSettings.tabMessages'),
              icon: <MessageSquareIcon size={14} />,
              content: (
                <ChatMessagesPanel
                  onBanned={() => setBansVersion((v) => v + 1)}
                />
              ),
            },
            {
              id: 'moderators',
              label: t('channelChatSettings.tabModerators'),
              icon: <UserRoundCogIcon size={14} />,
              content: <ChannelModeratorsPanel />,
            },
            {
              id: 'bans',
              label: t('channelChatSettings.tabBans'),
              icon: <ShieldBanIcon size={14} />,
              content: <ChatBansPanel key={bansVersion} />,
            },
          ]}
        />
      ) : profile ? (
        <p className="text-foreground-secondary text-sm">
          {t('channelChatSettings.turnChatOnAboveTo')}
        </p>
      ) : null}
    </section>
  );
}
