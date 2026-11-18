import { useNavigate } from '@tanstack/react-router';
import {
  MapPinIcon,
  MoonIcon,
  MusicIcon,
  PaletteIcon,
  Settings2Icon,
  SunIcon,
  SunMoonIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation, type TFunction } from '@tahti-player/i18n';
import {
  Button,
  Input,
  Select,
  SelectableTiles,
  Tabs,
  Textarea,
  Toggle,
  ViewShell,
  type SelectableTile,
} from '@tahti-player/ui';

import {
  AVATAR_UPLOAD_ACCEPT,
  uploadProfileAvatar,
} from '../api/artist-settings';
import { checkSlugAvailable, updateChannelSlug } from '../api/channel-design';
import { provisionChannel } from '../api/channel-provision';
import { isForceMock } from '../api/mode';
import { fetchMeProfile, patchMeProfile } from '../api/studio-extras';
import { GenrePicker } from '../components/GenrePicker';
import { PageLoading } from '../components/PageStates';
import { RoundImageUploadButton } from '../components/RoundImageUploadButton';
import { COUNTRIES, flagEmoji } from '../lib/countries';
import {
  formatGenreTags,
  MAX_GENRES,
  normalizeGenresForPicker,
  parseGenreTags,
} from '../lib/genres';
import { markOnboardingSeen } from '../lib/onboardingPrompt';
import { takePendingArtistKind } from '../lib/pendingArtistKind';
import { useThemeStore, type ColorMode } from '../plugins/themes';
import { useAuthStore } from '../stores/authStore';

function appearanceOptions(t: TFunction<'web'>): SelectableTile[] {
  return [
    {
      id: 'light',
      label: t('onboardingViewMore.light'),
      description: t('onboardingViewMore.brightBackgroundAlwaysOn'),
      icon: <SunIcon size={18} aria-hidden />,
    },
    {
      id: 'dark',
      label: t('onboardingViewMore.dark'),
      description: t('onboardingViewMore.dimBackgroundAlwaysOn'),
      icon: <MoonIcon size={18} aria-hidden />,
    },
    {
      id: 'dynamic',
      label: t('onboardingViewMore.dynamic'),
      description: t('onboardingViewMore.lightByDayDarkBy'),
      icon: <SunMoonIcon size={18} aria-hidden />,
    },
  ];
}

