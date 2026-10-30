import {
  Compass,
  Globe,
  MessageSquare,
  Paintbrush,
  Shield,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, InlineLoader, Input, Tabs } from '@tahti-player/ui';

import {
  checkSlugAvailable,
  setCustomDomain,
  updateChannelSlug,
  verifyCustomDomain,
} from '../../../api/channel-design';
import {
  fetchMeProfile,
  patchMeProfile,
  type ProfileFields,
} from '../../../api/studio-extras';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { GenrePicker } from '../../../components/GenrePicker';
import { ChannelModeratorsPanel } from '../../../components/moderation/ChannelModeratorsPanel';
import { ChatAccessPanel } from '../../../components/moderation/ChatAccessPanel';
import { ChatBansPanel } from '../../../components/moderation/ChatBansPanel';
import { ChatMessagesPanel } from '../../../components/moderation/ChatMessagesPanel';
import { PageError } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import {
  formatGenreTags,
  MAX_GENRES,
  normalizeGenresForPicker,
  parseGenreTags,
} from '../../../lib/genres';
import { useAuthStore } from '../../../stores/authStore';
import {
  CHANNEL_SETTINGS_SECTIONS,
  useSettingsModalStore,
  type ChannelSettingsSection,
} from '../../../stores/settingsModalStore';
import { StudioBrandingPanel } from '../../studio/StudioBrandingView';
import { SettingsHint, SettingsToggle } from '../SettingsFields';
import { ChannelAutoplayToggle } from './ChannelAutoplayToggle';
import { channelRenameNote } from './channelRenameNote';

/** The tab a link asked for with `?tab=` (for example `?tab=moderators`),
 * or the first tab. */
function tabIndexFor(section: ChannelSettingsSection | null): number {
  const tab = section ?? new URLSearchParams(window.location.search).get('tab');
  return Math.max(
    0,
    CHANNEL_SETTINGS_SECTIONS.findIndex((id) => id === tab),
  );
}

