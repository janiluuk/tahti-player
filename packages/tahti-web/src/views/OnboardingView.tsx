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
  fetchDiscoveryPrefs,
  patchDiscoveryPrefs,
  uploadProfileAvatar,
} from '../api/artist-settings';
import { checkSlugAvailable, updateChannelSlug } from '../api/channel-design';
import { provisionChannel } from '../api/channel-provision';
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

const APPEARANCE_OPTIONS: SelectableTile[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Bright background, always on.',
    icon: <SunIcon size={18} aria-hidden />,
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Dim background, always on.',
    icon: <MoonIcon size={18} aria-hidden />,
  },
  {
    id: 'dynamic',
    label: 'Dynamic',
    description: 'Light by day, dark by night — switches with the clock.',
    icon: <SunMoonIcon size={18} aria-hidden />,
  },
];

const ARTIST_KIND_OPTIONS: SelectableTile[] = [
  {
    id: 'SINGLE',
    label: 'Solo artist',
    icon: <UserIcon size={18} aria-hidden />,
  },
  {
    id: 'COLLECTIVE',
    label: 'Band / collective',
    icon: <UsersIcon size={18} aria-hidden />,
  },
];

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function OnboardingView() {
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

  const [showFollowers, setShowFollowers] = useState(true);
  const [showFollowing, setShowFollowing] = useState(true);
  const [showFavorites, setShowFavorites] = useState(true);
  const [announceReleases, setAnnounceReleases] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }
    void Promise.all([fetchMeProfile(), fetchDiscoveryPrefs()]).then(
      ([profile, discovery]) => {
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
        setGenres(
          normalizeGenresForPicker(parseGenreTags(discovery.data.genreTags)),
        );
        setShowFavorites(discovery.data.showFavorites ?? true);
        setAnnounceReleases(discovery.data.announceReleases ?? true);
        setLoading(false);
      },
    );
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
      if (!user.channel) {
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
      });
      if (!profileResult.ok) {
        toast.error(profileResult.error || 'Could not save your profile.');
      }
      const discoveryResult = await patchDiscoveryPrefs({
        genreTags: formatGenreTags(genres),
        showFavorites,
        announceReleases,
      });
      if (!discoveryResult.ok) {
        toast.error(
          discoveryResult.error || 'Could not save your preferences.',
        );
      }
      await refresh();
      markOnboardingSeen(user.id);
      toast.success('Profile set up.');
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
      title="Welcome to Tahti"
      classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl' }}
    >
      {loading ? (
        <PageLoading label="Loading your profile…" />
      ) : (
        <>
          <Tabs
            listClassName="flex-wrap border-border border-b pb-3"
            panelClassName="pt-4"
            items={[
              {
                id: 'profile',
                label: 'Profile',
                icon: <UserIcon size={14} />,
                content: (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <RoundImageUploadButton
                        label="Profile photo"
                        value={avatarUrl}
                        sizeClassName="h-16 w-16"
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
                        Optional — JPEG, PNG, or WebP.
                      </p>
                    </div>
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="text-foreground-secondary text-xs uppercase">
                        I am a…
                      </span>
                      <SelectableTiles
                        items={ARTIST_KIND_OPTIONS}
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
                    </label>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="flex flex-col gap-4">
                        <Input
                          label="Display name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </div>
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="text-foreground-secondary text-xs uppercase">
                          Bio
                        </span>
                        <Textarea
                          tone="secondary"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={9}
                          placeholder="Tell listeners what you do…"
                        />
                      </label>
                    </div>
                  </div>
                ),
              },
              {
                id: 'location',
                label: 'Location & domain',
                icon: <MapPinIcon size={14} />,
                content: (
                  <div className="flex flex-col gap-4">
                    <Select
                      label="Country"
                      value={countryCode}
                      onValueChange={setCountryCode}
                      options={[
                        { id: '', label: 'Prefer not to say' },
                        ...COUNTRIES.map((c) => ({
                          id: c.code,
                          label: `${flagEmoji(c.code)} ${c.name}`,
                        })),
                      ]}
                    />
                    <Input
                      label="City / location"
                      value={defaultLocation}
                      onChange={(e) => setDefaultLocation(e.target.value)}
                      description="Optional — shown on your public profile"
                    />
                    <div className="flex flex-col gap-1.5">
                      <Input
                        label="Your Tahti domain"
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
                              ? 'text-accent-green'
                              : slugStatus === 'taken' ||
                                  slugStatus === 'invalid'
                                ? 'text-accent-red'
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
                label: 'Genres',
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
                label: 'Appearance',
                icon: <PaletteIcon size={14} />,
                content: (
                  <div className="flex flex-col gap-3">
                    <p className="text-foreground-secondary text-sm">
                      Light or dark? We started you off matching your device —
                      change it any time in Settings.
                    </p>
                    <SelectableTiles
                      items={APPEARANCE_OPTIONS}
                      selected={colorMode}
                      onChange={(id) => setColorMode(id as ColorMode)}
                      className="sm:grid-cols-3"
                    />
                  </div>
                ),
              },
              {
                id: 'defaults',
                label: 'Defaults',
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
                        [
                          'Show favourites',
                          'Your favourited tracks and channels are visible on your public profile.',
                          showFavorites,
                          setShowFavorites,
                        ],
                        [
                          'Announce releases',
                          'Followers get a notification (and optional email) when you publish a release.',
                          announceReleases,
                          setAnnounceReleases,
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
              Skip for now
            </Button>
            <Button
              disabled={saving || (slugChanged && slugStatus === 'taken')}
              onClick={() => void finish(false)}
            >
              {saving ? 'Saving…' : 'Finish setup'}
            </Button>
          </div>
        </>
      )}
    </ViewShell>
  );
}
