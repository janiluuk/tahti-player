import { useNavigate } from '@tanstack/react-router';
import {
  Code2Icon,
  FolderIcon,
  HardDriveIcon,
  HeadphonesIcon,
  HeartIcon,
  HistoryIcon,
  LayoutGridIcon,
  LibraryIcon,
  Link2Icon,
  MicIcon,
  Music2Icon,
  PackageIcon,
  UploadIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  TabLabel,
  Tabs,
  TopList,
  ViewShell,
} from '@tahti-player/ui';

import { fetchStudioSounds } from '../api/studio';
import {
  fetchStatsTopTracks,
  fetchStorageUsage,
  type StatsTopTrack,
  type StorageUsage,
} from '../api/studio-extras';
import { DesktopLibraryPanel } from '../components/DesktopLibraryPanel';
import { PageEmpty, PageError } from '../components/PageStates';
import {
  PHONE_SCROLL_TAB_LIST,
  useSelectedTabInView,
} from '../components/SectionTabs';
import { StudioPanel } from '../components/StudioPanel';
import { hasStudioAccess } from '../lib/accountRoles';
import { getNativeLibrary } from '../lib/nativeLibrary';
import { formatPlayCount } from '../lib/topListEntries';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { FavoritesView } from './FavoritesView';
import { HistoryView } from './HistoryView';
import { LibraryEmbedsView } from './LibraryEmbedsView';
import { LibraryFollowingView } from './LibraryFollowingView';
import { LibraryMediaView } from './LibraryMediaView';
import { LibrarySmartLinksView } from './LibrarySmartLinksView';
import { StudioRecordingsView } from './studio/StudioRecordingsView';
import { StudioStashView } from './studio/StudioStashView';

export type Tab =
  | 'library'
  | 'favorites'
  | 'history'
  | 'following'
  | 'sounds'
  | 'collections'
  | 'recordings'
  | 'media'
  | 'stash'
  | 'embeds'
  | 'smartlinks'
  | 'local'
  | 'upload';

export const LIBRARY_SECTION_TABS = [
  {
    id: 'library' as const,
    labelKey: 'library.tabOverview' as const,
    icon: LayoutGridIcon,
    to: '/library',
  },
  {
    id: 'favorites' as const,
    labelKey: 'library.tabFavorites' as const,
    icon: HeartIcon,
    to: '/library/favorites',
  },
  {
    id: 'history' as const,
    labelKey: 'library.tabHistory' as const,
    icon: HistoryIcon,
    to: '/library/history',
  },
  {
    id: 'following' as const,
    labelKey: 'library.tabFollowing' as const,
    icon: UsersIcon,
    to: '/library/following',
  },
  {
    id: 'sounds' as const,
    labelKey: 'library.tabSounds' as const,
    icon: Music2Icon,
    to: '/library/sounds',
  },
  {
    id: 'collections' as const,
    labelKey: 'library.tabCollections' as const,
    icon: LibraryIcon,
    to: '/library/collections',
  },
  {
    id: 'upload' as const,
    labelKey: 'library.tabUpload' as const,
    icon: UploadIcon,
    to: '/library/upload',
  },
  {
    id: 'recordings' as const,
    labelKey: 'library.tabRecordings' as const,
    icon: MicIcon,
    to: '/library/recordings',
  },
  {
    id: 'media' as const,
    labelKey: 'library.tabMedia' as const,
    icon: HardDriveIcon,
    to: '/library/media',
  },
  {
    id: 'stash' as const,
    labelKey: 'library.tabStash' as const,
    icon: PackageIcon,
    to: '/library/stash',
  },
  {
    id: 'embeds' as const,
    labelKey: 'library.tabEmbeds' as const,
    icon: Code2Icon,
    to: '/library/embeds',
  },
  {
    id: 'smartlinks' as const,
    labelKey: 'library.tabSmartLinks' as const,
    icon: Link2Icon,
    to: '/library/smartlinks',
  },
  {
    id: 'local' as const,
    labelKey: 'library.tabLocal' as const,
    icon: FolderIcon,
    to: '/library/local',
  },
];

export type LibrarySectionId = (typeof LIBRARY_SECTION_TABS)[number]['id'];

/** Tabs for publishing artists only; a listener's Library leaves them out. */
const ARTIST_ONLY_TABS: ReadonlySet<LibrarySectionId> = new Set([
  'sounds',
  'upload',
  'recordings',
  'embeds',
  'smartlinks',
]);

