import { useNavigate } from '@tanstack/react-router';
import {
  Code2Icon,
  FolderIcon,
  HardDriveIcon,
  HeadphonesIcon,
  LayoutGridIcon,
  LibraryIcon,
  Link2Icon,
  MicIcon,
  Music2Icon,
  PackageIcon,
  UploadIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
import { LibraryEmbedsView } from './LibraryEmbedsView';
import { LibraryMediaView } from './LibraryMediaView';
import { LibrarySmartLinksView } from './LibrarySmartLinksView';
import { StudioRecordingsView } from './studio/StudioRecordingsView';
import { StudioStashView } from './studio/StudioStashView';

export type Tab =
  | 'library'
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
    label: 'Overview',
    icon: LayoutGridIcon,
    to: '/library',
  },
  {
    id: 'sounds' as const,
    label: 'Sounds',
    icon: Music2Icon,
    to: '/library/sounds',
  },
  {
    id: 'collections' as const,
    label: 'Collections',
    icon: LibraryIcon,
    to: '/library/collections',
  },
  {
    id: 'upload' as const,
    label: 'Upload',
    icon: UploadIcon,
    to: '/library/upload',
  },
  {
    id: 'recordings' as const,
    label: 'Recordings',
    icon: MicIcon,
    to: '/library/recordings',
  },
  {
    id: 'media' as const,
    label: 'Media',
    icon: HardDriveIcon,
    to: '/library/media',
  },
  {
    id: 'stash' as const,
    label: 'Stash',
    icon: PackageIcon,
    to: '/library/stash',
  },
  {
    id: 'embeds' as const,
    label: 'Embeds',
    icon: Code2Icon,
    to: '/library/embeds',
  },
  {
    id: 'smartlinks' as const,
    label: 'Smart links',
    icon: Link2Icon,
    to: '/library/smartlinks',
  },
  {
    id: 'local' as const,
    label: 'Local files',
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

function useLibraryTabs() {
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
  return desktopLocal ? tabs : tabs.filter((item) => item.id !== 'local');
}

/**
 * The horizontal Overview/Sounds/Collections/... tab strip shown at the top
 * of every Library page. Reused outside LibraryView by pages that live one
 * level under a Library tab (e.g. an individual collection's detail page)
 * so they still show Library's top navigation with the right tab active.
 */
export function LibrarySectionTabs({ active }: { active: LibrarySectionId }) {
  const navigate = useNavigate();
  const ref = useSelectedTabInView(active);
  const tabs = useLibraryTabs();
  return (
    <div ref={ref} className="min-w-0">
      <Tabs.Root
        selectedIndex={Math.max(
          0,
          tabs.findIndex((item) => item.id === active),
        )}
        onChange={(index) => {
          const next = tabs[index];
          if (next) {
            void navigate({ to: next.to as never });
          }
        }}
      >
        <Tabs.List
          aria-label="Library sections"
          className={`${PHONE_SCROLL_TAB_LIST} max-w-full`}
        >
          {tabs.map((item) => (
            <Tabs.Tab key={item.id}>
              <TabLabel icon={<item.icon size={14} />}>{item.label}</TabLabel>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
}

export function LibraryView({ tab = 'library' }: { tab?: Tab }) {
  const libraryTitle =
    tab === 'library'
      ? 'Overview'
      : tab === 'sounds'
        ? 'Sounds'
        : tab === 'upload'
          ? 'Upload'
          : tab === 'recordings'
            ? 'Recordings'
            : tab === 'embeds'
              ? 'Embeds'
              : tab === 'media'
                ? 'Media'
                : tab === 'stash'
                  ? 'Stash'
                  : tab === 'smartlinks'
                    ? 'Smart links'
                    : tab === 'local'
                      ? 'Local files'
                      : 'Collections';

  return (
    <div className="studio-page-layout flex w-full flex-col gap-6">
      <LibrarySectionTabs active={tab} />
      <ViewShell title={libraryTitle} classes={{ root: 'px-0 pt-0' }}>
        {tab === 'library' ? (
          <div className="mt-2">
            <LibraryStats />
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
      title="Library overview"
      description="Your catalog at a glance."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border-border bg-background-secondary/40 rounded-lg border p-3">
          <Music2Icon size={18} className="text-primary-strong" aria-hidden />
          <p className="text-foreground-secondary mt-2 text-xs uppercase">
            Total sounds
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
            Storage used
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {storage ? formatBytes(storage.usedBytes) : '—'}
          </p>
          <p className="text-foreground-secondary text-xs">
            {storage?.unlimited
              ? 'Unlimited plan'
              : storage?.quotaBytes
                ? `of ${formatBytes(storage.quotaBytes)}`
                : 'Audio and files'}
          </p>
        </div>
        <div className="border-border bg-background-secondary/40 rounded-lg border p-3">
          <HeadphonesIcon
            size={18}
            className="text-primary-strong"
            aria-hidden
          />
          <p className="text-foreground-secondary mt-2 text-xs uppercase">
            Top sound
          </p>
          <p className="mt-1 truncate text-sm font-bold">
            {topTracks[0]?.title ?? '—'}
          </p>
          <p className="text-foreground-secondary text-xs">
            {topTracks[0]
              ? formatPlayCount(topTracks[0].plays)
              : 'No plays yet'}
          </p>
        </div>
      </div>
      {topTracks.length > 0 ? (
        <div className="mt-4">
          <TopList
            title="Top sounds · all time"
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
            title="Could not load your catalog"
            description={soundsError}
            onRetry={() => setSoundsAttempt((n) => n + 1)}
          />
        </div>
      ) : soundCount === 0 ? (
        <div className="mt-4">
          <PageEmpty
            title={
              canUpload
                ? 'Your catalog is empty'
                : signedIn
                  ? 'Nothing saved yet'
                  : 'Your library is empty'
            }
            description={
              canUpload
                ? 'Upload a track to start filling Library, or browse Discover for inspiration.'
                : signedIn
                  ? 'Follow artists and save favorites from Discover — they show up here.'
                  : 'Sign in to save music you like, or browse Discover.'
            }
            action={
              <div className="flex flex-wrap gap-2">
                {canUpload ? (
                  <ButtonLink to="/library/upload" size="sm">
                    Upload
                  </ButtonLink>
                ) : null}
                {!signedIn ? (
                  <Button
                    size="sm"
                    onClick={() => useAuthModalStore.getState().open('login')}
                  >
                    Sign in
                  </Button>
                ) : null}
                <ButtonLink
                  to="/discover"
                  size="sm"
                  variant={canUpload || !signedIn ? 'secondary' : undefined}
                >
                  Discover
                </ButtonLink>
              </div>
            }
          />
        </div>
      ) : null}
    </StudioPanel>
  );
}