function artistKindOptions(t: TFunction<'web'>): SelectableTile[] {
  return [
    {
      id: 'SINGLE',
      label: t('onboardingViewMore.soloArtist'),
      icon: <UserIcon size={18} aria-hidden />,
    },
    {
      id: 'COLLECTIVE',
      label: t('onboardingViewMore.bandCollective'),
      icon: <UsersIcon size={18} aria-hidden />,
    },
  ];
}

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function OnboardingView() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const refresh = useAuthStore((s) => s.refresh);
  const colorMode = useThemeStore((s) => s.colorMode);
  const setColorMode = useThemeStore((s) => s.setColorMode);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [artistKind, setArtistKind] = useState<'SINGLE' | 'COLLECTIVE'>(
    'SINGLE',
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [countryCode, setCountryCode] = useState('');
  const [defaultLocation, setDefaultLocation] = useState('');
  const [slug, setSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');

  const [genres, setGenres] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string> | null>(
    null,
  );

  const [showFollowers, setShowFollowers] = useState(true);
  const [showFollowing, setShowFollowing] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }
    void fetchMeProfile().then((profile) => {
      setDisplayName(profile.data.displayName || user.displayName || '');
      setBio(profile.data.bio ?? '');
      setAvatarUrl(profile.data.avatarUrl ?? user.avatarUrl ?? null);
      setArtistKind(
        takePendingArtistKind() ?? profile.data.artistKind ?? 'SINGLE',
      );
      setCountryCode(profile.data.countryCode ?? '');
      setDefaultLocation(profile.data.defaultLocation ?? '');
      setShowFollowers(profile.data.showFollowers ?? true);
      setShowFollowing(profile.data.showFollowing ?? true);
      setSlug(user.channel?.slug ?? user.username);
      // socialLinks is replaced wholesale on save, so a profile that failed
      // to load must not be written back over the stored links.
      const loaded = !profile.meta.reason || isForceMock();
      setSocialLinks(loaded ? (profile.data.socialLinks ?? {}) : null);
      setGenres(
        normalizeGenresForPicker(
          parseGenreTags(profile.data.socialLinks?.genres),
        ),
      );
      setLoading(false);
    });
  }, [user]);

  const slugChanged = slug.trim() !== (user?.channel?.slug ?? user?.username);

  useEffect(() => {
    if (!slugChanged || slug.trim().length < 3) {
      setSlugStatus(
        slug.trim().length > 0 && slug.trim().length < 3 ? 'invalid' : 'idle',
      );
      return;
    }
    setSlugStatus('checking');
    let cancelled = false;
    const t = setTimeout(() => {
      void checkSlugAvailable(slug.trim()).then((r) => {
        if (!cancelled) {
          setSlugStatus(r.available ? 'available' : 'taken');
        }
      });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug, slugChanged]);

  const finish = async (skip: boolean) => {
    if (!user) {
      return;
    }
    if (skip) {
      markOnboardingSeen(user.id);
      void navigate({ to: '/' });
      return;
    }
    setSaving(true);
    try {
      if (!useAuthStore.getState().profileLoaded) {
        await useAuthStore.getState().refresh();
      }
      const known = useAuthStore.getState();
      if (!known.profileLoaded) {
        toast.error(i18n.t('web:toasts.couldNotLoadAccount'));
        return;
      }
      if (!known.user?.channel) {
        const provisioned = await provisionChannel();
        if (!provisioned.ok) {
          toast.error(provisioned.error || 'Could not create your channel.');
          return;
        }
      }
      if (slugChanged && slugStatus === 'available') {
        const renamed = await updateChannelSlug(slug.trim());
        if (!renamed.ok) {
          toast.error(renamed.error || 'Could not update your domain.');
        }
      }
      const profileResult = await patchMeProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        artistKind,
        countryCode: countryCode || null,
        defaultLocation: defaultLocation.trim() || null,
        showFollowers,
        showFollowing,
        ...(socialLinks
          ? { socialLinks: { ...socialLinks, genres: formatGenreTags(genres) } }
          : {}),
      });
      if (!profileResult.ok) {
        toast.error(profileResult.error || 'Could not save your profile.');
      }
      await refresh();
      markOnboardingSeen(user.id);
      toast.success(i18n.t('web:toasts.profileSetUp'));
      void navigate({ to: '/studio' });
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong finishing setup. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const emailPreview = useMemo(() => {
    const s = slug.trim() || user?.username || 'you';
    return `${s}@tahti.live`;
  }, [slug, user?.username]);

  if (!user) {
    return null;
  }

  return (
    <ViewShell
      title={t('onboarding.welcomeToTahti')}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
    >
      {loading ? (
        <PageLoading label={t('loading.loadingYourProfile')} />
      ) : (
        <>
          <Tabs
            listClassName="flex-wrap border-border border-b pb-3"
            panelClassName="pt-4"
            items={[
              {
                id: 'profile',
                label: t('onboardingView.profile'),
                icon: <UserIcon size={14} />,
                content: (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <RoundImageUploadButton
                        label={t('onboarding.profilePhoto')}
                        value={avatarUrl}
                        sizeClassName="h-16 w-16"
                        accept={AVATAR_UPLOAD_ACCEPT}
                        upload={(file) =>
                          uploadProfileAvatar(file).then((r) =>
                            r.ok
                              ? {
                                  ok: true as const,
                                  data: { url: r.avatarUrl },
                                }
                              : r,
                          )
                        }
                        onChange={(url) => {
                          setAvatarUrl(url);
                          void refresh();
                        }}
                      />
                      <p className="text-foreground-secondary text-xs">
                        {t('onboarding.optionalJpegPngOrWebp')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 text-sm">
                      <span
                        className="text-foreground-secondary text-xs uppercase"
                        aria-hidden
                      >
                        {t('onboarding.iAmA')}
                      </span>
                      <SelectableTiles
                        aria-label={t('onboarding.iAmA')}
                        items={artistKindOptions(t)}
                        selected={artistKind}
                        onChange={(id) =>
                          setArtistKind(id as 'SINGLE' | 'COLLECTIVE')
                        }
                        className="grid-cols-2"
                      />
                      {artistKind === 'COLLECTIVE' && (
                        <p className="text-foreground-secondary text-xs">
                          You can invite full band members later from Studio →
                          Artist → Members.
                        </p>
                      )}
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="flex flex-col gap-4">
                        <Input
                          label={t('onboarding.displayName')}
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </div>
                      <Textarea
                        label={t('channelFeatures.bio')}
                        tone="secondary"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={9}
                        placeholder={t('onboarding.tellListenersWhatYouDo')}
                      />
                    </div>
                  </div>
                ),
              },
              {
                id: 'location',
                label: t('onboardingView.locationDomain'),
                icon: <MapPinIcon size={14} />,
                content: (
                  <div className="flex flex-col gap-4">
                    <Select
                      label={t('onboarding.country')}
                      value={countryCode}
                      onValueChange={setCountryCode}
                      options={[
                        { id: '', label: t('onboardingView.preferNotToSay') },
                        ...COUNTRIES.map((c) => ({
                          id: c.code,
                          label: `${flagEmoji(c.code)} ${c.name}`,
                        })),
                      ]}
                    />
                    <Input
                      autoComplete="address-level2"
                      label={t('onboarding.cityLocation')}
                      value={defaultLocation}
                      onChange={(e) => setDefaultLocation(e.target.value)}
                      description={t('onboarding.optionalShownOnYourPublic')}
                    />
                    <div className="flex flex-col gap-1.5">
                      <Input
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        label={t('onboarding.yourTahtiDomain')}
                        value={slug}
                        onChange={(e) =>
                          setSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, ''),
                          )
                        }
                        description="lowercase letters, numbers, and -"
                      />
                      {slugChanged && (
                        <p
                          className={`text-xs ${
                            slugStatus === 'available'
                              ? 'text-accent-green-strong'
                              : slugStatus === 'taken' ||
                                  slugStatus === 'invalid'
                                ? 'text-accent-red-strong'
                                : 'text-foreground-secondary'
                          }`}
                        >
                          {slugStatus === 'checking' && 'Checking…'}
                          {slugStatus === 'available' && 'Available'}
                          {slugStatus === 'taken' && 'Already taken'}
                          {slugStatus === 'invalid' && 'At least 3 characters'}
                        </p>
                      )}
                      <div className="border-border bg-background-secondary/40 mt-1 flex flex-col gap-1 rounded-lg border p-3 text-xs">
                        <span>
                          Your channel:{' '}
                          <span className="font-mono">
                            {slug.trim() || user.username}.tahti.live
                          </span>
                        </span>
                        <span>
                          Your email will be:{' '}
                          <span className="font-mono">{emailPreview}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                id: 'genres',
                label: t('onboardingView.genres'),
                icon: <MusicIcon size={14} />,
                content: (
                  <div className="flex flex-col gap-2">
                    <p className="text-foreground-secondary text-sm">
                      Pick up to {MAX_GENRES} genres you make or play — helps
                      listeners find you.
                    </p>
                    <GenrePicker value={genres} onChange={setGenres} />
                  </div>
                ),
              },
              {
                id: 'appearance',
                label: t('onboardingView.appearance'),
                icon: <PaletteIcon size={14} />,
                content: (
                  <div className="flex flex-col gap-3">
                    <p className="text-foreground-secondary text-sm">
                      {t('onboarding.lightOrDarkWeStarted')}
                    </p>
                    <SelectableTiles
                      aria-label={t('onboarding.appearance')}
                      items={appearanceOptions(t)}
                      selected={colorMode}
                      onChange={(id) => setColorMode(id as ColorMode)}
                      className="sm:grid-cols-3"
                    />
                  </div>
                ),
              },
              {
                id: 'defaults',
                label: t('onboardingView.defaults'),
                icon: <Settings2Icon size={14} />,
                content: (
                  <div className="flex flex-col gap-4">
                    {(
                      [
                        [
                          'Show followers',
                          'Follower count is visible on your public profile.',
                          showFollowers,
                          setShowFollowers,
                        ],
                        [
                          'Show following',
                          'Who you follow is visible on your public profile.',
                          showFollowing,
                          setShowFollowing,
                        ],
                      ] as const
                    ).map(([label, hint, checked, setter]) => (
                      <div key={label} className="flex items-start gap-3">
                        <Toggle
                          checked={checked}
                          onChange={setter}
                          aria-label={label}
                        />
                        <div>
                          <div className="text-sm font-medium">{label}</div>
                          <div className="text-foreground-secondary text-xs">
                            {hint}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />

          <div className="border-border flex items-center justify-between border-t pt-4">
            <Button
              variant="text"
              size="sm"
              disabled={saving}
              onClick={() => void finish(true)}
            >
              {t('onboarding.skipForNow')}
            </Button>
            <Button
              disabled={saving || (slugChanged && slugStatus === 'taken')}
              onClick={() => void finish(false)}
            >
              {saving
                ? t('onboardingViewStates.saving')
                : t('onboardingViewStates.finishSetup')}
            </Button>
          </div>
        </>
      )}
    </ViewShell>
  );
}
