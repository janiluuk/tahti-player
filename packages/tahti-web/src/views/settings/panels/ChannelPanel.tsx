import {
  Compass,
  Globe,
  MessageSquare,
  Paintbrush,
  Shield,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, Tabs } from '@tahti-player/ui';

import {
  checkSlugAvailable,
  setCustomDomain,
  updateChannelSlug,
  verifyCustomDomain,
} from '../../../api/channel-design';
import { isForceMock } from '../../../api/mode';
import {
  fetchMeProfile,
  patchMeProfile,
  type ProfileFields,
} from '../../../api/studio-extras';
import { ClientCapabilityNotice } from '../../../components/ClientCapabilityNotice';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { GenrePicker } from '../../../components/GenrePicker';
import { ChannelModeratorsPanel } from '../../../components/moderation/ChannelModeratorsPanel';
import { ChatAccessPanel } from '../../../components/moderation/ChatAccessPanel';
import { ChatBansPanel } from '../../../components/moderation/ChatBansPanel';
import {
  formatGenreTags,
  MAX_GENRES,
  normalizeGenresForPicker,
  parseGenreTags,
} from '../../../lib/genres';
import { useAuthStore } from '../../../stores/authStore';
import { StudioBrandingPanel } from '../../studio/StudioBrandingView';
import { SettingsHint, SettingsToggle } from '../SettingsFields';
import { channelRenameNote } from './channelRenameNote';

export function ChannelPanel() {
  const user = useAuthStore((s) => s.user);
  const channel = user?.channel;
  const [channelProfile, setChannelProfile] = useState<ProfileFields | null>(
    null,
  );
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [slug, setSlug] = useState(channel?.slug ?? '');
  const [domain, setDomain] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [confirmingRename, setConfirmingRename] = useState(false);

  useEffect(() => {
    void fetchMeProfile().then((r) => {
      setChannelProfile(r.data);
      setProfileLoaded(!r.meta.reason || isForceMock());
    });
    setSlug(channel?.slug ?? user?.username ?? '');
  }, [channel?.slug, user?.username]);

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
      listClassName="flex-wrap"
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
            <SettingsHint>Loading…</SettingsHint>
          ) : (
            <div className="flex flex-col gap-6">
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
              <label className="flex flex-col gap-2">
                <span className="text-foreground text-sm font-semibold">
                  Genres
                </span>
                <span className="text-foreground-secondary text-sm select-none">
                  Up to {MAX_GENRES} — helps listeners find you.
                </span>
                <GenrePicker
                  value={normalizeGenresForPicker(
                    parseGenreTags(channelProfile.socialLinks?.genres),
                  )}
                  onChange={(genres) => {
                    // socialLinks is replaced wholesale on save, so a profile
                    // that failed to load must not be written back.
                    if (!profileLoaded) {
                      toast.error('Could not load your profile. Try again.');
                      return;
                    }
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
              </label>
              <div className="flex flex-col gap-4">
                <SettingsToggle
                  label="List in Listen directory"
                  description="Channels with public tracks are listed."
                  value
                  onChange={() => undefined}
                  disabled
                />
                <SettingsToggle
                  label="Allow Tahti Radio pickup"
                  value={false}
                  onChange={() => undefined}
                  disabled
                />
                <SettingsToggle
                  label="Featured on Listen home"
                  description="Subject to editorial / algorithmic placement."
                  value={false}
                  onChange={() => undefined}
                  disabled
                />
                <ClientCapabilityNotice kind="coming-soon">
                  Discovery listing, Radio pickup, and Featured placement are
                  not configurable from this client yet (no API).
                </ClientCapabilityNotice>
              </div>
            </div>
          ),
        },
        {
          id: 'domain',
          label: 'Username & domain',
          icon: <Globe size={14} />,
          content: (
            <div className="flex flex-col gap-6">
              <Input
                label="Channel slug / username"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void checkSlugAvailable(slug.trim()).then((r) => {
                      setNote(
                        r.available
                          ? 'Available'
                          : `Not available${r.reason ? ` (${r.reason})` : ''}`,
                      );
                    });
                  }}
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
                      setNote(r.ok ? channelRenameNote(r) : r.error);
                    });
                  }}
                />
              </div>
              <Input
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
                <Button
                  size="sm"
                  onClick={() => {
                    void setCustomDomain(domain.trim()).then((r) => {
                      if (!r.ok) {
                        setNote(r.error);
                      } else {
                        setNote(
                          `Add TXT ${r.txtHost} = ${r.txtRecord}, then Verify.`,
                        );
                      }
                    });
                  }}
                >
                  Set domain
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void verifyCustomDomain().then((r) => {
                      setNote(
                        r.ok
                          ? r.verified
                            ? 'Verified!'
                            : 'Not verified yet'
                          : r.error,
                      );
                    });
                  }}
                >
                  Verify DNS
                </Button>
              </div>
              {note && <SettingsHint>{note}</SettingsHint>}
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
                <SettingsHint>Loading…</SettingsHint>
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
              <ChatBansPanel />
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
