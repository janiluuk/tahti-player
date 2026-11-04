import {
  Download,
  Images,
  Paintbrush,
  Share2,
  Sparkles,
  UserCircle2,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  FilterChips,
  InlineLoader,
  Input,
  SaveButton,
  Select,
  SelectableTiles,
  Tabs,
  type SelectOption,
  type TabsItem,
} from '@tahti-player/ui';

import {
  fetchChannelMembers,
  fetchSocialConnections,
  patchSocialConnections,
  type ChannelMember,
  type SocialConnections,
} from '../../../api/artist-settings';
import {
  fetchMeProfile,
  patchMeProfile,
  type ProfileFields,
} from '../../../api/studio-extras';
import { ArtistImagePurposePicker } from '../../../components/ArtistImagePurposePicker';
import { MentionTextarea } from '../../../components/MentionTextarea';
import { PageError } from '../../../components/PageStates';
import { SocialLinkIcon } from '../../../components/SocialLinkIcon';
import { COUNTRIES, flagEmoji } from '../../../lib/countries';
import {
  readReleaseVisualizerPreference,
  releaseVisualizerPresets,
  saveReleaseVisualizerPreference,
  type ReleaseVisualizerMode,
} from '../../../lib/releaseVisualizer';
import { useAuthModalStore } from '../../../stores/authModalStore';
import { useAuthStore } from '../../../stores/authStore';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { StudioBrandingPanel } from '../../studio/StudioBrandingView';
import { ChannelMembersEditor } from '../ChannelMembersEditor';
import { NameplateFields, nameplatePatch } from '../NameplateFields';
import { NewsFeedUrlField } from '../NewsFeedUrlField';
import { SettingsHint } from '../SettingsFields';
import { SocialAutoPost } from '../SocialAutoPost';
import { buildArtistInfoPatch } from './artist-info-patch';
import { ARTIST_TAB_GROUPS } from './artistTabGroups';
import { MusicBrainzOfferToggle } from './MusicBrainzOfferToggle';
import { groupTabs, tabLanding } from './tabGroups';

const PRONOUN_OPTIONS: SelectOption[] = [
  { id: 'she/her', label: 'she/her' },
  { id: 'he/him', label: 'he/him' },
  { id: 'they/them', label: 'they/them' },
  { id: 'she/they', label: 'she/they' },
  { id: 'he/they', label: 'he/they' },
  { id: 'other', label: 'Other' },
];

const ARTIST_ROLE_OPTIONS = [
  ['producer', 'Producer'],
  ['dj', 'DJ'],
  ['band', 'Band'],
  ['live-performer', 'Live performer'],
  ['instrumentalist', 'Instrumentalist'],
  ['singer', 'Singer / vocalist'],
  ['songwriter', 'Songwriter'],
  ['composer', 'Composer'],
  ['sound-engineer', 'Sound engineer'],
  ['visual-artist', 'Visual artist'],
  ['curator', 'Curator / label'],
] as const;

const PRONOUN_PRESET_IDS = new Set(
  PRONOUN_OPTIONS.map((o) => o.id).filter((id) => id !== 'other'),
);

function parseArtistRoles(profile: ProfileFields): string[] {
  return (profile.socialLinks?.artistRoles ?? '')
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
}

function detectCountryCode(): string | null {
  if (typeof navigator === 'undefined') {
    return null;
  }
  const locales = [navigator.language, ...(navigator.languages ?? [])];
  for (const locale of locales) {
    try {
      const region = new Intl.Locale(locale).region;
      if (region && COUNTRIES.some((country) => country.code === region)) {
        return region;
      }
    } catch {
      continue;
    }
  }
  return null;
}

/** Optional pronouns dropdown — common options plus a free-text "Other". */
function PronounsField({
  profile,
  setProfile,
}: {
  profile: ProfileFields;
  setProfile: (p: ProfileFields) => void;
}) {
  const current = profile.pronouns ?? '';
  const isCustom = current !== '' && !PRONOUN_PRESET_IDS.has(current);
  const [showCustomInput, setShowCustomInput] = useState(isCustom);

  return (
    <div className="flex flex-col gap-2">
      <div className="w-fit min-w-40">
        <Select
          label="Pronouns"
          value={showCustomInput ? 'other' : current}
          onValueChange={(id) => {
            if (id === 'other') {
              setShowCustomInput(true);
              return;
            }
            setShowCustomInput(false);
            setProfile({ ...profile, pronouns: id });
          }}
          placeholder="Not set"
          options={PRONOUN_OPTIONS}
        />
      </div>
      {showCustomInput && (
        <Input
          label="Custom pronouns"
          value={isCustom ? current : ''}
          onChange={(e) => setProfile({ ...profile, pronouns: e.target.value })}
        />
      )}
    </div>
  );
}

