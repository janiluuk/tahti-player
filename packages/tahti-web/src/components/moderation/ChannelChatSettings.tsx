import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { InlineLoader, SectionTitle } from '@tahti-player/ui';

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

/** Live-chat on/off plus the moderation panels artists use for their channel.
 * Shared by Studio → Fans so Settings no longer duplicates the same controls. */
export function ChannelChatSettings({
  headingId = 'fans-chat',
}: {
  headingId?: string;
}) {
  const [profile, setProfile] = useState<ProfileFields | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [bansVersion, setBansVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    void fetchMeProfile().then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.data) {
        setProfile(null);
        setLoadError(result.meta.reason ?? 'Could not load chat settings.');
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
      <SectionTitle id={headingId} title="Chat" />
      <p className="text-foreground-secondary -mt-2 text-sm">
        Turn chat on for your channel, then moderate who can post, recent
        messages, bans and moderators.
      </p>

      {!profile ? (
        loadError ? (
          <PageError
            title="Could not load chat settings"
            description={loadError}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : (
          <InlineLoader label="Loading…" />
        )
      ) : (
        <div className="flex flex-col gap-5">
          <SettingsToggle
            label="Enable live chat on my channel"
            description="When this is off, listeners do not see a chat on your channel page."
            value={profile.chatEnabled}
            onChange={(value) =>
              saveSwitch('chatEnabled', value, 'Chat setting saved.')
            }
          />
          <SettingsToggle
            label="Show today’s listener count in my chat"
            description="Listeners see how many people tuned in today."
            value={profile.showDailyListeners ?? true}
            onChange={(value) =>
              saveSwitch('showDailyListeners', value, 'Chat setting saved.')
            }
          />
        </div>
      )}

      {profile?.chatEnabled !== false ? (
        <div className="flex flex-col gap-4">
          <ChatAccessPanel />
          <ChannelModeratorsPanel />
          <ChatMessagesPanel onBanned={() => setBansVersion((v) => v + 1)} />
          <ChatBansPanel key={bansVersion} />
        </div>
      ) : profile ? (
        <p className="text-foreground-secondary text-sm">
          Turn chat on above to manage who can post, messages, bans and
          moderators.
        </p>
      ) : null}
    </section>
  );
}
