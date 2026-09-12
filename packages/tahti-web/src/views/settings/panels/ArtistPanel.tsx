import {
  Download,
  ImagePlus,
  Images,
  Paintbrush,
  Share2,
  Sparkles,
  UserCircle2,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Input,
  SaveButton,
  Select,
  Tabs,
  type SelectOption,
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
import { SettingsHint } from '../SettingsFields';

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

  useEffect(() => {
    void Promise.all([
      fetchMeProfile(),
      fetchChannelMembers(),
      fetchSocialConnections(),
    ]).then(([p, m, s]) => {
      const detectedCountry = p.data.countryCode ? null : detectCountryCode();
      setProfile(
        detectedCountry ? { ...p.data, countryCode: detectedCountry } : p.data,
      );
      setMembers(m.data);
      setSocial(s.data);
      setArtistRoles(parseArtistRoles(p.data));
    });
  }, []);

  const saveArtistInfo = () => {
    if (!profile) {
      return;
    }
    setBusy(true);
    void patchMeProfile({
      displayName: profile.displayName.trim(),
      bio: profile.bio?.trim() || null,
      fullBio: profile.fullBio?.trim() || null,
      tipJarUrl: profile.tipJarUrl?.trim() || null,
      pronouns: profile.pronouns?.trim() || null,
      chatEnabled: profile.chatEnabled,
      showFollowers: profile.showFollowers,
      showFollowing: profile.showFollowing,
      artistKind: profile.artistKind ?? 'SINGLE',
      countryCode: profile.countryCode,
      defaultLocation: profile.defaultLocation?.trim() || null,
      socialLinks: {
        ...(profile.socialLinks ?? {}),
        artistRoles: artistRoles.join(', '),
      },
    }).then((result) => {
      setBusy(false);
      setMsg(result.ok ? 'Artist info saved.' : result.error);
      if (result.ok) {
        setProfile(result.data);
        void refreshAuth();
        toast.success('Artist info saved.');
      } else {
        toast.error(result.error);
      }
    });
  };

  if (!user) {
    return (
      <SettingsHint>
        <button
          type="button"
          className="underline-offset-2 hover:underline"
          onClick={() => useAuthModalStore.getState().open('login')}
        >
          Sign in
        </button>{' '}
        to edit artist profile.
      </SettingsHint>
    );
  }

  return (
    <Tabs
      key={artistSection ?? 'identity'}
      listClassName="flex-wrap"
      defaultIndex={Math.max(
        0,
        [
          'identity',
          'story',
          'people',
          'connections',
          'branding',
          'gallery',
          'press-kit',
          'channel-designer',
          'release-visuals',
        ]
          .filter(
            (id) => id !== 'people' || profile?.artistKind === 'COLLECTIVE',
          )
          .indexOf(artistSection ?? 'identity'),
      )}
      items={[
        {
          id: 'identity',
          label: 'Identity',
          icon: <UserCircle2 size={14} />,
          content: !profile ? (
            <SettingsHint>Loading…</SettingsHint>
          ) : (
            <div className="flex flex-col gap-6">
              <Input
                label="Display name"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile({ ...profile, displayName: e.target.value })
                }
              />
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    What do you do?
                  </p>
                  <p className="text-foreground-secondary mt-1 text-xs">
                    Choose the creative roles you want listeners to associate
                    with you.
                  </p>
                </div>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Creative roles"
                >
                  {ARTIST_ROLE_OPTIONS.map(([id, label]) => {
                    const selected = artistRoles.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setArtistRoles((current) =>
                            selected
                              ? current.filter((role) => role !== id)
                              : [...current, id],
                          )
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-foreground-secondary hover:text-foreground'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-foreground-secondary text-xs">
                  Selected:{' '}
                  {artistRoles.length > 0
                    ? artistRoles
                        .map(
                          (role) =>
                            ARTIST_ROLE_OPTIONS.find(
                              ([id]) => id === role,
                            )?.[1] ?? role,
                        )
                        .join(', ')
                    : 'None yet'}
                </p>
              </div>
              <ArtistImagePurposePicker
                avatarUrl={profile.avatarUrl}
                displayName={profile.displayName}
                onProfileUploaded={(avatarUrl) => {
                  setProfile({ ...profile, avatarUrl });
                  void refreshAuth();
                  toast.success('Profile image updated.');
                }}
                onGalleryUploaded={() => {
                  toast.success('Image added to your gallery.');
                }}
              />
              <PronounsField profile={profile} setProfile={setProfile} />
              <Select
                label="Country"
                value={profile.countryCode ?? ''}
                onValueChange={(value) =>
                  setProfile({
                    ...profile,
                    countryCode: value || null,
                  })
                }
                options={[
                  { id: '', label: 'Prefer not to say' },
                  ...COUNTRIES.map((c) => ({
                    id: c.code,
                    label: `${flagEmoji(c.code)} ${c.name}`,
                  })),
                ]}
              />
              {profile.countryCode && (
                <Input
                  label="City / location"
                  value={profile.defaultLocation ?? ''}
                  onChange={(e) =>
                    setProfile({ ...profile, defaultLocation: e.target.value })
                  }
                  description="Optional — shown on your public profile"
                />
              )}
              <Input
                label="Tip jar URL"
                value={profile.tipJarUrl ?? ''}
                onChange={(e) =>
                  setProfile({ ...profile, tipJarUrl: e.target.value })
                }
              />
              <div className="flex justify-end">
                <SaveButton
                  saving={busy}
                  label="Save identity"
                  onClick={saveArtistInfo}
                />
              </div>
              {msg && <SettingsHint>{msg}</SettingsHint>}
            </div>
          ),
        },
        {
          id: 'story',
          label: 'Story',
          icon: <UserCircle2 size={14} />,
          content: !profile ? (
            <SettingsHint>Loading…</SettingsHint>
          ) : (
            <div className="flex flex-col gap-6">
              <MentionTextarea
                label="Short bio"
                rows={4}
                value={profile.bio ?? ''}
                onChange={(bio) => setProfile({ ...profile, bio })}
                placeholder="The concise introduction shown on your profile."
              />
              <MentionTextarea
                label="Your story"
                rows={8}
                value={profile.fullBio ?? ''}
                onChange={(fullBio) => setProfile({ ...profile, fullBio })}
                placeholder="Share your history, influences, milestones, and what listeners should know."
              />
              <div className="flex justify-end">
                <SaveButton
                  saving={busy}
                  label="Save story"
                  onClick={saveArtistInfo}
                />
              </div>
              {msg && <SettingsHint>{msg}</SettingsHint>}
            </div>
          ),
        },
        {
          id: 'people',
          label: 'People',
          icon: <Users size={14} />,
          content: (
            <div className="flex flex-col gap-5">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-foreground text-sm font-semibold">
                  Project type
                </span>
                <span className="text-foreground-secondary text-xs">
                  Tell listeners whether this profile represents one artist or a
                  collective.
                </span>
                <div className="flex gap-2">
                  {(
                    [
                      ['SINGLE', 'Solo artist'],
                      ['COLLECTIVE', 'Band / collective'],
                    ] as const
                  ).map(([kind, label]) => (
                    <button
                      key={kind}
                      type="button"
                      aria-pressed={(profile?.artistKind ?? 'SINGLE') === kind}
                      onClick={() =>
                        profile && setProfile({ ...profile, artistKind: kind })
                      }
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        (profile?.artistKind ?? 'SINGLE') === kind
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-foreground-secondary hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </label>
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-foreground text-sm font-semibold">
                    Members and credits
                  </h3>
                  <p className="text-foreground-secondary mt-1 text-xs">
                    People shown alongside this project on its public artist
                    page.
                  </p>
                </div>
                {members.length === 0 ? (
                  <SettingsHint>No members listed.</SettingsHint>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {members.map((member) => (
                      <li
                        key={member.id}
                        className="border-border flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <span>
                          {member.displayName} (@{member.username})
                        </span>
                        <span className="text-foreground-secondary text-xs uppercase">
                          {member.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex justify-end">
                <SaveButton
                  saving={busy}
                  label="Save people settings"
                  onClick={saveArtistInfo}
                />
              </div>
              {msg && <SettingsHint>{msg}</SettingsHint>}
            </div>
          ),
        },
        {
          id: 'connections',
          label: 'Connections',
          icon: <Share2 size={14} />,
          content: !social ? (
            <SettingsHint>Loading…</SettingsHint>
          ) : (
            <div className="flex flex-col gap-6">
              <SettingsHint>
                Add the places listeners can find you. These links appear as
                branded buttons on your public artist profile.
              </SettingsHint>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ['website', 'Website'],
                    ['instagram', 'Instagram'],
                    ['bandcamp', 'Bandcamp'],
                    ['soundcloud', 'SoundCloud'],
                    ['youtube', 'YouTube'],
                    ['hearthisAt', 'hearthis.at'],
                    ['mixcloud', 'Mixcloud'],
                    ['twitch', 'Twitch'],
                    ['kick', 'Kick'],
                    ['spotify', 'Spotify'],
                    ['discord', 'Discord'],
                    ['tiktok', 'TikTok'],
                    ['twitter', 'X / Twitter'],
                    ['facebook', 'Facebook'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
                      <SocialLinkIcon label={label} url={social[key]} />
                      {label}
                    </span>
                    <Input
                      aria-label={label}
                      value={social[key]}
                      placeholder={`https://…/${label.toLowerCase()}`}
                      onChange={(e) =>
                        setSocial({ ...social, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <SaveButton
                  label="Save social links"
                  onClick={() => {
                    if (!social) {
                      return;
                    }
                    const { showConnections, ...connectionValues } = social;
                    void Promise.all([
                      patchSocialConnections(connectionValues),
                      patchMeProfile({
                        socialLinks: {
                          ...(profile?.socialLinks ?? {}),
                          ...connectionValues,
                          showConnections: String(showConnections),
                        },
                      }),
                    ]).then(([connectionsResult, profileResult]) => {
                      const error = !connectionsResult.ok
                        ? connectionsResult.error
                        : !profileResult.ok
                          ? profileResult.error
                          : null;
                      setSocialMsg(error ?? 'Connections saved.');
                      if (!error && connectionsResult.ok) {
                        setSocial({
                          ...connectionsResult.data,
                          showConnections,
                        });
                        toast.success('Connections saved.');
                      }
                    });
                  }}
                />
              </div>
              {socialMsg && <SettingsHint>{socialMsg}</SettingsHint>}
            </div>
          ),
        },
        {
          id: 'branding',
          label: 'Branding',
          icon: <Paintbrush size={14} />,
          content: <StudioBrandingPanel section="branding" />,
        },
        {
          id: 'gallery',
          label: 'Gallery',
          icon: <Images size={14} />,
          content: <StudioBrandingPanel section="gallery" />,
        },
        {
          id: 'press-kit',
          label: 'Press kit',
          icon: <Download size={14} />,
          content: <StudioBrandingPanel section="press-kit" />,
        },
        {
          id: 'channel-designer',
          label: 'Channel Designer',
          icon: <ImagePlus size={14} />,
          content: <StudioBrandingPanel section="channel-designer" />,
        },
        {
          id: 'release-visuals',
          label: 'Releases',
          icon: <Sparkles size={14} />,
          content: <ReleaseVisualDefaultsPanel />,
        },
      ].filter(
        (item) => item.id !== 'people' || profile?.artistKind === 'COLLECTIVE',
      )}
    />
  );
}

export function ReleaseVisualDefaultsPanel() {
  const [preference, setPreference] = useState(() =>
    readReleaseVisualizerPreference(),
  );

  const update = (patch: Partial<typeof preference>) => {
    const next = { ...preference, ...patch };
    setPreference(next);
    saveReleaseVisualizerPreference(next);
    toast.success('Release visualizer default saved.');
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingsHint>
        Choose the animated background used when you create a new release. You
        can still change an individual release later from its visual settings.
      </SettingsHint>
      <Select
        label="New release background"
        value={preference.mode}
        onValueChange={(value) =>
          update({ mode: value as ReleaseVisualizerMode })
        }
        options={[
          { id: 'specific', label: 'Use a specific visualizer' },
          { id: 'random', label: 'Choose a random visualizer' },
          { id: 'off', label: 'Off' },
        ]}
      />
      {preference.mode === 'specific' && (
        <Select
          label="Visualizer"
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