export function ChannelPanel() {
  const user = useAuthStore((s) => s.user);
  const channelSection = useSettingsModalStore((s) => s.channelSection);
  const channel = user?.channel;
  const [channelProfile, setChannelProfile] = useState<ProfileFields | null>(
    null,
  );
  const [profileError, setProfileError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [slug, setSlug] = useState(channel?.slug ?? '');
  const [bansVersion, setBansVersion] = useState(0);
  const [domain, setDomain] = useState('');
  const [note, setNote] = useState<{ text: string; failed: boolean } | null>(
    null,
  );
  // One result line for the whole tab: what happened, and in red with an
  // alert role when it did not work.
  const say = (text: string) => setNote({ text, failed: false });
  const sayFailed = (text: string) => setNote({ text, failed: true });
  const [confirmingRename, setConfirmingRename] = useState(false);

  useEffect(() => {
    void fetchMeProfile().then((r) => {
      const reason = r.meta.source === 'api' ? (r.meta.reason ?? null) : null;
      setProfileError(reason);
      setChannelProfile(reason ? null : r.data);
    });
  }, [attempt]);

  useEffect(() => {
    setSlug(channel?.slug ?? user?.username ?? '');
  }, [channel?.slug, user?.username]);

  const profileFailed = (
    <PageError
      title="Could not load your channel profile"
      description={profileError ?? undefined}
      onRetry={() => {
        setProfileError(null);
        setAttempt((n) => n + 1);
      }}
    />
  );

  const saveProfileSwitch = (
    key: 'chatEnabled' | 'showDailyListeners' | 'showShareButton',
    value: boolean,
    saved: string,
  ) => {
    if (!channelProfile) {
      return;
    }
    const previous = channelProfile;
    setChannelProfile({ ...previous, [key]: value });
    void patchMeProfile({ [key]: value }).then((result) => {
      if (!result.ok) {
        setChannelProfile(previous);
        toast.error(result.error);
        return;
      }
      setChannelProfile(result.data);
      toast.success(saved);
    });
  };

  if (!user) {
    return (
      <SettingsHint>
        Sign in with a channel to edit design and discovery.
      </SettingsHint>
    );
  }

  return (
    <Tabs
      key={channelSection ?? 'default'}
      listClassName="flex-wrap"
      defaultIndex={tabIndexFor(channelSection)}
      items={[
        {
          id: 'appearance',
          label: 'Channel Designer',
          icon: <Paintbrush size={14} />,
          content: (
            <StudioBrandingPanel section="channel-designer" hideSectionNav />
          ),
        },
        {
          id: 'discovery',
          label: 'Discovery',
          icon: <Compass size={14} />,
          content: !channelProfile ? (
            profileError ? (
              profileFailed
            ) : (
              <InlineLoader label="Loading…" />
            )
          ) : (
            <div className="flex flex-col gap-4">
              <StudioPanel
                title="Channel page"
                description="What listeners can do when they open your channel."
              >
                <div className="flex flex-col gap-5">
                  <SettingsToggle
                    label="Show share button on my channel"
                    description="Let listeners copy or share your channel link from your channel page."
                    value={channelProfile.showShareButton ?? true}
                    onChange={(value) =>
                      saveProfileSwitch(
                        'showShareButton',
                        value,
                        'Share button setting saved.',
                      )
                    }
                  />
                  <ChannelAutoplayToggle />
                </div>
              </StudioPanel>
              <StudioPanel
                title="Genres"
                description={`Up to ${MAX_GENRES}. They help listeners find you.`}
              >
                <div className="flex flex-col gap-2">
                  <GenrePicker
                    value={normalizeGenresForPicker(
                      parseGenreTags(channelProfile.socialLinks?.genres),
                    )}
                    onChange={(genres) => {
                      const previous = channelProfile;
                      const socialLinks = {
                        ...(previous.socialLinks ?? {}),
                        genres: formatGenreTags(genres),
                      };
                      setChannelProfile({ ...previous, socialLinks });
                      void patchMeProfile({ socialLinks }).then((result) => {
                        if (!result.ok) {
                          setChannelProfile(previous);
                          toast.error(result.error);
                          return;
                        }
                        setChannelProfile(result.data);
                      });
                    }}
                  />
                </div>
                <div className="mt-4">
                  <SettingsHint>
                    A channel with public tracks is listed in the Listen
                    directory.
                  </SettingsHint>
                </div>
              </StudioPanel>
            </div>
          ),
        },
        {
          id: 'domain',
          label: 'Username & domain',
          icon: <Globe size={14} />,
          content: (
            <div className="flex flex-col gap-6">
              <form
                className="flex flex-col gap-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void checkSlugAvailable(slug.trim()).then((r) => {
                    if (r.available) {
                      say(`${slug.trim()} is available.`);
                    } else {
                      sayFailed(
                        `Not available${r.reason ? ` (${r.reason})` : ''}`,
                      );
                    }
                  });
                }}
              >
                <Input
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  label="Channel slug / username"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!slug.trim()}
                    type="submit"
                  >
                    Check availability
                  </Button>
                  <Button
                    size="sm"
                    disabled={!slug.trim() || slug.trim() === channel?.slug}
                    onClick={() => setConfirmingRename(true)}
                  >
                    Rename
                  </Button>
                  <ConfirmDialog
                    isOpen={confirmingRename}
                    title={`Rename your channel to ${slug.trim()}?`}
                    description="Your channel address changes, and your stream key may change with it, so an encoder such as OBS needs the new key before your next stream. The old address redirects for a while."
                    confirmLabel="Rename"
                    onCancel={() => setConfirmingRename(false)}
                    onConfirm={() => {
                      setConfirmingRename(false);
                      void updateChannelSlug(slug.trim()).then((r) => {
                        if (r.ok) {
                          say(channelRenameNote(r));
                        } else {
                          sayFailed(r.error);
                        }
                      });
                    }}
                  />
                </div>
              </form>
              <form
                className="flex flex-col gap-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void setCustomDomain(domain.trim()).then((r) => {
                    if (!r.ok) {
                      sayFailed(r.error);
                    } else {
                      say(
                        `Add TXT ${r.txtHost} = ${r.txtRecord}, then Verify.`,
                      );
                    }
                  });
                }}
              >
                <Input
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  label="Custom domain"
                  description={
                    channel?.customDomain
                      ? `Current: ${channel.customDomain}${channel.customDomainVerified ? ' (verified)' : ' (pending)'}`
                      : 'Requires membership. Add DNS TXT then verify.'
                  }
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="music.example.com"
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={!domain.trim()} type="submit">
                    Set domain
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      void verifyCustomDomain().then((r) => {
                        if (!r.ok) {
                          sayFailed(r.error);
                        } else if (r.verified) {
                          say('Domain verified.');
                        } else {
                          sayFailed(
                            'Not verified yet. DNS changes can take a while to show.',
                          );
                        }
                      });
                    }}
                  >
                    Verify DNS
                  </Button>
                </div>
              </form>
              {note ? (
                <p
                  role={note.failed ? 'alert' : 'status'}
                  className={
                    note.failed
                      ? 'text-accent-red-strong text-sm'
                      : 'text-foreground-secondary text-sm'
                  }
                >
                  {note.text}
                </p>
              ) : null}
            </div>
          ),
        },
        {
          id: 'chat',
          label: 'Chat',
          icon: <MessageSquare size={14} />,
          content: (
            <div className="flex flex-col gap-6">
              {!channelProfile ? (
                profileError ? (
                  profileFailed
                ) : (
                  <InlineLoader label="Loading…" />
                )
              ) : (
                <div className="flex flex-col gap-5">
                  <SettingsToggle
                    label="Enable live chat on my channel"
                    description="Allow listeners to chat while you are broadcasting."
                    value={channelProfile.chatEnabled}
                    onChange={(value) =>
                      saveProfileSwitch(
                        'chatEnabled',
                        value,
                        'Chat setting saved.',
                      )
                    }
                  />
                  <SettingsToggle
                    label="Show today’s listener count in my chat"
                    description="Listeners see how many people tuned in today."
                    value={channelProfile.showDailyListeners ?? true}
                    onChange={(value) =>
                      saveProfileSwitch(
                        'showDailyListeners',
                        value,
                        'Chat setting saved.',
                      )
                    }
                  />
                </div>
              )}
              <ChatAccessPanel />
              <ChatMessagesPanel
                onBanned={() => setBansVersion((v) => v + 1)}
              />
              <ChatBansPanel key={bansVersion} />
            </div>
          ),
        },
        {
          id: 'moderators',
          label: 'Moderators',
          icon: <Shield size={14} />,
          content: <ChannelModeratorsPanel />,
        },
      ]}
    />
  );
}