/** A visitor can open Overview and Favorites. The rest need an account. */
const PUBLIC_LIBRARY_TABS: ReadonlySet<LibrarySectionId> = new Set([
  'library',
  'favorites',
]);

function useLibraryTabs() {
  const signedOut = useAuthStore((state) => !state.user);
  // Until the profile loads the stored user may lack its channel: keep every
  // tab so an artist never sees them disappear and come back.
  const listener = useAuthStore(
    (state) =>
      Boolean(state.user) &&
      state.profileLoaded &&
      !hasStudioAccess(state.user),
  );
  // Local files is the desktop native library — hide on plain web.
  const desktopLocal = Boolean(getNativeLibrary());
  const tabs = listener
    ? LIBRARY_SECTION_TABS.filter((item) => !ARTIST_ONLY_TABS.has(item.id))
    : LIBRARY_SECTION_TABS;
  return (desktopLocal ? tabs : tabs.filter((item) => item.id !== 'local')).map(
    (item) => ({
      ...item,
      disabled: signedOut && !PUBLIC_LIBRARY_TABS.has(item.id),
    }),
  );
}

/**
 * The horizontal Overview/Sounds/Collections/... tab strip shown at the top
 * of every Library page. Reused outside LibraryView by pages that live one
 * level under a Library tab (e.g. an individual collection's detail page)
 * so they still show Library's top navigation with the right tab active.
 */