export function ArtistPanel() {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const refreshAuth = useAuthStore((s) => s.refresh);
  const artistSection = useSettingsModalStore((s) => s.artistSection);
  const [profile, setProfile] = useState<ProfileFields | null>(null);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [social, setSocial] = useState<SocialConnections | null>(null);
  const [artistRoles, setArtistRoles] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [socialMsg, setSocialMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    void Promise.all([
      fetchMeProfile(),
      fetchChannelMembers(),
      fetchSocialConnections(),
    ]).then(([p, m, s]) => {
      setMembers(m.data);
      const socialReason =
        s.meta.source === 'api' ? (s.meta.reason ?? null) : null;
      setSocialError(socialReason);
      setSocial(socialReason ? null : s.data);
      if (p.meta.source === 'api' && p.meta.reason) {
        setProfileError(p.meta.reason);
        return;
      }
      setProfileError(null);
      const detectedCountry = p.data.countryCode ? null : detectCountryCode();
      setProfile(
        detectedCountry ? { ...p.data, countryCode: detectedCountry } : p.data,
      );
      setArtistRoles(parseArtistRoles(p.data));
    });
  }, [attempt]);

  const saveArtistInfo = () => {
    if (!profile) {
      return;
    }
    setBusy(true);
    void patchMeProfile({
      ...buildArtistInfoPatch(profile, artistRoles),
      ...nameplatePatch(profile),
    }).then((result) => {
      setBusy(false);
      setMsg(result.ok ? null : result.error);
      if (result.ok) {
        setProfile(result.data);
        void refreshAuth();
        toast.success(t('settingsBody.artist.artistInfoSaved'));
      }
    });
  };

  if (!user) {
    return (
      <SettingsHint>
        <Button
          variant="text"
          size="flexible"
          className="underline-offset-2 hover:underline"
          onClick={() => useAuthModalStore.getState().open('login')}
        >
          Sign in
        </Button>{' '}
        to edit artist profile.
      </SettingsHint>
    );
  }

  const profilePending = profileError ? (
    <PageError
      title={t('settingsBody.artist.loadError')}
      description={profileError}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  ) : (
    <InlineLoader label={t('settingsBody.loading')} />
  );

  const tabItems: TabsItem[] = [
    {
      id: 'identity',
      label: t('settingsBody.artist.tabIdentity'),
      icon: <UserCircle2 size={14} />,
      content: !profile ? (
        profilePending
      ) : (
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            saveArtistInfo();
          }}
        >
          <ArtistImagePurposePicker
            avatarUrl={profile.avatarUrl}
            displayName={profile.displayName}
            onProfileUploaded={(avatarUrl) => {
              setProfile({ ...profile, avatarUrl });
              void refreshAuth();
              toast.success(t('settingsBody.artist.profileImageUpdated'));
            }}
            onGalleryUploaded={() => {
              toast.success(t('settingsBody.artist.galleryImageAdded'));
            }}
          />
          <Input
            label={t('settingsBody.artist.displayName')}
            value={profile.displayName}
            onChange={(e) =>
              setProfile({ ...profile, displayName: e.target.value })
            }
          />
          <NameplateFields profile={profile} setProfile={setProfile} />
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-foreground text-sm font-semibold">
                {t('settingsBody.artist.whatDoYouDo')}
              </p>
              <p className="text-foreground-secondary mt-1 text-xs">
                {t('settingsBody.artist.rolesDescription')}
              </p>
            </div>
            <FilterChips
              multiple
              items={ARTIST_ROLE_OPTIONS.map(([id, label]) => ({
                id,
                label,
              }))}
              selected={artistRoles}
              onChange={setArtistRoles}
              aria-label={t('settingsBody.artist.creativeRoles')}
            />
            <p className="text-foreground-secondary text-xs">
              {t('settingsBody.artist.selectedRoles')}{' '}
              {artistRoles.length > 0
                ? artistRoles
                    .map(
                      (role) =>
                        ARTIST_ROLE_OPTIONS.find(([id]) => id === role)?.[1] ??
                        role,
                    )
                    .join(', ')
                : t('settingsBody.artist.noneYet')}
            </p>
          </div>
          <PronounsField profile={profile} setProfile={setProfile} />
          <Select
            label={t('settingsBody.artist.country')}
            value={profile.countryCode ?? ''}
            onValueChange={(value) =>
              setProfile({
                ...profile,
                countryCode: value || null,
              })
            }
            options={[
              { id: '', label: t('settingsBody.artist.preferNotToSay') },
              ...COUNTRIES.map((c) => ({
                id: c.code,
                label: `${flagEmoji(c.code)} ${c.name}`,
              })),
            ]}
          />
          {profile.countryCode && (
            <Input
              autoComplete="address-level2"
              label={t('settingsBody.artist.cityLocation')}
              value={profile.defaultLocation ?? ''}
              onChange={(e) =>
                setProfile({ ...profile, defaultLocation: e.target.value })
              }
              description={t('settingsBody.artist.cityDescription')}
            />
          )}
          <Input
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            label={t('settingsBody.artist.tipJarUrl')}
            value={profile.tipJarUrl ?? ''}
            onChange={(e) =>
              setProfile({ ...profile, tipJarUrl: e.target.value })
            }
          />
          <div className="flex justify-end">
            <SaveButton
              saving={busy}
              label={t('settingsBody.artist.saveIdentity')}
              type="submit"
            />
          </div>
          {msg && <SettingsHint>{msg}</SettingsHint>}
        </form>
      ),
    },
    {
      id: 'story',
      label: t('settingsBody.artist.tabStory'),
      icon: <UserCircle2 size={14} />,
      content: !profile ? (
        profilePending
      ) : (
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            saveArtistInfo();
          }}
        >
          <MentionTextarea
            label={t('settingsBody.artist.shortBio')}
            rows={4}
            value={profile.bio ?? ''}
            onChange={(bio) => setProfile({ ...profile, bio })}
            placeholder={t('settingsBody.artist.shortBioPlaceholder')}
            submitOnModEnter
          />
          <MentionTextarea
            label={t('settingsBody.artist.yourStory')}
            rows={8}
            value={profile.fullBio ?? ''}
            onChange={(fullBio) => setProfile({ ...profile, fullBio })}
            placeholder={t('settingsBody.artist.yourStoryPlaceholder')}
            submitOnModEnter
          />
          <div className="flex justify-end">
            <SaveButton
              saving={busy}
              label={t('settingsBody.artist.saveStory')}
              type="submit"
            />
          </div>
          {msg && <SettingsHint>{msg}</SettingsHint>}
        </form>
      ),
    },
    {
      id: 'people',
      label: t('settingsBody.artist.tabPeople'),
      icon: <Users size={14} />,
      content: (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground text-sm font-semibold" aria-hidden>
              {t('settingsBody.artist.projectType')}
            </span>
            <span className="text-foreground-secondary text-xs">
              {t('settingsBody.artist.projectTypeDescription')}
            </span>
            <SelectableTiles
              aria-label={t('settingsBody.artist.projectType')}
              items={[
                { id: 'SINGLE', label: t('settingsBody.artist.soloArtist') },
                {
                  id: 'COLLECTIVE',
                  label: t('settingsBody.artist.bandCollective'),
                },
              ]}
              selected={profile?.artistKind ?? 'SINGLE'}
              onChange={(kind) =>
                profile &&
                setProfile({
                  ...profile,
                  artistKind: kind as 'SINGLE' | 'COLLECTIVE',
                })
              }
              className="grid-cols-2"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-foreground text-sm font-semibold">
                {t('settingsBody.artist.membersCredits')}
              </h3>
              <p className="text-foreground-secondary mt-1 text-xs">
                {t('settingsBody.artist.membersCreditsDescription')}
              </p>
            </div>
            <ChannelMembersEditor members={members} onChange={setMembers} />
          </div>
          <div className="flex justify-end">
            <SaveButton
              saving={busy}
              label={t('settingsBody.artist.savePeople')}
              onClick={saveArtistInfo}
            />
          </div>
          {msg && <SettingsHint>{msg}</SettingsHint>}
        </div>
      ),
    },
    {
      id: 'connections',
      label: t('settingsBody.artist.tabConnections'),
      icon: <Share2 size={14} />,
      content: !social ? (
        socialError ? (
          <PageError
            title={t('settingsBody.artist.connectionsLoadError')}
            description={socialError}
            onRetry={() => {
              setSocialError(null);
              setAttempt((n) => n + 1);
            }}
          />
        ) : (
          <InlineLoader label={t('settingsBody.loading')} />
        )
      ) : (
        <div className="flex flex-col gap-6">
          <SettingsHint>
            {t('settingsBody.artist.connectionsHint')}
          </SettingsHint>
          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (!social) {
                return;
              }
              void patchSocialConnections(social).then((result) => {
                if (!result.ok) {
                  setSocialMsg(result.error);
                  return;
                }
                setSocialMsg(t('settingsBody.artist.connectionsSaved'));
                setSocial(result.data);
                toast.success(t('settingsBody.artist.connectionsSaved'));
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ['website', 'Website', 'https://yoursite.com'],
                  ['instagram', 'Instagram', 'https://instagram.com/you'],
                  ['bandcamp', 'Bandcamp', 'https://you.bandcamp.com'],
                  ['soundcloud', 'SoundCloud', 'https://soundcloud.com/you'],
                  ['youtube', 'YouTube', 'https://youtube.com/@you'],
                  ['hearthisAt', 'hearthis.at', 'https://hearthis.at/you'],
                  ['mixcloud', 'Mixcloud', 'https://mixcloud.com/you'],
                  ['twitch', 'Twitch', 'https://twitch.tv/you'],
                  ['kick', 'Kick', 'https://kick.com/you'],
                  ['spotify', 'Spotify', 'https://open.spotify.com/artist/…'],
                  ['discord', 'Discord', 'https://discord.gg/…'],
                  ['tiktok', 'TikTok', 'https://tiktok.com/@you'],
                  ['twitter', 'X / Twitter', 'https://x.com/you'],
                  ['facebook', 'Facebook', 'https://facebook.com/you'],
                ] as const
              ).map(([key, label, example]) => (
                <label key={key} className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
                    <SocialLinkIcon label={label} url={social[key]} />
                    {label}
                  </span>
                  <Input
                    aria-label={label}
                    value={social[key]}
                    placeholder={example}
                    onChange={(e) =>
                      setSocial({ ...social, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <SaveButton
                label={t('settingsBody.artist.saveSocialLinks')}
                type="submit"
              />
            </div>
          </form>
          {socialMsg && <SettingsHint>{socialMsg}</SettingsHint>}
          <NewsFeedUrlField />
          <SocialAutoPost />
          <MusicBrainzOfferToggle />
        </div>
      ),
    },
    {
      id: 'branding',
      label: t('settingsBody.artist.tabBranding'),
      icon: <Paintbrush size={14} />,
      content: <StudioBrandingPanel section="branding" />,
    },
    {
      id: 'gallery',
      label: t('settingsBody.artist.tabGallery'),
      icon: <Images size={14} />,
      content: <StudioBrandingPanel section="gallery" />,
    },
    {
      id: 'press-kit',
      label: t('settingsBody.artist.tabPressKit'),
      icon: <Download size={14} />,
      content: <StudioBrandingPanel section="press-kit" />,
    },
    {
      id: 'release-visuals',
      label: t('settingsBody.artist.tabReleases'),
      icon: <Sparkles size={14} />,
      content: <ReleaseVisualDefaultsPanel />,
    },
  ].filter(
    (item) => item.id !== 'people' || profile?.artistKind === 'COLLECTIVE',
  );
  const grouped = groupTabs(ARTIST_TAB_GROUPS, tabItems);
  const landing = tabLanding(grouped, artistSection);

  return (
    <Tabs
      key={artistSection ?? 'identity'}
      className="min-w-0"
      listClassName="flex-wrap"
      defaultIndex={landing.group}
      items={grouped.map(({ group, tabs }, index) => ({
        id: group.id,
        label: group.label,
        icon: <group.Icon size={14} />,
        content: (
          <Tabs
            className="min-w-0"
            listClassName="border-border flex-wrap gap-1 border-b pb-2"
            panelClassName="pt-3"
            defaultIndex={index === landing.group ? landing.tab : 0}
            items={tabs}
          />
        ),
      }))}
    />
  );
}

export function ReleaseVisualDefaultsPanel() {
  const { t } = useTranslation('web');
  const [preference, setPreference] = useState(() =>
    readReleaseVisualizerPreference(),
  );

  const update = (patch: Partial<typeof preference>) => {
    const next = { ...preference, ...patch };
    setPreference(next);
    saveReleaseVisualizerPreference(next);
    toast.success(t('settingsBody.artist.visualizerSaved'));
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingsHint>{t('settingsBody.artist.brandingHint')}</SettingsHint>
      <Select
        label={t('settingsBody.artist.newReleaseBackground')}
        value={preference.mode}
        onValueChange={(value) =>
          update({ mode: value as ReleaseVisualizerMode })
        }
        options={[
          {
            id: 'specific',
            label: t('settingsBody.artist.visualizerSpecific'),
          },
          { id: 'random', label: t('settingsBody.artist.visualizerRandom') },
          { id: 'off', label: t('settingsBody.artist.visualizerOff') },
        ]}
      />
      {preference.mode === 'specific' && (
        <Select
          label={t('settingsBody.artist.visualizer')}
          value={preference.preset}
          onValueChange={(value) =>
            update({
              preset: value as typeof preference.preset,
            })
          }
          options={releaseVisualizerPresets().map((preset) => ({
            id: preset,
            label: preset
              .replace(/_/g, ' ')
              .toLowerCase()
              .replace(/^\w/, (letter) => letter.toUpperCase()),
          }))}
        />
      )}
      <p className="text-foreground-secondary text-xs">
        Particle field is selected by default: a soft, audio-reactive cloud that
        keeps cover art readable.
      </p>
    </div>
  );
}
