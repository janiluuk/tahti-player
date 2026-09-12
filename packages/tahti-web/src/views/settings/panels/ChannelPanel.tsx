import { Compass, Globe, Paintbrush, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, Tabs } from '@tahti-player/ui';

import {
  fetchDiscoveryPrefs,
  patchDiscoveryPrefs,
  type DiscoveryPrefs,
} from '../../../api/artist-settings';
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
import { GenrePicker } from '../../../components/GenrePicker';
import {
  formatGenreTags,
  MAX_GENRES,
  normalizeGenresForPicker,
  parseGenreTags,
} from '../../../lib/genres';
import { useAuthStore } from '../../../stores/authStore';
import { useChannelShareStore } from '../../../stores/channelShareStore';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { StudioModerationView } from '../../studio/StudioModerationView';
import { SettingsHint, SettingsToggle } from '../SettingsFields';

export function ChannelPanel() {
  const user = useAuthStore((s) => s.user);
  const channel = user?.channel;
  const [discovery, setDiscovery] = useState<DiscoveryPrefs | null>(null);
  const [channelProfile, setChannelProfile] = useState<ProfileFields | null>(
    null,
  );
  const [slug, setSlug] = useState(channel?.slug ?? '');
  const [domain, setDomain] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const shareEnabled = useChannelShareStore(
    (state) => state.enabledByChannel[channel?.slug ?? ''] !== false,
  );
  const setShareEnabled = useChannelShareStore((state) => state.setEnabled);

  useEffect(() => {
    void fetchDiscoveryPrefs().then((r) => setDiscovery(r.data));
    void fetchMeProfile().then((r) => setChannelProfile(r.data));
    setSlug(channel?.slug ?? user?.username ?? '');
  }, [channel?.slug, user?.username]);

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
          label: 'Appearance',
          icon: <Paintbrush size={14} />,
          content: (
            <div className="flex flex-col gap-4">
              <SettingsHint>
                Channel look lives in Settings → Artist → Channel Designer.
              </SettingsHint>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  useSettingsModalStore
                    .getState()
                    .open('artist', undefined, 'channel-designer');
                }}
              >
                Open Channel Designer
              </Button>
            </div>
          ),
        },
        {
          id: 'discovery',
          label: 'Discovery',
          icon: <Compass size={14} />,
          content: !discovery ? (
            <SettingsHint>Loading…</SettingsHint>
          ) : (
            <div className="flex flex-col gap-6">
              <SettingsToggle
                label="Show share button on my channel and Broadcast"
                description="Let listeners and collaborators copy or share your live channel link."
                value={shareEnabled}
                onChange={(value) => {
                  if (channel?.slug) {
                    setShareEnabled(channel.slug, value);
                  }
                }}
              />
              <SettingsToggle
                label="List in Listen directory"
                value={discovery.listedInDirectory}
                onChange={(v) => {
                  const next = { ...discovery, listedInDirectory: v };
                  setDiscovery(next);
                  void patchDiscoveryPrefs({ listedInDirectory: v });
                }}
              />
              <SettingsToggle
                label="Allow Tahti Radio pickup"
                value={discovery.allowRadioPickup}
                onChange={(v) => {
                  const next = { ...discovery, allowRadioPickup: v };
                  setDiscovery(next);
                  void patchDiscoveryPrefs({ allowRadioPickup: v });
                }}
              />
              <SettingsToggle
                label="Featured on Listen home"
                description="Subject to editorial / algorithmic placement."
                value={discovery.showOnListenHome}
                onChange={(v) => {
                  const next = { ...discovery, showOnListenHome: v };
                  setDiscovery(next);
                  void patchDiscoveryPrefs({ showOnListenHome: v });
                }}
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
                    parseGenreTags(discovery.genreTags),
                  )}
                  onChange={(genres) => {
                    const genreTags = formatGenreTags(genres);
                    setDiscovery({ ...discovery, genreTags });
                    void patchDiscoveryPrefs({ genreTags });
                  }}
                />
              </label>
              {channelProfile && (
                <SettingsToggle
                  label="Enable live chat on my channel"
                  description="Allow listeners to chat while you are broadcasting."
                  value={channelProfile.chatEnabled}
                  onChange={(value) => {
                    const previous = channelProfile.chatEnabled;
                    setChannelProfile({
                      ...channelProfile,
                      chatEnabled: value,
                    });
                    void patchMeProfile({ chatEnabled: value }).then(
                      (result) => {
                        if (!result.ok) {
                          setChannelProfile({
                            ...channelProfile,
                            chatEnabled: previous,
                          });
                          toast.error(result.error);
                          return;
                        }
                        setChannelProfile(result.data);
                        toast.success('Channel chat setting saved.');
                      },
                    );
                  }}
                />
              )}
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
                  onClick={() => {
                    void updateChannelSlug(slug.trim()).then((r) => {
                      setNote(r.ok ? `Renamed to ${r.slug}` : r.error);
                    });
                  }}
                >
                  Rename
                </Button>
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
          id: 'moderation',
          label: 'Moderation',
          icon: <Shield size={14} />,
          content: <StudioModerationView embedded />,
        },
      ]}
    />
  );
}