export function LibrarySectionTabs({ active }: { active: LibrarySectionId }) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const ref = useSelectedTabInView(active);
  const tabs = useLibraryTabs();
  return (
    <div ref={ref} className="min-w-0">
      <Tabs.Root
        variant="underline"
        selectedIndex={Math.max(
          0,
          tabs.findIndex((item) => item.id === active),
        )}
        onChange={(index) => {
          const next = tabs[index];
          if (next && !next.disabled) {
            void navigate({ to: next.to as never });
          }
        }}
      >
        <Tabs.List
          aria-label={t('library.sections')}
          className={`${PHONE_SCROLL_TAB_LIST} max-w-full pb-0`}
        >
          {tabs.map((item) => (
            <Tabs.Tab
              key={item.id}
              disabled={item.disabled}
              aria-label={
                item.disabled
                  ? t('library.needsAccount', { label: t(item.labelKey) })
                  : undefined
              }
            >
              <TabLabel icon={<item.icon size={14} />}>
                {t(item.labelKey)}
              </TabLabel>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
}

export function LibraryView({ tab = 'library' }: { tab?: Tab }) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const listener = useAuthStore(
    (state) =>
      Boolean(state.user) &&
      state.profileLoaded &&
      !hasStudioAccess(state.user),
  );
  useEffect(() => {
    if (tab === 'library' && listener) {
      void navigate({ to: '/library/favorites', replace: true });
    }
  }, [listener, navigate, tab]);
  const libraryTitle = t(
    LIBRARY_SECTION_TABS.find((item) => item.id === tab)?.labelKey ??
      'library.tabCollections',
  );

  return (
    <div className="studio-page-layout flex w-full flex-col gap-6">
      <LibrarySectionTabs active={tab} />
      <ViewShell title={libraryTitle} classes={{ root: 'px-0 pt-0' }}>
        {tab === 'library' ? (
          <div className="mt-2">
            <LibraryStats />
          </div>
        ) : null}
        {tab === 'favorites' ? (
          <div className="mt-2">
            <FavoritesView embedded />
          </div>
        ) : null}
        {tab === 'history' ? (
          <div className="mt-2">
            <HistoryView embedded />
          </div>
        ) : null}
        {tab === 'following' ? (
          <div className="mt-2">
            <LibraryFollowingView />
          </div>
        ) : null}
        {tab === 'recordings' ? (
          <div className="mt-2">
            <StudioRecordingsView embedded />
          </div>
        ) : null}
        {tab === 'media' ? (
          <div className="mt-2">
            <LibraryMediaView />
          </div>
        ) : null}
        {tab === 'stash' ? (
          <div className="mt-2">
            <StudioStashView embedded />
          </div>
        ) : null}
        {tab === 'embeds' ? (
          <div className="mt-2">
            <LibraryEmbedsView />
          </div>
        ) : null}
        {tab === 'smartlinks' ? <LibrarySmartLinksView /> : null}
        {tab === 'local' ? (
          <div className="mt-2 h-[28rem]">
            <DesktopLibraryPanel />
          </div>
        ) : null}
      </ViewShell>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 1024 * 1024 * 100 ? 0 : 1)} MB`;
}

function LibraryStats() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canUpload = hasStudioAccess(user);
  const signedIn = Boolean(user);
  const [topTracks, setTopTracks] = useState<StatsTopTrack[]>([]);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [soundCount, setSoundCount] = useState<number | null>(null);
  const [soundsError, setSoundsError] = useState<string | null>(null);
  const [soundsAttempt, setSoundsAttempt] = useState(0);

  useEffect(() => {
    void Promise.all([fetchStatsTopTracks('all'), fetchStorageUsage()]).then(
      ([tracks, usage]) => {
        setTopTracks(tracks.data.slice(0, 3));
        setStorage(usage.data);
      },
    );
  }, []);

  useEffect(() => {
    void fetchStudioSounds().then((result) => {
      setSoundsError(
        canUpload && result.meta.source === 'api'
          ? (result.meta.reason ?? null)
          : null,
      );
      setSoundCount(result.data.length);
    });
  }, [canUpload, soundsAttempt]);

  return (
    <StudioPanel
      title={t('library.overviewTitle')}
      description={t('library.overviewDescription')}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border-border bg-background-secondary/40 rounded-lg border p-3">
          <Music2Icon size={18} className="text-primary-strong" aria-hidden />
          <p className="text-foreground-secondary mt-2 text-xs uppercase">
            {t('library.totalSounds')}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {soundCount === null || soundsError ? '—' : soundCount}
          </p>
        </div>
        <div className="border-border bg-background-secondary/40 rounded-lg border p-3">
          <HardDriveIcon
            size={18}
            className="text-primary-strong"
            aria-hidden
          />
          <p className="text-foreground-secondary mt-2 text-xs uppercase">
            {t('library.storageUsed')}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {storage ? formatBytes(storage.usedBytes) : '—'}
          </p>
          <p className="text-foreground-secondary text-xs">
            {storage?.unlimited
              ? t('library.unlimitedPlan')
              : storage?.quotaBytes
                ? t('library.storageOf', {
                    size: formatBytes(storage.quotaBytes),
                  })
                : t('library.storageDefault')}
          </p>
        </div>
        <div className="border-border bg-background-secondary/40 rounded-lg border p-3">
          <HeadphonesIcon
            size={18}
            className="text-primary-strong"
            aria-hidden
          />
          <p className="text-foreground-secondary mt-2 text-xs uppercase">
            {t('library.topSound')}
          </p>
          <p className="mt-1 truncate text-sm font-bold">
            {topTracks[0]?.title ?? '—'}
          </p>
          <p className="text-foreground-secondary text-xs">
            {topTracks[0]
              ? formatPlayCount(topTracks[0].plays)
              : t('library.noPlaysYet')}
          </p>
        </div>
      </div>
      {topTracks.length > 0 ? (
        <div className="mt-4">
          <TopList
            title={t('library.topSoundsAllTime')}
            formatValue={formatPlayCount}
            entries={topTracks.map((track) => ({
              id: track.soundId,
              label: track.title,
              value: track.plays,
              onClick: () => {
                void navigate({
                  to: '/studio/sounds/$id',
                  params: { id: track.soundId },
                });
              },
            }))}
          />
        </div>
      ) : soundsError ? (
        <div className="mt-4">
          <PageError
            title={t('library.loadError')}
            description={soundsError}
            onRetry={() => setSoundsAttempt((n) => n + 1)}
          />
        </div>
      ) : soundCount === 0 ? (
        <div className="mt-4">
          <PageEmpty
            title={
              canUpload
                ? t('library.emptyCatalogTitle')
                : signedIn
                  ? t('library.nothingSavedTitle')
                  : t('library.emptyLibraryTitle')
            }
            description={
              canUpload
                ? t('library.emptyCatalogDescription')
                : signedIn
                  ? t('library.nothingSavedDescription')
                  : t('library.emptyLibraryDescription')
            }
            action={
              <div className="flex flex-wrap gap-2">
                {canUpload ? (
                  <ButtonLink to="/library/upload" size="sm">
                    {t('actions.upload')}
                  </ButtonLink>
                ) : null}
                {!signedIn ? (
                  <Button
                    size="sm"
                    onClick={() => useAuthModalStore.getState().open('login')}
                  >
                    {t('actions.signIn')}
                  </Button>
                ) : null}
                <ButtonLink
                  to="/discover"
                  size="sm"
                  variant={canUpload || !signedIn ? 'secondary' : undefined}
                >
                  {t('nav.discover')}
                </ButtonLink>
              </div>
            }
          />
        </div>
      ) : null}
    </StudioPanel>
  );
}
