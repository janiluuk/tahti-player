import {
  Compass,
  Globe,
  MessageSquare,
  Paintbrush,
  Shield,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonAnchor,
  InlineLoader,
  Input,
  Tabs,
} from '@tahti-player/ui';

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
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const channelSection = useSettingsModalStore((s) => s.channelSection);
  const channel = user?.channel;
  const [channelProfile, setChannelProfile] = useState<ProfileFields | null>(
    null,
  );
  const [profileError, setProfileError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [slug, setSlug] = useState(channel?.slug ?? '');
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
      title={t('settingsBody.channel.loadError')}
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
    return <SettingsHint>{t('settingsBody.channel.signInHint')}</SettingsHint>;
  }

  return (
    <Tabs
      key={channelSection ?? 'default'}
      listClassName="flex-wrap"
      defaultIndex={tabIndexFor(channelSection)}
      items={[
        {
          id: 'appearance',
          label: t('settingsBody.channel.tabDesigner'),
          icon: <Paintbrush size={14} />,
          content: (
            <StudioBrandingPanel section="channel-designer" hideSectionNav />
          ),
        },
        {
          id: 'discovery',
          label: t('settingsBody.channel.tabDiscovery'),
          icon: <Compass size={14} />,
          content: !channelProfile ? (
            profileError ? (
              profileFailed
            ) : (
              <InlineLoader label={t('settingsBody.loading')} />
            )
          ) : (
            <div className="flex flex-col gap-4">
              <StudioPanel
                title={t('settingsBody.channel.pageTitle')}
                description={t('settingsBody.channel.pageDescription')}
              >
                <div className="flex flex-col gap-5">
                  <SettingsToggle
                    label={t('settingsBody.channel.showShareLabel')}
                    description={t('settingsBody.channel.showShareDescription')}
                    value={channelProfile.showShareButton ?? true}
                    onChange={(value) =>
                      saveProfileSwitch(
                        'showShareButton',
                        value,
                        t('toasts.shareButtonSaved'),
                      )
                    }
                  />
                  <ChannelAutoplayToggle />
                </div>
              </StudioPanel>
              <StudioPanel
                title={t('settingsBody.channel.genres')}
                description={t('settingsBody.channel.genresDescription', {
                  max: MAX_GENRES,
                })}
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
                    {t('settingsBody.channel.directoryHint')}
                  </SettingsHint>
                </div>
              </StudioPanel>
            </div>
          ),
        },
        {
          id: 'domain',
          label: t('settingsBody.channel.tabDomain'),
          icon: <Globe size={14} />,
          content: (
            <div className="flex flex-col gap-6">
              <form
                className="flex flex-col gap-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void checkSlugAvailable(slug.trim()).then((r) => {
                    if (r.available) {
                      say(
                        t('settingsBody.channel.slugAvailable', {
                          slug: slug.trim(),
                        }),
                      );
                    } else {
                      sayFailed(
                        r.reason
                          ? t('settingsBody.channel.slugNotAvailableReason', {
                              reason: r.reason,
                            })
                          : t('settingsBody.channel.slugNotAvailable'),
                      );
                    }
                  });
                }}
              >
                <Input
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  label={t('settingsBody.channel.slugLabel')}
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
                    {t('settingsBody.channel.checkAvailability')}
                  </Button>
                  <Button
                    size="sm"
                    disabled={!slug.trim() || slug.trim() === channel?.slug}
                    onClick={() => setConfirmingRename(true)}
                  >
                    {t('settingsBody.channel.rename')}
                  </Button>
                  <ConfirmDialog
                    destructive
                    isOpen={confirmingRename}
                    title={t('settingsBody.channel.renameTitle', {
                      slug: slug.trim(),
                    })}
                    description={t('settingsBody.channel.renameDescription')}
                    confirmLabel={t('settingsBody.channel.rename')}
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
                        t('settingsBody.channel.domainTxtHint', {
                          host: r.txtHost,
                          record: r.txtRecord,
                        }),
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
                  label={t('settingsBody.channel.customDomain')}
                  description={
                    channel?.customDomain
                      ? channel.customDomainVerified
                        ? t('settingsBody.channel.domainCurrentVerified', {
                            domain: channel.customDomain,
                          })
                        : t('settingsBody.channel.domainCurrentPending', {
                            domain: channel.customDomain,
                          })
                      : t('settingsBody.channel.domainRequiresMembership')
                  }
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="music.example.com"
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={!domain.trim()} type="submit">
                    {t('settingsBody.channel.setDomain')}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      void verifyCustomDomain().then((r) => {
                        if (!r.ok) {
                          sayFailed(r.error);
                        } else if (r.verified) {
                          say(t('settingsBody.channel.domainVerified'));
                        } else {
                          sayFailed(
                            t('settingsBody.channel.domainNotVerified'),
                          );
                        }
                      });
                    }}
                  >
                    {t('settingsBody.channel.verifyDomain')}
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
          label: t('settingsBody.channel.tabChat'),
          icon: <MessageSquare size={14} />,
          content: (
            <StudioPanel
              title={t('settingsBody.channel.chatMovedTitle')}
              description={t('settingsBody.channel.chatMovedDescription')}
            >
              <ButtonAnchor href="/studio/fans" size="sm">
                {t('settingsBody.channel.openFansChat')}
              </ButtonAnchor>
            </StudioPanel>
          ),
        },
        {
          id: 'moderators',
          label: t('settingsBody.channel.tabModerators'),
          icon: <Shield size={14} />,
          content: (
            <StudioPanel
              title={t('settingsBody.channel.moderatorsMovedTitle')}
              description={t('settingsBody.channel.moderatorsMovedDescription')}
            >
              <ButtonAnchor href="/studio/fans" size="sm">
                {t('settingsBody.channel.openFansChat')}
              </ButtonAnchor>
            </StudioPanel>
          ),
        },
      ]}
    />
  );
}
